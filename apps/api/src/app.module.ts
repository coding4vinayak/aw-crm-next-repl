import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as redisStore from 'cache-manager-redis-store';

// Core modules
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';

// CRM modules
import { CustomersModule } from './modules/customers/customers.module';
import { LeadsModule } from './modules/leads/leads.module';
import { DealsModule } from './modules/deals/deals.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { PipelinesModule } from './modules/pipelines/pipelines.module';
import { TagsModule } from './modules/tags/tags.module';

// Advanced modules
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AutomationModule } from './modules/automation/automation.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DashboardsModule } from './modules/dashboards/dashboards.module';

// Common modules
import { MailModule } from './common/mail/mail.module';
import { FileUploadModule } from './common/file-upload/file-upload.module';
import { AuditModule } from './common/audit/audit.module';

// Guards and interceptors
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { OrganizationGuard } from './common/guards/organization.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

// Configuration
import { databaseConfig } from './config/database.config';
import { authConfig } from './config/auth.config';
import { redisConfig } from './config/redis.config';
import { mailConfig } from './config/mail.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig, redisConfig, mailConfig],
      envFilePath: ['.env', '.env.local', '.env.development'],
      cache: true,
    }),

    // Winston Logger
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transports: [
          new winston.transports.Console({
            level: configService.get('LOG_LEVEL', 'info'),
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, context }) => {
                return `${timestamp} [${context}] ${level}: ${message}`;
              }),
            ),
          }),
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
          }),
        ],
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get('THROTTLE_TTL', 60),
        limit: configService.get('THROTTLE_LIMIT', 100),
      }),
    }),

    // Caching with Redis
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL');
        
        if (redisUrl) {
          return {
            store: redisStore,
            url: redisUrl,
            ttl: 60 * 5, // 5 minutes default TTL
            max: 1000, // Maximum number of items in cache
          };
        }

        // Fallback to in-memory cache
        return {
          ttl: 60 * 5,
          max: 1000,
        };
      },
    }),

    // Task scheduling
    ScheduleModule.forRoot(),

    // Event emitter for domain events
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Bull queue for background jobs
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 0),
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }),
    }),

    // Database
    DatabaseModule,

    // Core modules
    AuthModule,
    UsersModule,
    OrganizationsModule,

    // CRM modules
    CustomersModule,
    LeadsModule,
    DealsModule,
    CompaniesModule,
    ContactsModule,
    TasksModule,
    ActivitiesModule,
    PipelinesModule,
    TagsModule,

    // Advanced modules
    AnalyticsModule,
    AutomationModule,
    IntegrationsModule,
    WebhooksModule,
    NotificationsModule,
    ReportsModule,
    DashboardsModule,

    // Common modules
    MailModule,
    FileUploadModule,
    AuditModule,
  ],
  providers: [
    // Global guards
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: OrganizationGuard,
    },

    // Global filters
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },

    // Global interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}