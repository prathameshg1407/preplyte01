import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiInterviewService } from 'src/practice/ai-interview/ai-interview.service';
import {
  AiInterviewSessionStatus,
  AiInterviewQuestionCategory,
  MockDriveAttemptStatus,
  Prisma,
} from '@prisma/client';
import { SubmitMockDriveAnswerDto } from '../dto/mock-drive-interview.dto';

@Injectable()
export class MockDriveAiInterviewService {
  private readonly logger = new Logger(MockDriveAiInterviewService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiInterviewService: AiInterviewService,
  ) {}

  /**
   * Start AI interview for mock drive attempt
   */
  async startMockDriveInterview(
    userId: string,
    attemptId: string,
    resumeId: number,
  ) {
    this.logger.log(`Starting mock drive AI interview for attempt ${attemptId}`);

    // 1. Validate mock drive attempt
    const attempt = await this.validateAttempt(userId, attemptId);

    // 2. Check if AI interview already started
    if (attempt.aiInterviewSessionId) {
      throw new BadRequestException('AI interview already started for this attempt');
    }

    // 3. Validate AI interview is configured
    const aiConfig = attempt.mockDrive.aiInterviewConfig as any;
    if (!aiConfig) {
      throw new BadRequestException('AI interview not configured for this mock drive');
    }

    // 4. Validate resume ownership
    await this.validateResume(userId, resumeId);

    // 5. Prepare interview start DTO
    const jobTitle = aiConfig.jobRole || 
                     aiConfig.jobTitle || 
                     attempt.mockDrive.title || 
                     'General Interview';

    const companyName = aiConfig.companyName || 
                        attempt.mockDrive.institution?.name || 
                        'Mock Company';

    // 6. Use existing AI interview service to start session
    const sessionResponse = await this.aiInterviewService.startInterviewSession(userId, {
      resumeId,
      jobTitle,
      companyName,
    });

    // 7. Link session to mock drive attempt
    await this.prisma.mockDriveAttempt.update({
      where: { id: attemptId },
      data: {
        aiInterviewSessionId: sessionResponse.id,
      },
    });

    this.logger.log(`Mock drive AI interview session created: ${sessionResponse.id}`);

    return {
      ...sessionResponse,
      attemptId,
      mockDriveTitle: attempt.mockDrive.title,
      configuredQuestions: aiConfig.totalQuestions || 10,
      duration: aiConfig.durationMinutes || 30,
    };
  }

  /**
   * Submit answer for mock drive AI interview
   */
  async submitAnswer(
    userId: string,
    attemptId: string,
    dto: SubmitMockDriveAnswerDto,
  ) {
    this.logger.log(`Submitting answer for mock drive interview, attempt ${attemptId}`);

    // 1. Validate attempt
    const attempt = await this.validateAttempt(userId, attemptId);

    // 2. Verify session belongs to this attempt
    if (attempt.aiInterviewSessionId !== dto.sessionId) {
      throw new BadRequestException('Session does not belong to this attempt');
    }

    // 3. Use existing AI interview service to submit answer
    const response = await this.aiInterviewService.submitAnswer(
      dto.sessionId,
      userId,
      {
        category: dto.category as AiInterviewQuestionCategory,
        question: dto.question,
        answer: dto.answer,
        timeTakenSeconds: dto.timeTakenSeconds,
        isTranscribed: dto.isTranscribed,
      },
    );

    return {
      ...response,
      attemptId,
    };
  }

  /**
   * Get current AI interview session for attempt
   */
  async getCurrentSession(userId: string, attemptId: string) {
    this.logger.log(`Getting AI interview session for attempt ${attemptId}`);

    // 1. Validate attempt
    const attempt = await this.validateAttempt(userId, attemptId);

    if (!attempt.aiInterviewSessionId) {
      throw new NotFoundException('No AI interview session found for this attempt');
    }

    // 2. Use existing service to get session
    const session = await this.aiInterviewService.getInterviewSession(
      attempt.aiInterviewSessionId,
      userId,
    );

    return {
      ...session,
      attemptId,
      mockDriveTitle: attempt.mockDrive.title,
    };
  }

  /**
   * Get next question for mock drive interview
   */
  async getNextQuestion(userId: string, attemptId: string) {
    this.logger.log(`Getting next question for attempt ${attemptId}`);

    // 1. Validate attempt
    const attempt = await this.validateAttempt(userId, attemptId);

    if (!attempt.aiInterviewSessionId) {
      throw new NotFoundException('No AI interview session found');
    }

    // 2. Use existing service to get next question
    const response = await this.aiInterviewService.getNextQuestion(
      attempt.aiInterviewSessionId,
      userId,
    );

    return {
      ...response,
      attemptId,
    };
  }

  /**
   * Complete AI interview for mock drive
   */
  async completeInterview(userId: string, attemptId: string) {
    this.logger.log(`Completing AI interview for attempt ${attemptId}`);

    // 1. Validate attempt
    const attempt = await this.validateAttempt(userId, attemptId);

    if (!attempt.aiInterviewSessionId) {
      throw new NotFoundException('No AI interview session found');
    }

    // 2. Get feedback using existing service
    const feedback = await this.aiInterviewService.getInterviewFeedback(
      attempt.aiInterviewSessionId,
      userId,
    );

    this.logger.log(`AI interview completed for attempt ${attemptId}`);

    return {
      ...feedback,
      attemptId,
      mockDriveTitle: attempt.mockDrive.title,
    };
  }

