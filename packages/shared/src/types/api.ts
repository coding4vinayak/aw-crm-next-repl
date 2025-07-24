export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: Record<string, any>;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterOption {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: SortOption[];
  filters?: FilterOption[];
  search?: string;
  include?: string[];
}

export interface BulkOperation {
  action: 'create' | 'update' | 'delete';
  data: any[];
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: ApiError[];
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
    queue: 'healthy' | 'unhealthy';
  };
}