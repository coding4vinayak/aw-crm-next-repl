import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface EmailSender {
  name: string;
  email: string;
  avatar?: string;
}

export interface EmailRecipient {
  name: string;
  email: string;
}

export interface EmailLabel {
  id: string;
  name: string;
  color: string;
}

export interface EmailAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
}

export interface Email {
  id: string;
  subject: string;
  body: string;
  preview: string;
  sender: EmailSender;
  recipients: {
    to: EmailRecipient[];
    cc?: EmailRecipient[];
    bcc?: EmailRecipient[];
  };
  date: string;
  read: boolean;
  starred: boolean;
  hasAttachments: boolean;
  attachments?: EmailAttachment[];
  labels?: EmailLabel[];
  folder: string;
  threadId?: string;
}

export interface EmailsResponse {
  emails: Email[];
  total: number;
  unreadCount: number;
}

export interface EmailFilters {
  folder?: string;
  search?: string;
  page?: number;
  limit?: number;
  starred?: boolean;
  unread?: boolean;
}

// Mock data for development
const mockEmails: Email[] = [
  {
    id: '1',
    subject: 'Welcome to our CRM system!',
    body: '<p>Dear John,</p><p>Welcome to our CRM system! We\'re excited to have you on board.</p><p>Best regards,<br>The CRM Team</p>',
    preview: 'Dear John, Welcome to our CRM system! We\'re excited to have you on board...',
    sender: {
      name: 'CRM Team',
      email: 'team@crm.com',
      avatar: '/avatars/team.jpg',
    },
    recipients: {
      to: [{ name: 'John Doe', email: 'john@example.com' }],
    },
    date: '2024-01-20T10:30:00Z',
    read: false,
    starred: true,
    hasAttachments: false,
    folder: 'inbox',
    labels: [
      { id: '1', name: 'Important', color: '#ef4444' },
      { id: '2', name: 'Welcome', color: '#10b981' },
    ],
  },
  {
    id: '2',
    subject: 'Follow-up on our meeting',
    body: '<p>Hi John,</p><p>Thank you for taking the time to meet with us yesterday. As discussed, I\'m attaching the proposal for your review.</p><p>Please let me know if you have any questions.</p><p>Best,<br>Sarah</p>',
    preview: 'Hi John, Thank you for taking the time to meet with us yesterday...',
    sender: {
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      avatar: '/avatars/sarah.jpg',
    },
    recipients: {
      to: [{ name: 'John Doe', email: 'john@example.com' }],
      cc: [{ name: 'Mike Wilson', email: 'mike@company.com' }],
    },
    date: '2024-01-19T14:15:00Z',
    read: true,
    starred: false,
    hasAttachments: true,
    attachments: [
      {
        id: '1',
        name: 'proposal.pdf',
        size: '2.4 MB',
        type: 'pdf',
        url: '/attachments/proposal.pdf',
      },
      {
        id: '2',
        name: 'pricing.xlsx',
        size: '156 KB',
        type: 'xlsx',
        url: '/attachments/pricing.xlsx',
      },
    ],
    folder: 'inbox',
    labels: [
      { id: '3', name: 'Follow-up', color: '#f59e0b' },
    ],
  },
  {
    id: '3',
    subject: 'Your support ticket has been resolved',
    body: '<p>Hello John,</p><p>Your support ticket #12345 has been resolved.</p><p>Issue: Login problems</p><p>Solution: Password reset completed</p><p>If you have any further questions, please don\'t hesitate to reach out.</p><p>Best regards,<br>Support Team</p>',
    preview: 'Hello John, Your support ticket #12345 has been resolved...',
    sender: {
      name: 'Support Team',
      email: 'support@crm.com',
      avatar: '/avatars/support.jpg',
    },
    recipients: {
      to: [{ name: 'John Doe', email: 'john@example.com' }],
    },
    date: '2024-01-18T09:45:00Z',
    read: true,
    starred: false,
    hasAttachments: false,
    folder: 'inbox',
    labels: [
      { id: '4', name: 'Support', color: '#3b82f6' },
    ],
  },
];

// Mock API functions
const fetchEmails = async (filters: EmailFilters = {}): Promise<EmailsResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredEmails = [...mockEmails];
  
  // Apply filters
  if (filters.folder && filters.folder !== 'inbox') {
    filteredEmails = filteredEmails.filter(email => email.folder === filters.folder);
  }
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredEmails = filteredEmails.filter(email => 
      email.subject.toLowerCase().includes(searchLower) ||
      email.sender.name.toLowerCase().includes(searchLower) ||
      email.preview.toLowerCase().includes(searchLower)
    );
  }
  
  if (filters.starred) {
    filteredEmails = filteredEmails.filter(email => email.starred);
  }
  
  if (filters.unread) {
    filteredEmails = filteredEmails.filter(email => !email.read);
  }
  
  // Sort by date (newest first)
  filteredEmails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const startIndex = (page - 1) * limit;
  const paginatedEmails = filteredEmails.slice(startIndex, startIndex + limit);
  
  return {
    emails: paginatedEmails,
    total: filteredEmails.length,
    unreadCount: mockEmails.filter(email => !email.read).length,
  };
};

const fetchEmail = async (emailId: string): Promise<Email | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const email = mockEmails.find(e => e.id === emailId);
  return email || null;
};

const sendEmail = async (emailData: {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  attachments?: File[];
}): Promise<{ success: boolean; emailId?: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate success/failure
  if (Math.random() > 0.1) { // 90% success rate
    return { success: true, emailId: Math.random().toString(36).substr(2, 9) };
  } else {
    throw new Error('Failed to send email');
  }
};

const markEmailAsRead = async (emailId: string, read: boolean): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const email = mockEmails.find(e => e.id === emailId);
  if (email) {
    email.read = read;
  }
};

const toggleEmailStar = async (emailId: string, starred: boolean): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const email = mockEmails.find(e => e.id === emailId);
  if (email) {
    email.starred = starred;
  }
};

const deleteEmail = async (emailId: string): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const index = mockEmails.findIndex(e => e.id === emailId);
  if (index > -1) {
    mockEmails.splice(index, 1);
  }
};

// React Query hooks
export const useEmails = (filters: EmailFilters = {}) => {
  return useQuery({
    queryKey: ['emails', filters],
    queryFn: () => fetchEmails(filters),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useEmail = (emailId: string) => {
  return useQuery({
    queryKey: ['email', emailId],
    queryFn: () => fetchEmail(emailId),
    enabled: !!emailId,
  });
};

export const useSendEmail = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: sendEmail,
    onSuccess: () => {
      // Invalidate and refetch emails
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });
};

export const useMarkEmailAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ emailId, read }: { emailId: string; read: boolean }) => 
      markEmailAsRead(emailId, read),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });
};

export const useToggleEmailStar = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ emailId, starred }: { emailId: string; starred: boolean }) => 
      toggleEmailStar(emailId, starred),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });
};

export const useDeleteEmail = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });
};