import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiInterviewQuestionCategory, AiInterviewSessionStatus } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============= Shared Types & Interfaces =============
export interface Question {
  category: AiInterviewQuestionCategory;
  text: string;
}

export interface ResponseScore {
  contentScore: number;
  fluencyScore: number;
  relevanceScore: number;
  feedback: string;
}

// ============= Constants =============
export const INTERVIEW_CATEGORIES = Object.values(AiInterviewQuestionCategory);

export const CategoryDescriptions: Record<AiInterviewQuestionCategory, string> = {
  [AiInterviewQuestionCategory.INTRODUCTORY]: 'Opening questions about background and experience',
  [AiInterviewQuestionCategory.TECHNICAL]: 'Technical skills and knowledge assessment',
  [AiInterviewQuestionCategory.PROJECT_BASED]: 'Questions about past projects and implementations',
  [AiInterviewQuestionCategory.BEHAVIORAL]: 'Behavioral and soft skills evaluation',
  [AiInterviewQuestionCategory.SITUATIONAL]: 'Hypothetical scenarios and problem-solving',
  [AiInterviewQuestionCategory.CLOSING]: 'Closing questions and candidate queries',
};

// ============= Base Classes for Reusability =============
abstract class BaseSessionDto {
  @ApiPropertyOptional({ 
    description: 'Job title for the interview position',
    example: 'Senior Software Engineer',
    maxLength: 100
  })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiPropertyOptional({ 
    description: 'Target company name',
    example: 'Google',
    maxLength: 100
  })
  @IsString()
  @IsOptional()
  companyName?: string;
}

