import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { SecurityService } from './security.service';
import { MfaService } from './mfa.service';
import { SessionService } from './session.service';

import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyMfaDto,
} from './dto';

export interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  role: string;
  sessionId: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string;
    mfaEnabled: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  requiresMfa?: boolean;
  mfaToken?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly securityService: SecurityService,
    private readonly mfaService: MfaService,
    private readonly sessionService: SessionService,
  ) {}

  async register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const { email, password, firstName, lastName, organizationId } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate password strength
    this.validatePasswordStrength(password);

    // Hash password
    const saltRounds = this.configService.get<number>('auth.bcrypt.rounds');
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash,
        emailVerificationToken,
        organizationId,
      },
      include: {
        organization: true,
      },
    });

    // Log security event
    await this.securityService.logSecurityEvent({
      type: 'LOGIN_SUCCESS',
      severity: 'LOW',
      description: `User registered: ${email}`,
      userId: user.id,
      organizationId: user.organizationId,
      ipAddress,
      userAgent,
    });

    // Create audit log
    await this.auditService.log({
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      organizationId: user.organizationId,
      newValues: { email, firstName, lastName },
      ipAddress,
      userAgent,
    });

    // Generate tokens
    const session = await this.sessionService.createSession(user.id, ipAddress, userAgent);
    const tokens = await this.generateTokens(user, session.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        mfaEnabled: user.mfaEnabled,
      },
      tokens,
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const { email, password, mfaCode } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
      },
    });

    if (!user) {
      await this.handleFailedLogin(email, ipAddress, userAgent, 'User not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.securityService.logSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS',
        severity: 'HIGH',
        description: `Login attempt on locked account: ${email}`,
        userId: user.id,
        organizationId: user.organizationId,
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Account is temporarily locked');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await this.handleFailedLogin(email, ipAddress, userAgent, 'Invalid password', user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if MFA is required
    if (user.mfaEnabled) {
      if (!mfaCode) {
        // Generate temporary MFA token
        const mfaToken = this.jwtService.sign(
          { userId: user.id, type: 'mfa' },
          { expiresIn: '5m' }
        );
        
        return {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            organizationId: user.organizationId,
            mfaEnabled: user.mfaEnabled,
          },
          tokens: { accessToken: '', refreshToken: '' },
          requiresMfa: true,
          mfaToken,
        };
      }

      // Verify MFA code
      const isMfaValid = await this.mfaService.verifyMfaCode(user.id, mfaCode);
      if (!isMfaValid) {
        await this.handleFailedLogin(email, ipAddress, userAgent, 'Invalid MFA code', user.id);
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    // Reset failed login attempts
    if (user.failedLoginAttempts > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log successful login
    await this.securityService.logSecurityEvent({
      type: 'LOGIN_SUCCESS',
      severity: 'LOW',
      description: `User logged in: ${email}`,
      userId: user.id,
      organizationId: user.organizationId,
      ipAddress,
      userAgent,
    });

    // Create session and generate tokens
    const session = await this.sessionService.createSession(user.id, ipAddress, userAgent);
    const tokens = await this.generateTokens(user, session.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        mfaEnabled: user.mfaEnabled,
      },
      tokens,
    };
  }

  async logout(userId: string, sessionId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    // Invalidate session
    await this.sessionService.invalidateSession(sessionId);

    // Log logout event
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await this.securityService.logSecurityEvent({
        type: 'LOGOUT',
        severity: 'LOW',
        description: `User logged out: ${user.email}`,
        userId: user.id,
        organizationId: user.organizationId,
        ipAddress,
        userAgent,
      });
    }
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Validate new password strength
    this.validatePasswordStrength(newPassword);

    // Hash new password
    const saltRounds = this.configService.get<number>('auth.bcrypt.rounds');
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all sessions except current one
    await this.sessionService.invalidateAllUserSessions(userId);

    // Log password change
    await this.securityService.logSecurityEvent({
      type: 'PASSWORD_CHANGED',
      severity: 'MEDIUM',
      description: `Password changed for user: ${user.email}`,
      userId: user.id,
      organizationId: user.organizationId,
      ipAddress,
      userAgent,
    });

    // Create audit log
    await this.auditService.log({
      action: 'PASSWORD_CHANGED',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      organizationId: user.organizationId,
      ipAddress,
      userAgent,
    });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists or not
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // TODO: Send password reset email
    this.logger.log(`Password reset token generated for user: ${email}`);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Validate password strength
    this.validatePasswordStrength(newPassword);

    // Hash new password
    const saltRounds = this.configService.get<number>('auth.bcrypt.rounds');
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Invalidate all sessions
    await this.sessionService.invalidateAllUserSessions(user.id);

    // Log password reset
    await this.securityService.logSecurityEvent({
      type: 'PASSWORD_CHANGED',
      severity: 'MEDIUM',
      description: `Password reset for user: ${user.email}`,
      userId: user.id,
      organizationId: user.organizationId,
    });
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const session = await this.sessionService.getSession(payload.sessionId);

      if (!session || !session.isActive) {
        throw new UnauthorizedException('Invalid session');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: session.userId },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new access token
      const jwtPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role,
        sessionId: session.id,
      };

      const accessToken = this.jwtService.sign(jwtPayload);

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(user: any, sessionId: string) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
      sessionId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: this.configService.get<string>('auth.jwt.refreshExpiresIn') }
    );

    return { accessToken, refreshToken };
  }

  private async handleFailedLogin(
    email: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string,
    userId?: string,
  ): Promise<void> {
    if (userId) {
      // Increment failed login attempts
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (user) {
        const failedAttempts = user.failedLoginAttempts + 1;
        const maxAttempts = 5; // Configure this
        
        const updateData: any = {
          failedLoginAttempts: failedAttempts,
        };

        // Lock account after max attempts
        if (failedAttempts >= maxAttempts) {
          updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        }

        await this.prisma.user.update({
          where: { id: userId },
          data: updateData,
        });

        // Log security event
        await this.securityService.logSecurityEvent({
          type: failedAttempts >= maxAttempts ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
          severity: failedAttempts >= maxAttempts ? 'HIGH' : 'MEDIUM',
          description: `Failed login attempt for ${email}: ${reason}`,
          userId,
          organizationId: user.organizationId,
          ipAddress,
          userAgent,
        });
      }
    } else {
      // Log failed login for non-existent user
      await this.securityService.logSecurityEvent({
        type: 'LOGIN_FAILED',
        severity: 'MEDIUM',
        description: `Failed login attempt for ${email}: ${reason}`,
        organizationId: 'unknown',
        ipAddress,
        userAgent,
      });
    }
  }

  private validatePasswordStrength(password: string): void {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    if (!hasUpperCase) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }

    if (!hasLowerCase) {
      throw new BadRequestException('Password must contain at least one lowercase letter');
    }

    if (!hasNumbers) {
      throw new BadRequestException('Password must contain at least one number');
    }

    if (!hasSpecialChar) {
      throw new BadRequestException('Password must contain at least one special character');
    }
  }
}