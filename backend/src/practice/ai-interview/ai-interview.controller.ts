import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  ParseUUIDPipe,
  Delete,
} from '@nestjs/common';
import { AiInterviewService } from './ai-interview.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/user.decorator';
import type { JwtUser } from 'src/auth/types/jwt-user';
import {
  StartInterviewSessionDto,
  SubmitAnswerDto,
  InterviewSessionResponseDto,
  InterviewFeedbackResponseDto,
  UserSessionSummaryDto,
} from './dto/ai-interview.dto';

// ============= Response DTOs =============
class NextQuestionResponseDto {
  question: string;
  category: string;
  index: number;
  audioUrl: string;
  totalQuestions: number;
}

class QuestionCompletionResponseDto {
  isComplete: boolean;
  message: string;
  audioUrl?: string;
}

class SubmitAnswerResponseDto {
  nextQuestion?: {
    category: string;
    text: string;
  };
  isComplete: boolean;
  message?: string;
  audioUrl: string;
}

class SessionStateResponseDto {
  id: string;
  userId: string;
  questions: Array<{
    category: string;
    text: string;
  }>;
  currentQuestion: {
    category: string;
    text: string;
  };
  audioUrl: string;
  currentQuestionIndex: number;
  responses?: any[];
  resume?: any;
}

class ErrorResponseDto {
  statusCode: number;
  message: string;
  error?: string;
  timestamp?: string;
  path?: string;
}

@ApiTags('AI Interview Practice')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('practice/ai-interview')
export class AiInterviewController {
  private readonly logger = new Logger(AiInterviewController.name);

  constructor(private readonly aiInterviewService: AiInterviewService) {}

  // ============= IMPORTANT: Static routes MUST come before parameterized routes =============

