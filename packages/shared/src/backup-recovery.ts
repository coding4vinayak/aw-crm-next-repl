import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { createReadStream, createWriteStream } from 'fs'
import { createGzip, createGunzip } from 'zlib'
import { pipeline } from 'stream/promises'

const execAsync = promisify(exec)

export interface BackupConfig {
  databaseUrl: string
  backupPath: string
  retentionDays: number
  compressionEnabled: boolean
  encryptionKey?: string
}

export interface BackupMetadata {
  id: string
  timestamp: string
  size: number
  compressed: boolean
  encrypted: boolean
  checksum: string
  version: string
}

export class BackupManager {
  private config: BackupConfig

  constructor(config: BackupConfig) {
    this.config = config
  }

  async createBackup(): Promise<BackupMetadata> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupId = `backup-${timestamp}`
    const backupFileName = `${backupId}.sql`
    const backupFilePath = path.join(this.config.backupPath, backupFileName)

    try {
      // Ensure backup directory exists
      await fs.mkdir(this.config.backupPath, { recursive: true })

      // Create database dump
      console.log(`Creating database backup: ${backupId}`)
      await this.createDatabaseDump(backupFilePath)

      // Compress if enabled
      let finalFilePath = backupFilePath
      if (this.config.compressionEnabled) {
        finalFilePath = `${backupFilePath}.gz`
        await this.compressFile(backupFilePath, finalFilePath)
        await fs.unlink(backupFilePath) // Remove uncompressed file
      }

      // Encrypt if key provided
      if (this.config.encryptionKey) {
        const encryptedPath = `${finalFilePath}.enc`
        await this.encryptFile(finalFilePath, encryptedPath)
        await fs.unlink(finalFilePath) // Remove unencrypted file
        finalFilePath = encryptedPath
      }

      // Generate metadata
      const stats = await fs.stat(finalFilePath)
      const checksum = await this.calculateChecksum(finalFilePath)

      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: new Date().toISOString(),
        size: stats.size,
        compressed: this.config.compressionEnabled,
        encrypted: !!this.config.encryptionKey,
        checksum,
        version: process.env.npm_package_version || '1.0.0',
      }

      // Save metadata
      await this.saveMetadata(backupId, metadata)

