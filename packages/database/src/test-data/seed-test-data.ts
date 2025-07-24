import { PrismaClient } from '../generated/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function seedTestData() {
  console.log('🌱 Seeding test data...')

  try {
    // Clean existing data
    await cleanDatabase()

    // Create test organization
    const organization = await prisma.organization.create({
      data: {
        id: 'test-org-id',
        name: 'Test Organization',
        slug: 'test-org',
        domain: 'test.com',
        settings: {
          timezone: 'UTC',
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY',
        },
      },
    })

    // Create test users
    const passwordHash = await bcrypt.hash('password123', 10)
    
    const users = await Promise.all([
      prisma.user.create({
        data: {
          id: 'test-admin-id',
          email: 'admin@test.com',
          firstName: 'Admin',
          lastName: 'User',
          passwordHash,
          emailVerified: true,
          role: 'ADMIN',
          organizationId: organization.id,
        },
      }),
      prisma.user.create({
        data: {
          id: 'test-manager-id',
          email: 'manager@test.com',
          firstName: 'Manager',
          lastName: 'User',
          passwordHash,
          emailVerified: true,
          role: 'MANAGER',
          organizationId: organization.id,
        },
      }),
      prisma.user.create({
        data: {
          id: 'test-user-id',
          email: 'user@test.com',
          firstName: 'Regular',
          lastName: 'User',
          passwordHash,
          emailVerified: true,
          role: 'USER',
          organizationId: organization.id,
        },
      }),
    ])

    // Create test companies
    const companies = await Promise.all([
      prisma.company.create({
        data: {
          id: 'test-company-1',
          name: 'Acme Corporation',
          domain: 'acme.com',
          industry: 'Technology',
          size: '51-200',
          website: 'https://acme.com',
          organizationId: organization.id,
        },
      }),
      prisma.company.create({
        data: {
          id: 'test-company-2',
          name: 'Tech Corp',
          domain: 'techcorp.com',
          industry: 'Technology',
          size: '11-50',
          website: 'https://techcorp.com',
          organizationId: organization.id,
        },
      }),
    ])

    // Create test customers
    const customers = await Promise.all([
      prisma.customer.create({
        data: {
          id: 'test-customer-1',
          email: 'john.doe@acme.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          status: 'ACTIVE',
          source: 'Website',
          organizationId: organization.id,
          companyId: companies[0].id,
          assignedToId: users[0].id,
        },
      }),
      prisma.customer.create({
        data: {
          id: 'test-customer-2',
          email: 'jane.smith@techcorp.com',
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+1234567891',
          status: 'ACTIVE',
          source: 'Referral',
          organizationId: organization.id,
          companyId: companies[1].id,
          assignedToId: users[1].id,
        },
      }),
    ])

    // Create test leads
    const leads = await Promise.all([
      prisma.lead.create({
        data: {
          id: 'test-lead-1',
          email: 'alice.brown@prospect.com',
          firstName: 'Alice',
          lastName: 'Brown',
          phone: '+1234567892',
          status: 'NEW',
          source: 'Trade Show',
          score: 85,
          organizationId: organization.id,
          assignedToId: users[0].id,
        },
      }),
      prisma.lead.create({
        data: {
          id: 'test-lead-2',
          email: 'charlie.wilson@potential.com',
          firstName: 'Charlie',
          lastName: 'Wilson',
          phone: '+1234567893',
          status: 'CONTACTED',
          source: 'LinkedIn',
          score: 65,
          organizationId: organization.id,
          assignedToId: users[1].id,
        },
      }),
    ])

    // Create test deals
    const deals = await Promise.all([
      prisma.deal.create({
        data: {
          id: 'test-deal-1',
          title: 'Enterprise Software License',
          description: 'Annual software license for 500 users',
          value: 150000,
          stage: 'PROPOSAL',
          priority: 'HIGH',
          probability: 75,
          expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          source: 'Inbound',
          organizationId: organization.id,
          customerId: customers[0].id,
          assignedToId: users[0].id,
        },
      }),
      prisma.deal.create({
        data: {
          id: 'test-deal-2',
          title: 'Consulting Services',
          description: 'Technical consulting for system integration',
          value: 75000,
          stage: 'NEGOTIATION',
          priority: 'MEDIUM',
          probability: 60,
          expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          source: 'Referral',
          organizationId: organization.id,
          customerId: customers[1].id,
          assignedToId: users[1].id,
        },
      }),
    ])

    // Create test tasks
    const tasks = await Promise.all([
      prisma.task.create({
        data: {
          id: 'test-task-1',
          title: 'Follow up on proposal',
          description: 'Call John Doe to discuss the enterprise proposal',
          status: 'PENDING',
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          organizationId: organization.id,
          createdById: users[0].id,
          assignedToId: users[0].id,
          customerId: customers[0].id,
          dealId: deals[0].id,
        },
      }),
      prisma.task.create({
        data: {
          id: 'test-task-2',
          title: 'Prepare technical demo',
          description: 'Set up demo environment for Tech Corp presentation',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          organizationId: organization.id,
          createdById: users[1].id,
          assignedToId: users[1].id,
          customerId: customers[1].id,
          dealId: deals[1].id,
        },
      }),
      prisma.task.create({
        data: {
          id: 'test-task-3',
          title: 'Send pricing information',
          description: 'Email pricing details to customer',
          status: 'COMPLETED',
          priority: 'LOW',
          dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          completedAt: new Date(),
          organizationId: organization.id,
          createdById: users[2].id,
          assignedToId: users[2].id,
          customerId: customers[1].id,
        },
      }),
    ])

    // Create test activities
    await Promise.all([
      prisma.activity.create({
        data: {
          type: 'EMAIL',
          title: 'Sent proposal email',
          description: 'Sent enterprise software proposal to John Doe',
          organizationId: organization.id,
          createdById: users[0].id,
          customerId: customers[0].id,
          dealId: deals[0].id,
          metadata: {
            emailSubject: 'Enterprise Software Proposal',
            emailTo: 'john.doe@acme.com',
          },
        },
      }),
      prisma.activity.create({
        data: {
          type: 'CALL',
          title: 'Discovery call',
          description: 'Initial discovery call with Jane Smith',
          organizationId: organization.id,
          createdById: users[1].id,
          customerId: customers[1].id,
          dealId: deals[1].id,
          metadata: {
            duration: 45,
            outcome: 'Positive - interested in consulting services',
          },
        },
      }),
    ])

    // Create test notes
    await Promise.all([
      prisma.note.create({
        data: {
          content: 'Customer needs integration with existing ERP system. Timeline is flexible but prefers Q1 implementation.',
          priority: 'HIGH',
          isPinned: true,
          tags: ['requirements', 'integration'],
          organizationId: organization.id,
          createdById: users[0].id,
          customerId: customers[0].id,
          dealId: deals[0].id,
        },
      }),
      prisma.note.create({
        data: {
          content: 'Discussed API requirements and data migration strategy. Customer has concerns about downtime.',
          priority: 'MEDIUM',
          tags: ['technical', 'api'],
          organizationId: organization.id,
          createdById: users[1].id,
          customerId: customers[1].id,
          dealId: deals[1].id,
        },
      }),
    ])

    console.log('✅ Test data seeded successfully')
    console.log(`Created:
    - 1 organization
    - 3 users (admin, manager, user)
    - 2 companies
    - 2 customers
    - 2 leads
    - 2 deals
    - 3 tasks
    - 2 activities
    - 2 notes`)

  } catch (error) {
    console.error('❌ Error seeding test data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

export async function cleanDatabase() {
  console.log('🧹 Cleaning database...')
  
  // Delete in correct order to avoid foreign key constraints
  await prisma.activity.deleteMany()
  await prisma.note.deleteMany()
  await prisma.task.deleteMany()
  await prisma.deal.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.company.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()
  
  console.log('✅ Database cleaned')
}

// Run if called directly
if (require.main === module) {
  seedTestData()
    .then(() => {
      console.log('Test data seeding completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Test data seeding failed:', error)
      process.exit(1)
    })
}