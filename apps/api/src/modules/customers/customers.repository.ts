import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerFiltersDto } from './dto';
import { Customer, CustomerWithRelations, PaginatedResponse } from '@awcrm/database';

@Injectable()
export class CustomersRepository {
  private readonly logger = new Logger(CustomersRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, data: CreateCustomerDto): Promise<CustomerWithRelations> {
    return this.prisma.customer.create({
      data: {
        ...data,
        organizationId,
      },
      include: {
        organization: true,
        assignedTo: true,
        company: true,
        contacts: true,
        deals: {
          include: {
            stage: true,
            pipeline: true,
          },
        },
        activities: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async findMany(
    organizationId: string,
    filters: CustomerFiltersDto,
  ): Promise<PaginatedResponse<CustomerWithRelations>> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      assignedToId,
      companyId,
      source,
      tags,
      createdAfter,
      createdBefore,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (source) {
      where.source = source;
    }

    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          tagId: {
            in: tags,
          },
        },
      };
    }

    if (createdAfter || createdBefore) {
      where.createdAt = {};
      if (createdAfter) {
        where.createdAt.gte = new Date(createdAfter);
      }
      if (createdBefore) {
        where.createdAt.lte = new Date(createdBefore);
      }
    }

    // Execute queries
    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: {
          organization: true,
          assignedTo: true,
          company: true,
          contacts: true,
          deals: {
            include: {
              stage: true,
              pipeline: true,
            },
          },
          activities: {
            include: {
              user: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 5,
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: customers,
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

  async findById(organizationId: string, id: string): Promise<CustomerWithRelations | null> {
    return this.prisma.customer.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        organization: true,
        assignedTo: true,
        company: {
          include: {
            addresses: true,
          },
        },
        contacts: true,
        deals: {
          include: {
            stage: true,
            pipeline: true,
            assignedTo: true,
          },
        },
        activities: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        notes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async findByEmail(organizationId: string, email: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({
      where: {
        email,
        organizationId,
      },
    });
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateCustomerDto,
  ): Promise<CustomerWithRelations> {
    return this.prisma.customer.update({
      where: {
        id,
        organizationId,
      },
      data,
      include: {
        organization: true,
        assignedTo: true,
        company: true,
        contacts: true,
        deals: {
          include: {
            stage: true,
            pipeline: true,
          },
        },
        activities: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async delete(organizationId: string, id: string): Promise<void> {
    await this.prisma.customer.delete({
      where: {
        id,
        organizationId,
      },
    });
  }

  async search(
    organizationId: string,
    query: string,
    limit: number = 10,
  ): Promise<CustomerWithRelations[]> {
    return this.prisma.customer.findMany({
      where: {
        organizationId,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { company: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        organization: true,
        assignedTo: true,
        company: true,
        contacts: true,
        deals: {
          include: {
            stage: true,
            pipeline: true,
          },
        },
        activities: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      take: limit,
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });
  }

  async getStats(organizationId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    prospects: number;
    totalValue: number;
    averageValue: number;
  }> {
    const [
      total,
      active,
      inactive,
      prospects,
      valueStats,
    ] = await Promise.all([
      this.prisma.customer.count({
        where: { organizationId },
      }),
      this.prisma.customer.count({
        where: { organizationId, status: 'active' },
      }),
      this.prisma.customer.count({
        where: { organizationId, status: 'inactive' },
      }),
      this.prisma.customer.count({
        where: { organizationId, status: 'prospect' },
      }),
      this.prisma.customer.aggregate({
        where: { organizationId },
        _sum: {
          lifetimeValue: true,
        },
        _avg: {
          lifetimeValue: true,
        },
      }),
    ]);

    return {
      total,
      active,
      inactive,
      prospects,
      totalValue: Number(valueStats._sum.lifetimeValue || 0),
      averageValue: Number(valueStats._avg.lifetimeValue || 0),
    };
  }

  async getActivities(
    organizationId: string,
    customerId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where: {
          organizationId,
          customerId,
        },
        include: {
          user: true,
          contact: true,
          deal: true,
          task: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.activity.count({
        where: {
          organizationId,
          customerId,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: activities,
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

  async getDeals(
    organizationId: string,
    customerId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [deals, total] = await Promise.all([
      this.prisma.deal.findMany({
        where: {
          organizationId,
          customerId,
        },
        include: {
          stage: true,
          pipeline: true,
          assignedTo: true,
          activities: {
            include: {
              user: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 5,
          },
          tasks: {
            include: {
              assignedTo: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 5,
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.deal.count({
        where: {
          organizationId,
          customerId,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: deals,
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
}