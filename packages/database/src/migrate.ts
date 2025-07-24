#!/usr/bin/env tsx

import { PrismaClient } from './generated/client';
import { execSync } from 'child_process';
import { performance } from 'perf_hooks';

interface MigrationResult {
  success: boolean;
  duration: number;
  appliedMigrations: string[];
  error?: string;
}

async function runMigrations(): Promise<MigrationResult> {
  const start = performance.now();
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Starting database migrations...');
    
    // Run Prisma migrations
    const output = execSync('npx prisma migrate deploy', { 
      encoding: 'utf8',
      cwd: process.cwd(),
    });
    
    console.log(output);
    
    // Get applied migrations
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at 
      FROM _prisma_migrations 
      WHERE finished_at IS NOT NULL 
      ORDER BY finished_at DESC 
      LIMIT 10
    ` as any[];
    
    const end = performance.now();
    const duration = Math.round(end - start);
    
    console.log(`✅ Migrations completed successfully in ${duration}ms`);
    
    return {
      success: true,
      duration,
      appliedMigrations: migrations.map(m => m.migration_name),
    };
    
  } catch (error) {
    const end = performance.now();
    const duration = Math.round(end - start);
    
    console.error('❌ Migration failed:', error);
    
    return {
      success: false,
      duration,
      appliedMigrations: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function generatePrismaClient(): Promise<void> {
  console.log('🔧 Generating Prisma client...');
  
  try {
    execSync('npx prisma generate', { 
      encoding: 'utf8',
      cwd: process.cwd(),
    });
    
    console.log('✅ Prisma client generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate Prisma client:', error);
    throw error;
  }
}

async function seedDatabase(): Promise<void> {
  console.log('🌱 Seeding database...');
  
  try {
    execSync('npm run db:seed', { 
      encoding: 'utf8',
      cwd: process.cwd(),
    });
    
    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldSeed = args.includes('--seed');
  const shouldGenerate = args.includes('--generate') || !args.length;
  
  try {
    if (shouldGenerate) {
      await generatePrismaClient();
    }
    
    const result = await runMigrations();
    
    if (!result.success) {
      process.exit(1);
    }
    
    if (shouldSeed) {
      await seedDatabase();
    }
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { runMigrations, generatePrismaClient, seedDatabase };