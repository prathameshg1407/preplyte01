// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

// Force Node.js DNS to use IPv4 first (fixes ENETUNREACH / Cloudinary issues)
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

const logger = new Logger('Bootstrap');

async function listenWithTimeout(app: NestExpressApplication, port: number, host = '0.0.0.0', timeoutMs = 15000) {
  // Wrap the listen call so we can detect if it never resolves
  return Promise.race([
    app.listen(port, host),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`app.listen() did not complete within ${timeoutMs}ms`)), timeoutMs),
    ),
  ]);
}

async function bootstrap() {
  logger.log('Starting NestJS bootstrap sequence...');

  try {
    // Create NestJS application
    logger.log('Creating Nest application instance...');
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
      cors: false,
      bufferLogs: true,
    });

    const configService = app.get(ConfigService);

    // Environment configuration
    const port = configService.get<number>('PORT', 3001);
    const environment = configService.get<string>('NODE_ENV', 'development');
    const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const isDevelopment = environment === 'development';

    logger.debug(`Environment: ${environment}`);
    logger.debug(`Frontend URL: ${frontendUrl}`);
    logger.debug(`Dev mode: ${isDevelopment}`);

    // SECURITY MIDDLEWARE
    logger.log('Applying security middleware (helmet, cookieParser, compression)...');
    app.use(
      helmet({
        contentSecurityPolicy: isDevelopment ? false : undefined,
        crossOriginEmbedderPolicy: false,
      }),
    );
    app.use(cookieParser());
    app.use(
      compression({
        filter: (req, res) => {
          if (req.headers['x-no-compression']) return false;
          return compression.filter(req, res);
        },
        threshold: 1024,
      }),
    );

    // CORS
    logger.log('Configuring CORS...');
    app.enableCors({
      origin: isDevelopment ? [frontendUrl, 'http://localhost:3000', 'http://localhost:5173'] : frontendUrl,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      maxAge: 3600,
    });

    // Static assets
    logger.log('Setting up static assets...');
    app.useStaticAssets(join(process.cwd(), 'public'), {
      prefix: '/public/',
      maxAge: isDevelopment ? 0 : 86400000,
    });

    // Global prefix
    logger.log('Setting global prefix...');
    app.setGlobalPrefix('api', {
      exclude: ['health', 'docs'],
    });

    // API versioning
    logger.log('Enabling API versioning...');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
      prefix: 'v',
    });

    // Validation
    logger.log('Applying global validation pipe...');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        disableErrorMessages: !isDevelopment,
        validationError: { target: isDevelopment, value: isDevelopment },
      }),
    );

    // Swagger (dev only)
    if (isDevelopment) {
      try {
        logger.log('Setting up Swagger documentation...');
        const swaggerConfig = new DocumentBuilder()
          .setTitle('Preplyte API')
          .setDescription('Placement Preparation Platform - API Documentation')
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
          .addTag('auth', 'Authentication & Authorization')
          .addTag('users', 'User Management')
          .addTag('mock-drives', 'Mock Drive Management')  // Add this
          .addTag('scheduler', 'Scheduler Management')      // Add this
          .addTag('aptitude', 'Aptitude Tests')
          .addTag('machine-test', 'Machine Tests')
          .addTag('ai-interview', 'AI Interview')
          .addServer(`http://localhost:${port}`, 'Development Server')
          .build();

        const document = SwaggerModule.createDocument(app, swaggerConfig);
        SwaggerModule.setup('docs', app, document, {
          swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'none',
            filter: true,
            showRequestDuration: true,
          },
          customSiteTitle: 'Preplyte API Docs',
        });
        logger.log(`Swagger available at http://localhost:${port}/docs`);
      } catch (err) {
        logger.error('Failed to setup Swagger', (err as Error).message);
      }
    }

    // Graceful shutdown hooks
    app.enableShutdownHooks();

    // Log scheduler status (if you want to verify schedulers are loaded)
    if (isDevelopment) {
      try {
        const { SchedulerRegistry } = await import('@nestjs/schedule');
        const schedulerRegistry = app.get(SchedulerRegistry);
        const cronJobs = schedulerRegistry.getCronJobs();
        
        if (cronJobs.size > 0) {
          logger.log(`📅 Loaded ${cronJobs.size} scheduled job(s):`);
          cronJobs.forEach((job, name) => {
            logger.debug(`  - ${name}`);
          });
        }
      } catch (err) {
        // SchedulerRegistry might not be available if ScheduleModule isn't imported
        logger.debug('Scheduler registry not available');
      }
    }

    // Start server with timeout to detect hangs
    logger.log(`Starting server (listen) on port ${port}...`);
    try {
      await listenWithTimeout(app, port, '0.0.0.0', 15000);
    } catch (err) {
      logger.error(`app.listen() timeout or error: ${(err as Error).message}`);
      // Re-throw so overall bootstrap catch below logs full stack
      throw err;
    }

    const now = new Date().toLocaleTimeString();
    logger.log(`
========================================================
🚀 Preplyte Backend is READY! (${now})
📍 Listening on http://localhost:${port}
📚 Swagger docs: http://localhost:${port}/docs
💻 Health check: http://localhost:${port}/health
⚙️  Environment: ${environment}
========================================================
    `);

    // Log scheduler information
    if (isDevelopment) {
      logger.log('📅 Scheduler jobs will run automatically based on their cron expressions');
      logger.log('   - Mock drive cleanup: Every 30 minutes');
      logger.log('   - Incomplete components check: Every hour');
      logger.log('   - Orphaned sessions cleanup: Daily at 2 AM');
      logger.log('   - Daily report generation: Daily at 1 AM');
    }

  } catch (err) {
    // Log stack trace and keep process alive in dev so watcher can pick up changes
    logger.error(`Bootstrap failed: ${(err as Error).message}`);
    logger.error((err as Error).stack || 'no stack trace');

    // In development we don't exit so watch can continue; in production you may exit(1)
    // process.exit(1);
  }
}

// Safe global handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', JSON.stringify(reason), 'promise:', String(promise));
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', (error as Error).message);
  logger.error((error as Error).stack || 'no stack');
  process.exit(1);
});

// Graceful shutdown for schedulers
process.on('SIGTERM', async () => {
  logger.warn('SIGTERM signal received: closing HTTP server and stopping schedulers');
  // The app.enableShutdownHooks() handles most of this, but you can add custom logic here
});

process.on('SIGINT', async () => {
  logger.warn('SIGINT signal received: closing HTTP server and stopping schedulers');
  // The app.enableShutdownHooks() handles most of this, but you can add custom logic here
});

bootstrap();