      console.log(`Backup created successfully: ${backupId}`)
      return metadata
    } catch (error) {
      console.error(`Backup creation failed: ${error}`)
      throw error
    }
  }

  async restoreBackup(backupId: string): Promise<void> {
    try {
      console.log(`Starting restore from backup: ${backupId}`)

      // Load metadata
      const metadata = await this.loadMetadata(backupId)
      if (!metadata) {
        throw new Error(`Backup metadata not found: ${backupId}`)
      }

      // Determine file path
      let backupFilePath = path.join(this.config.backupPath, `${backupId}.sql`)
      
      if (metadata.encrypted) {
        backupFilePath += '.gz.enc'
      } else if (metadata.compressed) {
        backupFilePath += '.gz'
      }

      // Verify file exists
      await fs.access(backupFilePath)

      // Verify checksum
      const currentChecksum = await this.calculateChecksum(backupFilePath)
      if (currentChecksum !== metadata.checksum) {
        throw new Error('Backup file checksum mismatch - file may be corrupted')
      }

      // Decrypt if needed
      let workingFilePath = backupFilePath
      if (metadata.encrypted) {
        if (!this.config.encryptionKey) {
          throw new Error('Encryption key required for encrypted backup')
        }
        const decryptedPath = backupFilePath.replace('.enc', '')
        await this.decryptFile(backupFilePath, decryptedPath)
        workingFilePath = decryptedPath
      }

      // Decompress if needed
      if (metadata.compressed) {
        const decompressedPath = workingFilePath.replace('.gz', '')
        await this.decompressFile(workingFilePath, decompressedPath)
        if (workingFilePath !== backupFilePath) {
          await fs.unlink(workingFilePath) // Clean up decrypted file
        }
        workingFilePath = decompressedPath
      }

      // Restore database
      await this.restoreDatabase(workingFilePath)

      // Clean up temporary files
      if (workingFilePath !== backupFilePath) {
        await fs.unlink(workingFilePath)
      }

      console.log(`Restore completed successfully: ${backupId}`)
    } catch (error) {
      console.error(`Restore failed: ${error}`)
      throw error
    }
  }

  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const files = await fs.readdir(this.config.backupPath)
      const metadataFiles = files.filter(file => file.endsWith('.metadata.json'))
      
      const backups: BackupMetadata[] = []
      for (const file of metadataFiles) {
        const backupId = file.replace('.metadata.json', '')
        const metadata = await this.loadMetadata(backupId)
        if (metadata) {
          backups.push(metadata)
        }
      }

      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    } catch (error) {
      console.error(`Failed to list backups: ${error}`)
      return []
    }
  }

  async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays)

      for (const backup of backups) {
        const backupDate = new Date(backup.timestamp)
        if (backupDate < cutoffDate) {
          await this.deleteBackup(backup.id)
          console.log(`Deleted old backup: ${backup.id}`)
        }
      }
    } catch (error) {
      console.error(`Cleanup failed: ${error}`)
    }
  }

  private async createDatabaseDump(filePath: string): Promise<void> {
    const command = `pg_dump "${this.config.databaseUrl}" > "${filePath}"`
    await execAsync(command)
  }

  private async restoreDatabase(filePath: string): Promise<void> {
    const command = `psql "${this.config.databaseUrl}" < "${filePath}"`
    await execAsync(command)
  }

  private async compressFile(inputPath: string, outputPath: string): Promise<void> {
    const input = createReadStream(inputPath)
    const output = createWriteStream(outputPath)
    const gzip = createGzip()
    
    await pipeline(input, gzip, output)
  }

  private async decompressFile(inputPath: string, outputPath: string): Promise<void> {
    const input = createReadStream(inputPath)
    const output = createWriteStream(outputPath)
    const gunzip = createGunzip()
    
    await pipeline(input, gunzip, output)
  }

  private async encryptFile(inputPath: string, outputPath: string): Promise<void> {
    // This is a simplified encryption - in production, use proper encryption libraries
    const crypto = await import('crypto')
    const algorithm = 'aes-256-gcm'
    const key = crypto.scryptSync(this.config.encryptionKey!, 'salt', 32)
    const iv = crypto.randomBytes(16)
    
    const cipher = crypto.createCipher(algorithm, key)
    const input = createReadStream(inputPath)
    const output = createWriteStream(outputPath)
    
    await pipeline(input, cipher, output)
  }

  private async decryptFile(inputPath: string, outputPath: string): Promise<void> {
    // This is a simplified decryption - in production, use proper encryption libraries
    const crypto = await import('crypto')
    const algorithm = 'aes-256-gcm'
    const key = crypto.scryptSync(this.config.encryptionKey!, 'salt', 32)
    
    const decipher = crypto.createDecipher(algorithm, key)
    const input = createReadStream(inputPath)
    const output = createWriteStream(outputPath)
    
    await pipeline(input, decipher, output)
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    const crypto = await import('crypto')
    const hash = crypto.createHash('sha256')
    const input = createReadStream(filePath)
    
    return new Promise((resolve, reject) => {
      input.on('data', (data) => hash.update(data))
      input.on('end', () => resolve(hash.digest('hex')))
      input.on('error', reject)
    })
  }

  private async saveMetadata(backupId: string, metadata: BackupMetadata): Promise<void> {
    const metadataPath = path.join(this.config.backupPath, `${backupId}.metadata.json`)
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
  }

  private async loadMetadata(backupId: string): Promise<BackupMetadata | null> {
    try {
      const metadataPath = path.join(this.config.backupPath, `${backupId}.metadata.json`)
      const content = await fs.readFile(metadataPath, 'utf-8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }

  private async deleteBackup(backupId: string): Promise<void> {
    const metadata = await this.loadMetadata(backupId)
    if (!metadata) return

    // Delete backup file
    let backupFilePath = path.join(this.config.backupPath, `${backupId}.sql`)
    
    if (metadata.encrypted) {
      backupFilePath += '.gz.enc'
    } else if (metadata.compressed) {
      backupFilePath += '.gz'
    }

    try {
      await fs.unlink(backupFilePath)
    } catch {
      // File might not exist
    }

    // Delete metadata
    const metadataPath = path.join(this.config.backupPath, `${backupId}.metadata.json`)
    try {
      await fs.unlink(metadataPath)
    } catch {
      // File might not exist
    }
  }
}

// Factory function
export function createBackupManager(config: Partial<BackupConfig>): BackupManager {
  const defaultConfig: BackupConfig = {
    databaseUrl: process.env.DATABASE_URL || '',
    backupPath: process.env.BACKUP_PATH || './backups',
    retentionDays: 30,
    compressionEnabled: true,
    encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
  }

  return new BackupManager({ ...defaultConfig, ...config })
}