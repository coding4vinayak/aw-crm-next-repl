import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { SecurityService } from './security.service';
import { MfaService } from './mfa.service';
import { SessionService } from './session.service';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyMfaDto,
  MfaSetupDto,
  MfaDisableDto,
  RegenerateBackupCodesDto,
} from './dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly securityService: SecurityService,
    private readonly mfaService: MfaService,
    private readonly sessionService: SessionService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(
    @Body() registerDto: RegisterDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.register(registerDto, ipAddress, userAgent);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiBody({ type: LoginDto })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({ status: 204, description: 'Logout successful' })
  @ApiBearerAuth('JWT-auth')
  async logout(
    @CurrentUser() user: any,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    await this.authService.logout(user.id, user.sessionId, ipAddress, userAgent);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Put('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 204, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  @ApiBearerAuth('JWT-auth')
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    await this.authService.changePassword(
      user.id,
      changePasswordDto,
      ipAddress,
      userAgent,
    );
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({ status: 204, description: 'Password reset email sent if user exists' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset password using reset token' })
  @ApiResponse({ status: 204, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
  }

  // MFA Endpoints
  @Post('mfa/setup')
  @ApiOperation({ summary: 'Setup multi-factor authentication' })
  @ApiResponse({ status: 200, description: 'MFA setup initiated' })
  @ApiBearerAuth('JWT-auth')
  async setupMfa(@CurrentUser() user: any) {
    return this.mfaService.setupMfa(user.id);
  }

  @Post('mfa/enable')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Enable multi-factor authentication' })
  @ApiResponse({ status: 204, description: 'MFA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  @ApiBearerAuth('JWT-auth')
  async enableMfa(
    @CurrentUser() user: any,
    @Body() mfaSetupDto: MfaSetupDto,
  ) {
    await this.mfaService.enableMfa(user.id, mfaSetupDto.verificationCode);
  }

  @Post('mfa/disable')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disable multi-factor authentication' })
  @ApiResponse({ status: 204, description: 'MFA disabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  @ApiBearerAuth('JWT-auth')
  async disableMfa(
    @CurrentUser() user: any,
    @Body() mfaDisableDto: MfaDisableDto,
  ) {
    await this.mfaService.disableMfa(user.id, mfaDisableDto.verificationCode);
  }

  @Get('mfa/status')
  @ApiOperation({ summary: 'Get MFA status for current user' })
  @ApiResponse({ status: 200, description: 'MFA status retrieved' })
  @ApiBearerAuth('JWT-auth')
  async getMfaStatus(@CurrentUser() user: any) {
    return this.mfaService.getMfaStatus(user.id);
  }

  @Post('mfa/backup-codes/regenerate')
  @ApiOperation({ summary: 'Regenerate MFA backup codes' })
  @ApiResponse({ status: 200, description: 'Backup codes regenerated' })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  @ApiBearerAuth('JWT-auth')
  async regenerateBackupCodes(
    @CurrentUser() user: any,
    @Body() regenerateDto: RegenerateBackupCodesDto,
  ) {
    return this.mfaService.regenerateBackupCodes(
      user.id,
      regenerateDto.verificationCode,
    );
  }

  // Session Management
  @Get('sessions')
  @ApiOperation({ summary: 'Get all active sessions for current user' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  @ApiBearerAuth('JWT-auth')
  async getUserSessions(@CurrentUser() user: any) {
    return this.sessionService.getUserSessions(user.id);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiResponse({ status: 204, description: 'Session revoked successfully' })
  @ApiBearerAuth('JWT-auth')
  async revokeSession(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string,
  ) {
    await this.sessionService.revokeSession(sessionId, user.id);
  }

  @Delete('sessions/others')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke all other sessions except current' })
  @ApiResponse({ status: 204, description: 'Other sessions revoked successfully' })
  @ApiBearerAuth('JWT-auth')
  async revokeOtherSessions(@CurrentUser() user: any) {
    return this.sessionService.revokeAllOtherSessions(user.sessionId, user.id);
  }

  // Security Endpoints
  @Get('security/events')
  @ApiOperation({ summary: 'Get security events for organization' })
  @ApiResponse({ status: 200, description: 'Security events retrieved' })
  @ApiBearerAuth('JWT-auth')
  async getSecurityEvents(@CurrentUser() user: any) {
    return this.securityService.getSecurityEvents(user.organizationId);
  }

  @Get('security/dashboard')
  @ApiOperation({ summary: 'Get security dashboard data' })
  @ApiResponse({ status: 200, description: 'Security dashboard data retrieved' })
  @ApiBearerAuth('JWT-auth')
  async getSecurityDashboard(@CurrentUser() user: any) {
    return this.securityService.getSecurityDashboard(user.organizationId);
  }

  @Get('security/metrics')
  @ApiOperation({ summary: 'Get security metrics for organization' })
  @ApiResponse({ status: 200, description: 'Security metrics retrieved' })
  @ApiBearerAuth('JWT-auth')
  async getSecurityMetrics(@CurrentUser() user: any) {
    const timeRange = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date(),
    };
    return this.securityService.getSecurityMetrics(user.organizationId, timeRange);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiBearerAuth('JWT-auth')
  async getProfile(@CurrentUser() user: any) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organization: user.organization,
    };
  }
}