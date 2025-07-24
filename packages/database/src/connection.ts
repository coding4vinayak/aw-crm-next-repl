import { PrismaClient } from './generated/client';

interface DatabaseConfig {
  maxConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  queryTimeout: number;
}

const config: DatabaseConfig = {
  maxConnections: parseInt(process.env['DB_MAX_CONNECTIONS'] || '10'),
  connectionTimeout: parseInt(process.env['DB_CONNECTION_TIMEOUT'] || '10000'),
  idleTimeout: parseInt(process.env['DB_IDLE_TIMEOUT'] || '30000'),
  queryTimeout: parseInt(process.env['DB_QUERY_TIMEOUT'] || '30000'),
};

export function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env['NODE_ENV'] === 'development' 
      ? ['query', 'info', 'warn', 'error'] 
      : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env['DATABASE_URL'] || 'postgresql://localhost:5432/awcrm',
      },
    },
  });
}

export async function testDatabaseConnection(client: PrismaClient): Promise<boolean> {
  try {
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

export async function closeDatabaseConnection(client: PrismaClient): Promise<void> {
  try {
    await client.$disconnect();
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

export { config as databaseConfig };