# @awcrm/database

Database package for the AWCRM application, built with Prisma and PostgreSQL.

## Features

- **Prisma ORM** - Type-safe database access with auto-generated client
- **PostgreSQL** - Robust relational database with full-text search
- **Migrations** - Version-controlled database schema changes
- **Seeding** - Realistic test data for development
- **Connection Pooling** - Optimized database connections
- **Repository Pattern** - Clean data access layer
- **Health Checks** - Database monitoring and diagnostics
- **Backup/Restore** - Database backup and recovery scripts

## Database Schema

### Core Entities

- **Organizations** - Multi-tenant organization management
- **Users** - User accounts with role-based access control
- **Companies** - Company/account information
- **Customers** - Customer relationship management
- **Leads** - Lead tracking and qualification
- **Deals** - Sales pipeline and deal management

### Supporting Entities

- **Activities** - Activity tracking and timeline
- **Notes** - Notes and comments system
- **Tasks** - Task management and assignments
- **Tags** - Flexible tagging system
- **Custom Fields** - Configurable custom fields

## Quick Start

### 1. Environment Setup

```bash
# Copy environment variables
cp .env.example .env

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/awcrm_dev"
```

### 2. Start Database Services

```bash
# Start PostgreSQL, Redis, and RabbitMQ
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Setup Database

```bash
# Generate Prisma client, run migrations, and seed data
npm run db:setup
```

## Available Scripts

### Development

```bash
npm run dev              # Watch mode for TypeScript compilation
npm run build            # Build the package
```

### Database Operations

```bash
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes (development)
npm run db:migrate       # Create and apply migration
npm run db:migrate:deploy # Apply migrations (production)
npm run db:migrate:reset # Reset database and migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database with test data
npm run db:reset         # Reset database and reseed
npm run db:setup         # Complete database setup
```

### Maintenance

```bash
npm run db:health        # Check database health
npm run db:backup        # Create database backup
npm run db:restore       # Restore from backup
```

## Usage

### Basic Usage

```typescript
import { prisma, CustomerRepository } from '@awcrm/database';

// Direct Prisma usage
const users = await prisma.user.findMany();

// Repository pattern
const customerRepo = new CustomerRepository(prisma);
const customers = await customerRepo.findWithFilters(
  { status: 'ACTIVE' },
  'org-id',
  { page: 1, limit: 10 }
);
```

### Repository Pattern

```typescript
import { CustomerRepository, DealRepository } from '@awcrm/database';

const customerRepo = new CustomerRepository(prisma);
const dealRepo = new DealRepository(prisma);

// Find customers with advanced filtering
const result = await customerRepo.findWithFilters({
  search: 'john',
  status: 'ACTIVE',
  assignedToId: 'user-id',
  tags: ['vip', 'enterprise'],
  createdAfter: new Date('2024-01-01'),
}, organizationId, { page: 1, limit: 20 });

// Get pipeline statistics
const stats = await dealRepo.getPipelineStatistics(organizationId);
```

### Health Checks

```typescript
import { performHealthCheck } from '@awcrm/database';

const health = await performHealthCheck();
console.log(health.status); // 'healthy' | 'unhealthy'
```

## Database Schema Overview

### Relationships

```
Organization
├── Users (1:many)
├── Companies (1:many)
├── Customers (1:many)
├── Leads (1:many)
├── Deals (1:many)
├── Activities (1:many)
├── Notes (1:many)
├── Tasks (1:many)
└── Tags (1:many)

Customer
├── Company (many:1)
├── AssignedTo User (many:1)
├── Deals (1:many)
├── Activities (1:many)
├── Notes (1:many)
├── Tasks (1:many)
└── Tags (many:many)

Deal
├── Customer (many:1)
├── AssignedTo User (many:1)
├── Activities (1:many)
├── Notes (1:many)
└── Tasks (1:many)
```

### Indexes

The database includes optimized indexes for:

- **Search queries** - Full-text search on names, emails, titles
- **Filtering** - Status, assignment, dates, values
- **Sorting** - Common sort fields like created date, priority
- **Relationships** - Foreign key relationships
- **Performance** - Composite indexes for common query patterns

## Migration Strategy

### Development

```bash
# Create new migration
npx prisma migrate dev --name add_new_feature

# Reset and reseed (destructive)
npm run db:reset
```

### Production

```bash
# Deploy migrations
npm run db:migrate:deploy

# Backup before major changes
npm run db:backup
```

## Backup and Recovery

### Create Backup

```bash
# Manual backup
npm run db:backup

# Automated backup with custom location
DB_NAME=awcrm_prod BACKUP_DIR=/backups npm run db:backup
```

### Restore Database

```bash
# Restore from backup
npm run db:restore backup_file.sql.gz target_database
```

## Performance Optimization

### Connection Pooling

The database client is configured with connection pooling:

```typescript
// Configured in src/client.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

### Query Optimization

- Use `select` to limit returned fields
- Use `include` for related data
- Implement pagination for large datasets
- Use indexes for filtering and sorting

```typescript
// Optimized query example
const customers = await prisma.customer.findMany({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    company: {
      select: {
        name: true,
      },
    },
  },
  where: {
    organizationId,
    status: 'ACTIVE',
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 20,
  skip: 0,
});
```

## Monitoring

### Health Checks

```bash
# Check database health
npm run db:health
```

### Metrics

The database package provides metrics for:

- Connection pool status
- Query performance
- Migration status
- Data integrity

## Security

### Data Protection

- **Encryption at rest** - Database-level encryption
- **Connection security** - SSL/TLS connections
- **Access control** - Role-based permissions
- **Audit logging** - Activity tracking

### Best Practices

- Use parameterized queries (Prisma handles this)
- Validate input data with Zod schemas
- Implement proper error handling
- Use transactions for data consistency
- Regular security updates

## Troubleshooting

### Common Issues

1. **Connection errors**
   ```bash
   # Check database is running
   docker-compose -f docker-compose.dev.yml ps
   
   # Check connection
   npm run db:health
   ```

2. **Migration errors**
   ```bash
   # Reset migrations (development only)
   npm run db:migrate:reset
   
   # Manual migration
   npx prisma migrate resolve --applied "migration_name"
   ```

3. **Performance issues**
   ```bash
   # Analyze slow queries
   npx prisma studio
   
   # Check indexes
   npm run db:health
   ```

## Contributing

1. **Schema changes** - Always create migrations
2. **Seed data** - Update seed script for new entities
3. **Tests** - Add tests for new repositories
4. **Documentation** - Update README for new features

## Environment Variables

```bash
# Required
DATABASE_URL="postgresql://user:password@host:port/database"

# Optional
DB_MAX_CONNECTIONS=10
DB_CONNECTION_TIMEOUT=10000
DB_IDLE_TIMEOUT=30000
DB_QUERY_TIMEOUT=30000
LOG_LEVEL=info
```