import { prisma } from '@awcrm/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';

export interface AuditContext {
  userId?: string;
  organizationId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export class AuditLogger {
  private static async getContext(request?: NextRequest): Promise<AuditContext> {
    const session = await getServerSession(authOptions);
    
    let ipAddress: string | undefined;
    let userAgent: string | undefined;
    
    if (request) {
      const forwarded = request.headers.get('x-forwarded-for');
      const realIP = request.headers.get('x-real-ip');
      
      if (forwarded) {
        ipAddress = forwarded.split(',')[0].trim();
      } else if (realIP) {
        ipAddress = realIP;
      } else {
        ipAddress = request.ip || 'unknown';
      }\n      userAgent = request.headers.get('user-agent') || undefined;
    }
    
    let organizationId: string | undefined;
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true },
      });
      organizationId = user?.organizationId;
    }
    
    return {
      userId: session?.user?.id,
      organizationId,
      ipAddress,
      userAgent,
    };
  }

  // Generic audit logging
  static async log(
    action: string,
    entityType: string,
    entityId: string,
    oldValues?: any,
    newValues?: any,
    request?: NextRequest,
    customContext?: Partial<AuditContext>
  ): Promise<void> {
    try {
      const context = await this.getContext(request);
      const finalContext = { ...context, ...customContext };
      
      if (!finalContext.organizationId) {
        console.warn('Audit log skipped: No organization context');
        return;
      }
      
      await prisma.auditLog.create({
        data: {
          action,
          entityType,
          entityId,
          oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
          newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
          userId: finalContext.userId || null,
          organizationId: finalContext.organizationId,
          ipAddress: finalContext.ipAddress,
          userAgent: finalContext.userAgent,
          metadata: {
            timestamp: new Date().toISOString(),
            sessionId: finalContext.sessionId,
          },
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  // Specific audit methods for common operations
  static async logCreate(
    entityType: string,
    entityId: string,
    newValues: any,
    request?: NextRequest
  ): Promise<void> {
    await this.log('CREATE', entityType, entityId, null, newValues, request);
  }

  static async logUpdate(
    entityType: string,
    entityId: string,
    oldValues: any,
    newValues: any,
    request?: NextRequest
  ): Promise<void> {
    await this.log('UPDATE', entityType, entityId, oldValues, newValues, request);
  }

  static async logDelete(
    entityType: string,
    entityId: string,
    oldValues: any,
    request?: NextRequest
  ): Promise<void> {
    await this.log('DELETE', entityType, entityId, oldValues, null, request);
  }

  static async logView(
    entityType: string,
    entityId: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log('VIEW', entityType, entityId, null, null, request);
  }

  static async logExport(
    entityType: string,
    entityIds: string[],
    format: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log('EXPORT', entityType, 'bulk', null, {
      entityIds,
      format,
      count: entityIds.length,
    }, request);
  }

  static async logImport(
    entityType: string,
    count: number,
    request?: NextRequest
  ): Promise<void> {
    await this.log('IMPORT', entityType, 'bulk', null, {
      count,
    }, request);
  }

  // Authentication-specific audit logs
  static async logLogin(
    userId: string,
    success: boolean,
    method: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log('LOGIN', 'USER', userId, null, {
      success,
      method,
    }, request);
  }

  static async logLogout(
    userId: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log('LOGOUT', 'USER', userId, null, null, request);
  }

  static async logPasswordChange(
    userId: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log('PASSWORD_CHANGE', 'USER', userId, null, null, request);
  }

  static async logMFAEnable(
    userId: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log('MFA_ENABLE', 'USER', userId, null, null, request);
  }

  static async logMFADisable(
    userId: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log('MFA_DISABLE', 'USER', userId, null, null, request);
  }

  // Permission and role changes
  static async logRoleChange(
    userId: string,
    oldRole: string,
    newRole: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log('ROLE_CHANGE', 'USER', userId, { role: oldRole }, { role: newRole }, request);
  }

  static async logPermissionChange(
    userId: string,
    permission: string,
    granted: boolean,
    request?: NextRequest
  ): Promise<void> {
    await this.log('PERMISSION_CHANGE', 'USER', userId, null, {
      permission,
      granted,
    }, request);
  }

  // Data access logs
  static async logDataAccess(
    entityType: string,
    entityId: string,
    accessType: 'READ' | 'WRITE' | 'DELETE',
    request?: NextRequest
  ): Promise<void> {
    await this.log('DATA_ACCESS', entityType, entityId, null, {
      accessType,
    }, request);
  }

  // API access logs
  static async logAPIAccess(
    endpoint: string,
    method: string,
    statusCode: number,
    request?: NextRequest
  ): Promise<void> {
    await this.log('API_ACCESS', 'ENDPOINT', endpoint, null, {
      method,
      statusCode,
    }, request);
  }

  // Query audit logs
  static async getAuditLogs(
    organizationId: string,
    filters: {
      userId?: string;
      entityType?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const {
      userId,
      entityType,
      action,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = filters;

    const where: any = {
      organizationId,
    };

    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      hasMore: offset + limit < total,
    };
  }

  // Generate audit report
  static async generateAuditReport(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const logs = await prisma.auditLog.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Generate summary statistics
    const summary = {
      totalEvents: logs.length,
      uniqueUsers: new Set(logs.map(log => log.userId).filter(Boolean)).size,
      actionBreakdown: logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      entityBreakdown: logs.reduce((acc, log) => {
        acc[log.entityType] = (acc[log.entityType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      dailyActivity: logs.reduce((acc, log) => {
        const date = log.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return {
      logs,
      summary,
      period: {
        startDate,
        endDate,
      },
    };
  }
}