import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'

// Mock session data
const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER',
    organizationId: 'test-org-id',
  },
  expires: '2024-12-31',
}

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={mockSession}>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'USER',
  status: 'ACTIVE',
  organizationId: 'test-org-id',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockCustomer = (overrides = {}) => ({
  id: 'test-customer-id',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  company: 'Test Company',
  jobTitle: 'CEO',
  status: 'ACTIVE',
  organizationId: 'test-org-id',
  assignedToId: 'test-user-id',
  tags: [],
  customFields: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockDeal = (overrides = {}) => ({
  id: 'test-deal-id',
  name: 'Test Deal',
  description: 'A test deal',
  value: 10000,
  currency: 'USD',
  stage: 'QUALIFIED',
  status: 'OPEN',
  probability: 75,
  expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  organizationId: 'test-org-id',
  customerId: 'test-customer-id',
  assignedToId: 'test-user-id',
  tags: [],
  customFields: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockTask = (overrides = {}) => ({
  id: 'test-task-id',
  title: 'Test Task',
  description: 'A test task',
  status: 'TODO',
  priority: 'MEDIUM',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  organizationId: 'test-org-id',
  createdById: 'test-user-id',
  assignedToId: 'test-user-id',
  customerId: 'test-customer-id',
  tags: [],
  customFields: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockActivity = (overrides = {}) => ({
  id: 'test-activity-id',
  type: 'NOTE',
  title: 'Test Activity',
  description: 'A test activity',
  organizationId: 'test-org-id',
  createdById: 'test-user-id',
  customerId: 'test-customer-id',
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

// API response mocks
export const createMockApiResponse = (data: any, success = true) => ({
  success,
  data,
  ...(success ? {} : { error: 'Test error' }),
})

export const createMockPaginatedResponse = (data: any[], page = 1, limit = 20) => ({
  success: true,
  data,
  pagination: {
    page,
    limit,
    total: data.length,
    totalPages: Math.ceil(data.length / limit),
    hasNext: page * limit < data.length,
    hasPrev: page > 1,
  },
})

// Mock fetch responses
export const mockFetchSuccess = (data: any) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => data,
  })
}

export const mockFetchError = (status = 500, message = 'Internal Server Error') => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => ({ error: message }),
  })
}

// Wait for async operations
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0))

// Custom matchers
expect.extend({
  toBeInTheDocument: (received) => {
    const pass = received !== null && received !== undefined
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be in the document`,
      pass,
    }
  },
})

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
export { mockSession }