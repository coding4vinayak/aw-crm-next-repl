import { PrismaClient, Prisma } from '../generated/client';
import { BaseRepository } from './base.repository';
import { DealWithRelations, DealFilters } from '../types';
import { createDateRangeFilter, createNumberRangeFilter } from '../utils';

export class DealRepository extends BaseRepository<
  DealWithRelations,
  Prisma.DealCreateInput,
  Prisma.DealUpdateInput,
  Prisma.DealWhereInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'deal');
  }

  /**
   * Build where clause from filters
   */
  private buildWhereClause(filters: DealFilters, organizationId: string): Prisma.DealWhereInput {
    const where: Prisma.DealWhereInput = {
      organizationId,
    };

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { customer: { 
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
          ]
        }},
      ];
    }

    if (filters.stage) {
      where.stage = filters.stage as any;
    }

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.priority) {
      where.priority = filters.priority as any;
    }

    if (filters.source) {
      where.source = filters.source;
    }

    if (filters.valueMin !== undefined || filters.valueMax !== undefined) {
      const valueFilter = createNumberRangeFilter(filters.valueMin, filters.valueMax);
      if (valueFilter) {
        where.value = valueFilter;
      }
    }

    if (filters.expectedCloseAfter || filters.expectedCloseBefore) {
      const expectedCloseDateFilter = createDateRangeFilter(filters.expectedCloseAfter, filters.expectedCloseBefore);
      if (expectedCloseDateFilter) {
        where.expectedCloseDate = expectedCloseDateFilter;
      }
    }

    if (filters.createdAfter || filters.createdBefore) {
      const createdAtFilter = createDateRangeFilter(filters.createdAfter, filters.createdBefore);
      if (createdAtFilter) {
        where.createdAt = createdAtFilter;
      }
    }

    return where;
  }

  /**
   * Find deals with filters
   */
  async findWithFilters(
    filters: DealFilters,
    organizationId: string,
    pagination = { page: 1, limit: 10 },
    sort?: any
  ) {
    const where = this.buildWhereClause(filters, organizationId);
    
    const include = {
      customer: {
        include: {
          company: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          activities: true,
          notes: true,
          tasks: true,
        },
      },
    };

    return this.findMany(where, pagination, sort, include);
  }

  /**
   * Get deals by stage
   */
  async findByStage(stage: string, organizationId: string) {
    return this.prisma.deal.findMany({
      where: {
        organizationId,
        stage: stage as any,
      },
      include: {
        customer: {
          include: {
            company: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { expectedCloseDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Get pipeline statistics
   */
  async getPipelineStatistics(organizationId: string) {
    const [
      stageStats,
      totalValue,
      wonValue,
      lostValue,
      averageDealSize,
      conversionRate,
    ] = await Promise.all([
      this.prisma.deal.groupBy({
        by: ['stage'],
        where: { organizationId },
        _count: { _all: true },
        _sum: { value: true },
        _avg: { probability: true },
      }),
      this.prisma.deal.aggregate({
        where: { organizationId },
        _sum: { value: true },
      }),
      this.prisma.deal.aggregate({
        where: { organizationId, stage: 'CLOSED_WON' },
        _sum: { value: true },
      }),
      this.prisma.deal.aggregate({
        where: { organizationId, stage: 'CLOSED_LOST' },
        _sum: { value: true },
      }),
      this.prisma.deal.aggregate({
        where: { organizationId },
        _avg: { value: true },
      }),
      this.getConversionRate(organizationId),
    ]);

    return {
      byStage: stageStats.map((stat: any) => ({
        stage: stat.stage,
        count: stat._count._all,
        value: Number(stat._sum.value) || 0,
        averageProbability: stat._avg.probability || 0,
      })),
      totalValue: Number(totalValue._sum.value) || 0,
      wonValue: Number(wonValue._sum.value) || 0,
      lostValue: Number(lostValue._sum.value) || 0,
      averageDealSize: Number(averageDealSize._avg.value) || 0,
      conversionRate,
    };
  }

  /**
   * Calculate conversion rate
   */
  private async getConversionRate(organizationId: string): Promise<number> {
    const [wonCount, totalClosedCount] = await Promise.all([
      this.prisma.deal.count({
        where: { organizationId, stage: 'CLOSED_WON' },
      }),
      this.prisma.deal.count({
        where: { 
          organizationId, 
          stage: { in: ['CLOSED_WON', 'CLOSED_LOST'] },
        },
      }),
    ]);

    return totalClosedCount > 0 ? (wonCount / totalClosedCount) * 100 : 0;
  }

  /**
   * Get deals by assigned user
   */
  async findByAssignedUser(userId: string, organizationId: string) {
    return this.prisma.deal.findMany({
      where: {
        organizationId,
        assignedToId: userId,
        stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
      },
      include: {
        customer: {
          include: {
            company: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { expectedCloseDate: 'asc' },
      ],
    });
  }

  /**
   * Update deal stage
   */
  async updateStage(dealId: string, stage: string, userId: string) {
    const deal = await this.prisma.deal.update({
      where: { id: dealId },
      data: { 
        stage: stage as any,
        updatedAt: new Date(),
        ...(stage === 'CLOSED_WON' || stage === 'CLOSED_LOST' ? {
          actualCloseDate: new Date(),
        } : {}),
      },
      include: {
        customer: true,
        assignedTo: true,
      },
    });

    // Create activity for stage change
    await this.prisma.activity.create({
      data: {
        type: stage === 'CLOSED_WON' ? 'DEAL_WON' : stage === 'CLOSED_LOST' ? 'DEAL_LOST' : 'DEAL_UPDATED',
        title: `Deal moved to ${stage.replace('_', ' ').toLowerCase()}`,
        description: `Deal "${deal.title}" was moved to ${stage.replace('_', ' ').toLowerCase()} stage`,
        organizationId: deal.organizationId,
        dealId: deal.id,
        customerId: deal.customerId,
        createdById: userId,
      },
    });

    return deal;
  }

  /**
   * Get deals closing soon
   */
  async findClosingSoon(organizationId: string, days: number = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.deal.findMany({
      where: {
        organizationId,
        stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
        expectedCloseDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        customer: {
          include: {
            company: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        expectedCloseDate: 'asc',
      },
    });
  }

  /**
   * Get weighted pipeline value
   */
  async getWeightedPipelineValue(organizationId: string): Promise<number> {
    const deals = await this.prisma.deal.findMany({
      where: {
        organizationId,
        stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
      },
      select: {
        value: true,
        probability: true,
      },
    });

    return deals.reduce((total: number, deal: any) => {
      const probability = deal.probability || 0;
      return total + (Number(deal.value) * probability / 100);
    }, 0);
  }
}