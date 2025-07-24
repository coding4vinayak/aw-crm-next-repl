import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Deal } from '@awcrm/database';

// API functions (these would typically be in a separate API service file)
const dealsApi = {
  getDeals: async (params?: {
    page?: number;
    limit?: number;
    stage?: string;
    assignedToId?: string;
    priority?: string;
    source?: string;
    valueRange?: { min: number; max: number };
    dateRange?: { from: Date | undefined; to: Date | undefined };
  }): Promise<{ deals: Deal[]; total: number; page: number; limit: number }> => {
    // Mock implementation - replace with actual API call
    const mockDeals: Deal[] = [
      {
        id: '1',
        title: 'Enterprise Software License',
        description: 'Annual enterprise software license renewal with additional modules',
        value: 50000,
        stage: 'Proposal',
        priority: 'high',
        probability: 75,
        expectedCloseDate: new Date('2024-02-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-20'),
        customerId: '1',
        assignedToId: '1',
        organizationId: '1',
        source: 'website',
        tags: ['enterprise', 'renewal'],
        customer: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          company: {
            id: '1',
            name: 'Acme Corp'
          }
        },
        assignedTo: {
          id: '1',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah@example.com'
        }
      },
      {
        id: '2',
        title: 'Professional Services Package',
        description: 'Implementation and training services for new software deployment',
        value: 25000,
        stage: 'Negotiation',
        priority: 'medium',
        probability: 90,
        expectedCloseDate: new Date('2024-01-30'),
        createdAt: new Date('2023-12-15'),
        updatedAt: new Date('2024-01-18'),
        customerId: '2',
        assignedToId: '2',
        organizationId: '1',
        source: 'referral',
        tags: ['services', 'implementation'],
        customer: {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          company: {
            id: '2',
            name: 'HealthTech Inc'
          }
        },
        assignedTo: {
          id: '2',
          firstName: 'Mike',
          lastName: 'Chen',
          email: 'mike@example.com'
        }
      },
      {
        id: '3',
        title: 'Hardware Upgrade',
        description: 'Complete hardware infrastructure upgrade including servers and networking equipment',
        value: 75000,
        stage: 'Closed Won',
        priority: 'high',
        probability: 100,
        expectedCloseDate: new Date('2023-12-01'),
        createdAt: new Date('2023-10-01'),
        updatedAt: new Date('2023-12-01'),
        customerId: '1',
        assignedToId: '1',
        organizationId: '1',
        source: 'marketing',
        tags: ['hardware', 'infrastructure'],
        customer: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          company: {
            id: '1',
            name: 'Acme Corp'
          }
        },
        assignedTo: {
          id: '1',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah@example.com'
        }
      },
      {
        id: '4',
        title: 'Support Contract Extension',
        description: 'Extended support contract for existing systems',
        value: 15000,
        stage: 'Prospecting',
        priority: 'low',
        probability: 25,
        expectedCloseDate: new Date('2024-03-15'),
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-15'),
        customerId: '3',
        assignedToId: '3',
        organizationId: '1',
        source: 'cold_call',
        tags: ['support', 'contract'],
        customer: {
          id: '3',
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob.johnson@example.com',
          company: {
            id: '3',
            name: 'TechStart LLC'
          }
        },
        assignedTo: {
          id: '3',
          firstName: 'Lisa',
          lastName: 'Wang',
          email: 'lisa@example.com'
        }
      },
      {
        id: '5',
        title: 'Cloud Migration Project',
        description: 'Complete migration of on-premise infrastructure to cloud',
        value: 120000,
        stage: 'Qualification',
        priority: 'high',
        probability: 60,
        expectedCloseDate: new Date('2024-04-01'),
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-22'),
        customerId: '2',
        assignedToId: '1',
        organizationId: '1',
        source: 'event',
        tags: ['cloud', 'migration'],
        customer: {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          company: {
            id: '2',
            name: 'HealthTech Inc'
          }
        },
        assignedTo: {
          id: '1',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah@example.com'
        }
      }
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Apply filters
    let filteredDeals = mockDeals;
    
    if (params?.stage) {
      filteredDeals = filteredDeals.filter(deal => 
        deal.stage.toLowerCase().replace(' ', '-') === params.stage
      );
    }

    if (params?.assignedToId) {
      filteredDeals = filteredDeals.filter(deal => deal.assignedToId === params.assignedToId);
    }

    if (params?.priority) {
      filteredDeals = filteredDeals.filter(deal => deal.priority === params.priority);
    }

    if (params?.source) {
      filteredDeals = filteredDeals.filter(deal => deal.source === params.source);
    }

    if (params?.valueRange) {
      filteredDeals = filteredDeals.filter(deal => 
        deal.value >= params.valueRange!.min && deal.value <= params.valueRange!.max
      );
    }

    if (params?.dateRange?.from || params?.dateRange?.to) {
      filteredDeals = filteredDeals.filter(deal => {
        if (!deal.expectedCloseDate) return false;
        const closeDate = new Date(deal.expectedCloseDate);
        if (params.dateRange!.from && closeDate < params.dateRange!.from) return false;
        if (params.dateRange!.to && closeDate > params.dateRange!.to) return false;
        return true;
      });
    }

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      deals: filteredDeals.slice(startIndex, endIndex),
      total: filteredDeals.length,
      page,
      limit
    };
  },

  getDeal: async (id: string): Promise<Deal> => {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockDeal: Deal = {
      id,
      title: 'Enterprise Software License',
      description: 'Annual enterprise software license renewal with additional modules',
      value: 50000,
      stage: 'Proposal',
      priority: 'high',
      probability: 75,
      expectedCloseDate: new Date('2024-02-15'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-20'),
      customerId: '1',
      assignedToId: '1',
      organizationId: '1',
      source: 'website',
      tags: ['enterprise', 'renewal'],
      customer: {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        company: {
          id: '1',
          name: 'Acme Corp'
        }
      },
      assignedTo: {
        id: '1',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah@example.com'
      }
    };

    return mockDeal;
  },

  createDeal: async (data: Partial<Deal>): Promise<Deal> => {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newDeal: Deal = {
      id: Math.random().toString(36).substr(2, 9),
      title: data.title || '',
      description: data.description || '',
      value: data.value || 0,
      stage: data.stage || 'Prospecting',
      priority: data.priority || 'medium',
      probability: data.probability || 50,
      expectedCloseDate: data.expectedCloseDate,
      customerId: data.customerId || '',
      assignedToId: data.assignedToId || '',
      organizationId: '1',
      source: data.source || '',
      tags: data.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return newDeal;
  },

  updateDeal: async (data: Partial<Deal> & { id: string }): Promise<Deal> => {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedDeal: Deal = {
      id: data.id,
      title: data.title || '',
      description: data.description || '',
      value: data.value || 0,
      stage: data.stage || 'Prospecting',
      priority: data.priority || 'medium',
      probability: data.probability || 50,
      expectedCloseDate: data.expectedCloseDate,
      customerId: data.customerId || '',
      assignedToId: data.assignedToId || '',
      organizationId: '1',
      source: data.source || '',
      tags: data.tags || [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    };

    return updatedDeal;
  },

  deleteDeal: async (id: string): Promise<void> => {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Deleted deal:', id);
  },

  updateDealStage: async (id: string, stage: string): Promise<Deal> => {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const updatedDeal: Deal = {
      id,
      title: 'Enterprise Software License',
      description: 'Annual enterprise software license renewal with additional modules',
      value: 50000,
      stage,
      priority: 'high',
      probability: 75,
      expectedCloseDate: new Date('2024-02-15'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      customerId: '1',
      assignedToId: '1',
      organizationId: '1',
      source: 'website',
      tags: ['enterprise', 'renewal']
    };

    return updatedDeal;
  }
};

// React Query hooks
export function useDeals(params?: {
  page?: number;
  limit?: number;
  stage?: string;
  assignedToId?: string;
  priority?: string;
  source?: string;
  valueRange?: { min: number; max: number };
  dateRange?: { from: Date | undefined; to: Date | undefined };
}) {
  return useQuery({
    queryKey: ['deals', params],
    queryFn: () => dealsApi.getDeals(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: ['deal', id],
    queryFn: () => dealsApi.getDeal(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dealsApi.createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dealsApi.updateDeal,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal', data.id] });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dealsApi.deleteDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useUpdateDealStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => 
      dealsApi.updateDealStage(id, stage),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal', data.id] });
    },
  });
}