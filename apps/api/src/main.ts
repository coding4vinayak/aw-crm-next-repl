import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as compression from 'compression';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  // Create Winston logger
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, trace }) => {
            return `${timestamp} [${context}] ${level}: ${message}${trace ? `\n${trace}` : ''}`;
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
  });

  const app = await NestFactory.create(AppModule, {
    logger,
    cors: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: nodeEnv === 'production',
    crossOriginEmbedderPolicy: nodeEnv === 'production',
  }));

  // Compression middleware
  app.use(compression());

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS configuration
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map(error => 
          Object.values(error.constraints || {}).join(', ')
        );
        return new Error(`Validation failed: ${messages.join('; ')}`);
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TimeoutInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger documentation (only in development)
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('AW CRM API')
      .setDescription('Production-ready CRM API with comprehensive features')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Users', 'User management')
      .addTag('Organizations', 'Organization management')
      .addTag('Customers', 'Customer relationship management')
      .addTag('Leads', 'Lead management and qualification')
      .addTag('Deals', 'Deal pipeline and sales tracking')
      .addTag('Tasks', 'Task and activity management')
      .addTag('Analytics', 'Business intelligence and reporting')
      .addTag('Integrations', 'Third-party integrations')
      .addTag('Webhooks', 'Webhook management')
      .addTag('Automation', 'Workflow automation')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    Logger.log(`📚 API Documentation available at http://localhost:${port}/api/docs`, 'Bootstrap');
  }

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: nodeEnv,
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    Logger.log('SIGTERM received, shutting down gracefully...', 'Bootstrap');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    Logger.log('SIGINT received, shutting down gracefully...', 'Bootstrap');
    await app.close();
    process.exit(0);
  });

  await app.listen(port, '0.0.0.0');
  
  Logger.log(`🚀 Application is running on: http://localhost:${port}/api/v1`, 'Bootstrap');
  Logger.log(`🌍 Environment: ${nodeEnv}`, 'Bootstrap');
  
  if (nodeEnv !== 'production') {
    Logger.log(`📖 GraphQL Playground: http://localhost:${port}/graphql`, 'Bootstrap');
  }
}

bootstrap().catch((error) => {
  Logger.error('❌ Error starting application', error, 'Bootstrap');
  process.exit(1);
});