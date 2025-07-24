import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface SecurityEventData {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  userId?: string;
  organizationId: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  recentEvents: any[];
  suspiciousActivities: any[];
}

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logSecurityEvent(data: SecurityEventData): Promise<void> {
    try {
      await this.prisma.securityEvent.create({
        data: {
          type: data.type as any,
          severity: data.severity as any,
          description: data.description,
          userId: data.userId,
          organizationId: data.organizationId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          metadata: data.metadata || {},
        },
      });

      // Log critical events immediately
      if (data.severity === 'CRITICAL' || data.severity === 'HIGH') {
        this.logger.warn(`Security Event [${data.severity}]: ${data.description}`, {
          type: data.type,
          userId: data.userId,
          organizationId: data.organizationId,
          ipAddress: data.ipAddress,
        });
      }

      // Check for suspicious patterns
      await this.detectSuspiciousActivity(data);
    } catch (error) {
      this.logger.error('Failed to log security event:', error);
    }
  }

  async getSecurityMetrics(organizationId: string, timeRange?: { start: Date; end: Date }): Promise<SecurityMetrics> {
    const where: any = { organizationId };

    if (timeRange) {
      where.createdAt = {
        gte: timeRange.start,
        lte: timeRange.end,
      };
    }

    const [totalEvents, eventsByType, eventsBySeverity, recentEvents] = await Promise.all([
      // Total events count
      this.prisma.securityEvent.count({ where }),

      // Events by type
      this.prisma.securityEvent.groupBy({
        by: ['type'],
        where,
        _count: { type: true },
      }),

      // Events by severity
      this.prisma.securityEvent.groupBy({
        by: ['severity'],
        where,
        _count: { severity: true },
      }),

      // Recent events
      this.prisma.securityEvent.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    // Detect suspicious activities
    const suspiciousActivities = await this.detectSuspiciousPatterns(organizationId, timeRange);

    return {
      totalEvents,
      eventsByType: eventsByType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {}),
      eventsBySeverity: eventsBySeverity.reduce((acc, item) => {
        acc[item.severity] = item._count.severity;
        return acc;
      }, {}),
      recentEvents,
      suspiciousActivities,
    };
  }

  async detectSuspiciousActivity(eventData: SecurityEventData): Promise<void> {
    const { type, userId, ipAddress, organizationId } = eventData;

    // Check for multiple failed login attempts
    if (type === 'LOGIN_FAILED' && userId) {
      const recentFailures = await this.prisma.securityEvent.count({
        where: {
          type: 'LOGIN_FAILED',
          userId,
          createdAt: {
            gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
          },
        },
      });

      if (recentFailures >= 5) {
        await this.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'HIGH',
          description: `Multiple failed login attempts detected for user ${userId}`,
          userId,
          organizationId,
          ipAddress,
          metadata: { failedAttempts: recentFailures },
        });
      }
    }

    // Check for login from unusual IP
    if (type === 'LOGIN_SUCCESS' && userId && ipAddress) {
      const recentLogins = await this.prisma.securityEvent.findMany({
        where: {
          type: 'LOGIN_SUCCESS',
          userId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        select: { ipAddress: true },
      });

      const knownIPs = new Set(recentLogins.map(login => login.ipAddress).filter(Boolean));
      
      if (!knownIPs.has(ipAddress) && knownIPs.size > 0) {
        await this.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'MEDIUM',
          description: `Login from new IP address: ${ipAddress}`,
          userId,
          organizationId,
          ipAddress,
          metadata: { knownIPs: Array.from(knownIPs) },
        });
      }
    }

    // Check for rapid successive logins
    if (type === 'LOGIN_SUCCESS' && userId) {
      const recentLogins = await this.prisma.securityEvent.count({
        where: {
          type: 'LOGIN_SUCCESS',
          userId,
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
          },
        },
      });

      if (recentLogins >= 3) {
        await this.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'MEDIUM',
          description: `Rapid successive logins detected for user ${userId}`,
          userId,
          organizationId,
          ipAddress,
          metadata: { loginCount: recentLogins },
        });
      }
    }
  }

  private async detectSuspiciousPatterns(
    organizationId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<any[]> {
    const where: any = { organizationId };

    if (timeRange) {
      where.createdAt = {
        gte: timeRange.start,
        lte: timeRange.end,
      };
    }

    const suspiciousActivities = [];

    // Find users with multiple failed login attempts
    const failedLogins = await this.prisma.securityEvent.groupBy({
      by: ['userId'],
      where: {
        ...where,
        type: 'LOGIN_FAILED',
        userId: { not: null },
      },
      _count: { userId: true },
      having: {
        userId: { _count: { gte: 5 } },
      },
    });

    for (const failure of failedLogins) {
      if (failure.userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: failure.userId },
          select: { email: true, firstName: true, lastName: true },
        });

        suspiciousActivities.push({
          type: 'MULTIPLE_FAILED_LOGINS',
          severity: 'HIGH',
          description: `User ${user?.email} has ${failure._count.userId} failed login attempts`,
          userId: failure.userId,
          user,
          count: failure._count.userId,
        });
      }
    }

    // Find IPs with multiple failed attempts across different users
    const suspiciousIPs = await this.prisma.securityEvent.groupBy({
      by: ['ipAddress'],
      where: {
        ...where,
        type: 'LOGIN_FAILED',
        ipAddress: { not: null },
      },
      _count: { ipAddress: true },
      having: {
        ipAddress: { _count: { gte: 10 } },
      },
    });

    for (const ip of suspiciousIPs) {
      if (ip.ipAddress) {
        suspiciousActivities.push({
          type: 'SUSPICIOUS_IP',
          severity: 'CRITICAL',
          description: `IP ${ip.ipAddress} has ${ip._count.ipAddress} failed login attempts`,
          ipAddress: ip.ipAddress,
          count: ip._count.ipAddress,
        });
      }
    }

    return suspiciousActivities;
  }

  async getSecurityEvents(
    organizationId: string,
    filters: {
      type?: string;
      severity?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const {
      type,
      severity,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (type) {
      where.type = type;
    }

    if (severity) {
      where.severity = severity;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [events, total] = await Promise.all([
      this.prisma.securityEvent.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.securityEvent.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async resolveSecurityEvent(eventId: string, userId: string): Promise<void> {
    await this.prisma.securityEvent.update({
      where: { id: eventId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
      },
    });

    this.logger.log(`Security event ${eventId} resolved by user ${userId}`);
  }

  async getSecurityDashboard(organizationId: string) {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalEvents,
      eventsLast24h,
      eventsLast7d,
      eventsLast30d,
      criticalEvents,
      unresolvedEvents,
      topEventTypes,
      recentEvents,
    ] = await Promise.all([
      this.prisma.securityEvent.count({ where: { organizationId } }),
      this.prisma.securityEvent.count({
        where: { organizationId, createdAt: { gte: last24Hours } },
      }),
      this.prisma.securityEvent.count({
        where: { organizationId, createdAt: { gte: last7Days } },
      }),
      this.prisma.securityEvent.count({
        where: { organizationId, createdAt: { gte: last30Days } },
      }),
      this.prisma.securityEvent.count({
        where: { organizationId, severity: 'CRITICAL' },
      }),
      this.prisma.securityEvent.count({
        where: { organizationId, resolved: false },
      }),
      this.prisma.securityEvent.groupBy({
        by: ['type'],
        where: { organizationId, createdAt: { gte: last30Days } },
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } },
        take: 5,
      }),
      this.prisma.securityEvent.findMany({
        where: { organizationId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      summary: {
        totalEvents,
        eventsLast24h,
        eventsLast7d,
        eventsLast30d,
        criticalEvents,
        unresolvedEvents,
      },
      topEventTypes: topEventTypes.map(item => ({
        type: item.type,
        count: item._count.type,
      })),
      recentEvents,
    };
  }
}