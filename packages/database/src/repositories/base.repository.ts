import { PrismaClient } from '../generated/client';
import { 
  PaginationOptions, 
  SortOptions, 
  PaginatedResponse,
  createPaginationMeta,
  calculateSkip,
  createOrderBy,
  validatePagination 
} from '../utils';

export abstract class BaseRepository<T, CreateInput, UpdateInput, WhereInput> {
  protected prisma: PrismaClient;
  protected modelName: string;

  constructor(prisma: PrismaClient, modelName: string) {
    this.prisma = prisma;
    this.modelName = modelName;
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string, include?: any): Promise<T | null> {
    const model = (this.prisma as any)[this.modelName];
    return model.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * Find multiple records with pagination and filtering
   */
  async findMany(
    where: WhereInput = {} as WhereInput,
    pagination: PaginationOptions = { page: 1, limit: 10 },
    sort?: SortOptions,
    include?: any
  ): Promise<PaginatedResponse<T>> {
    const validatedPagination = validatePagination(pagination.page, pagination.limit);
    const skip = calculateSkip(validatedPagination.page, validatedPagination.limit);
    const orderBy = createOrderBy(sort);

    const model = (this.prisma as any)[this.modelName];

    const [data, total] = await Promise.all([
      model.findMany({
        where,
        skip,
        take: validatedPagination.limit,
        orderBy,
        include,
      }),
      model.count({ where }),
    ]);

    return {
      data,
      pagination: createPaginationMeta(total, validatedPagination.page, validatedPagination.limit),
    };
  }

  /**
   * Create a new record
   */
  async create(data: CreateInput, include?: any): Promise<T> {
    const model = (this.prisma as any)[this.modelName];
    return model.create({
      data,
      include,
    });
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: UpdateInput, include?: any): Promise<T> {
    const model = (this.prisma as any)[this.modelName];
    return model.update({
      where: { id },
      data,
      include,
    });
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<T> {
    const model = (this.prisma as any)[this.modelName];
    return model.delete({
      where: { id },
    });
  }

  /**
   * Check if a record exists
   */
  async exists(where: WhereInput): Promise<boolean> {
    const model = (this.prisma as any)[this.modelName];
    const count = await model.count({ where });
    return count > 0;
  }

  /**
   * Count records matching criteria
   */
  async count(where: WhereInput = {} as WhereInput): Promise<number> {
    const model = (this.prisma as any)[this.modelName];
    return model.count({ where });
  }

  /**
   * Bulk create records
   */
  async createMany(data: CreateInput[]): Promise<{ count: number }> {
    const model = (this.prisma as any)[this.modelName];
    return model.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * Bulk update records
   */
  async updateMany(where: WhereInput, data: Partial<UpdateInput>): Promise<{ count: number }> {
    const model = (this.prisma as any)[this.modelName];
    return model.updateMany({
      where,
      data,
    });
  }

  /**
   * Bulk delete records
   */
  async deleteMany(where: WhereInput): Promise<{ count: number }> {
    const model = (this.prisma as any)[this.modelName];
    return model.deleteMany({
      where,
    });
  }
}