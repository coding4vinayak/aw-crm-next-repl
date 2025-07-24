import { render, screen, fireEvent, waitFor } from '@/lib/test-utils'
import { CustomerList } from '../customer-list'
import { createMockCustomer, mockFetchSuccess } from '@/lib/test-utils'

// Mock the customer list component
jest.mock('../create-customer-dialog', () => ({
  CreateCustomerDialog: ({ onCustomerCreated }: any) => (
    <div data-testid="create-customer-dialog">
      <button onClick={() => onCustomerCreated(createMockCustomer())}>
        Create Customer
      </button>
    </div>
  ),
}))

describe('CustomerList Component', () => {
  const mockCustomers = [
    createMockCustomer({ id: '1', firstName: 'John', lastName: 'Doe' }),
    createMockCustomer({ id: '2', firstName: 'Jane', lastName: 'Smith' }),
  ]

  beforeEach(() => {
    mockFetchSuccess({
      success: true,
      customers: mockCustomers,
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    })
  })

  it('renders customer list', async () => {
    render(<CustomerList />)
    
    expect(screen.getByText('Customers')).toBeInTheDocument()
    expect(screen.getByText('Manage and track your customers')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /new customer/i })).toBeInTheDocument()
  })

  it('displays customers after loading', async () => {
    render(<CustomerList initialCustomers={mockCustomers} />)
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  it('handles search functionality', async () => {
    render(<CustomerList initialCustomers={mockCustomers} />)
    
    const searchInput = screen.getByPlaceholderText(/search customers/i)
    fireEvent.change(searchInput, { target: { value: 'John' } })
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=John')
      )
    })
  })

  it('handles status filter', async () => {
    render(<CustomerList initialCustomers={mockCustomers} />)
    
    const statusFilter = screen.getByDisplayValue('All statuses')
    fireEvent.change(statusFilter, { target: { value: 'ACTIVE' } })
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=ACTIVE')
      )
    })
  })

  it('opens create customer dialog', () => {
    render(<CustomerList />)
    
    const createButton = screen.getByRole('button', { name: /new customer/i })
    fireEvent.click(createButton)
    
    expect(screen.getByTestId('create-customer-dialog')).toBeInTheDocument()
  })

  it('handles customer creation', async () => {
    render(<CustomerList initialCustomers={[]} />)
    
    const createButton = screen.getByRole('button', { name: /new customer/i })
    fireEvent.click(createButton)
    
    const createCustomerButton = screen.getByText('Create Customer')
    fireEvent.click(createCustomerButton)
    
    await waitFor(() => {
      expect(screen.getByText('Test Customer')).toBeInTheDocument()
    })
  })

  it('displays loading state', () => {
    render(<CustomerList />)
    
    // Should show loading state initially
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('handles error state', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Failed to fetch'))
    
    render(<CustomerList />)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load customers/i)).toBeInTheDocument()
    })
  })

  it('handles pagination', async () => {
    const paginatedResponse = {
      success: true,
      customers: mockCustomers,
      pagination: {
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      },
    }
    
    mockFetchSuccess(paginatedResponse)
    render(<CustomerList />)
    
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument()
    })
    
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      )
    })
  })
})