import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@awcrm/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
      errorFormat: 'pretty',
    });

    // Log database queries in development
    if (configService.get('NODE_ENV') === 'development') {
      this.$on('query', (e) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    // Log database errors
    this.$on('error', (e) => {
      this.logger.error('Database error:', e);
    });

    // Log database info
    this.$on('info', (e) => {
      this.logger.log(`Database info: ${e.message}`);
    });

    // Log database warnings
    this.$on('warn', (e) => {
      this.logger.warn(`Database warning: ${e.message}`);
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
      
      // Test the connection
      await this.$queryRaw`SELECT 1`;
      this.logger.log('✅ Database connection test passed');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('✅ Database disconnected successfully');
    } catch (error) {
      this.logger.error('❌ Error disconnecting from database:', error);
    }
  }

  /**
   * Execute a transaction with automatic retry logic
   */
  async executeTransaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.$transaction(fn, {
          maxWait: 5000, // 5 seconds
          timeout: 10000, // 10 seconds
        });
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Transaction attempt ${attempt}/${maxRetries} failed: ${error.message}`,
        );

        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    this.logger.error(`Transaction failed after ${maxRetries} attempts:`, lastError);
    throw lastError;
  }

  /**
   * Health check for the database connection
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      await this.$queryRaw`SELECT 1`;
      return { status: 'healthy', message: 'Database connection is healthy' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: `Database connection failed: ${error.message}` 
      };
    }
  }

  /**
   * Get database metrics
   */
  async getMetrics() {
    try {
      const [
        totalConnections,
        activeConnections,
        databaseSize,
      ] = await Promise.all([
        this.$queryRaw`SELECT count(*) as total FROM pg_stat_activity`,
        this.$queryRaw`SELECT count(*) as active FROM pg_stat_activity WHERE state = 'active'`,
        this.$queryRaw`SELECT pg_size_pretty(pg_database_size(current_database())) as size`,
      ]);

      return {
        totalConnections: totalConnections[0]?.total || 0,
        activeConnections: activeConnections[0]?.active || 0,
        databaseSize: databaseSize[0]?.size || 'Unknown',
      };
    } catch (error) {
      this.logger.error('Failed to get database metrics:', error);
      return null;
    }
  }
}