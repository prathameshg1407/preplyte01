import { IsString, IsNotEmpty, IsInt, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Body for: POST /mock-drives/attempts/:attemptId/ai-interview/start
export class StartMockDriveInterviewBodyDto {
  @ApiProperty({
    description: 'Resume ID (must be uploaded by student)',
    example: 123, // If this is actually a string in your DB, switch to IsString and example: 'res_123'
  })
  @IsInt()
  resumeId: number;
}

// Body for: POST /mock-drives/attempts/:attemptId/ai-interview/answer
export class SubmitMockDriveAnswerDto {
  @ApiProperty({
    description: 'AI interview session ID',
    example: 'session_cmh123456',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ example: 'TECHNICAL' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'What is your experience with React?' })
  @IsString()
  question: string;

  @ApiProperty({ example: 'I have 2 years of experience...' })
  @IsString()
  answer: string;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsInt()
  timeTakenSeconds?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isTranscribed?: boolean;
}