  /**
   * Get feedback for completed AI interview
   */
  async getFeedback(userId: string, attemptId: string) {
    this.logger.log(`Getting AI interview feedback for attempt ${attemptId}`);

    // 1. Validate attempt
    const attempt = await this.validateAttempt(userId, attemptId);

    if (!attempt.aiInterviewSessionId) {
      throw new NotFoundException('No AI interview session found for this attempt');
    }

    // 2. Use existing service to get feedback
    const feedback = await this.aiInterviewService.getInterviewFeedback(
      attempt.aiInterviewSessionId,
      userId,
    );

    return {
      ...feedback,
      attemptId,
      mockDriveTitle: attempt.mockDrive.title,
    };
  }

  /**
   * Check if AI interview is completed
   */
  async isInterviewCompleted(attemptId: string, userId: string): Promise<boolean> {
    const attempt = await this.validateAttempt(userId, attemptId);

    if (!attempt.aiInterviewSessionId) {
      return false;
    }

    const session = await this.prisma.aiInterviewSession.findUnique({
      where: { id: attempt.aiInterviewSessionId },
    });

    return session?.status === AiInterviewSessionStatus.COMPLETED;
  }

  /**
   * Get AI interview progress
   */
  async getInterviewProgress(attemptId: string, userId: string) {
    this.logger.log(`Getting AI interview progress for attempt ${attemptId}`);

    const attempt = await this.validateAttempt(userId, attemptId);

    if (!attempt.aiInterviewSessionId) {
      return {
        started: false,
        completed: false,
        questionsAnswered: 0,
        totalQuestions: 0,
        currentQuestionIndex: 0,
      };
    }

    const session = await this.prisma.aiInterviewSession.findUnique({
      where: { id: attempt.aiInterviewSessionId },
      include: {
        responses: true,
      },
    });

    if (!session) {
      return {
        started: false,
        completed: false,
        questionsAnswered: 0,
        totalQuestions: 0,
        currentQuestionIndex: 0,
      };
    }

    const aiConfig = attempt.mockDrive.aiInterviewConfig as any;
    const totalQuestions = aiConfig?.totalQuestions || session.totalQuestions || 10;

    return {
      started: true,
      completed: session.status === AiInterviewSessionStatus.COMPLETED,
      questionsAnswered: session.responses.length,
      totalQuestions,
      currentQuestionIndex: session.currentQuestionIndex,
      status: session.status,
      startedAt: session.createdAt,
      completedAt: session.completedAt,
    };
  }

  /**
   * Get session statistics
   */
  async getSessionStats(attemptId: string, userId: string) {
    const attempt = await this.validateAttempt(userId, attemptId);

    if (!attempt.aiInterviewSessionId) {
      throw new NotFoundException('No AI interview session found');
    }

    const session = await this.prisma.aiInterviewSession.findUnique({
      where: { id: attempt.aiInterviewSessionId },
      include: {
        responses: true,
        feedback: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Calculate average scores from responses
    const scores = session.responses.map(r => {
      const scoresJson = r.scoresJson as any;
      return {
        contentScore: scoresJson?.contentScore || 0,
        fluencyScore: scoresJson?.fluencyScore || 0,
        relevanceScore: scoresJson?.relevanceScore || 0,
      };
    });

    const avgContentScore = scores.length > 0
      ? scores.reduce((sum, s) => sum + s.contentScore, 0) / scores.length
      : 0;

    const avgFluencyScore = scores.length > 0
      ? scores.reduce((sum, s) => sum + s.fluencyScore, 0) / scores.length
      : 0;

    const avgRelevanceScore = scores.length > 0
      ? scores.reduce((sum, s) => sum + s.relevanceScore, 0) / scores.length
      : 0;

    return {
      attemptId,
      sessionId: session.id,
      totalQuestions: session.totalQuestions,
      answeredQuestions: session.responses.length,
      status: session.status,
      averageScores: {
        content: Math.round(avgContentScore * 10) / 10,
        fluency: Math.round(avgFluencyScore * 10) / 10,
        relevance: Math.round(avgRelevanceScore * 10) / 10,
      },
      overallScore: session.feedback?.overallScore
        ? Number(session.feedback.overallScore)
        : null,
      hasFeedback: !!session.feedback,
      duration: {
        startedAt: session.createdAt,
        completedAt: session.completedAt,
      },
    };
  }

  // ============= Private Helper Methods =============

  /**
   * Validate mock drive attempt
   */
  private async validateAttempt(userId: string, attemptId: string) {
    const attempt = await this.prisma.mockDriveAttempt.findUnique({
      where: { id: attemptId },
      include: {
        mockDrive: {
          include: {
            institution: true,
          },
        },
        aiInterviewSession: {
          include: {
            responses: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Mock drive attempt not found');
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('This attempt does not belong to you');
    }

    if (attempt.status === MockDriveAttemptStatus.COMPLETED) {
      throw new BadRequestException('Attempt already completed');
    }

    if (attempt.status === MockDriveAttemptStatus.ABANDONED) {
      throw new BadRequestException('Attempt was abandoned');
    }

    return attempt;
  }

  /**
   * Validate resume ownership
   */
  private async validateResume(userId: string, resumeId: number) {
    const resume = await this.prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId,
      },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found or does not belong to you');
    }

    return resume;
  }
}