  /**
   * 🧪 DEBUG: Test TTS connection (optional - remove in production)
   */
  @Get('test-tts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🧪 Test TTS Configuration',
    description: 'Debug endpoint to verify Google Cloud TTS credentials setup',
  })
  async testTTS() {
    const fs = require('fs');
    const path = require('path');
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    return {
      credentialsPath: credPath,
      fileExists: credPath ? fs.existsSync(credPath) : false,
      absolutePath: credPath ? path.resolve(credPath) : null,
      environmentVariables: {
        fromEnv: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        nodeEnv: process.env.NODE_ENV,
      },
    };
  }

  /**
   * Get session statistics for the current user
   * ⚠️ MUST be before @Get(':sessionId') route!
   */
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user session statistics',
    description: `
      Retrieves aggregate statistics for all interview sessions of the user.
      Includes total sessions, completion rate, average score, etc.
    `,
  })
  @ApiOkResponse({
    description: 'Session statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalSessions: { type: 'number', example: 15 },
        completedSessions: { type: 'number', example: 10 },
        inProgressSessions: { type: 'number', example: 2 },
        averageScore: { type: 'number', example: 85 },
        totalQuestionsAnswered: { type: 'number', example: 120 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
    type: ErrorResponseDto,
  })
  async getUserSessionStats(@GetUser() user: JwtUser): Promise<any> {
    this.logger.log(`Fetching session stats for user ${user.sub}`);
    
    try {
      const stats = await this.aiInterviewService.getUserSessionStats(user.sub);
      this.logger.log(`Stats retrieved for user ${user.sub}`);
      return stats;
    } catch (error) {
      this.logger.error(`Failed to fetch stats for user ${user.sub}:`, error);
      throw error;
    }
  }

  /**
   * Get all interview sessions for the current user
   * ⚠️ MUST be before @Get(':sessionId') route!
   */
  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all user interview sessions',
    description: `
      Retrieves all interview sessions for the authenticated user.
      Includes both active and completed sessions with summary information.
      Sessions are ordered by creation date (most recent first).
    `,
  })
  @ApiOkResponse({
    description: 'List of interview sessions retrieved successfully',
    type: [UserSessionSummaryDto],
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
    type: ErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve sessions',
    type: ErrorResponseDto,
  })
  async getUserSessions(@GetUser() user: JwtUser): Promise<UserSessionSummaryDto[]> {
    this.logger.log(`Fetching all sessions for user ${user.sub}`);
    
    try {
      const sessions = await this.aiInterviewService.getUserSessions(user.sub);
      this.logger.log(`Found ${sessions.length} sessions for user ${user.sub}`);
      return sessions;
    } catch (error) {
      this.logger.error(`Failed to fetch sessions for user ${user.sub}:`, error);
      throw error;
    }
  }

  /**
   * Start a new AI interview session
   */
  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Start new AI interview session',
    description: `
      Initiates a new AI-powered interview session with 10 dynamically generated questions.
      Structure: 1 INTRODUCTORY, 8 TECHNICAL, 1 CLOSING.
      Questions are tailored based on the provided resume and job details.
    `,
  })
  @ApiBody({
    type: StartInterviewSessionDto,
    description: 'Session configuration including optional resume and job details',
  })
  @ApiCreatedResponse({
    description: 'Interview session successfully created with generated questions',
    type: InterviewSessionResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input - resume not found, unreadable, or parameters invalid',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
    type: ErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to generate questions or initialize session',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Duplicate request detected',
    type: ErrorResponseDto,
  })
  async startInterviewSession(
    @GetUser() user: JwtUser,
    @Body() startDto: StartInterviewSessionDto,
  ): Promise<InterviewSessionResponseDto> {
    this.logger.log(`Starting interview session for user ${user.sub}`);
    
    try {
      const result = await this.aiInterviewService.startInterviewSession(
        user.sub,
        startDto,
      );
      
      this.logger.log(`Session ${result.id} created successfully`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to start session for user ${user.sub}:`, error);
      throw error;
    }
  }

  // ============= Parameterized routes come AFTER static routes =============

  /**
   * Get current interview session state
   */
  @Get(':sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get interview session state',
    description: `
      Retrieves the current state of an interview session including:
      - All generated questions
      - Current question index
      - Submitted responses
      - Session metadata
    `,
  })
  @ApiParam({
    name: 'sessionId',
    type: String,
    description: 'Unique identifier of the interview session',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Session state retrieved successfully',
    type: SessionStateResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Interview session not found or user does not have access',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
    type: ErrorResponseDto,
  })
  async getInterviewSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @GetUser() user: JwtUser,
  ): Promise<SessionStateResponseDto> {
    this.logger.log(`Fetching session ${sessionId} for user ${user.sub}`);
    
    try {
      return await this.aiInterviewService.getInterviewSession(sessionId, user.sub);
    } catch (error) {
      this.logger.error(`Failed to fetch session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get next question in the interview
   */
  @Get(':sessionId/next')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get next interview question',
    description: `
      Retrieves the next question in the interview sequence.
      Returns completion status if all questions have been answered.
      Each response includes audio URL for text-to-speech playback.
    `,
  })
  @ApiParam({
    name: 'sessionId',
    type: String,
    description: 'Unique identifier of the interview session',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Next question retrieved or interview completion confirmed',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/NextQuestionResponseDto' },
        { $ref: '#/components/schemas/QuestionCompletionResponseDto' },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'Session not found',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Session already completed or duplicate request',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
    type: ErrorResponseDto,
  })
  async getNextQuestion(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @GetUser() user: JwtUser,
  ): Promise<NextQuestionResponseDto | QuestionCompletionResponseDto> {
    this.logger.log(`Getting next question for session ${sessionId}`);
    
    try {
      return await this.aiInterviewService.getNextQuestion(sessionId, user.sub);
    } catch (error) {
      this.logger.error(`Failed to get next question for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get comprehensive interview feedback
   */
  @Get(':sessionId/feedback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get comprehensive interview feedback',
    description: `
      Generates detailed AI-powered feedback for a completed interview session.
      
      Includes:
      - Overall performance score (0-100)
      - Comprehensive summary
      - Key strengths identified
      - Areas for improvement
      - Weak sections requiring focus
      - Per-question scores and feedback
      
      Note: Session must be completed before feedback can be generated.
      Feedback is cached and only generated once per session.
    `,
  })
  @ApiParam({
    name: 'sessionId',
    type: String,
    description: 'Unique identifier of the completed interview session',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Comprehensive feedback generated successfully',
    type: InterviewFeedbackResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Session not found',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Session not yet completed - answer all questions first',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
    type: ErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to generate feedback',
    type: ErrorResponseDto,
  })
  async getInterviewFeedback(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @GetUser() user: JwtUser,
  ): Promise<InterviewFeedbackResponseDto> {
    this.logger.log(`Generating feedback for session ${sessionId}`);
    
    try {
      const result = await this.aiInterviewService.getInterviewFeedback(
        sessionId,
        user.sub,
      );
      
      this.logger.log(`Feedback generated successfully for session ${sessionId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to generate feedback for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Submit answer to interview question
   */
  @Post(':sessionId/answer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit answer to interview question',
    description: `
      Submits an answer to the current interview question.
      The answer is:
      - Scored on content, fluency, and relevance (0-10 each)
      - Analyzed for strengths and weaknesses
      - Used to generate the next follow-up question
      
      Returns the next question or completion status with audio URL.
    `,
  })
  @ApiParam({
    name: 'sessionId',
    type: String,
    description: 'Unique identifier of the interview session',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: SubmitAnswerDto,
    description: 'Answer details including question, response text, and metadata',
  })
  @ApiOkResponse({
    description: 'Answer submitted successfully with scores and next question',
    type: SubmitAnswerResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Session not found',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Session already completed',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid answer format or question mismatch',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
    type: ErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to score answer or generate next question',
    type: ErrorResponseDto,
  })
  async submitAnswer(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @GetUser() user: JwtUser,
    @Body() submitDto: SubmitAnswerDto,
  ): Promise<SubmitAnswerResponseDto> {
    this.logger.log(`Submitting answer for session ${sessionId}`);
    
    try {
      const result = await this.aiInterviewService.submitAnswer(
        sessionId,
        user.sub,
        submitDto,
      );
      
      this.logger.log(`Answer submitted successfully for session ${sessionId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to submit answer for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel an interview session
   */
  @Post(':sessionId/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cancel interview session',
    description: `
      Cancels an active interview session.
      Marks the session as completed without generating feedback.
      This action is irreversible.
    `,
  })
  @ApiParam({
    name: 'sessionId',
    type: String,
    description: 'Unique identifier of the interview session',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Session cancelled successfully',
  })
  @ApiNotFoundResponse({
    description: 'Session not found',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Cannot cancel a completed session',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
    type: ErrorResponseDto,
  })
  async cancelSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @GetUser() user: JwtUser,
  ): Promise<void> {
    this.logger.log(`Cancelling session ${sessionId}`);
    
    try {
      await this.aiInterviewService.cancelSession(sessionId, user.sub);
      this.logger.log(`Session ${sessionId} cancelled successfully`);
    } catch (error) {
      this.logger.error(`Failed to cancel session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Delete an interview session
   */
  @Delete(':sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete interview session',
    description: `
      Permanently deletes an interview session and all associated data.
      This includes responses, feedback, and session metadata.
      This action cannot be undone.
    `,
  })
  @ApiParam({
    name: 'sessionId',
    type: String,
    description: 'Unique identifier of the interview session',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Session deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Session not found',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
    type: ErrorResponseDto,
  })
  async deleteSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @GetUser() user: JwtUser,
  ): Promise<void> {
    this.logger.log(`Deleting session ${sessionId}`);
    
    try {
      await this.aiInterviewService.deleteSession(sessionId, user.sub);
      this.logger.log(`Session ${sessionId} deleted successfully`);
    } catch (error) {
      this.logger.error(`Failed to delete session ${sessionId}:`, error);
      throw error;
    }
  }
}