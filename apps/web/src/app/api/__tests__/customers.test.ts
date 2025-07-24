import { NextRequest } from 'next/server'
import { GET, POST } from '../customers/route'
import { prisma } from '@awcrm/database'
import { getServerSession } from 'next-auth'
import { createMockUser, createMockCustomer } from '@/lib/test-utils'

// Mock dependencies
jest.mock('next-auth')
jest.mock('@awcrm/database')
jest.mock('@/lib/database-optimizer')
jest.mock('@/lib/audit')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/customers', () => {
  const mockUser = createMockUser()
  const mockCustomer = createMockCustomer()

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetServerSession.mockResolvedValue({
      user: { id: mockUser.id },
    } as any)
  })

  describe('GET /api/customers', () => {
    it('returns customers for authenticated user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
      mockPrisma.customer.findMany.mockResolvedValue([mockCustomer] as any)
      mockPrisma.customer.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/customers')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.customers).toHaveLength(1)
      expect(data.customers[0]).toMatchObject({
        id: mockCustomer.id,
        firstName: mockCustomer.firstName,
        lastName: mockCustomer.lastName,
      })
    })

    it('returns 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/customers')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('handles search query parameter', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
      mockPrisma.customer.findMany.mockResolvedValue([mockCustomer] as any)
      mockPrisma.customer.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/customers?search=john')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { firstName: { contains: 'john', mode: 'insensitive' } },
              { lastName: { contains: 'john', mode: 'insensitive' } },
              { email: { contains: 'john', mode: 'insensitive' } },
              { company: { contains: 'john', mode: 'insensitive' } },
            ]),
          }),
        })
      )
    })

    it('handles pagination parameters', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
      mockPrisma.customer.findMany.mockResolvedValue([mockCustomer] as any)
      mockPrisma.customer.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/customers?page=2&limit=10')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      )
    })
  })

  describe('POST /api/customers', () => {
    it('creates a new customer', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
      mockPrisma.customer.create.mockResolvedValue(mockCustomer as any)
      mockPrisma.activity.create.mockResolvedValue({} as any)

      const customerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        company: 'Test Company',
      }

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify(customerData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.customer).toMatchObject({
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
      })
      expect(mockPrisma.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email,
          company: customerData.company,
          organizationId: mockUser.organizationId,
        }),
        include: expect.any(Object),
      })
    })

    it('returns 400 for missing required fields', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('First name and last name are required')
    })

    it('returns 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify({ firstName: 'John', lastName: 'Doe' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('handles database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
      mockPrisma.customer.create.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify({ firstName: 'John', lastName: 'Doe' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create customer')
    })
  })
})