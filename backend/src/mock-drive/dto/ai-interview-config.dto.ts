import {
  IsString,
  IsInt,
  IsOptional,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AiInterviewConfigDto {
  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'Google' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty({ 
    minimum: 5, 
    maximum: 20, 
    example: 10, 
    description: 'Total interview questions' 
  })
  @IsInt()
  @Min(5)
  @Max(20)
  totalQuestions: number;

  @ApiProperty({ 
    minimum: 15, 
    maximum: 60, 
    example: 30, 
    description: 'Duration in minutes' 
  })
  @IsInt()
  @Min(15)
  @Max(60)
  durationMinutes: number;

  @ApiPropertyOptional({ 
    default: true, 
    description: 'Whether resume is required' 
  })
  @IsBoolean()
  @IsOptional()
  requireResume?: boolean;

  @ApiPropertyOptional({ 
    minimum: 0, 
    example: 100, 
    description: 'Maximum score' 
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  maxScore?: number;

  @ApiPropertyOptional({ 
    default: false, 
    description: 'Enable follow-up questions' 
  })
  @IsBoolean()
  @IsOptional()
  enableFollowUps?: boolean;
}