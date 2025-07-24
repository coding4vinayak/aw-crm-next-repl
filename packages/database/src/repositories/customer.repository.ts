import { PrismaClient, Prisma } from '../generated/client';
import { BaseRepository } from './base.repository';
import { CustomerWithRelations, CustomerFilters } from '../types';
import { createSearchFilter, createDateRangeFilter } from '../utils';

export class CustomerRepository extends BaseRepository<
  CustomerWithRelations,
  Prisma.CustomerCreateInput,
  Prisma.CustomerUpdateInput,
  Prisma.CustomerWhereInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'customer');
  }

  /**
   * Build where clause from filters
   */
  private buildWhereClause(filters: CustomerFilters, organizationId: string): Prisma.CustomerWhereInput {
    const where: Prisma.CustomerWhereInput = {
      organizationId,
    };

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { company: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    if (filters.status) {
      where.status = filters.status as any;
    }

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    if (filters.source) {
      where.source = filters.source;
    }

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        some: {
          tagId: { in: filters.tags },
        },
      };
    }

    if (filters.createdAfter || filters.createdBefore) {
      const dateFilter = createDateRangeFilter(filters.createdAfter, filters.createdBefore);
      if (dateFilter) {
        where.createdAt = dateFilter;
      }
    }

    return where;
  }

  /**
   * Find customers with filters
   */
  async findWithFilters(
    filters: CustomerFilters,
    organizationId: string,
    pagination = { page: 1, limit: 10 },
    sort?: any
  ) {
    const where = this.buildWhereClause(filters, organizationId);
    
    const include = {
      company: true,
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      _count: {
        select: {
          deals: true,
          activities: true,
          notes: true,
          tasks: true,
        },
      },
    };

    return this.findMany(where, pagination, sort, include);
  }

  /**
   * Find customer by email within organization
   */
  async findByEmail(email: string, organizationId: string): Promise<CustomerWithRelations | null> {
    return this.prisma.customer.findUnique({
      where: {
        email_organizationId: {
          email,
          organizationId,
        },
      },
      include: {
        company: true,
        assignedTo: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  /**
   * Get customer statistics
   */
  async getStatistics(organizationId: string) {
    const [
      totalCount,
      activeCount,
      prospectCount,
      inactiveCount,
      totalLifetimeValue,
      recentCount,
    ] = await Promise.all([
      this.prisma.customer.count({
        where: { organizationId },
      }),
      this.prisma.customer.count({
        where: { organizationId, status: 'ACTIVE' },
      }),
      this.prisma.customer.count({
        where: { organizationId, status: 'PROSPECT' },
      }),
      this.prisma.customer.count({
        where: { organizationId, status: 'INACTIVE' },
      }),
      this.prisma.customer.aggregate({
        where: { organizationId },
        _sum: { lifetimeValue: true },
      }),
      this.prisma.customer.count({
        where: {
          organizationId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    return {
      total: totalCount,
      active: activeCount,
      prospect: prospectCount,
      inactive: inactiveCount,
      totalLifetimeValue: totalLifetimeValue._sum.lifetimeValue || 0,
      averageLifetimeValue: totalCount > 0 ? (Number(totalLifetimeValue._sum.lifetimeValue) || 0) / totalCount : 0,
      recentlyAdded: recentCount,
    };
  }

  /**
   * Get customers by assigned user
   */
  async findByAssignedUser(userId: string, organizationId: string) {
    return this.prisma.customer.findMany({
      where: {
        organizationId,
        assignedToId: userId,
      },
      include: {
        company: true,
        _count: {
          select: {
            deals: true,
            activities: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * Update customer lifetime value
   */
  async updateLifetimeValue(customerId: string, value: number) {
    return this.prisma.customer.update({
      where: { id: customerId },
      data: { lifetimeValue: value },
    });
  }

  /**
   * Bulk assign customers to user
   */
  async bulkAssign(customerIds: string[], assignedToId: string) {
    return this.prisma.customer.updateMany({
      where: {
        id: { in: customerIds },
      },
      data: {
        assignedToId,
        updatedAt: new Date(),
      },
    });
  }
}