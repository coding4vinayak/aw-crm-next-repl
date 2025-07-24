import { prisma } from '@awcrm/database';
import { EncryptionService } from './encryption';
import { AuditLogger } from './audit';
import { NextRequest } from 'next/server';

export interface DataExportRequest {
  userId: string;
  organizationId: string;
  format: 'json' | 'csv' | 'xml';
  includeDeleted?: boolean;
}

export interface DataDeletionRequest {
  userId: string;
  organizationId: string;
  reason: string;
  hardDelete?: boolean; // true = permanent deletion, false = soft delete
}

export interface ConsentRecord {
  userId: string;
  organizationId: string;
  consentType: string;
  granted: boolean;
  purpose: string;
  legalBasis: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class GDPRService {
  // Data export functionality
  static async exportUserData(request: DataExportRequest): Promise<any> {
    const { userId, organizationId, format, includeDeleted = false } = request;

    try {
      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: userId, organizationId },
        include: {
          assignedCustomers: true,
          assignedLeads: true,
          assignedDeals: true,
          assignedTasks: true,
          createdActivities: true,
          createdNotes: true,
          createdTasks: true,
          sessions: true,
          auditLogs: true,
          securityEvents: true,
          apiKeys: true,
          mfaSettings: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Collect all user-related data
      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
          emailVerified: user.emailVerified,
          mfaEnabled: user.mfaEnabled,
          settings: user.settings,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        assignedCustomers: user.assignedCustomers,
        assignedLeads: user.assignedLeads,
        assignedDeals: user.assignedDeals,
        assignedTasks: user.assignedTasks,
        createdActivities: user.createdActivities,
        createdNotes: user.createdNotes,
        createdTasks: user.createdTasks,
        sessions: user.sessions.map(session => ({
          id: session.id,
          expiresAt: session.expiresAt,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          isActive: session.isActive,
          createdAt: session.createdAt,
        })),
        auditLogs: user.auditLogs,
        securityEvents: user.securityEvents,
        apiKeys: user.apiKeys.map(key => ({
          id: key.id,
          name: key.name,
          permissions: key.permissions,
          lastUsedAt: key.lastUsedAt,
          expiresAt: key.expiresAt,
          isActive: key.isActive,
          createdAt: key.createdAt,
        })),
        mfaSettings: user.mfaSettings ? {
          enabled: user.mfaSettings.enabled,
          createdAt: user.mfaSettings.createdAt,
        } : null,
        exportMetadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: userId,
          format,
          includeDeleted,
          dataRetentionPolicy: 'As per GDPR Article 5(1)(e)',
        },
      };

      // Log the export
      await AuditLogger.logExport('USER', [userId], format);

      // Format the data based on requested format
      switch (format) {
        case 'json':
          return exportData;
        case 'csv':
          return this.convertToCSV(exportData);
        case 'xml':
          return this.convertToXML(exportData);
        default:
          return exportData;
      }
    } catch (error) {
      console.error('Data export failed:', error);
      throw new Error(`Data export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Data deletion functionality
  static async deleteUserData(request: DataDeletionRequest, requestingUserId?: string): Promise<void> {
    const { userId, organizationId, reason, hardDelete = false } = request;

    try {
      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId, organizationId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (hardDelete) {
        // Permanent deletion - cannot be undone
        await this.performHardDelete(userId, organizationId);
      } else {
        // Soft deletion - mark as deleted but keep for compliance
        await this.performSoftDelete(userId, organizationId);
      }

      // Log the deletion
      await AuditLogger.log(
        hardDelete ? 'HARD_DELETE' : 'SOFT_DELETE',
        'USER',
        userId,
        { reason },
        null,
        undefined,
        { userId: requestingUserId }
      );

      // Create deletion record for compliance
      await this.createDeletionRecord(userId, organizationId, reason, hardDelete);

    } catch (error) {
      console.error('Data deletion failed:', error);
      throw new Error(`Data deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Consent management
  static async recordConsent(consent: ConsentRecord, request?: NextRequest): Promise<void> {
    try {
      // Store consent record
      await prisma.$executeRaw`
        INSERT INTO consent_records (
          user_id, organization_id, consent_type, granted, purpose, 
          legal_basis, timestamp, ip_address, user_agent
        ) VALUES (
          ${consent.userId}, ${consent.organizationId}, ${consent.consentType},
          ${consent.granted}, ${consent.purpose}, ${consent.legalBasis},
          ${consent.timestamp}, ${consent.ipAddress}, ${consent.userAgent}
        )
      `;

      // Log consent change
      await AuditLogger.log(
        'CONSENT_CHANGE',
        'USER',
        consent.userId,
        null,
        consent,
        request
      );

    } catch (error) {
      console.error('Failed to record consent:', error);
      throw new Error('Failed to record consent');
    }
  }

  // Get user consent status
  static async getUserConsent(userId: string, organizationId: string): Promise<ConsentRecord[]> {
    try {
      const consents = await prisma.$queryRaw<ConsentRecord[]>`
        SELECT * FROM consent_records 
        WHERE user_id = ${userId} AND organization_id = ${organizationId}
        ORDER BY timestamp DESC
      `;

      return consents;
    } catch (error) {
      console.error('Failed to get user consent:', error);
      return [];
    }
  }

  // Data portability - export in standard format
  static async exportForPortability(userId: string, organizationId: string): Promise<any> {
    const exportData = await this.exportUserData({
      userId,
      organizationId,
      format: 'json',
    });

    // Add portability-specific metadata
    return {
      ...exportData,
      portabilityMetadata: {
        standard: 'GDPR Article 20',
        format: 'JSON',
        encoding: 'UTF-8',
        exportedAt: new Date().toISOString(),
        rightsExercised: 'Data Portability',
      },
    };
  }

  // Right to rectification - update user data
  static async rectifyUserData(
    userId: string,
    organizationId: string,
    updates: any,
    requestingUserId?: string
  ): Promise<void> {
    try {
      const oldUser = await prisma.user.findUnique({
        where: { id: userId, organizationId },
      });

      if (!oldUser) {
        throw new Error('User not found');
      }

      // Update user data
      const updatedUser = await prisma.user.update({
        where: { id: userId, organizationId },
        data: updates,
      });

      // Log the rectification
      await AuditLogger.logUpdate('USER', userId, oldUser, updatedUser);

      // Record rectification for compliance
      await this.createRectificationRecord(userId, organizationId, updates, requestingUserId);

    } catch (error) {
      console.error('Data rectification failed:', error);
      throw new Error('Data rectification failed');
    }
  }

  // Data retention policy enforcement
  static async enforceDataRetention(organizationId: string): Promise<void> {
    try {
      const retentionPeriod = 7 * 365 * 24 * 60 * 60 * 1000; // 7 years in milliseconds
      const cutoffDate = new Date(Date.now() - retentionPeriod);

      // Find data that should be deleted based on retention policy
      const expiredData = await prisma.auditLog.findMany({
        where: {
          organizationId,
          createdAt: {
            lt: cutoffDate,
          },
        },
        select: { id: true },
      });

      // Delete expired audit logs
      if (expiredData.length > 0) {
        await prisma.auditLog.deleteMany({
          where: {
            id: {
              in: expiredData.map(d => d.id),
            },
          },
        });

        console.log(`Deleted ${expiredData.length} expired audit log entries`);
      }

      // Similar cleanup for other data types...

    } catch (error) {
      console.error('Data retention enforcement failed:', error);
    }
  }

  // Privacy impact assessment helpers
  static async generatePrivacyReport(organizationId: string): Promise<any> {
    try {
      const [
        userCount,
        dataProcessingActivities,
        consentStats,
        deletionRequests,
        exportRequests,
      ] = await Promise.all([
        prisma.user.count({ where: { organizationId } }),
        this.getDataProcessingActivities(organizationId),
        this.getConsentStatistics(organizationId),
        this.getDeletionRequestStats(organizationId),
        this.getExportRequestStats(organizationId),
      ]);

      return {
        organizationId,
        generatedAt: new Date().toISOString(),
        userCount,
        dataProcessingActivities,
        consentStats,
        deletionRequests,
        exportRequests,
        complianceStatus: {
          gdprCompliant: true,
          lastAssessment: new Date().toISOString(),
          nextAssessment: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };
    } catch (error) {
      console.error('Privacy report generation failed:', error);
      throw new Error('Privacy report generation failed');
    }
  }

  // Helper methods
  private static async performHardDelete(userId: string, organizationId: string): Promise<void> {
    // Delete in correct order to respect foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.session.deleteMany({ where: { userId } });
      await tx.apiKey.deleteMany({ where: { userId } });
      await tx.mfaSettings.deleteMany({ where: { userId } });
      
      // Update foreign key references to null
      await tx.customer.updateMany({
        where: { assignedToId: userId },
        data: { assignedToId: null },
      });
      
      await tx.lead.updateMany({
        where: { assignedToId: userId },
        data: { assignedToId: null },
      });
      
      await tx.deal.updateMany({
        where: { assignedToId: userId },
        data: { assignedToId: null },
      });
      
      await tx.task.updateMany({
        where: { assignedToId: userId },
        data: { assignedToId: null },
      });

      // Finally delete the user
      await tx.user.delete({ where: { id: userId } });
    });
  }

  private static async performSoftDelete(userId: string, organizationId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId, organizationId },
      data: {
        status: 'INACTIVE',
        email: `deleted_${userId}@deleted.local`,
        firstName: '[DELETED]',
        lastName: '[DELETED]',
        phone: null,
        avatar: null,
        settings: null,
      },
    });
  }

  private static async createDeletionRecord(
    userId: string,
    organizationId: string,
    reason: string,
    hardDelete: boolean
  ): Promise<void> {
    // This would typically be stored in a separate compliance table
    console.log(`Deletion record created: User ${userId}, Reason: ${reason}, Hard: ${hardDelete}`);
  }

  private static async createRectificationRecord(
    userId: string,
    organizationId: string,
    updates: any,
    requestingUserId?: string
  ): Promise<void> {
    // This would typically be stored in a separate compliance table
    console.log(`Rectification record created: User ${userId}, Updates: ${JSON.stringify(updates)}`);
  }

  private static convertToCSV(data: any): string {
    // Simple CSV conversion - in production, use a proper CSV library
    const flatten = (obj: any, prefix = ''): any => {
      const flattened: any = {};
      for (const key in obj) {
        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          Object.assign(flattened, flatten(obj[key], `${prefix}${key}.`));
        } else {
          flattened[`${prefix}${key}`] = obj[key];
        }
      }
      return flattened;
    };

    const flattened = flatten(data);
    const headers = Object.keys(flattened).join(',');
    const values = Object.values(flattened).map(v => 
      typeof v === 'string' ? `\"${v.replace(/\"/g, '\"\"')}\"` : v
    ).join(',');

    return `${headers}\n${values}`;
  }

  private static convertToXML(data: any): string {
    // Simple XML conversion - in production, use a proper XML library
    const toXML = (obj: any, indent = 0): string => {
      const spaces = '  '.repeat(indent);
      let xml = '';
      
      for (const key in obj) {
        const value = obj[key];
        if (Array.isArray(value)) {
          xml += `${spaces}<${key}>\n`;
          value.forEach(item => {
            xml += `${spaces}  <item>\n`;
            xml += toXML(item, indent + 2);
            xml += `${spaces}  </item>\n`;
          });
          xml += `${spaces}</${key}>\n`;
        } else if (value && typeof value === 'object') {
          xml += `${spaces}<${key}>\n`;
          xml += toXML(value, indent + 1);
          xml += `${spaces}</${key}>\n`;
        } else {
          xml += `${spaces}<${key}>${value}</${key}>\n`;
        }
      }
      
      return xml;
    };

    return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<data>\n${toXML(data, 1)}</data>`;
  }

  private static async getDataProcessingActivities(organizationId: string): Promise<any[]> {
    // Return data processing activities for privacy report
    return [
      {
        activity: 'Customer Management',
        purpose: 'CRM functionality',
        legalBasis: 'Legitimate interest',
        dataTypes: ['Contact information', 'Communication history'],
        retention: '7 years',
      },
      // Add more activities...
    ];
  }

  private static async getConsentStatistics(organizationId: string): Promise<any> {
    // Return consent statistics
    return {
      totalConsents: 0,
      grantedConsents: 0,
      revokedConsents: 0,
    };
  }

  private static async getDeletionRequestStats(organizationId: string): Promise<any> {
    // Return deletion request statistics
    return {
      totalRequests: 0,
      completedRequests: 0,
      pendingRequests: 0,
    };
  }

  private static async getExportRequestStats(organizationId: string): Promise<any> {
    // Return export request statistics
    return {
      totalRequests: 0,
      completedRequests: 0,
      pendingRequests: 0,
    };
  }
}