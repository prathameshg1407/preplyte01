// src/practice/ai-interview/ai-interview.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiInterviewService } from './ai-interview.service';
import { AiInterviewController } from './ai-interview.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { ProfileModule } from 'src/profile/profile.module';

@Module({
  imports: [ConfigModule, CloudinaryModule, ProfileModule],
  controllers: [AiInterviewController],
  providers: [AiInterviewService, PrismaService],
  exports: [AiInterviewService], // ✅ ADD THIS LINE
})
export class AiInterviewModule {}