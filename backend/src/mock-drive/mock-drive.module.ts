import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

// Root Controllers
import { MockDriveController } from './mock-drive.controller';
import { MockDriveAdminController } from './mock-drive-admin.controller';

// Nested Controllers
import { MockDriveAdminRegistrationController } from './controllers/mock-drive-admin-registration.controller';
import { MockDriveAttemptController } from './controllers/mock-drive-attempt.controller';
import { MockDriveBatchController } from './controllers/mock-drive-batch.controller';
import { MockDriveRegistrationController } from './controllers/mock-drive-registration.controller';

// Root Services
import { MockDriveService } from './mock-drive.service';
import { MockDriveAdminService } from './mock-drive-admin.service';

// Nested Services
import { AiQuestionGeneratorService } from './services/ai-question-generator.service';
import { MockDriveAiInterviewService } from './services/mock-drive-ai-interview.service';
import { MockDriveAptitudeService } from './services/mock-drive-aptitude.service';
import { MockDriveAttemptService } from './services/mock-drive-attempt.service';
import { MockDriveBatchService } from './services/mock-drive-batch.service';
import { MockDriveMachineTestService } from './services/mock-drive-machine-test.service';
import { MockDriveQuestionService } from './services/mock-drive-question.service';
import { MockDriveRegistrationService } from './services/mock-drive-registration.service';
import { MockDriveTasksService } from './services/mock-drive-tasks.service';

// Guards
import { BatchTimeGuard } from './guards/batch-time.guard';
import { InstitutionOwnershipGuard } from './guards/institution-ownership.guard';

// External Modules
import { PrismaModule } from '../prisma/prisma.module';
import { GroqModule } from '../groq/groq.module';
import { AiInterviewModule } from 'src/practice/ai-interview/ai-interview.module';
import { MachineTestSubmissionModule } from 'src/practice/machine-test/machine-test-submission.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    PrismaModule,
    GroqModule,
    AiInterviewModule,
    MachineTestSubmissionModule,
    HttpModule,
    ScheduleModule.forRoot(), // For cron jobs (MockDriveTasksService)
  ],
  controllers: [
    // Root Controllers
    MockDriveController,
    MockDriveAdminController,
    
    // Nested Controllers
    MockDriveAdminRegistrationController,
    MockDriveAttemptController,
    MockDriveBatchController,
    MockDriveRegistrationController,
  ],
  providers: [
    // Root Services
    MockDriveService,
    MockDriveAdminService,
    
    // Nested Services
    AiQuestionGeneratorService,
    MockDriveAiInterviewService,
    MockDriveAptitudeService,
    MockDriveAttemptService,
    MockDriveBatchService,
    MockDriveMachineTestService,
    MockDriveQuestionService,
    MockDriveRegistrationService,
    MockDriveTasksService,
    
    // Guards
    BatchTimeGuard,
    InstitutionOwnershipGuard,
  ],
  exports: [
    // Services that might be needed in other modules
    MockDriveService,
    MockDriveAdminService,
    MockDriveRegistrationService,
    MockDriveBatchService,
    MockDriveQuestionService,
    MockDriveAttemptService,
    MockDriveAptitudeService,
    MockDriveMachineTestService,
    MockDriveAiInterviewService,
    AiQuestionGeneratorService,
    
    // Guards (if needed in other modules)
    BatchTimeGuard,
    InstitutionOwnershipGuard,
  ],
})
export class MockDriveModule {}