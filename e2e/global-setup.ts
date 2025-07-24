import { chromium, FullConfig } from '@playwright/test'
import { prisma } from '@awcrm/database'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...')

  // Set up test database
  try {
    // Clean up existing test data
    await prisma.activity.deleteMany()
    await prisma.task.deleteMany()
    await prisma.deal.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.lead.deleteMany()
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()
    await prisma.organization.deleteMany()

    // Create test organization
    const testOrg = await prisma.organization.create({
      data: {
        id: 'test-org-id',
        name: 'Test Organization',
        domain: 'test.com',
      },
    })

    // Create test users
    const testUser = await prisma.user.create({
      data: {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: '$2a$10$test.hash.for.testing',
        emailVerified: true,
        organizationId: testOrg.id,
        role: 'ADMIN',
      },
    })

    const testUser2 = await prisma.user.create({
      data: {
        id: 'test-user-2-id',
        email: 'user2@example.com',
        firstName: 'User',
        lastName: 'Two',
        passwordHash: '$2a$10$test.hash.for.testing',
        emailVerified: true,
        organizationId: testOrg.id,
        role: 'USER',
      },
    })

    // Create test customers
    await prisma.customer.createMany({
      data: [
        {
          id: 'test-customer-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          company: 'Acme Corp',
          organizationId: testOrg.id,
          assignedToId: testUser.id,
        },
        {
          id: 'test-customer-2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          company: 'Tech Solutions',
          organizationId: testOrg.id,
          assignedToId: testUser2.id,
        },
      ],
    })

    // Create test deals
    await prisma.deal.createMany({
      data: [
        {
          id: 'test-deal-1',
          name: 'Big Deal',
          value: 50000,
          stage: 'QUALIFIED',
          status: 'OPEN',
          probability: 75,
          organizationId: testOrg.id,
          customerId: 'test-customer-1',
          assignedToId: testUser.id,
        },
        {
          id: 'test-deal-2',
          name: 'Small Deal',
          value: 10000,
          stage: 'PROPOSAL',
          status: 'OPEN',
          probability: 50,
          organizationId: testOrg.id,
          customerId: 'test-customer-2',
          assignedToId: testUser2.id,
        },
      ],
    })

    // Create test tasks
    await prisma.task.createMany({
      data: [
        {
          id: 'test-task-1',
          title: 'Follow up with John',
          description: 'Call John about the proposal',
          status: 'TODO',
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          organizationId: testOrg.id,
          createdById: testUser.id,
          assignedToId: testUser.id,
          customerId: 'test-customer-1',
          dealId: 'test-deal-1',
        },
        {
          id: 'test-task-2',
          title: 'Send proposal to Jane',
          description: 'Email the updated proposal',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          organizationId: testOrg.id,
          createdById: testUser2.id,
          assignedToId: testUser2.id,
          customerId: 'test-customer-2',
          dealId: 'test-deal-2',
        },
      ],
    })

    console.log('✅ Test data created successfully')
  } catch (error) {
    console.error('❌ Failed to set up test data:', error)
    throw error
  }

  // Set up authentication state
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  // Navigate to login page and authenticate
  await page.goto('/auth/signin')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard')
  
  // Save authentication state
  await page.context().storageState({ path: 'e2e/auth.json' })
  
  await browser.close()
  
  console.log('✅ Global setup completed')
}

export default globalSetup