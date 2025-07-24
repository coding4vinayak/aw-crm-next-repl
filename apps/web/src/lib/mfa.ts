import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { prisma } from '@awcrm/database';
import { EncryptionService } from './encryption';
import { SecurityService } from './security';

export interface MFASetupResult {
  secret: string;
  qrCodeUrl: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export interface MFAVerificationResult {
  success: boolean;
  method: 'totp' | 'backup_code';
  backupCodesRemaining?: number;
}

export class MFAService {
  private static readonly APP_NAME = 'AWCRM';
  private static readonly BACKUP_CODE_COUNT = 10;
  private static readonly BACKUP_CODE_LENGTH = 8;

  // Setup MFA for a user
  static async setupMFA(userId: string, userEmail: string): Promise<MFASetupResult> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: userEmail,
        issuer: this.APP_NAME,
        length: 32,
      });

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Encrypt secret and backup codes for storage
      const encryptedSecret = EncryptionService.encryptWithPurpose(secret.base32, 'mfa_secret');
      const encryptedBackupCodes = backupCodes.map(code => 
        EncryptionService.encryptWithPurpose(code, 'backup_code')
      );

      // Store MFA settings (but don't enable yet - user needs to verify first)
      await prisma.mfaSettings.upsert({
        where: { userId },
        create: {
          userId,
          enabled: false,
          secret: encryptedSecret,
          backupCodes: encryptedBackupCodes,
        },
        update: {
          secret: encryptedSecret,
          backupCodes: encryptedBackupCodes,
        },
      });

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

      // Log MFA setup attempt
      await SecurityService.logSecurityEvent(
        userId,
        'MFA_SETUP_INITIATED',
        'MEDIUM',
        { method: 'TOTP' }
      );

      return {
        secret: secret.base32,
        qrCodeUrl: secret.otpauth_url!,
        qrCodeDataUrl,
        backupCodes,
      };
    } catch (error) {
      console.error('MFA setup failed:', error);
      throw new Error('Failed to setup MFA');
    }
  }

  // Verify and enable MFA
  static async enableMFA(userId: string, token: string): Promise<boolean> {
    try {
      const mfaSettings = await prisma.mfaSettings.findUnique({
        where: { userId },
      });

      if (!mfaSettings) {
        throw new Error('MFA not set up');
      }

      // Decrypt secret
      const secret = EncryptionService.decryptWithPurpose(mfaSettings.secret, 'mfa_secret');

      // Verify token
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2,
      });

      if (!verified) {
        await SecurityService.logSecurityEvent(
          userId,
          'MFA_ENABLE_FAILED',
          'MEDIUM',
          { reason: 'Invalid token' }
        );
        return false;
      }

      // Enable MFA
      await prisma.mfaSettings.update({
        where: { userId },
        data: { enabled: true },
      });

      // Update user MFA status
      await prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: true },
      });

      // Log successful MFA enablement
      await SecurityService.logSecurityEvent(
        userId,
        'MFA_ENABLED',
        'MEDIUM',
        { method: 'TOTP' }
      );

      return true;
    } catch (error) {
      console.error('MFA enable failed:', error);
      throw new Error('Failed to enable MFA');
    }
  }

  // Disable MFA
  static async disableMFA(userId: string, token: string): Promise<boolean> {
    try {
      const verification = await this.verifyMFA(userId, token);
      
      if (!verification.success) {
        await SecurityService.logSecurityEvent(
          userId,
          'MFA_DISABLE_FAILED',
          'HIGH',
          { reason: 'Invalid token' }
        );
        return false;
      }

      // Disable MFA
      await prisma.mfaSettings.update({
        where: { userId },
        data: { enabled: false },
      });

      // Update user MFA status
      await prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: false },
      });

      // Log MFA disablement
      await SecurityService.logSecurityEvent(
        userId,
        'MFA_DISABLED',
        'HIGH',
        { method: verification.method }
      );

      return true;
    } catch (error) {
      console.error('MFA disable failed:', error);
      throw new Error('Failed to disable MFA');
    }
  }

  // Verify MFA token
  static async verifyMFA(userId: string, token: string): Promise<MFAVerificationResult> {
    try {
      const mfaSettings = await prisma.mfaSettings.findUnique({
        where: { userId },
      });

      if (!mfaSettings || !mfaSettings.enabled) {
        return { success: false, method: 'totp' };
      }

      // First try TOTP verification
      const secret = EncryptionService.decryptWithPurpose(mfaSettings.secret, 'mfa_secret');
      
      const totpVerified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2,
      });

      if (totpVerified) {
        await SecurityService.logSecurityEvent(
          userId,
          'MFA_VERIFIED',
          'LOW',
          { method: 'TOTP' }
        );
        return { success: true, method: 'totp' };
      }

      // If TOTP fails, try backup codes
      const backupCodeResult = await this.verifyBackupCode(userId, token);
      if (backupCodeResult.success) {
        return backupCodeResult;
      }

      // Log failed verification
      await SecurityService.logSecurityEvent(
        userId,
        'MFA_VERIFICATION_FAILED',
        'MEDIUM',
        { token: token.substring(0, 2) + '***' }
      );

      return { success: false, method: 'totp' };
    } catch (error) {
      console.error('MFA verification failed:', error);
      return { success: false, method: 'totp' };
    }
  }

  // Verify backup code
  private static async verifyBackupCode(userId: string, code: string): Promise<MFAVerificationResult> {
    try {
      const mfaSettings = await prisma.mfaSettings.findUnique({
        where: { userId },
      });

      if (!mfaSettings) {
        return { success: false, method: 'backup_code' };
      }

      // Decrypt and check backup codes
      const decryptedCodes = mfaSettings.backupCodes.map(encryptedCode => {
        try {
          return EncryptionService.decryptWithPurpose(encryptedCode, 'backup_code');
        } catch {
          return null;
        }
      }).filter(Boolean) as string[];

      const codeIndex = decryptedCodes.findIndex(backupCode => backupCode === code);

      if (codeIndex === -1) {
        return { success: false, method: 'backup_code' };
      }

      // Remove used backup code
      const updatedCodes = [...mfaSettings.backupCodes];
      updatedCodes.splice(codeIndex, 1);

      await prisma.mfaSettings.update({
        where: { userId },
        data: { backupCodes: updatedCodes },
      });

      // Log backup code usage
      await SecurityService.logSecurityEvent(
        userId,
        'MFA_BACKUP_CODE_USED',
        'MEDIUM',
        { 
          codesRemaining: updatedCodes.length,
          codeUsed: code.substring(0, 2) + '***'
        }
      );

      return {
        success: true,
        method: 'backup_code',
        backupCodesRemaining: updatedCodes.length,
      };
    } catch (error) {
      console.error('Backup code verification failed:', error);
      return { success: false, method: 'backup_code' };
    }
  }

  // Generate new backup codes
  static async regenerateBackupCodes(userId: string, token: string): Promise<string[] | null> {
    try {
      // Verify current MFA token first
      const verification = await this.verifyMFA(userId, token);
      if (!verification.success) {
        return null;
      }

      // Generate new backup codes
      const newBackupCodes = this.generateBackupCodes();
      const encryptedBackupCodes = newBackupCodes.map(code => 
        EncryptionService.encryptWithPurpose(code, 'backup_code')
      );

      // Update backup codes
      await prisma.mfaSettings.update({
        where: { userId },
        data: { backupCodes: encryptedBackupCodes },
      });

      // Log backup code regeneration
      await SecurityService.logSecurityEvent(
        userId,
        'MFA_BACKUP_CODES_REGENERATED',
        'MEDIUM',
        { count: newBackupCodes.length }
      );

      return newBackupCodes;
    } catch (error) {
      console.error('Backup code regeneration failed:', error);
      return null;
    }
  }

  // Get MFA status for user
  static async getMFAStatus(userId: string): Promise<{
    enabled: boolean;
    backupCodesCount: number;
    lastUsed?: Date;
  }> {
    try {
      const mfaSettings = await prisma.mfaSettings.findUnique({
        where: { userId },
      });

      if (!mfaSettings) {
        return {
          enabled: false,
          backupCodesCount: 0,
        };
      }

      return {
        enabled: mfaSettings.enabled,
        backupCodesCount: mfaSettings.backupCodes.length,
      };
    } catch (error) {
      console.error('Failed to get MFA status:', error);
      return {
        enabled: false,
        backupCodesCount: 0,
      };
    }
  }

  // Check if user has MFA enabled
  static async isMFAEnabled(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { mfaEnabled: true },
      });

      return user?.mfaEnabled || false;
    } catch (error) {
      console.error('Failed to check MFA status:', error);
      return false;
    }
  }

  // Generate backup codes
  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
      const code = crypto.randomBytes(this.BACKUP_CODE_LENGTH / 2)
        .toString('hex')
        .toUpperCase()
        .match(/.{1,4}/g)
        ?.join('-') || '';
      codes.push(code);
    }
    
    return codes;
  }

  // Validate TOTP token format
  static validateTOTPToken(token: string): boolean {
    return /^\d{6}$/.test(token);
  }

  // Validate backup code format
  static validateBackupCode(code: string): boolean {
    return /^[A-F0-9]{4}-[A-F0-9]{4}$/.test(code);
  }

  // Emergency MFA disable (admin only)
  static async emergencyDisableMFA(userId: string, adminUserId: string, reason: string): Promise<boolean> {
    try {
      // Verify admin has permission (this would check admin role)
      const admin = await prisma.user.findUnique({
        where: { id: adminUserId },
        select: { role: true },
      });

      if (admin?.role !== 'ADMIN') {
        throw new Error('Insufficient permissions');
      }

      // Disable MFA
      await prisma.mfaSettings.update({
        where: { userId },
        data: { enabled: false },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: false },
      });

      // Log emergency disable
      await SecurityService.logSecurityEvent(
        userId,
        'MFA_EMERGENCY_DISABLED',
        'CRITICAL',
        {
          disabledBy: adminUserId,
          reason,
        }
      );

      return true;
    } catch (error) {
      console.error('Emergency MFA disable failed:', error);
      return false;
    }
  }

  // Get MFA recovery information
  static async getMFARecoveryInfo(userId: string): Promise<{
    hasBackupCodes: boolean;
    backupCodesCount: number;
    canRecover: boolean;
  }> {
    try {
      const mfaSettings = await prisma.mfaSettings.findUnique({
        where: { userId },
      });

      if (!mfaSettings) {
        return {
          hasBackupCodes: false,
          backupCodesCount: 0,
          canRecover: false,
        };
      }

      const backupCodesCount = mfaSettings.backupCodes.length;

      return {
        hasBackupCodes: backupCodesCount > 0,
        backupCodesCount,
        canRecover: backupCodesCount > 0,
      };
    } catch (error) {
      console.error('Failed to get MFA recovery info:', error);
      return {
        hasBackupCodes: false,
        backupCodesCount: 0,
        canRecover: false,
      };
    }
  }
}