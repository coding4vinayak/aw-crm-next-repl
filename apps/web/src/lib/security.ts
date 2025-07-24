import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from '@awcrm/database';

export class SecurityService {
  // Password hashing
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Password validation
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // MFA (Multi-Factor Authentication)
  static generateMfaSecret(userEmail: string): { secret: string; qrCodeUrl: string } {
    const secret = speakeasy.generateSecret({
      name: userEmail,
      issuer: 'AWCRM',
      length: 32,
    });

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url!,
    };
  }

  static async generateQRCode(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl);
  }

  static verifyMfaToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before and after
    });
  }

  // Backup codes
  static generateBackupCodes(count: 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  // Account lockout
  static async handleFailedLogin(userId: string): Promise<{ locked: boolean; attemptsLeft: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true, lockedUntil: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const maxAttempts = 5;
    const lockoutDuration = 15 * 60 * 1000; // 15 minutes
    const newAttempts = user.failedLoginAttempts + 1;

    if (newAttempts >= maxAttempts) {
      const lockedUntil = new Date(Date.now() + lockoutDuration);
      
      await prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil,
        },
      });

      // Log security event
      await this.logSecurityEvent(userId, 'ACCOUNT_LOCKED', 'HIGH', {
        attempts: newAttempts,
        lockedUntil,
      });

      return { locked: true, attemptsLeft: 0 };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: newAttempts },
    });

    return { locked: false, attemptsLeft: maxAttempts - newAttempts };
  }

  static async resetFailedLoginAttempts(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  static async isAccountLocked(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lockedUntil: true },
    });

    if (!user?.lockedUntil) {
      return false;
    }

    if (user.lockedUntil > new Date()) {
      return true;
    }

    // Unlock account if lockout period has expired
    await this.resetFailedLoginAttempts(userId);
    return false;
  }

  // Security event logging
  static async logSecurityEvent(
    userId: string | null,
    type: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'PASSWORD_CHANGED' | 'MFA_ENABLED' | 'MFA_DISABLED' | 'ACCOUNT_LOCKED' | 'ACCOUNT_UNLOCKED' | 'SUSPICIOUS_ACTIVITY' | 'DATA_EXPORT' | 'DATA_IMPORT' | 'PERMISSION_CHANGED' | 'API_KEY_CREATED' | 'API_KEY_REVOKED' | 'UNAUTHORIZED_ACCESS',
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    metadata: any = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Get organization ID from user
    let organizationId = '';
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });
      organizationId = user?.organizationId || '';
    }

    await prisma.securityEvent.create({
      data: {
        type,
        severity,
        description: `Security event: ${type}`,
        userId,
        organizationId,
        ipAddress,
        userAgent,
        metadata,
      },
    });
  }

  // Audit logging
  static async logAuditEvent(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    oldValues?: any,
    newValues?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Get organization ID from user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        oldValues,
        newValues,
        userId,
        organizationId: user.organizationId,
        ipAddress,
        userAgent,
      },
    });
  }

  // Data encryption
  static encrypt(text: string, key: string): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedText: string, key: string): string {
    const algorithm = 'aes-256-gcm';
    const parts = encryptedText.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Input sanitization
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .trim();
  }

  // Rate limiting helper
  static async checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // This would typically use Redis in production
    // For now, we'll use a simple in-memory store
    const requests = await this.getRateLimitData(key, windowStart);
    
    if (requests.length >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date((requests[0] || now) + windowMs),
      };
    }

    await this.addRateLimitRequest(key, now);

    return {
      allowed: true,
      remaining: maxRequests - requests.length - 1,
      resetTime: new Date(now + windowMs),
    };
  }

  private static rateLimitStore = new Map<string, number[]>();

  private static async getRateLimitData(key: string, windowStart: number): Promise<number[]> {
    const requests = this.rateLimitStore.get(key) || [];
    return requests.filter(timestamp => timestamp > windowStart);
  }

  private static async addRateLimitRequest(key: string, timestamp: number): Promise<void> {
    const requests = this.rateLimitStore.get(key) || [];
    requests.push(timestamp);
    this.rateLimitStore.set(key, requests);
  }
}