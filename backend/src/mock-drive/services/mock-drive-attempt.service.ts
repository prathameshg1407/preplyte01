import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MockDriveAttemptStatus,
  MockDriveStatus,
  MockDriveRegistrationStatus,
  Role,
  Prisma,
} from '@prisma/client';
import { CompleteAttemptDto } from '../dto/complete-attempt.dto';
import { QueryAttemptsDto } from '../dto/query-attempts.dto';

// Add these exports at the top of the file, after the imports
export enum TestComponent {
  APTITUDE = 'APTITUDE',
  MACHINE_TEST = 'MACHINE_TEST',
  AI_INTERVIEW = 'AI_INTERVIEW',
  COMPLETED = 'COMPLETED',
}

export interface ComponentStatus {
  currentComponent: TestComponent;
  nextComponent: TestComponent | null;
  canProceed: boolean;
  message: string;
}

@Injectable()
export class MockDriveAttemptService {
  private readonly logger = new Logger(MockDriveAttemptService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Start a mock drive attempt - automatically starts first component
   */
  async startAttempt(userId: string, mockDriveId: string) {
    this.logger.log(`Starting attempt for user ${userId}, mock drive ${mockDriveId}`);

    // 1. Get user and mock drive
    const [user, mockDrive] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.mockDrive.findUnique({
        where: { id: mockDriveId },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!mockDrive) {
      throw new NotFoundException('Mock drive not found');
    }

    // 2. Validate mock drive status
    this.validateMockDriveStatus(mockDrive);

    // 3. Validate time windows
    this.validateTimeWindow(mockDrive);

    // 4. Validate registration and batch
    const registration = await this.validateRegistrationAndBatch(
      userId,
      mockDriveId,
    );

    // 5. Check for existing attempt
    const existingAttempt = await this.checkExistingAttempt(userId, mockDriveId);
    if (existingAttempt) {
      // Get current component status
      const componentStatus = await this.getCurrentComponentStatus(existingAttempt.id);
      
      return {
        message: 'Resuming existing attempt',
        attempt: await this.getAttemptDetails(existingAttempt.id, userId),
        componentStatus,
        autoStart: true,
      };
    }

    // 6. Create new attempt
    const attempt = await this.createAttempt(
      userId,
      mockDriveId,
      registration.batchStudent?.batchId,
    );

    // 7. Get first component
    const componentStatus = await this.getCurrentComponentStatus(attempt.id);

    this.logger.log(`Attempt created successfully: ${attempt.id}`);
    this.logger.log(`First component: ${componentStatus.currentComponent}`);

    return {
      message: 'Mock drive started successfully',
      attempt: await this.getAttemptDetails(attempt.id, userId),
      componentStatus,
      autoStart: true,
    };
  }

  /**
   * Get current component status - determines which test should be shown
   */
  async getCurrentComponentStatus(attemptId: string): Promise<ComponentStatus> {
    const attempt = await this.prisma.mockDriveAttempt.findUnique({
      where: { id: attemptId },
      include: {
        mockDrive: true,
        aptitudeResponse: true,
        aiInterviewSession: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.status === MockDriveAttemptStatus.COMPLETED) {
      return {
        currentComponent: TestComponent.COMPLETED,
        nextComponent: null,
        canProceed: false,
        message: 'Mock drive completed. View your results.',
      };
    }

    if (attempt.status === MockDriveAttemptStatus.ABANDONED) {
      throw new BadRequestException('This attempt was abandoned');
    }

    // Check components in order
    const config = await this.getMockDriveConfig(attempt.mockDriveId);

    // 1. Check Aptitude Test
    if (config.hasAptitude && !attempt.aptitudeResponseId) {
      return {
        currentComponent: TestComponent.APTITUDE,
        nextComponent: config.hasMachineTest
          ? TestComponent.MACHINE_TEST
          : config.hasAiInterview
          ? TestComponent.AI_INTERVIEW
          : TestComponent.COMPLETED,
        canProceed: false,
        message: 'Complete the aptitude test to proceed',
      };
    }

    // 2. Check Machine Test
    if (config.hasMachineTest) {
      const submissions = await this.prisma.mockDriveProblemSubmission.count({
        where: { attemptId: attempt.id },
      });

      // Check if user has attempted all problems
      const allProblems = await this.prisma.mockDriveGeneratedProblem.count({
        where: { mockDriveId: attempt.mockDriveId },
      });

      if (submissions === 0) {
        return {
          currentComponent: TestComponent.MACHINE_TEST,
          nextComponent: config.hasAiInterview
            ? TestComponent.AI_INTERVIEW
            : TestComponent.COMPLETED,
          canProceed: false,
          message: 'Complete the coding test to proceed',
        };
      }
    }

    // 3. Check AI Interview
    if (config.hasAiInterview) {
      if (!attempt.aiInterviewSessionId) {
        return {
          currentComponent: TestComponent.AI_INTERVIEW,
          nextComponent: TestComponent.COMPLETED,
          canProceed: false,
          message: 'Complete the AI interview to finish',
        };
      }

      if (attempt.aiInterviewSession?.status !== 'COMPLETED') {
        return {
          currentComponent: TestComponent.AI_INTERVIEW,
          nextComponent: TestComponent.COMPLETED,
          canProceed: false,
          message: 'Complete the AI interview to finish',
        };
      }
    }

    // All components completed - auto-complete attempt
    return {
      currentComponent: TestComponent.COMPLETED,
      nextComponent: null,
      canProceed: true,
      message: 'All tests completed. Generating final results...',
    };
  }

  /**
   * Move to next component after completing current one
   */
  async moveToNextComponent(attemptId: string, userId: string) {
    this.logger.log(`Moving to next component for attempt ${attemptId}`);

    const attempt = await this.prisma.mockDriveAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('Unauthorized');
    }

    if (attempt.status === MockDriveAttemptStatus.COMPLETED) {
      throw new BadRequestException('Attempt already completed');
    }

    // Get current status
    const componentStatus = await this.getCurrentComponentStatus(attemptId);

    // If all components completed, auto-complete the attempt
    if (componentStatus.currentComponent === TestComponent.COMPLETED) {
      return this.autoCompleteAttempt(attemptId, userId);
    }

    return {
      message: `Proceed to ${componentStatus.currentComponent}`,
      componentStatus,
    };
  }

  /**
   * Auto-complete attempt when all components are done
   */
  async autoCompleteAttempt(attemptId: string, userId: string) {
    this.logger.log(`Auto-completing attempt ${attemptId}`);

    const attempt = await this.prisma.mockDriveAttempt.findUnique({
      where: { id: attemptId },
      include: {
        mockDrive: true,
        aptitudeResponse: true,
        aiInterviewSession: {
          include: {
            responses: true,
            feedback: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('Unauthorized');
    }

    if (attempt.status === MockDriveAttemptStatus.COMPLETED) {
      // Already completed, just return the result
      const result = await this.prisma.mockDriveResult.findUnique({
        where: { attemptId },
        include: {
          ranking: true,
        },
      });

      return {
        message: 'Attempt already completed',
        attempt,
        result,
      };
    }

    // Update attempt status
    const updatedAttempt = await this.prisma.mockDriveAttempt.update({
      where: { id: attemptId },
      data: {
        status: MockDriveAttemptStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    // Calculate and create result
    const result = await this.calculateAndCreateResult(attempt);

    this.logger.log(`Attempt ${attemptId} auto-completed successfully`);

    return {
      message: 'Mock drive completed successfully!',
      attempt: updatedAttempt,
      result,
      componentStatus: {
        currentComponent: TestComponent.COMPLETED,
        nextComponent: null,
        canProceed: false,
        message: 'View your results and feedback',
      },
    };
  }

  /**
   * Get mock drive configuration
   */
  private async getMockDriveConfig(mockDriveId: string) {
    const [aptitudeQuestions, codingProblems, mockDrive] = await Promise.all([
      this.prisma.mockDriveAptitudeQuestion.count({
        where: { mockDriveId },
      }),
      this.prisma.mockDriveGeneratedProblem.count({
        where: { mockDriveId },
      }),
      this.prisma.mockDrive.findUnique({
        where: { id: mockDriveId },
        select: { aiInterviewConfig: true },
      }),
    ]);

    return {
      hasAptitude: aptitudeQuestions > 0,
      hasMachineTest: codingProblems > 0,
      hasAiInterview: !!mockDrive?.aiInterviewConfig,
    };
  }

  /**
   * Get current active attempt for a mock drive
   */
  async getCurrentAttempt(userId: string, mockDriveId: string) {
    this.logger.log(`Getting current attempt for user ${userId}, mock drive ${mockDriveId}`);

    const attempt = await this.prisma.mockDriveAttempt.findUnique({
      where: {
        mockDriveId_userId: {
          mockDriveId,
          userId,
        },
      },
      include: {
        mockDrive: true,
        aptitudeResponse: true,
        aiInterviewSession: {
          include: {
            responses: {
              orderBy: {
                timestamp: 'desc',
              },
            },
            feedback: true,
          },
        },
        result: {
          include: {
            ranking: true,
          },
        },
      },
    });

    if (!attempt) {
      return null;
    }

    // Get component status
    const componentStatus = await this.getCurrentComponentStatus(attempt.id);

    return {
      ...attempt,
      componentStatus,
    };
  }

  /**
   * Get attempt details by ID
   */
  async getAttemptDetails(attemptId: string, userId: string) {
    this.logger.log(`Getting attempt details: ${attemptId}`);

    const attempt = await this.prisma.mockDriveAttempt.findUnique({
      where: { id: attemptId },
      include: {
        mockDrive: {
          include: {
            institution: true,
          },
        },
        user: {
          include: {
            profile: true,
          },
        },
        aptitudeResponse: true,
        aiInterviewSession: {
          include: {
            responses: true,
            feedback: true,
          },
        },
        result: {
          include: {
            ranking: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    // Check ownership for students
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.role === Role.STUDENT && attempt.userId !== userId) {
      throw new ForbiddenException('You can only view your own attempts');
    }

    // Check institution for institution admins
    if (
      user?.role === Role.INSTITUTION_ADMIN &&
      attempt.mockDrive.institutionId !== user.institutionId
    ) {
      throw new ForbiddenException(
        'You can only view attempts from your institution',
      );
    }

    // Get component status
    const componentStatus = await this.getCurrentComponentStatus(attemptId);

    return {
      ...attempt,
      componentStatus,
    };
  }

  /**
   * Get all attempts for current user
   */
  async getMyAttempts(userId: string) {
    this.logger.log(`Getting all attempts for user ${userId}`);

    const attempts = await this.prisma.mockDriveAttempt.findMany({
      where: {
        userId,
      },
      include: {
        mockDrive: {
          select: {
            id: true,
            title: true,
            driveStartDate: true,
            driveEndDate: true,
            duration: true,
          },
        },
        result: {
          select: {
            id: true,
            totalScore: true,
            totalMaxScore: true,
            percentage: true,
            ranking: {
              select: {
                rank: true,
                percentile: true,
              },
            },
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return attempts;
  }

  /**
   * Complete mock drive attempt (deprecated - use auto-complete)
   */
  async completeAttempt(
    attemptId: string,
    userId: string,
    dto: CompleteAttemptDto,
  ) {
    this.logger.log(`Manual completion requested for attempt ${attemptId}`);

    // Check if all components are completed
    const componentStatus = await this.getCurrentComponentStatus(attemptId);

    if (componentStatus.currentComponent !== TestComponent.COMPLETED) {
      throw new BadRequestException(
        `Cannot complete yet. ${componentStatus.message}`,
      );
    }

    // Auto-complete the attempt
    return this.autoCompleteAttempt(attemptId, userId);
  }

  /**
   * Abandon attempt (timeout or manual abandon)
   */
  async abandonAttempt(attemptId: string, userId: string) {
    this.logger.log(`Abandoning attempt ${attemptId}`);

    const attempt = await this.prisma.mockDriveAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('Unauthorized');
    }

    if (attempt.status === MockDriveAttemptStatus.COMPLETED) {
      throw new BadRequestException('Cannot abandon completed attempt');
    }

    const updated = await this.prisma.mockDriveAttempt.update({
      where: { id: attemptId },
      data: {
        status: MockDriveAttemptStatus.ABANDONED,
        completedAt: new Date(),
      },
    });

    this.logger.log(`Attempt ${attemptId} abandoned`);

    return {
      message: 'Attempt abandoned successfully',
      attempt: updated,
    };
  }

  /**
   * Link aptitude response to attempt (deprecated - handled by aptitude service)
   */
  async linkAptitudeResponse(
    attemptId: string,
    userId: string,
    aptitudeResponseId: number,
  ) {
    this.logger.log(`Linking aptitude response ${aptitudeResponseId} to attempt ${attemptId}`);

    const attempt = await this.prisma.mockDriveAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('Unauthorized');
    }

    if (attempt.status === MockDriveAttemptStatus.COMPLETED) {
      throw new BadRequestException('Cannot modify completed attempt');
    }

    // Verify aptitude response belongs to user
    const response = await this.prisma.aptitudeResponse.findUnique({
      where: { id: aptitudeResponseId },
    });

    if (!response || response.userId !== userId) {
      throw new ForbiddenException('Aptitude response does not belong to you');
    }

    const updated = await this.prisma.mockDriveAttempt.update({
      where: { id: attemptId },
      data: {
        aptitudeResponseId,
      },
    });

    this.logger.log(`Aptitude response linked successfully`);

    // Check if we should move to next component
    const componentStatus = await this.getCurrentComponentStatus(attemptId);

    return {
      message: 'Aptitude response linked successfully',
      attempt: updated,
      componentStatus,
    };
  }

  /**
   * Link machine test to attempt (deprecated - not needed with new flow)
   */
  async linkMachineTest(
    attemptId: string,
    userId: string,
    machineTestId: number,
  ) {
    this.logger.log(`Linking machine test ${machineTestId} to attempt ${attemptId}`);

    const attempt = await this.prisma.mockDriveAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('Unauthorized');
    }

    if (attempt.status === MockDriveAttemptStatus.COMPLETED) {
      throw new BadRequestException('Cannot modify completed attempt');
    }

    const updated = await this.prisma.mockDriveAttempt.update({
      where: { id: attemptId },
      data: {
        machineTestId,
      },
    });

    this.logger.log(`Machine test linked successfully`);

    return {
      message: 'Machine test linked successfully',
      attempt: updated,
    };
  }

  /**
   * Get attempt progress
   */
  async getAttemptProgress(attemptId: string, userId: string) {
    this.logger.log(`Getting progress for attempt ${attemptId}`);

    const attempt = await this.prisma.mockDriveAttempt.findUnique({
      where: { id: attemptId },
      include: {
        mockDrive: true,
        aptitudeResponse: true,
        aiInterviewSession: {
          include: {
            responses: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('Unauthorized');
    }

    const startTime = new Date(attempt.startedAt);
    const totalDuration = attempt.mockDrive.duration * 60 * 1000; // milliseconds
    const elapsed = Date.now() - startTime.getTime();
    const remaining = Math.max(0, totalDuration - elapsed);

    const config = await this.getMockDriveConfig(attempt.mockDriveId);
    const componentStatus = await this.getCurrentComponentStatus(attemptId);

    // Get coding submissions count
    const codingSubmissions = await this.prisma.mockDriveProblemSubmission.count({
      where: { attemptId },
    });

    const totalCodingProblems = await this.prisma.mockDriveGeneratedProblem.count({
      where: { mockDriveId: attempt.mockDriveId },
    });

    return {
      attemptId: attempt.id,
      status: attempt.status,
      currentComponent: componentStatus.currentComponent,
      nextComponent: componentStatus.nextComponent,
      progress: {
        aptitude: {
          required: config.hasAptitude,
          completed: !!attempt.aptitudeResponseId,
          score: attempt.aptitudeResponse
            ? {
                score: attempt.aptitudeResponse.score,
                total: attempt.aptitudeResponse.total,
                percentage: Number(attempt.aptitudeResponse.percentage),
              }
            : null,
        },
        machineTest: {
          required: config.hasMachineTest,
          completed: codingSubmissions > 0,
          problemsCount: totalCodingProblems,
          submissionsCount: codingSubmissions,
        },
        aiInterview: {
          required: config.hasAiInterview,
          completed: attempt.aiInterviewSession?.status === 'COMPLETED',
          questionsAnswered: attempt.aiInterviewSession?.responses?.length || 0,
          totalQuestions: (attempt.mockDrive.aiInterviewConfig as any)?.totalQuestions || 10,
          currentQuestionIndex: attempt.aiInterviewSession?.currentQuestionIndex || 0,
        },
      },
      timing: {
        startedAt: attempt.startedAt,
        durationMinutes: attempt.mockDrive.duration,
        elapsedMinutes: Math.floor(elapsed / 60000),
        remainingMinutes: Math.floor(remaining / 60000),
        expiresAt: new Date(startTime.getTime() + totalDuration),
        isExpired: remaining <= 0,
      },
      message: componentStatus.message,
    };
  }

  /**
   * Admin: Get all attempts for a mock drive (paginated)
   */
  async getAttemptsForAdmin(
    userId: string,
    mockDriveId: string,
    query: QueryAttemptsDto,
  ) {
    this.logger.log(`Getting attempts for mock drive ${mockDriveId} (admin)`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const mockDrive = await this.prisma.mockDrive.findUnique({
      where: { id: mockDriveId },
    });

    if (!mockDrive) {
      throw new NotFoundException('Mock drive not found');
    }

    // Check permissions
    if (
      user.role === Role.INSTITUTION_ADMIN &&
      mockDrive.institutionId !== user.institutionId
    ) {
      throw new ForbiddenException(
        'You can only view attempts from your institution',
      );
    }

    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { mockDriveId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { user: { email: { contains: search, mode: 'insensitive' } } },
        {
          user: {
            profile: { fullName: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    const [attempts, total] = await Promise.all([
      this.prisma.mockDriveAttempt.findMany({
        where,
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          result: {
            include: {
              ranking: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          startedAt: 'desc',
        },
      }),
      this.prisma.mockDriveAttempt.count({ where }),
    ]);

    return {
      data: attempts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Expire old attempts (called by cron job)
   */
  async expireOldAttempts() {
    this.logger.log('Checking for expired attempts...');

    const expiredAttempts = await this.prisma.mockDriveAttempt.findMany({
      where: {
        status: MockDriveAttemptStatus.IN_PROGRESS,
      },
      include: {
        mockDrive: true,
      },
    });

    let expiredCount = 0;

    for (const attempt of expiredAttempts) {
      const startTime = new Date(attempt.startedAt);
      const expiryTime = new Date(
        startTime.getTime() + attempt.mockDrive.duration * 60 * 1000,
      );

      if (new Date() > expiryTime) {
        await this.prisma.mockDriveAttempt.update({
          where: { id: attempt.id },
          data: {
            status: MockDriveAttemptStatus.ABANDONED,
            completedAt: new Date(),
          },
        });
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.logger.log(`Expired ${expiredCount} attempts`);
    }

    return {
      message: `Expired ${expiredCount} attempts`,
      expiredCount,
    };
  }

  // ============= Private Helper Methods =============

  /**
   * Validate mock drive status
   */
  private validateMockDriveStatus(mockDrive: any) {
    if (!mockDrive.isPublished) {
      throw new BadRequestException('Mock drive is not published');
    }

    if (mockDrive.status !== MockDriveStatus.ONGOING) {
      throw new BadRequestException('Mock drive is not currently active');
    }
  }

  /**
   * Validate time windows
   */
  private validateTimeWindow(mockDrive: any) {
    const now = new Date();

    if (now < mockDrive.driveStartDate) {
      throw new BadRequestException(
        `Mock drive starts at ${mockDrive.driveStartDate}`,
      );
    }

    if (now > mockDrive.driveEndDate) {
      throw new BadRequestException('Mock drive has ended');
    }
  }

  /**
   * Validate registration and batch
   */
  private async validateRegistrationAndBatch(userId: string, mockDriveId: string) {
    const registration = await this.prisma.mockDriveRegistration.findUnique({
      where: {
        mockDriveId_userId: {
          mockDriveId,
          userId,
        },
      },
      include: {
        batchStudent: {
          include: {
            batch: true,
          },
        },
      },
    });

    if (!registration) {
      throw new BadRequestException('You are not registered for this mock drive');
    }

    if (registration.status === MockDriveRegistrationStatus.CANCELLED) {
      throw new BadRequestException('Your registration was cancelled');
    }

    if (registration.status === MockDriveRegistrationStatus.DISQUALIFIED) {
      throw new BadRequestException('You are disqualified from this mock drive');
    }

    // Check batch assignment
    if (!registration.batchStudent) {
      throw new BadRequestException('You have not been assigned to a batch yet');
    }

    const batch = registration.batchStudent.batch;

    if (!batch.isActive) {
      throw new BadRequestException('Your batch is currently inactive');
    }

    // Validate batch timing
    const now = new Date();

    if (now < batch.startTime) {
      throw new BadRequestException(`Your batch starts at ${batch.startTime}`);
    }

    if (now > batch.endTime) {
      throw new BadRequestException('Your batch time has ended');
    }

    return registration;
  }

  /**
   * Check for existing attempt
   */
  private async checkExistingAttempt(userId: string, mockDriveId: string) {
    const existingAttempt = await this.prisma.mockDriveAttempt.findUnique({
      where: {
        mockDriveId_userId: {
          mockDriveId,
          userId,
        },
      },
    });

    if (existingAttempt) {
      if (existingAttempt.status === MockDriveAttemptStatus.COMPLETED) {
        throw new BadRequestException('You have already completed this mock drive');
      }

      // Return existing in-progress attempt
      return existingAttempt;
    }

    return null;
  }

  /**
   * Create new attempt
   */
  private async createAttempt(
    userId: string,
    mockDriveId: string,
    batchId?: string,
  ) {
    return this.prisma.mockDriveAttempt.create({
      data: {
        mockDriveId,
        userId,
        batchId,
        status: MockDriveAttemptStatus.IN_PROGRESS,
      },
    });
  }

  /**
   * Calculate scores and create result
   */
  async calculateAndCreateResult(attempt: any) {
    this.logger.log(`Calculating result for attempt ${attempt.id}`);

    let aptitudeScore = 0;
    let aptitudeMaxScore = 0;
    let machineTestScore = 0;
    let machineTestMaxScore = 0;
    let aiInterviewScore = 0;
    let aiInterviewMaxScore = 0;

    const strengths: string[] = [];
    const areasForImprovement: string[] = [];

    // ============= Calculate Aptitude Score =============
    if (attempt.aptitudeResponse) {
      aptitudeScore = attempt.aptitudeResponse.score;
      aptitudeMaxScore = attempt.aptitudeResponse.total;

      const percentage = Number(attempt.aptitudeResponse.percentage);

      if (percentage >= 70) {
        strengths.push('Strong aptitude and reasoning skills');
      } else if (percentage < 50) {
        areasForImprovement.push('Need to improve aptitude fundamentals');
      }
    }

    // ============= Calculate Machine Test Score =============
    const codingSubmissions = await this.prisma.mockDriveProblemSubmission.findMany({
      where: { attemptId: attempt.id },
    });

    if (codingSubmissions.length > 0) {
      const problemScores = new Map<string, number>();

      // Get best score for each problem
      codingSubmissions.forEach((submission: any) => {
        const problemId = submission.generatedProblemId;
        const currentBest = problemScores.get(problemId) || 0;

        const results = submission.testCaseResults as any[];
        if (results && Array.isArray(results)) {
          const passed = results.filter(r => r.status.description === 'Accepted').length;
          const total = results.length;
          const score = (passed / total) * 100;

          problemScores.set(problemId, Math.max(currentBest, score));
        }
      });

      // Calculate total score
      const mockDriveProblems = await this.prisma.mockDriveGeneratedProblem.findMany({
        where: { mockDriveId: attempt.mockDriveId },
      });

      mockDriveProblems.forEach((p) => {
        const score = problemScores.get(p.id) || 0;
        machineTestScore += (score / 100) * p.points;
        machineTestMaxScore += p.points;
      });

      const percentage =
        machineTestMaxScore > 0
          ? (machineTestScore / machineTestMaxScore) * 100
          : 0;

      if (percentage >= 70) {
        strengths.push('Excellent coding and problem-solving skills');
      } else if (percentage < 50) {
        areasForImprovement.push('Practice more coding problems');
      }
    }

    // ============= Calculate AI Interview Score =============
    if (attempt.aiInterviewSession?.feedback) {
      aiInterviewScore = Number(attempt.aiInterviewSession.feedback.overallScore);
      aiInterviewMaxScore = 100;

      if (aiInterviewScore >= 70) {
        strengths.push('Strong communication and interview skills');
      } else if (aiInterviewScore < 50) {
        areasForImprovement.push('Work on interview communication skills');
      }

      // Add specific strengths and improvements from AI feedback
      if (attempt.aiInterviewSession.feedback.keyStrengths) {
        strengths.push(...attempt.aiInterviewSession.feedback.keyStrengths);
      }
      if (attempt.aiInterviewSession.feedback.areasForImprovement) {
        areasForImprovement.push(
          ...attempt.aiInterviewSession.feedback.areasForImprovement,
        );
      }
    }

    // ============= Calculate Total Score =============
    const totalScore = aptitudeScore + machineTestScore + aiInterviewScore;
    const totalMaxScore =
      aptitudeMaxScore + machineTestMaxScore + aiInterviewMaxScore;
    const percentage =
      totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

    // Add overall performance feedback
    if (percentage >= 80) {
      strengths.push('Outstanding overall performance');
    } else if (percentage >= 60) {
      strengths.push('Good overall performance');
    } else if (percentage < 40) {
      areasForImprovement.push('Focus on consistent improvement across all areas');
    }

    // ============= Create Result =============
    const result = await this.prisma.mockDriveResult.create({
      data: {
        attemptId: attempt.id,
        mockDriveId: attempt.mockDriveId,
        userId: attempt.userId,
        aptitudeScore: new Prisma.Decimal(aptitudeScore),
        aptitudeMaxScore: new Prisma.Decimal(aptitudeMaxScore),
        machineTestScore: new Prisma.Decimal(machineTestScore),
        machineTestMaxScore: new Prisma.Decimal(machineTestMaxScore),
        aiInterviewScore: new Prisma.Decimal(aiInterviewScore),
        aiInterviewMaxScore: new Prisma.Decimal(aiInterviewMaxScore),
        totalScore: new Prisma.Decimal(totalScore),
        totalMaxScore: new Prisma.Decimal(totalMaxScore),
        percentage: new Prisma.Decimal(percentage),
        strengths,
        areasForImprovement,
        detailedReport: {
          aptitude: {
            score: aptitudeScore,
            maxScore: aptitudeMaxScore,
            percentage: aptitudeMaxScore > 0 ? (aptitudeScore / aptitudeMaxScore) * 100 : 0,
          },
          machineTest: {
            score: machineTestScore,
            maxScore: machineTestMaxScore,
            percentage: machineTestMaxScore > 0 ? (machineTestScore / machineTestMaxScore) * 100 : 0,
            submissionsCount: codingSubmissions.length,
          },
          aiInterview: {
            score: aiInterviewScore,
            maxScore: aiInterviewMaxScore,
            percentage: aiInterviewMaxScore > 0 ? (aiInterviewScore / aiInterviewMaxScore) * 100 : 0,
            feedback: attempt.aiInterviewSession?.feedback || null,
          },
        },
      },
    });

    this.logger.log(`Result created for attempt ${attempt.id}: ${percentage.toFixed(2)}%`);

    return result;
  }
}