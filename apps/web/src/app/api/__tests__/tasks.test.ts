import { NextRequest } from 'next/server'
import { GET, POST } from '../tasks/route'
import { prisma } from '@awcrm/database'
import { getServerSession } from 'next-auth'
import { createMockUser, createMockTask } from '@/lib/test-utils'

// Mock dependencies
jest.mock('next-auth')
jest.mock('@awcrm/database')
jest.mock('@/lib/database-optimizer')
jest.mock('@/lib/audit')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/tasks', () => {
  const mockUser = createMockUser()
  const mockTask = createMockTask()

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetServerSession.mockResolvedValue({
      user: { id: mockUser.id },
    } as any)
  })

  describe('GET /api/tasks', () => {
    it('returns tasks for authenticated user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
      mockPrisma.task.findMany.mockResolvedValue([mockTask] as any)
      mockPrisma.task.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/tasks')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.tasks).toHaveLength(1)
      expect(data.tasks[0]).toMatchObject({
        id: mockTask.id,
        title: mockTask.title,
        status: mockTask.status,
        priority: mockTask.priority,
      })
    })

    it('filters tasks by status', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
      mockPrisma.task.findMany.mockResolvedValue([mockTask] as any)
      mockPrisma.task.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/tasks?status=TODO')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'TODO',
          }),
        })
      )
    })

    it('filters tasks by priority', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
      mockPrisma.task.findMany.mockResolvedValue([mockTask] as any)
      mockPrisma.task.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/tasks?priority=HIGH')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priority: 'HIGH',
          }),
        })
      )
    })

    it('searches tasks by title and description', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
      mockPrisma.task.findMany.mockResolvedValue([mockTask] as any)
      mockPrisma.task.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/tasks?search=test')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'test', mode: 'insensitive' } },
              { description: { contains: 'test', mode: 'insensitive' } },
            ],
          }),
        })
      )
    })
  })

  describe('POST /api/tasks', () => {
    it('creates a new task', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
      mockPrisma.task.create.mockResolvedValue(mockTask as any)
      mockPrisma.activity.create.mockResolvedValue({} as any)

      const taskData = {
        title: 'New Task',
        description: 'Task description',
        priority: 'HIGH',
        dueDate: new Date().toISOString(),
      }

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.task).toMatchObject({
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
      })
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          organizationId: mockUser.organizationId,
          createdById: mockUser.id,
        }),
        include: expect.any(Object),
      })
    })

    it('returns 400 for missing title', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ description: 'Task without title' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Title is required')
    })

    it('validates assigned user belongs to same organization', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockUser as any) // Current user
        .mockResolvedValueOnce(null) // Assigned user not found

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Task',
          assignedToId: 'invalid-user-id',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid assigned user')
    })

    it('creates activity when task is created', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
      mockPrisma.task.create.mockResolvedValue(mockTask as any)
      mockPrisma.activity.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Task' }),
      })

      await POST(request)

      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'TASK',
          title: 'Task created: New Task',
          description: 'Task "New Task" was created',
          organizationId: mockUser.organizationId,
          createdById: mockUser.id,
          taskId: mockTask.id,
        }),
      })
    })
  })
})