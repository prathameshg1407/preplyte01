// src/groq/groq.module.ts
import { Module, Global } from '@nestjs/common';
import { GroqService } from './groq.service';

@Global()
@Module({
  providers: [GroqService],
  exports: [GroqService],
})
export class GroqModule {}