import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Customer } from '@awcrm/database';

// API functions (these would typically be in a separate API service file)
const customersApi = {
  getCustomers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    assignedToId?: string;
    source?: string;
    tags?: string[];
  }): Promise<{ customers: Customer[]; total: number; page: number; limit: number }> => {
    // Mock implementation - replace with actual API call
    const mockCustomers: Customer[] = [
      {
        id: '1',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1-555-0123',
        website: 'https://johndoe.com',
        industry: 'Technology',
        companySize: '51-200',
        status: 'active',
        source: 'website',
        lifetimeValue: 50000,
        assignedToId: '1',
        companyId: '1',
        organizationId: '1',
        customFields: {},
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-20'),
        assignedTo: {
          id: '1',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah@example.com'
        },
        company: {
          id: '1',
          name: 'Acme Corp',
          industry: 'Technology'
        }
      },
      {
        id: '2',
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1-555-0456',
        website: 'https://janesmith.com',
        industry: 'Healthcare',
        companySize: '11-50',
        status: 'prospect',
        source: 'referral',
        lifetimeValue: 25000,
        assignedToId: '2',
        companyId: '2',
        organizationId: '1',
        customFields: {},
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-18'),
        assignedTo: {
          id: '2',
          firstName: 'Mike',
          lastName: 'Chen',
          email: 'mike@example.com'
        },
        company: {
          id: '2',
          name: 'HealthTech Inc',
          industry: 'Healthcare'
        }
      }
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Apply filters
    let filteredCustomers = mockCustomers;
    
    if (params?.search) {
      const search = params.search.toLowerCase();
      filteredCustomers = filteredCustomers.filter(customer =>
        customer.firstName.toLowerCase().includes(search) ||
        customer.lastName.toLowerCase().includes(search) ||
        customer.email.toLowerCase().includes(search) ||
        customer.company?.name.toLowerCase().includes(search)
      );
    }

    if (params?.status) {
      filteredCustomers = filteredCustomers.filter(customer => customer.status === params.status);
    }

    if (params?.assignedToId) {
      filteredCustomers = filteredCustomers.filter(customer => customer.assignedToId === params.assignedToId);
    }

    if (params?.source) {
      filteredCustomers = filteredCustomers.filter(customer => customer.source === params.source);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      customers: filteredCustomers.slice(startIndex, endIndex),
      total: filteredCustomers.length,
      page,
      limit
    };
  },

  getCustomer: async (id: string): Promise<Customer> => {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockCustomer: Customer = {
      id,
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1-555-0123',
      website: 'https://johndoe.com',
      industry: 'Technology',
      companySize: '51-200',
      status: 'active',
      source: 'website',
      lifetimeValue: 50000,
      assignedToId: '1',
      companyId: '1',
      organizationId: '1',
      customFields: {},
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-20'),
      assignedTo: {
        id: '1',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah@example.com'
      },
      company: {
        id: '1',
        name: 'Acme Corp',
        industry: 'Technology'
      }
    };

    return mockCustomer;
  },

  createCustomer: async (data: Partial<Customer>): Promise<Customer> => {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newCustomer: Customer = {
      id: Math.random().toString(36).substr(2, 9),
      email: data.email || '',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      phone: data.phone || '',
      website: data.website || '',
      industry: data.industry || '',
      companySize: data.companySize || '',
      status: data.status || 'active',
      source: data.source || '',
      lifetimeValue: data.lifetimeValue || 0,
      assignedToId: data.assignedToId || '',
      companyId: data.companyId || '',
      organizationId: '1',
      customFields: data.customFields || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return newCustomer;
  },

  updateCustomer: async (data: Partial<Customer> & { id: string }): Promise<Customer> => {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedCustomer: Customer = {
      id: data.id,
      email: data.email || '',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      phone: data.phone || '',
      website: data.website || '',
      industry: data.industry || '',
      companySize: data.companySize || '',
      status: data.status || 'active',
      source: data.source || '',
      lifetimeValue: data.lifetimeValue || 0,
      assignedToId: data.assignedToId || '',
      companyId: data.companyId || '',
      organizationId: '1',
      customFields: data.customFields || {},
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    };

    return updatedCustomer;
  },

  deleteCustomer: async (id: string): Promise<void> => {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Deleted customer:', id);
  },

  bulkCreateCustomers: async (customers: Partial<Customer>[]): Promise<{ created: Customer[]; errors: any[] }> => {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const created = customers.map((data, index) => ({
      id: Math.random().toString(36).substr(2, 9),
      email: data.email || '',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      phone: data.phone || '',
      website: data.website || '',
      industry: data.industry || '',
      companySize: data.companySize || '',
      status: data.status || 'active',
      source: data.source || '',
      lifetimeValue: data.lifetimeValue || 0,
      assignedToId: data.assignedToId || '',
      companyId: data.companyId || '',
      organizationId: '1',
      customFields: data.customFields || {},
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    return {
      created,
      errors: []
    };
  }
};

// React Query hooks
export function useCustomers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  assignedToId?: string;
  source?: string;
  tags?: string[];
}) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customersApi.getCustomers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getCustomer(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customersApi.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customersApi.updateCustomer,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', data.id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customersApi.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useBulkCreateCustomers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customersApi.bulkCreateCustomers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}