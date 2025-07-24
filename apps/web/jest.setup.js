import '@testing-library/jest-dom'

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    },
    status: 'authenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}))

// Mock Prisma client
jest.mock('@awcrm/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    deal: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    task: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    activity: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: false,
    error: null,
    data: null,
  })),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }) => children,
}))

// Mock React Hook Form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(() => ({
    register: jest.fn(),
    handleSubmit: jest.fn((fn) => fn),
    formState: { errors: {} },
    reset: jest.fn(),
    setValue: jest.fn(),
    watch: jest.fn(),
    control: {},
  })),
  Controller: ({ render }) => render({
    field: {
      onChange: jest.fn(),
      onBlur: jest.fn(),
      value: '',
      name: 'test',
      ref: jest.fn(),
    },
    fieldState: {
      invalid: false,
      isTouched: false,
      isDirty: false,
      error: undefined,
    },
  }),
}))

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => date.toISOString()),
  parseISO: jest.fn((dateStr) => new Date(dateStr)),
  isValid: jest.fn(() => true),
  addDays: jest.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
  subDays: jest.fn((date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000)),
  startOfDay: jest.fn((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())),
  endOfDay: jest.fn((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)),
}))

// Mock Recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />,
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => {
  const icons = [
    'Plus', 'Search', 'Filter', 'Edit', 'Trash2', 'User', 'Building', 
    'Calendar', 'Clock', 'CheckCircle', 'AlertTriangle', 'Flag', 
    'MoreHorizontal', 'Mail', 'Phone', 'MapPin', 'Globe', 'Star',
    'TrendingUp', 'TrendingDown', 'DollarSign', 'Users', 'Activity',
    'BarChart3', 'PieChart', 'Settings', 'LogOut', 'Bell', 'Home',
    'FileText', 'Download', 'Upload', 'Eye', 'EyeOff', 'Lock',
    'Unlock', 'Shield', 'AlertCircle', 'Info', 'Check', 'X'
  ]
  
  const mockIcons = {}
  icons.forEach(icon => {
    mockIcons[icon] = ({ className, ...props }) => 
      <span data-testid={`${icon.toLowerCase()}-icon`} className={className} {...props} />
  })
  
  return mockIcons
})