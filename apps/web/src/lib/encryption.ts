import crypto from 'crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits

  // Get encryption key from environment or generate one
  private static getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    
    // If key is hex-encoded, decode it
    if (key.length === 64) {
      return Buffer.from(key, 'hex');
    }
    
    // Otherwise, hash the key to get consistent 32-byte key
    return crypto.createHash('sha256').update(key).digest();
  }

  // Generate a new encryption key (for setup)
  static generateKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
  }

  // Encrypt data
  static encrypt(plaintext: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);
      
      const cipher = crypto.createCipherGCM(this.ALGORITHM, key, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Combine iv + tag + encrypted data
      const combined = Buffer.concat([iv, tag, Buffer.from(encrypted, 'hex')]);
      
      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Decrypt data
  static decrypt(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey();
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract iv, tag, and encrypted data
      const iv = combined.subarray(0, this.IV_LENGTH);
      const tag = combined.subarray(this.IV_LENGTH, this.IV_LENGTH + this.TAG_LENGTH);
      const encrypted = combined.subarray(this.IV_LENGTH + this.TAG_LENGTH);
      
      const decipher = crypto.createDecipherGCM(this.ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Encrypt object (converts to JSON first)
  static encryptObject(obj: any): string {
    const json = JSON.stringify(obj);
    return this.encrypt(json);
  }

  // Decrypt object (parses JSON after decryption)
  static decryptObject<T = any>(encryptedData: string): T {
    const json = this.decrypt(encryptedData);
    return JSON.parse(json);
  }

  // Hash data (one-way)
  static hash(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 100000, 64, 'sha512');
    return `${actualSalt}:${hash.toString('hex')}`;
  }

  // Verify hash
  static verifyHash(data: string, hashedData: string): boolean {
    const [salt, hash] = hashedData.split(':');
    const newHash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512');
    return hash === newHash.toString('hex');
  }

  // Generate secure random token
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate UUID
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  // Encrypt sensitive fields in database records
  static encryptSensitiveFields<T extends Record<string, any>>(
    record: T,
    sensitiveFields: (keyof T)[]
  ): T {
    const encrypted = { ...record };
    
    sensitiveFields.forEach(field => {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = this.encrypt(encrypted[field] as string);
      }
    });
    
    return encrypted;
  }

  // Decrypt sensitive fields in database records
  static decryptSensitiveFields<T extends Record<string, any>>(
    record: T,
    sensitiveFields: (keyof T)[]
  ): T {
    const decrypted = { ...record };
    
    sensitiveFields.forEach(field => {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        try {
          decrypted[field] = this.decrypt(decrypted[field] as string);
        } catch (error) {
          // If decryption fails, the field might not be encrypted
          console.warn(`Failed to decrypt field ${String(field)}:`, error);
        }
      }
    });
    
    return decrypted;
  }

  // Encrypt PII (Personally Identifiable Information)
  static encryptPII(data: {
    email?: string;
    phone?: string;
    ssn?: string;
    address?: string;
    [key: string]: any;
  }): typeof data {
    const piiFields = ['email', 'phone', 'ssn', 'address'];
    return this.encryptSensitiveFields(data, piiFields);
  }

  // Decrypt PII
  static decryptPII(data: {
    email?: string;
    phone?: string;
    ssn?: string;
    address?: string;
    [key: string]: any;
  }): typeof data {
    const piiFields = ['email', 'phone', 'ssn', 'address'];
    return this.decryptSensitiveFields(data, piiFields);
  }

  // Create encrypted backup of data
  static createEncryptedBackup(data: any): string {
    const backup = {
      timestamp: new Date().toISOString(),
      data,
      checksum: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'),
    };
    
    return this.encryptObject(backup);
  }

  // Restore from encrypted backup
  static restoreFromEncryptedBackup(encryptedBackup: string): any {
    const backup = this.decryptObject(encryptedBackup);
    
    // Verify checksum
    const expectedChecksum = crypto.createHash('sha256').update(JSON.stringify(backup.data)).digest('hex');
    if (backup.checksum !== expectedChecksum) {
      throw new Error('Backup data integrity check failed');
    }
    
    return backup.data;
  }

  // Secure data wiping (overwrite memory)
  static secureWipe(buffer: Buffer): void {
    if (buffer && buffer.length > 0) {
      crypto.randomFillSync(buffer);
      buffer.fill(0);
    }
  }

  // Key derivation for different purposes
  static deriveKey(masterKey: string, purpose: string, salt?: string): Buffer {
    const actualSalt = salt || crypto.createHash('sha256').update(purpose).digest();
    return crypto.pbkdf2Sync(masterKey, actualSalt, 100000, 32, 'sha512');
  }

  // Encrypt with different keys for different purposes
  static encryptWithPurpose(plaintext: string, purpose: string): string {
    const masterKey = process.env.ENCRYPTION_KEY;
    if (!masterKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    
    const derivedKey = this.deriveKey(masterKey, purpose);
    const iv = crypto.randomBytes(this.IV_LENGTH);
    
    const cipher = crypto.createCipherGCM(this.ALGORITHM, derivedKey, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine purpose + iv + tag + encrypted data
    const purposeBuffer = Buffer.from(purpose, 'utf8');
    const purposeLength = Buffer.alloc(2);
    purposeLength.writeUInt16BE(purposeBuffer.length, 0);
    
    const combined = Buffer.concat([
      purposeLength,
      purposeBuffer,
      iv,
      tag,
      Buffer.from(encrypted, 'hex')
    ]);
    
    return combined.toString('base64');
  }

  // Decrypt with purpose verification
  static decryptWithPurpose(encryptedData: string, expectedPurpose: string): string {
    const masterKey = process.env.ENCRYPTION_KEY;
    if (!masterKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract purpose
    const purposeLength = combined.readUInt16BE(0);
    const purpose = combined.subarray(2, 2 + purposeLength).toString('utf8');
    
    if (purpose !== expectedPurpose) {
      throw new Error('Purpose mismatch - data may be corrupted or tampered with');
    }
    
    // Extract iv, tag, and encrypted data
    const offset = 2 + purposeLength;
    const iv = combined.subarray(offset, offset + this.IV_LENGTH);
    const tag = combined.subarray(offset + this.IV_LENGTH, offset + this.IV_LENGTH + this.TAG_LENGTH);
    const encrypted = combined.subarray(offset + this.IV_LENGTH + this.TAG_LENGTH);
    
    const derivedKey = this.deriveKey(masterKey, purpose);
    const decipher = crypto.createDecipherGCM(this.ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}