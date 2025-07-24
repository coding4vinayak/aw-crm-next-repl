import type {
  User,
  Customer,
  Lead,
  Deal,
  Activity,
  Note,
  Task,
  Company,
  Tag,
  Organization,
  CustomField,
} from './generated/client';

// Extended types with relations
export interface CustomerWithRelations extends Customer {
  company?: Company | null;
  assignedTo?: User | null;
  deals?: Deal[];
  activities?: Activity[];
  notes?: Note[];
  tasks?: Task[];
  tags?: { tag: Tag }[];
}

export interface LeadWithRelations extends Lead {
  company?: Company | null;
  assignedTo?: User | null;
  activities?: Activity[];
  notes?: Note[];
  tasks?: Task[];
  tags?: { tag: Tag }[];
}

export interface DealWithRelations extends Deal {
  customer?: Customer | null;
  assignedTo?: User | null;
  activities?: Activity[];
  notes?: Note[];
  tasks?: Task[];
}

export interface UserWithRelations extends User {
  organization: Organization;
  assignedCustomers?: Customer[];
  assignedLeads?: Lead[];
  assignedDeals?: Deal[];
  assignedTasks?: Task[];
}

export interface ActivityWithRelations extends Activity {
  customer?: Customer | null;
  lead?: Lead | null;
  deal?: Deal | null;
  createdBy: User;
}

export interface NoteWithRelations extends Note {
  customer?: Customer | null;
  lead?: Lead | null;
  deal?: Deal | null;
  createdBy: User;
}

export interface TaskWithRelations extends Task {
  customer?: Customer | null;
  lead?: Lead | null;
  deal?: Deal | null;
  assignedTo?: User | null;
  createdBy: User;
}

// API Response types
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Filter types
export interface CustomerFilters {
  search?: string;
  status?: string;
  assignedToId?: string;
  source?: string;
  tags?: string[];
  companyId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface LeadFilters {
  search?: string;
  status?: string;
  assignedToId?: string;
  source?: string;
  tags?: string[];
  companyId?: string;
  scoreMin?: number;
  scoreMax?: number;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface DealFilters {
  search?: string;
  stage?: string;
  assignedToId?: string;
  customerId?: string;
  priority?: string;
  source?: string;
  valueMin?: number;
  valueMax?: number;
  expectedCloseAfter?: Date;
  expectedCloseBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
}

// Sort options
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Pagination options
export interface PaginationOptions {
  page: number;
  limit: number;
}