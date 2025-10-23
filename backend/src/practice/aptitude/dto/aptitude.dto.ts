import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsArray,
  ValidateNested,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionDifficulty } from '@prisma/client';

/**
 * Defines the validation rules for query parameters when fetching random questions.
 */
export class GetRandomQuestionsDto {
  @ApiPropertyOptional({
    description: 'Filter questions by one or more tags (e.g., "Quantitative").',
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  @Type(() => String)
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Filter questions by difficulty level.',
    enum: QuestionDifficulty,
  })
  @IsOptional()
  @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty;
}

/**
 * Defines the validation rules for checking a single answer.
 */
export class CheckAnswerDto {
  @ApiProperty({ description: 'The unique ID of the question.' })
  @IsInt()
  questionId: number;

  @ApiProperty({
    description: "The user's selected answer ID (e.g., 'a', 'b').",
  })
  @IsString()
  @IsNotEmpty()
  selectedAnswer: string;
}

/**
 * Represents a single user answer within a test submission.
 */
class UserAnswerDto {
  @ApiProperty({ description: 'The unique ID of the question being answered.' })
  @IsInt()
  questionId: number;

  @ApiPropertyOptional({
    description:
      "The option ID selected by the user. Can be empty if unanswered.",
  })
  @IsString()
  @IsOptional()
  selectedOption: string;
}

/**
 * Defines the validation rules for submitting a full aptitude test.
 */
/**
 * Defines the validation rules for submitting a practice aptitude test.
 */
export class SubmitPracticeAptitudeDto {  // ✅ Renamed
  @ApiProperty({ description: 'The type or category of the aptitude test.' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'An array of all answers from the quiz, including unanswered ones.',
    type: [UserAnswerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserAnswerDto)
  answers: UserAnswerDto[];

  @ApiProperty({
    description: 'The total number of questions that were in the quiz.',
  })
  @IsInt()
  @IsNotEmpty()
  totalQuestions: number;
}