import { useQuery } from '@tanstack/react-query';

interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

// Mock API function
const tagsApi = {
  getTags: async (): Promise<Tag[]> => {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      {
        id: '1',
        name: 'VIP',
        color: '#f59e0b',
        description: 'Very important customer'
      },
      {
        id: '2',
        name: 'Enterprise',
        color: '#3b82f6',
        description: 'Enterprise customer'
      },
      {
        id: '3',
        name: 'High Value',
        color: '#10b981',
        description: 'High value customer'
      },
      {
        id: '4',
        name: 'New Customer',
        color: '#8b5cf6',
        description: 'Recently acquired customer'
      },
      {
        id: '5',
        name: 'At Risk',
        color: '#ef4444',
        description: 'Customer at risk of churning'
      }
    ];
  }
};

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: tagsApi.getTags,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}