// ============= Request DTOs =============
export class StartInterviewSessionDto extends BaseSessionDto {
  @ApiPropertyOptional({ 
    description: 'Resume ID to tailor interview questions',
    example: 123,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  resumeId?: number;
}

export class SubmitAnswerDto {
  @ApiProperty({ 
    description: 'Category of the interview question',
    enum: AiInterviewQuestionCategory,
    enumName: 'AiInterviewQuestionCategory',
    example: AiInterviewQuestionCategory.TECHNICAL
  })
  @IsEnum(AiInterviewQuestionCategory, {
    message: `Category must be one of: ${INTERVIEW_CATEGORIES.join(', ')}`
  })
  @IsNotEmpty()
  category: AiInterviewQuestionCategory;

  @ApiProperty({ 
    description: 'The interview question text',
    example: 'Describe your experience with microservices architecture.',
    minLength: 1,
    maxLength: 500
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ 
    description: 'Candidate\'s answer to the question',
    example: 'I have 3 years of experience designing and implementing microservices...',
    minLength: 1,
    maxLength: 5000
  })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiPropertyOptional({ 
    description: 'Time taken to answer in seconds',
    example: 45,
    minimum: 0,
    maximum: 600 // 10 minutes max
  })
  @IsNumber()
  @Min(0)
  @Max(600)
  @IsOptional()
  timeTakenSeconds?: number;

  @ApiPropertyOptional({ 
    description: 'Indicates if answer was transcribed from speech-to-text',
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  isTranscribed?: boolean = false;
}

// ============= Response DTOs =============
export class QuestionItemDto implements Question {
  @ApiProperty({ 
    enum: AiInterviewQuestionCategory,
    enumName: 'AiInterviewQuestionCategory',
    description: 'Category classification of the question',
    example: AiInterviewQuestionCategory.TECHNICAL
  })
  category: AiInterviewQuestionCategory;

  @ApiProperty({ 
    description: 'The interview question text',
    example: 'What are your key technical strengths?'
  })
  text: string;
}

export class InterviewSessionResponseDto {
  @ApiProperty({ 
    description: 'Unique session identifier',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID()
  id: string;

  @ApiProperty({ 
    description: 'User ID who initiated this session',
    example: 'user_2NNEqSsZrYR1L8v4XJ5K9Bb1234'
  })
  userId: string;

  @ApiProperty({ 
    type: [QuestionItemDto],
    description: 'Array of interview questions for this session',
    isArray: true
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionItemDto)
  questions: QuestionItemDto[];

  @ApiProperty({ 
    description: 'Session creation timestamp',
    example: '2024-01-15T10:30:00.000Z'
  })
  createdAt: Date;
}

export class ResponseScoreDto implements ResponseScore {
  @ApiProperty({ 
    description: 'Score for answer content quality and accuracy',
    example: 85,
    minimum: 0,
    maximum: 100
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  contentScore: number;

  @ApiProperty({ 
    description: 'Score for communication fluency and articulation',
    example: 90,
    minimum: 0,
    maximum: 100
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  fluencyScore: number;

  @ApiProperty({ 
    description: 'Score for answer relevance to the question',
    example: 88,
    minimum: 0,
    maximum: 100
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  relevanceScore: number;

  @ApiProperty({ 
    description: 'Detailed AI-generated feedback for this response',
    example: 'Strong technical explanation with good use of examples. Consider being more concise in your delivery.'
  })
  @IsString()
  feedback: string;
}

export class InterviewFeedbackResponseDto {
  @ApiProperty({ 
    description: 'Comprehensive summary of interview performance',
    example: 'Demonstrated strong technical knowledge and problem-solving skills with clear communication.',
    minLength: 10,
    maxLength: 1000
  })
  @IsString()
  overallSummary: string;

  @ApiProperty({ 
    description: 'Overall interview performance score',
    example: 88,
    minimum: 0,
    maximum: 100
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  overallScore: number;

  @ApiProperty({ 
    type: [String],
    description: 'List of identified strengths',
    example: ['Strong technical knowledge', 'Clear communication', 'Good problem-solving approach'],
    isArray: true
  })
  @IsArray()
  @IsString({ each: true })
  keyStrengths: string[];

  @ApiProperty({ 
    type: [String],
    description: 'Areas requiring improvement',
    example: ['Time management', 'System design depth', 'Handling ambiguity'],
    isArray: true
  })
  @IsArray()
  @IsString({ each: true })
  areasForImprovement: string[];

  @ApiProperty({ 
    type: [String],
    description: 'Categories where performance was below average',
    example: ['SITUATIONAL', 'BEHAVIORAL'],
    isArray: true
  })
  @IsArray()
  @IsString({ each: true })
  weakSections: string[];

  @ApiProperty({ 
    type: [ResponseScoreDto],
    description: 'Detailed scoring breakdown for each answer',
    isArray: true
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResponseScoreDto)
  perResponseScores: ResponseScoreDto[];
}

// ============= Utility Types for Better Type Safety =============
export type CategoryQuestionMap = Partial<Record<AiInterviewQuestionCategory, string[]>>;

export interface InterviewSessionConfig {
  resumeId?: number;
  jobTitle?: string;
  companyName?: string;
  questionCount?: number;
  categoryDistribution?: Partial<Record<AiInterviewQuestionCategory, number>>;
}

// ============= Helper Functions (Optional) =============
export class InterviewCategoryHelper {
  static getCategoryDescription(category: AiInterviewQuestionCategory): string {
    return CategoryDescriptions[category] || 'Unknown category';
  }

  static getDefaultQuestionDistribution(): Record<AiInterviewQuestionCategory, number> {
    return {
      [AiInterviewQuestionCategory.INTRODUCTORY]: 2,
      [AiInterviewQuestionCategory.TECHNICAL]: 3,
      [AiInterviewQuestionCategory.PROJECT_BASED]: 2,
      [AiInterviewQuestionCategory.BEHAVIORAL]: 2,
      [AiInterviewQuestionCategory.SITUATIONAL]: 2,
      [AiInterviewQuestionCategory.CLOSING]: 1,
    };
  }

  static isValidCategory(category: string): category is AiInterviewQuestionCategory {
    return INTERVIEW_CATEGORIES.includes(category as AiInterviewQuestionCategory);
  }
}


// Add this to your dto file
// In ai-interview.dto.ts - Update the DTO
export class UserSessionSummaryDto {
  @ApiProperty({ 
    description: 'Session unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  id: string;

  @ApiProperty({ 
    description: 'Job title for the interview',
    example: 'Senior Software Engineer'
  })
  jobTitle: string; // Change to non-nullable with default in mapper

  @ApiProperty({ 
    description: 'Company name',
    example: 'Google',
    nullable: true
  })
  companyName: string | null;

  @ApiProperty({ 
    description: 'Resume ID used for the session',
    example: 123,
    nullable: true
  })
  resumeId: number | null;

  @ApiProperty({ 
    description: 'Session status',
    enum: AiInterviewSessionStatus,
    example: AiInterviewSessionStatus.COMPLETED
  })
  status: AiInterviewSessionStatus;

  @ApiProperty({ 
    description: 'Total number of questions',
    example: 10
  })
  totalQuestions: number;

  @ApiProperty({ 
    description: 'Number of questions answered',
    example: 7
  })
  answeredQuestions: number;

  @ApiProperty({ 
    description: 'Current question index',
    example: 6
  })
  currentQuestionIndex: number;

  @ApiProperty({ 
    description: 'Overall feedback score if completed',
    example: 88,
    nullable: true
  })
  overallScore: number | null;

  @ApiProperty({ 
    description: 'Session creation timestamp'
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Session completion timestamp',
    nullable: true
  })
  completedAt: Date | null;

  @ApiProperty({ 
    description: 'Has feedback been generated',
    example: true
  })
  hasFeedback: boolean;
}


