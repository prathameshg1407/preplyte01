
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min, Max } from 'class-validator';
import { QuestionDifficulty } from '@prisma/client';

/**
 * Defines the validation rules for the data sent when generating a new machine test.
 */
export class GenerateTestDto {
  @ApiProperty({
    description: 'The desired difficulty level for the test questions.',
    enum: QuestionDifficulty,
    example: 'MEDIUM',
  })
  @IsEnum(QuestionDifficulty)
  difficulty: QuestionDifficulty;

  @ApiProperty({
    description: 'The number of questions to include in the test.',
    example: 5,
  })
  @IsInt()
  @Min(1)
  @Max(20) // A reasonable limit to prevent excessive resource usage.
  count: number;
}
