import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

// Mock API function
const usersApi = {
  getUsers: async (): Promise<User[]> => {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      {
        id: '1',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah@example.com',
        avatar: null
      },
      {
        id: '2',
        firstName: 'Mike',
        lastName: 'Chen',
        email: 'mike@example.com',
        avatar: null
      },
      {
        id: '3',
        firstName: 'Lisa',
        lastName: 'Wang',
        email: 'lisa@example.com',
        avatar: null
      }
    ];
  }
};

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getUsers,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}