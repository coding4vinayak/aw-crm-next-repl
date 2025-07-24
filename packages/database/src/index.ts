export * from './client';
export * from './types';
export * from './utils';
export * from './connection';

// Repositories
export * from './repositories/base.repository';
export * from './repositories/customer.repository';
export * from './repositories/deal.repository';

// Re-export Prisma types
export type {
  Organization,
  User,
  Company,
  Customer,
  Lead,
  Deal,
  Activity,
  Note,
  Task,
  Tag,
  CustomerTag,
  LeadTag,
  CustomField,
  UserRole,
  UserStatus,
  CustomerStatus,
  LeadStatus,
  DealStage,
  Priority,
  TaskStatus,
  ActivityType,
  CustomFieldType,
  EntityType,
  Prisma,
} from './generated/client';