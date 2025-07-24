import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import * as crypto from 'crypto';

import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { SecurityService } from './security.service';

export interface MfaSetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly securityService: SecurityService,
  ) {}

  async setupMfa(userId: string): Promise<MfaSetupResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled for this user');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${user.email}`,
      issuer: this.configService.get<string>('auth.mfa.issuer'),
      length: 32,
    });

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Store secret temporarily (not enabled yet)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: secret.base32,
        backupCodes: backupCodes,
      },
    });

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    this.logger.log(`MFA setup initiated for user: ${user.email}`);

    return {
      secret: secret.base32!,
      qrCodeUrl,
      backupCodes,
    };
  }

  async enableMfa(userId: string, verificationCode: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.mfaSecret) {
      throw new BadRequestException('MFA setup not initiated. Please setup MFA first.');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled for this user');
    }

    // Verify the code
    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: verificationCode,
      window: this.configService.get<number>('auth.mfa.window'),
    });

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Enable MFA
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    // Log security event
    await this.securityService.logSecurityEvent({
      type: 'MFA_ENABLED',
      severity: 'MEDIUM',
      description: `MFA enabled for user: ${user.email}`,
      userId: user.id,
      organizationId: user.organizationId,
    });

    // Create audit log
    await this.auditService.log({
      action: 'MFA_ENABLED',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      organizationId: user.organizationId,
    });

    this.logger.log(`MFA enabled for user: ${user.email}`);
  }

  async disableMfa(userId: string, verificationCode: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled for this user');
    }

    // Verify the code or backup code
    const isValidTotp = await this.verifyMfaCode(userId, verificationCode);
    const isValidBackup = await this.verifyBackupCode(userId, verificationCode);

    if (!isValidTotp && !isValidBackup) {
      throw new BadRequestException('Invalid verification code');
    }

    // Disable MFA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        backupCodes: [],
      },
    });

    // Log security event
    await this.securityService.logSecurityEvent({
      type: 'MFA_DISABLED',
      severity: 'HIGH',
      description: `MFA disabled for user: ${user.email}`,
      userId: user.id,
      organizationId: user.organizationId,
    });

    // Create audit log
    await this.auditService.log({
      action: 'MFA_DISABLED',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      organizationId: user.organizationId,
    });

    this.logger.log(`MFA disabled for user: ${user.email}`);
  }

  async verifyMfaCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return false;
    }

    // Verify TOTP code
    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: this.configService.get<number>('auth.mfa.window'),
    });

    return isValid;
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfaEnabled || !user.backupCodes) {
      return false;
    }

    // Check if backup code exists
    const backupCodes = user.backupCodes as string[];
    const codeIndex = backupCodes.indexOf(code);

    if (codeIndex === -1) {
      return false;
    }

    // Remove used backup code
    const updatedBackupCodes = backupCodes.filter((_, index) => index !== codeIndex);
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { backupCodes: updatedBackupCodes },
    });

    // Log backup code usage
    await this.securityService.logSecurityEvent({
      type: 'MFA_BACKUP_CODE_USED',
      severity: 'MEDIUM',
      description: `Backup code used for user: ${user.email}`,
      userId: user.id,
      organizationId: user.organizationId,
      metadata: { remainingCodes: updatedBackupCodes.length },
    });

    this.logger.log(`Backup code used for user: ${user.email}. Remaining codes: ${updatedBackupCodes.length}`);

    return true;
  }

  async regenerateBackupCodes(userId: string, verificationCode: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled for this user');
    }

    // Verify the code
    const isValid = await this.verifyMfaCode(userId, verificationCode);
    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Generate new backup codes
    const newBackupCodes = this.generateBackupCodes();

    await this.prisma.user.update({
      where: { id: userId },
      data: { backupCodes: newBackupCodes },
    });

    // Log backup code regeneration
    await this.securityService.logSecurityEvent({
      type: 'MFA_BACKUP_CODES_REGENERATED',
      severity: 'MEDIUM',
      description: `Backup codes regenerated for user: ${user.email}`,
      userId: user.id,
      organizationId: user.organizationId,
    });

    // Create audit log
    await this.auditService.log({
      action: 'MFA_BACKUP_CODES_REGENERATED',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      organizationId: user.organizationId,
    });

    this.logger.log(`Backup codes regenerated for user: ${user.email}`);

    return newBackupCodes;
  }

  async getMfaStatus(userId: string): Promise<{
    enabled: boolean;
    backupCodesCount: number;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        mfaEnabled: true,
        backupCodes: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      enabled: user.mfaEnabled,
      backupCodesCount: user.backupCodes ? (user.backupCodes as string[]).length : 0,
    };
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  async validateMfaToken(token: string): Promise<{ userId: string; type: string } | null> {
    try {
      // This would be used for temporary MFA tokens during login
      const decoded = speakeasy.totp.verify({
        secret: token,
        encoding: 'base32',
        token: token,
        window: 1,
      });

      if (decoded) {
        // Return decoded token info - this is a simplified version
        // In practice, you'd decode a JWT token here
        return { userId: 'temp', type: 'mfa' };
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}