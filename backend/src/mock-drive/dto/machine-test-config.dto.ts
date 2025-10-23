import {
  IsInt,
  IsEnum,
  IsOptional,
  Min,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionDifficulty } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MachineProblemDistribution {
  @ApiProperty({ enum: QuestionDifficulty })
  @IsEnum(QuestionDifficulty)
  difficulty: QuestionDifficulty;

  @ApiProperty({ minimum: 1, example: 2 })
  @IsInt()
  @Min(1)
  count: number;

  @ApiProperty({ minimum: 0, example: 100, description: 'Points per problem' })
  @IsInt()
  @Min(0)
  pointsPerProblem: number;

  @ApiPropertyOptional({ type: [String], example: ['ARRAY', 'STRING', 'DYNAMIC_PROGRAMMING'] })
  @IsArray()
  @IsOptional()
  topics?: string[];
}

export class SelectedMachineProblem {
  @ApiProperty({ example: 1 })
  @IsInt()
  problemId: number;

  @ApiProperty({ minimum: 0, example: 100 })
  @IsInt()
  @Min(0)
  points: number;

  @ApiPropertyOptional({ minimum: 0, example: 1 })
  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;
}

export class MachineTestConfigDto {
  @ApiPropertyOptional({
    type: [MachineProblemDistribution],
    description: 'Auto-generate problems by distribution',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MachineProblemDistribution)
  @IsOptional()
  problemDistribution?: MachineProblemDistribution[];

  @ApiPropertyOptional({
    type: [SelectedMachineProblem],
    description: 'Manually selected problems',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedMachineProblem)
  @IsOptional()
  selectedProblems?: SelectedMachineProblem[];

  @ApiProperty({ minimum: 1, example: 3, description: 'Total problems' })
  @IsInt()
  @Min(1)
  totalProblems: number;

  @ApiProperty({ minimum: 1, example: 90, description: 'Duration in minutes' })
  @IsInt()
  @Min(1)
  durationMinutes: number;

  @ApiPropertyOptional({ minimum: 0, example: 300, description: 'Maximum score' })
  @IsInt()
  @Min(0)
  @IsOptional()
  maxScore?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  allowMultipleSubmissions?: boolean;
}