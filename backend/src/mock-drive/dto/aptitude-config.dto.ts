import {
  IsInt,
  IsEnum,
  IsOptional,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionDifficulty } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AptitudeQuestionDistribution {
  @ApiProperty({ enum: QuestionDifficulty })
  @IsEnum(QuestionDifficulty)
  difficulty: QuestionDifficulty;

  @ApiProperty({ minimum: 1, example: 10 })
  @IsInt()
  @Min(1)
  count: number;

  @ApiPropertyOptional({ type: [String], example: ['LOGICAL_REASONING', 'QUANTITATIVE'] })
  @IsArray()
  @IsOptional()
  topics?: string[];
}

export class AptitudeTestConfigDto {
  @ApiPropertyOptional({ description: 'Use existing aptitude test definition ID' })
  @IsInt()
  @IsOptional()
  existingTestId?: number;

  @ApiPropertyOptional({ 
    type: [AptitudeQuestionDistribution],
    description: 'Question distribution by difficulty' 
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AptitudeQuestionDistribution)
  @IsOptional()
  questionDistribution?: AptitudeQuestionDistribution[];

  @ApiProperty({ minimum: 1, example: 30, description: 'Total questions' })
  @IsInt()
  @Min(1)
  totalQuestions: number;

  @ApiProperty({ minimum: 1, example: 60, description: 'Duration in minutes' })
  @IsInt()
  @Min(1)
  durationMinutes: number;

  @ApiPropertyOptional({ minimum: 0, example: 100, description: 'Maximum score' })
  @IsInt()
  @Min(0)
  @IsOptional()
  maxScore?: number;
}