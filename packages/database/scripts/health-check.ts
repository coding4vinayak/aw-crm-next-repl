#!/usr/bin/env tsx

import { PrismaClient } from '../src/generated/client';
import { performance } from 'perf_hooks';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  checks: {
    database: {
      status: 'pass' | 'fail';
      responseTime: number;
      error?: string;
    };
    migrations: {
      status: 'pass' | 'fail';
      error?: string;
    };
    connections: {
      status: 'pass' | 'fail';
      activeConnections?: number;
      error?: string;
    };
  };
  timestamp: string;
}

async function checkDatabaseConnection(prisma: PrismaClient): Promise<{ status: 'pass' | 'fail'; responseTime: number; error?: string }> {
  try {
    const start = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const end = performance.now();
    
    return {
      status: 'pass',
      responseTime: Math.round(end - start),
    };
  } catch (error) {
    return {
      status: 'fail',
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkMigrations(prisma: PrismaClient): Promise<{ status: 'pass' | 'fail'; error?: string }> {
  try {
    // Check if the _prisma_migrations table exists and has records
    const migrations = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = '_prisma_migrations'
    ` as any[];
    
    if (migrations[0]?.count > 0) {
      return { status: 'pass' };
    } else {
      return { 
        status: 'fail', 
        error: 'No migrations table found - database may not be initialized' 
      };
    }
  } catch (error) {
    return {
      status: 'fail',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkConnections(prisma: PrismaClient): Promise<{ status: 'pass' | 'fail'; activeConnections?: number; error?: string }> {
  try {
    const result = await prisma.$queryRaw`
      SELECT count(*) as active_connections 
      FROM pg_stat_activity 
      WHERE state = 'active'
    ` as any[];
    
    const activeConnections = parseInt(result[0]?.active_connections || '0');
    
    return {
      status: 'pass',
      activeConnections,
    };
  } catch (error) {
    return {
      status: 'fail',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function performHealthCheck(): Promise<HealthCheckResult> {
  const prisma = new PrismaClient();
  
  try {
    const [databaseCheck, migrationsCheck, connectionsCheck] = await Promise.all([
      checkDatabaseConnection(prisma),
      checkMigrations(prisma),
      checkConnections(prisma),
    ]);
    
    const allChecksPass = 
      databaseCheck.status === 'pass' && 
      migrationsCheck.status === 'pass' && 
      connectionsCheck.status === 'pass';
    
    return {
      status: allChecksPass ? 'healthy' : 'unhealthy',
      checks: {
        database: databaseCheck,
        migrations: migrationsCheck,
        connections: connectionsCheck,
      },
      timestamp: new Date().toISOString(),
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🏥 Running database health check...\n');
  
  const result = await performHealthCheck();
  
  // Output results
  console.log(`Overall Status: ${result.status === 'healthy' ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
  console.log(`Timestamp: ${result.timestamp}\n`);
  
  console.log('📊 Detailed Results:');
  console.log(`Database Connection: ${result.checks.database.status === 'pass' ? '✅' : '❌'} (${result.checks.database.responseTime}ms)`);
  if (result.checks.database.error) {
    console.log(`  Error: ${result.checks.database.error}`);
  }
  
  console.log(`Migrations: ${result.checks.migrations.status === 'pass' ? '✅' : '❌'}`);
  if (result.checks.migrations.error) {
    console.log(`  Error: ${result.checks.migrations.error}`);
  }
  
  console.log(`Connections: ${result.checks.connections.status === 'pass' ? '✅' : '❌'}`);
  if (result.checks.connections.activeConnections !== undefined) {
    console.log(`  Active connections: ${result.checks.connections.activeConnections}`);
  }
  if (result.checks.connections.error) {
    console.log(`  Error: ${result.checks.connections.error}`);
  }
  
  // Exit with appropriate code
  process.exit(result.status === 'healthy' ? 0 : 1);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  });
}

export { performHealthCheck, type HealthCheckResult };