import { PrismaClient } from './generated/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      domain: 'acme-corp.com',
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
      },
    },
  });

  console.log('✅ Created organization:', organization.name);

  // Hash password for all users
  const passwordHash = await bcrypt.hash('password123', 10);

  // Create users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@acme-corp.com' },
      update: {},
      create: {
        email: 'admin@acme-corp.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        passwordHash,
        organizationId: organization.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'sarah.johnson@acme-corp.com' },
      update: {},
      create: {
        email: 'sarah.johnson@acme-corp.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'MANAGER',
        status: 'ACTIVE',
        phone: '+1-555-0101',
        emailVerified: true,
        passwordHash,
        organizationId: organization.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'mike.chen@acme-corp.com' },
      update: {},
      create: {
        email: 'mike.chen@acme-corp.com',
        firstName: 'Mike',
        lastName: 'Chen',
        role: 'USER',
        status: 'ACTIVE',
        phone: '+1-555-0102',
        emailVerified: true,
        passwordHash,
        organizationId: organization.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'lisa.wang@acme-corp.com' },
      update: {},
      create: {
        email: 'lisa.wang@acme-corp.com',
        firstName: 'Lisa',
        lastName: 'Wang',
        role: 'USER',
        status: 'ACTIVE',
        phone: '+1-555-0103',
        emailVerified: true,
        passwordHash,
        organizationId: organization.id,
      },
    }),
  ]);

  console.log('✅ Created users:', users.length);

  // Create companies
  const companies = await Promise.all([
    prisma.company.upsert({
      where: { id: 'company-1' },
      update: {},
      create: {
        id: 'company-1',
        name: 'TechStart Inc',
        domain: 'techstart.com',
        industry: 'Technology',
        size: '51-200',
        website: 'https://techstart.com',
        phone: '+1-555-1001',
        description: 'Innovative technology solutions for modern businesses',
        organizationId: organization.id,
      },
    }),
    prisma.company.upsert({
      where: { id: 'company-2' },
      update: {},
      create: {
        id: 'company-2',
        name: 'HealthTech Solutions',
        domain: 'healthtech.com',
        industry: 'Healthcare',
        size: '11-50',
        website: 'https://healthtech.com',
        phone: '+1-555-1002',
        description: 'Digital health solutions for healthcare providers',
        organizationId: organization.id,
      },
    }),
    prisma.company.upsert({
      where: { id: 'company-3' },
      update: {},
      create: {
        id: 'company-3',
        name: 'FinanceFlow Corp',
        domain: 'financeflow.com',
        industry: 'Finance',
        size: '201-500',
        website: 'https://financeflow.com',
        phone: '+1-555-1003',
        description: 'Financial technology and payment processing solutions',
        organizationId: organization.id,
      },
    }),
  ]);

  console.log('✅ Created companies:', companies.length);

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name_organizationId: { name: 'VIP', organizationId: organization.id } },
      update: {},
      create: {
        name: 'VIP',
        color: '#f59e0b',
        description: 'Very important customer',
        organizationId: organization.id,
      },
    }),
    prisma.tag.upsert({
      where: { name_organizationId: { name: 'Enterprise', organizationId: organization.id } },
      update: {},
      create: {
        name: 'Enterprise',
        color: '#3b82f6',
        description: 'Enterprise customer',
        organizationId: organization.id,
      },
    }),
    prisma.tag.upsert({
      where: { name_organizationId: { name: 'High Value', organizationId: organization.id } },
      update: {},
      create: {
        name: 'High Value',
        color: '#10b981',
        description: 'High value customer',
        organizationId: organization.id,
      },
    }),
  ]);

  console.log('✅ Created tags:', tags.length);

  // Create customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { email_organizationId: { email: 'john.doe@techstart.com', organizationId: organization.id } },
      update: {},
      create: {
        email: 'john.doe@techstart.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1-555-2001',
        website: 'https://johndoe.com',
        industry: 'Technology',
        companySize: '51-200',
        status: 'ACTIVE',
        source: 'website',
        lifetimeValue: 75000,
        organizationId: organization.id,
        companyId: companies[0].id,
        assignedToId: users[1].id,
      },
    }),
    prisma.customer.upsert({
      where: { email_organizationId: { email: 'jane.smith@healthtech.com', organizationId: organization.id } },
      update: {},
      create: {
        email: 'jane.smith@healthtech.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1-555-2002',
        industry: 'Healthcare',
        companySize: '11-50',
        status: 'ACTIVE',
        source: 'referral',
        lifetimeValue: 45000,
        organizationId: organization.id,
        companyId: companies[1].id,
        assignedToId: users[2].id,
      },
    }),
    prisma.customer.upsert({
      where: { email_organizationId: { email: 'bob.wilson@financeflow.com', organizationId: organization.id } },
      update: {},
      create: {
        email: 'bob.wilson@financeflow.com',
        firstName: 'Bob',
        lastName: 'Wilson',
        phone: '+1-555-2003',
        industry: 'Finance',
        companySize: '201-500',
        status: 'PROSPECT',
        source: 'marketing',
        lifetimeValue: 120000,
        organizationId: organization.id,
        companyId: companies[2].id,
        assignedToId: users[1].id,
      },
    }),
  ]);

  console.log('✅ Created customers:', customers.length);

  // Create leads
  const leads = await Promise.all([
    prisma.lead.upsert({
      where: { email_organizationId: { email: 'alice.brown@startup.com', organizationId: organization.id } },
      update: {},
      create: {
        email: 'alice.brown@startup.com',
        firstName: 'Alice',
        lastName: 'Brown',
        phone: '+1-555-3001',
        industry: 'Technology',
        companySize: '1-10',
        status: 'NEW',
        source: 'website',
        score: 75,
        organizationId: organization.id,
        assignedToId: users[2].id,
      },
    }),
    prisma.lead.upsert({
      where: { email_organizationId: { email: 'david.lee@medtech.com', organizationId: organization.id } },
      update: {},
      create: {
        email: 'david.lee@medtech.com',
        firstName: 'David',
        lastName: 'Lee',
        phone: '+1-555-3002',
        industry: 'Healthcare',
        companySize: '51-200',
        status: 'QUALIFIED',
        source: 'event',
        score: 85,
        organizationId: organization.id,
        assignedToId: users[3].id,
      },
    }),
  ]);

  console.log('✅ Created leads:', leads.length);

  // Create deals
  const deals = await Promise.all([
    prisma.deal.upsert({
      where: { id: 'deal-1' },
      update: {},
      create: {
        id: 'deal-1',
        title: 'Enterprise Software License',
        description: 'Annual enterprise software license renewal with additional modules',
        value: 50000,
        stage: 'PROPOSAL',
        priority: 'HIGH',
        probability: 75,
        expectedCloseDate: new Date('2024-02-15'),
        source: 'website',
        tags: ['enterprise', 'renewal'],
        organizationId: organization.id,
        customerId: customers[0].id,
        assignedToId: users[1].id,
      },
    }),
    prisma.deal.upsert({
      where: { id: 'deal-2' },
      update: {},
      create: {
        id: 'deal-2',
        title: 'Professional Services Package',
        description: 'Implementation and training services for new software deployment',
        value: 25000,
        stage: 'NEGOTIATION',
        priority: 'MEDIUM',
        probability: 90,
        expectedCloseDate: new Date('2024-01-30'),
        source: 'referral',
        tags: ['services', 'implementation'],
        organizationId: organization.id,
        customerId: customers[1].id,
        assignedToId: users[2].id,
      },
    }),
    prisma.deal.upsert({
      where: { id: 'deal-3' },
      update: {},
      create: {
        id: 'deal-3',
        title: 'Cloud Migration Project',
        description: 'Complete migration of on-premise infrastructure to cloud',
        value: 120000,
        stage: 'QUALIFICATION',
        priority: 'HIGH',
        probability: 60,
        expectedCloseDate: new Date('2024-04-01'),
        source: 'marketing',
        tags: ['cloud', 'migration'],
        organizationId: organization.id,
        customerId: customers[2].id,
        assignedToId: users[1].id,
      },
    }),
  ]);

  console.log('✅ Created deals:', deals.length);

  // Create activities
  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        type: 'EMAIL',
        title: 'Follow-up email sent',
        description: 'Sent follow-up email regarding the enterprise software proposal',
        metadata: {
          subject: 'Re: Enterprise Software Proposal',
          recipient: customers[0].email,
        },
        organizationId: organization.id,
        customerId: customers[0].id,
        dealId: deals[0].id,
        createdById: users[1].id,
      },
    }),
    prisma.activity.create({
      data: {
        type: 'CALL',
        title: 'Discovery call completed',
        description: 'Had a 45-minute discovery call to understand requirements',
        metadata: {
          duration: '45 minutes',
          outcome: 'Positive - Moving to proposal stage',
        },
        organizationId: organization.id,
        customerId: customers[1].id,
        dealId: deals[1].id,
        createdById: users[2].id,
      },
    }),
    prisma.activity.create({
      data: {
        type: 'MEETING',
        title: 'Product demonstration',
        description: 'Conducted comprehensive product demo for the customer team',
        metadata: {
          attendees: ['John Doe', 'Jane Smith', 'Bob Wilson'],
          duration: '60 minutes',
        },
        organizationId: organization.id,
        customerId: customers[0].id,
        createdById: users[1].id,
      },
    }),
  ]);

  console.log('✅ Created activities:', activities.length);

  // Create notes
  const notes = await Promise.all([
    prisma.note.create({
      data: {
        content: 'Customer expressed strong interest in our enterprise package during the demo. Budget has been approved for Q1 implementation.',
        priority: 'HIGH',
        isPinned: true,
        tags: ['budget-approved', 'enterprise', 'q1-implementation'],
        organizationId: organization.id,
        customerId: customers[0].id,
        dealId: deals[0].id,
        createdById: users[1].id,
      },
    }),
    prisma.note.create({
      data: {
        content: 'Follow-up needed on the technical requirements document. Customer\'s IT team has specific security requirements.',
        priority: 'MEDIUM',
        tags: ['technical', 'security', 'follow-up'],
        organizationId: organization.id,
        customerId: customers[1].id,
        createdById: users[2].id,
      },
    }),
  ]);

  console.log('✅ Created notes:', notes.length);

  // Create tasks
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Send follow-up proposal',
        description: 'Send updated proposal with revised pricing and implementation timeline',
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: new Date('2024-01-25'),
        organizationId: organization.id,
        customerId: customers[0].id,
        dealId: deals[0].id,
        assignedToId: users[1].id,
        createdById: users[1].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Schedule technical demo',
        description: 'Coordinate with customer\'s IT team for technical demonstration',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: new Date('2024-01-30'),
        organizationId: organization.id,
        customerId: customers[1].id,
        dealId: deals[1].id,
        assignedToId: users[2].id,
        createdById: users[1].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Prepare security documentation',
        description: 'Compile security compliance documentation for customer review',
        status: 'COMPLETED',
        priority: 'HIGH',
        dueDate: new Date('2024-01-20'),
        completedAt: new Date('2024-01-19'),
        organizationId: organization.id,
        customerId: customers[1].id,
        assignedToId: users[3].id,
        createdById: users[2].id,
      },
    }),
  ]);

  console.log('✅ Created tasks:', tasks.length);

  // Create customer tags relationships
  await Promise.all([
    prisma.customerTag.upsert({
      where: { customerId_tagId: { customerId: customers[0].id, tagId: tags[0].id } },
      update: {},
      create: {
        customerId: customers[0].id,
        tagId: tags[0].id,
      },
    }),
    prisma.customerTag.upsert({
      where: { customerId_tagId: { customerId: customers[0].id, tagId: tags[1].id } },
      update: {},
      create: {
        customerId: customers[0].id,
        tagId: tags[1].id,
      },
    }),
    prisma.customerTag.upsert({
      where: { customerId_tagId: { customerId: customers[2].id, tagId: tags[2].id } },
      update: {},
      create: {
        customerId: customers[2].id,
        tagId: tags[2].id,
      },
    }),
  ]);

  console.log('✅ Created customer tag relationships');

  // Create custom fields
  const customFields = await Promise.all([
    prisma.customField.upsert({
      where: { name_entityType_organizationId: { name: 'account_manager', entityType: 'CUSTOMER', organizationId: organization.id } },
      update: {},
      create: {
        name: 'account_manager',
        label: 'Account Manager',
        type: 'TEXT',
        entityType: 'CUSTOMER',
        position: 1,
        organizationId: organization.id,
      },
    }),
    prisma.customField.upsert({
      where: { name_entityType_organizationId: { name: 'contract_type', entityType: 'CUSTOMER', organizationId: organization.id } },
      update: {},
      create: {
        name: 'contract_type',
        label: 'Contract Type',
        type: 'SELECT',
        options: {
          choices: ['Monthly', 'Annual', 'Multi-year']
        },
        entityType: 'CUSTOMER',
        position: 2,
        organizationId: organization.id,
      },
    }),
    prisma.customField.upsert({
      where: { name_entityType_organizationId: { name: 'renewal_date', entityType: 'DEAL', organizationId: organization.id } },
      update: {},
      create: {
        name: 'renewal_date',
        label: 'Renewal Date',
        type: 'DATE',
        entityType: 'DEAL',
        position: 1,
        organizationId: organization.id,
      },
    }),
  ]);

  console.log('✅ Created custom fields:', customFields.length);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });