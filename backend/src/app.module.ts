import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule'; // Add this
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Core Modules
import { PrismaModule } from './prisma/prisma.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { HealthModule } from './health/health.module';

// Auth & User Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfileModule } from './profile/profile.module';
import { AdminModule } from './admin/admin.module';

// Institution & Events
import { InstitutionsModule } from './institutions/institutions.module';
import { EventsModule } from './events/events.module';

// Practice Modules
import { AptitudeModule } from './practice/aptitude/aptitude.module';
import { MachineTestProblemsModule } from './practice/machine-test/machine-test-problems.module';
import { MachineTestSubmissionModule } from './practice/machine-test/machine-test-submission.module';
import { MachineTestModule } from './practice/machine-test/machine-test.module';
import { AiInterviewModule } from './practice/ai-interview/ai-interview.module';

// Mock Drive Module
import { MockDriveModule } from './mock-drive/mock-drive.module';

// Utility Modules
import { ResumeBuilderModule } from './resume-builder/resume-builder.module';

// Global Guards & Filters
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    // Configuration - Global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      expandVariables: true,
    }),

    // Schedule Module - Global (for cron jobs)
    ScheduleModule.forRoot(), // Add this

    // Rate Limiting - Global
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 20, // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Core Infrastructure
    PrismaModule,
    CloudinaryModule,
    HealthModule,

    // Authentication & Authorization
    AuthModule,
    UsersModule,
    ProfileModule,
    AdminModule,

    // Institution Management
    InstitutionsModule,

    // Practice & Assessment
    AptitudeModule,
    MachineTestProblemsModule,
    MachineTestSubmissionModule,
    MachineTestModule,
    AiInterviewModule,

    // Mock Drives & Assessments
    MockDriveModule, // Add this

    // Real-time & Events
    EventsModule,

    // Utilities
    ResumeBuilderModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global Guards (optional - can be applied selectively)
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
})
export class AppModule {}