import { FullConfig } from '@playwright/test'
import { prisma } from '@awcrm/database'
import fs from 'fs'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...')

  try {
    // Clean up test data
    await prisma.activity.deleteMany()
    await prisma.task.deleteMany()
    await prisma.deal.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.lead.deleteMany()
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()
    await prisma.organization.deleteMany()

    // Close database connection
    await prisma.$disconnect()

    // Clean up auth state file
    if (fs.existsSync('e2e/auth.json')) {
      fs.unlinkSync('e2e/auth.json')
    }

    console.log('✅ Global teardown completed')
  } catch (error) {
    console.error('❌ Failed during teardown:', error)
    throw error
  }
}

export default globalTeardown