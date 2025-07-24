import { Prisma } from './generated/client';
import type { PaginationOptions, SortOptions, PaginatedResponse } from './types';

// Re-export types from types.ts
export type { PaginationOptions, SortOptions, PaginatedResponse } from './types';

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginatedResponse<any>['pagination'] {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Calculate skip value for pagination
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Create Prisma orderBy from sort options
 */
export function createOrderBy(sort?: SortOptions): any {
  if (!sort) return { createdAt: 'desc' };
  
  return {
    [sort.field]: sort.direction,
  };
}

/**
 * Create search filter for text fields
 */
export function createSearchFilter(
  search: string,
  fields: string[]
): any {
  return {
    OR: fields.map(field => ({
      [field]: {
        contains: search,
        mode: 'insensitive' as const,
      },
    })),
  };
}

/**
 * Create date range filter
 */
export function createDateRangeFilter(
  after?: Date,
  before?: Date
): Prisma.DateTimeFilter | undefined {
  if (!after && !before) return undefined;
  
  const filter: Prisma.DateTimeFilter = {};
  
  if (after) filter.gte = after;
  if (before) filter.lte = before;
  
  return filter;
}

/**
 * Create number range filter
 */
export function createNumberRangeFilter(
  min?: number,
  max?: number
): Prisma.IntFilter | Prisma.DecimalFilter | undefined {
  if (min === undefined && max === undefined) return undefined;
  
  const filter: any = {};
  
  if (min !== undefined) filter.gte = min;
  if (max !== undefined) filter.lte = max;
  
  return filter;
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  page: number = 1,
  limit: number = 10
): PaginationOptions {
  const validatedPage = Math.max(1, Math.floor(page));
  const validatedLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  
  return {
    page: validatedPage,
    limit: validatedLimit,
  };
}

/**
 * Create a standardized API response
 */
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string
) {
  return {
    success,
    data,
    error,
    message,
  };
}

/**
 * Handle Prisma errors and convert to user-friendly messages
 */
export function handlePrismaError(error: any): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return 'A record with this information already exists.';
      case 'P2014':
        return 'The change you are trying to make would violate a required relation.';
      case 'P2003':
        return 'Foreign key constraint failed.';
      case 'P2025':
        return 'Record not found.';
      default:
        return 'Database operation failed.';
    }
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    return 'Invalid data provided.';
  }
  
  return 'An unexpected error occurred.';
}

/**
 * Generate a unique slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Format currency values
 */
export function formatCurrency(
  amount: number | string,
  currency: string = 'USD'
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(numAmount);
}

/**
 * Calculate deal weighted value
 */
export function calculateWeightedValue(
  value: number | string,
  probability: number
): number {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return (numValue * probability) / 100;
}

/**
 * Generate initials from name
 */
export function generateInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (basic)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Generate random color for tags
 */
export function generateRandomColor(): string {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#f43f5e'
  ];
  
  return colors[Math.floor(Math.random() * colors.length)]!;
}