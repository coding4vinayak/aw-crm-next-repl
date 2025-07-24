import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { PrismaService } from '../../database/prisma.service';

export interface SessionData {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<SessionData> {
    // Generate secure session token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiration time
    const maxAge = this.configService.get<number>('auth.session.maxAge');
    const expiresAt = new Date(Date.now() + maxAge);

    const session = await this.prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    this.logger.log(`Session created for user: ${userId}`);

    return session;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await this.invalidateSession(sessionId);
      return null;
    }

    return session;
  }

  async getSessionByToken(token: string): Promise<SessionData | null> {
    const session = await this.prisma.session.findUnique({
      where: { token },
    });

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await this.invalidateSession(session.id);
      return null;
    }

    return session;
  }

  async getUserSessions(userId: string): Promise<SessionData[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sessions;
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false },
    });

    this.logger.log(`Session invalidated: ${sessionId}`);
  }

  async invalidateAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
    const where: any = {
      userId,
      isActive: true,
    };

    if (exceptSessionId) {
      where.id = { not: exceptSessionId };
    }

    const result = await this.prisma.session.updateMany({
      where,
      data: { isActive: false },
    });

    this.logger.log(`${result.count} sessions invalidated for user: ${userId}`);
  }

  async extendSession(sessionId: string): Promise<SessionData | null> {
    const session = await this.getSession(sessionId);
    
    if (!session) {
      return null;
    }

    // Extend expiration time
    const maxAge = this.configService.get<number>('auth.session.maxAge');
    const newExpiresAt = new Date(Date.now() + maxAge);

    const updatedSession = await this.prisma.session.update({
      where: { id: sessionId },
      data: { expiresAt: newExpiresAt },
    });

    return updatedSession;
  }

  async cleanupExpiredSessions(): Promise<void> {
    const result = await this.prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isActive: false },
        ],
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired sessions`);
  }

  async getSessionStats(organizationId: string): Promise<{
    totalActiveSessions: number;
    sessionsLast24h: number;
    sessionsLast7d: number;
    topUserAgents: Array<{ userAgent: string; count: number }>;
    topIpAddresses: Array<{ ipAddress: string; count: number }>;
  }> {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get users from this organization
    const orgUsers = await this.prisma.user.findMany({
      where: { organizationId },
      select: { id: true },
    });

    const userIds = orgUsers.map(user => user.id);

    const [
      totalActiveSessions,
      sessionsLast24h,
      sessionsLast7d,
      userAgentStats,
      ipAddressStats,
    ] = await Promise.all([
      // Total active sessions
      this.prisma.session.count({
        where: {
          userId: { in: userIds },
          isActive: true,
          expiresAt: { gt: now },
        },
      }),

      // Sessions in last 24 hours
      this.prisma.session.count({
        where: {
          userId: { in: userIds },
          createdAt: { gte: last24Hours },
        },
      }),

      // Sessions in last 7 days
      this.prisma.session.count({
        where: {
          userId: { in: userIds },
          createdAt: { gte: last7Days },
        },
      }),

      // Top user agents
      this.prisma.session.groupBy({
        by: ['userAgent'],
        where: {
          userId: { in: userIds },
          userAgent: { not: null },
          createdAt: { gte: last7Days },
        },
        _count: { userAgent: true },
        orderBy: { _count: { userAgent: 'desc' } },
        take: 5,
      }),

      // Top IP addresses
      this.prisma.session.groupBy({
        by: ['ipAddress'],
        where: {
          userId: { in: userIds },
          ipAddress: { not: null },
          createdAt: { gte: last7Days },
        },
        _count: { ipAddress: true },
        orderBy: { _count: { ipAddress: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      totalActiveSessions,
      sessionsLast24h,
      sessionsLast7d,
      topUserAgents: userAgentStats.map(stat => ({
        userAgent: stat.userAgent || 'Unknown',
        count: stat._count.userAgent,
      })),
      topIpAddresses: ipAddressStats.map(stat => ({
        ipAddress: stat.ipAddress || 'Unknown',
        count: stat._count.ipAddress,
      })),
    };
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    // Verify the session belongs to the user
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new Error('Session not found or does not belong to user');
    }

    await this.invalidateSession(sessionId);
  }

  async revokeAllOtherSessions(currentSessionId: string, userId: string): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        id: { not: currentSessionId },
        isActive: true,
      },
      data: { isActive: false },
    });

    this.logger.log(`${result.count} other sessions revoked for user: ${userId}`);
    
    return result.count;
  }
}