// src/resume-builder/resume-builder.module.ts
import { Module } from '@nestjs/common';
import { ResumeBuilderService } from './resume-builder.service';
import { ResumeBuilderController } from './resume-builder.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module'; // 👈 import this

@Module({
  imports: [AuthModule, PrismaModule], // 👈 add PrismaModule here
  providers: [ResumeBuilderService],
  controllers: [ResumeBuilderController],
})
export class ResumeBuilderModule {}
