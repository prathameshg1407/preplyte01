// machine-test-submission.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MachineTestSubmissionService } from './machine-test-submission.service';
import { MachineTestSubmissionController } from './machine-test-submission.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [MachineTestSubmissionController],
  providers: [MachineTestSubmissionService],
  exports: [MachineTestSubmissionService], // ✅ ADD THIS
})
export class MachineTestSubmissionModule {}