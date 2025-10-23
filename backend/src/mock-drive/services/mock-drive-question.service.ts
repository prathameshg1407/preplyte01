import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiQuestionGeneratorService } from './ai-question-generator.service';
import { QuestionDifficulty, Role, Prisma } from '@prisma/client';
import { AptitudeTestConfigDto } from '../dto/aptitude-config.dto';
import { MachineTestConfigDto } from '../dto/machine-test-config.dto';

@Injectable()
export class MockDriveQuestionService {
  private readonly logger = new Logger(MockDriveQuestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiGenerator: AiQuestionGeneratorService,
  ) {}

  /**
   * Generate all questions (aptitude + coding) for a mock drive using AI
   * AI Interview questions are NOT pre-generated - they are created on-demand during the interview
   */
  async generateQuestionsForMockDrive(mockDriveId: string, userId: string) {
    this.logger.log(`Generating AI questions for mock drive: ${mockDriveId}`);

    // Get user and mock drive
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

    // Check permissions
    if (
      user.role === Role.INSTITUTION_ADMIN &&
      mockDrive.institutionId !== user.institutionId
    ) {
      throw new BadRequestException('You can only generate questions for your institution');
    }

    // Check if mock drive is still in DRAFT
    if (mockDrive.status !== 'DRAFT') {
      throw new BadRequestException('Can only generate questions for DRAFT mock drives');
    }

    const results = {
      aptitudeQuestions: null as any,
      machineTestProblems: null as any,
      totalGenerated: 0,
      message: '',
    };

    // Parse configs from eligibilityCriteria
    const criteria = mockDrive.eligibilityCriteria as any;
    const aptitudeConfig = criteria?.aptitudeConfig;
    const machineTestConfig = criteria?.machineTestConfig;

    // Generate aptitude questions if configured
    if (aptitudeConfig) {
      // Check if questions already exist
      const existingQuestions = await this.prisma.mockDriveAptitudeQuestion.count({
        where: { mockDriveId },
      });

      if (existingQuestions > 0) {
        this.logger.warn('Aptitude questions already exist for this mock drive');
        results.aptitudeQuestions = {
          status: 'ALREADY_EXISTS',
          questionsCount: existingQuestions,
        };
      } else {
        try {
          results.aptitudeQuestions = await this.generateAptitudeQuestions(
            mockDriveId,
            aptitudeConfig,
          );
          results.totalGenerated += results.aptitudeQuestions.questionsCount;
        } catch (error) {
          this.logger.error('Failed to generate aptitude questions:', error);
          throw new BadRequestException(`Aptitude generation failed: ${error.message}`);
        }
      }
    } else {
      results.message += 'No aptitude test configured. ';
    }

    // Generate machine test problems if configured
    if (machineTestConfig) {
      const existingProblems = await this.prisma.mockDriveGeneratedProblem.count({
        where: { mockDriveId },
      });

      if (existingProblems > 0) {
        this.logger.warn('Coding problems already exist for this mock drive');
        results.machineTestProblems = {
          status: 'ALREADY_EXISTS',
          problemsCount: existingProblems,
        };
      } else {
        try {
          // Check if using selected problems or generating new ones
          if (machineTestConfig.selectedProblems && machineTestConfig.selectedProblems.length > 0) {
            results.machineTestProblems = await this.linkSelectedProblems(
              mockDriveId,
              machineTestConfig.selectedProblems,
            );
          } else if (machineTestConfig.problemDistribution && machineTestConfig.problemDistribution.length > 0) {
            results.machineTestProblems = await this.generateCodingProblems(
              mockDriveId,
              mockDrive.institutionId,
              machineTestConfig,
            );
          }
          results.totalGenerated += results.machineTestProblems.problemsCount;
        } catch (error) {
          this.logger.error('Failed to generate coding problems:', error);
          throw new BadRequestException(`Machine test generation failed: ${error.message}`);
        }
      }
    } else {
      results.message += 'No machine test configured. ';
    }

    // Note about AI Interview
    results.message += 'AI Interview questions will be generated on-demand during the interview session.';

    return {
      message: results.message || 'Questions generated successfully',
      results,
      note: 'AI Interview questions are NOT pre-generated. They are created dynamically based on student resume and responses during the interview.',
    };
  }

  /**
   * Generate aptitude questions using AI and store in MockDriveAptitudeQuestion table
   */
  private async generateAptitudeQuestions(
    mockDriveId: string,
    config: AptitudeTestConfigDto,
  ) {
    this.logger.log('Generating aptitude questions with AI...');

    // Generate questions using AI
    const generatedQuestions = await this.aiGenerator.generateAptitudeQuestions(config);

    // Store in MockDriveAptitudeQuestion table (temporary storage for this mock drive)
    const tempQuestions = await this.prisma.$transaction(async (tx) => {
      return Promise.all(
        generatedQuestions.map((q) =>
          tx.mockDriveAptitudeQuestion.create({
            data: {
              mockDriveId,
              question: q.question,
              options: q.options as Prisma.InputJsonValue,
              correctAnswer: q.correctAnswer,
              difficulty: q.difficulty,
              topic: q.topic,
              explanation: q.explanation,
              attemptCount: 0,
              correctCount: 0,
              successRate: new Prisma.Decimal(0),
              isMigrated: false,
            },
          })
        )
      );
    });

    this.logger.log(`Created ${tempQuestions.length} aptitude questions in temporary table`);

    return {
      status: 'GENERATED',
      questionsCount: tempQuestions.length,
      breakdown: this.getBreakdown(tempQuestions.map(q => ({ difficulty: q.difficulty }))),
    };
  }

  /**
   * Generate coding problems using AI and store in MockDriveGeneratedProblem table
   */
  private async generateCodingProblems(
    mockDriveId: string,
    institutionId: number,
    config: MachineTestConfigDto,
  ) {
    this.logger.log('Generating coding problems with AI...');

    // Generate problems using AI
    const generatedProblems = await this.aiGenerator.generateCodingProblems(config);

    // Store in MockDriveGeneratedProblem table (temporary storage for this mock drive)
    const createdProblems = await this.prisma.$transaction(async (tx) => {
      return Promise.all(
        generatedProblems.map((genP, index) => {
          // Get points from distribution or use default
          const points = this.getPointsForProblem(config, genP.difficulty, index);

          return tx.mockDriveGeneratedProblem.create({
            data: {
              mockDriveId,
              title: genP.title,
              description: genP.description as Prisma.InputJsonValue,
              difficulty: genP.difficulty,
              topic: genP.topic,
              hints: genP.hints || [],
              testCases: genP.testCases as Prisma.InputJsonValue,
              orderIndex: index,
              points,
              totalAttempts: 0,
              solvedCount: 0,
              partialSolveCount: 0,
              failedCount: 0,
              isTestCaseValidated: false,
              isMigrated: false,
            },
          });
        })
      );
    });

    this.logger.log(`Created ${createdProblems.length} coding problems in temporary table`);

    return {
      status: 'GENERATED',
      problemsCount: createdProblems.length,
      breakdown: this.getBreakdown(createdProblems.map(p => ({ difficulty: p.difficulty }))),
      totalPoints: createdProblems.reduce((sum, p) => sum + p.points, 0),
    };
  }

  /**
   * Link selected problems from existing problem bank to mock drive
   */
  private async linkSelectedProblems(
    mockDriveId: string,
    selectedProblems: Array<{ problemId: number; points: number; orderIndex?: number }>,
  ) {
    const linkedProblems: Array<{
      problemId: number;
      title: string;
      difficulty: QuestionDifficulty;
      points: number;
    }> = [];

    for (const [index, selected] of selectedProblems.entries()) {
      // Verify problem exists
      const problem = await this.prisma.machineTestProblem.findUnique({
        where: { id: selected.problemId },
      });

      if (!problem) {
        throw new NotFoundException(`Problem ${selected.problemId} not found`);
      }

      // Link to mock drive using the join table
      await this.prisma.mockDriveMachineProblem.create({
        data: {
          mockDriveId,
          problemId: selected.problemId,
          orderIndex: selected.orderIndex ?? index,
          points: selected.points,
        },
      });

      linkedProblems.push({
        problemId: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        points: selected.points,
      });
    }

    this.logger.log(`Linked ${linkedProblems.length} selected problems from problem bank`);

    return {
      status: 'LINKED',
      problemsCount: linkedProblems.length,
      breakdown: this.getBreakdown(linkedProblems),
      totalPoints: linkedProblems.reduce((sum, p) => sum + p.points, 0),
      note: 'Using existing problems from problem bank',
    };
  }

  /**
   * Get points for a problem based on config
   */
  private getPointsForProblem(
    config: MachineTestConfigDto,
    difficulty: QuestionDifficulty,
    index: number,
  ): number {
    // If problem distribution exists, find matching difficulty
    if (config.problemDistribution) {
      const dist = config.problemDistribution.find(d => d.difficulty === difficulty);
      if (dist) {
        return dist.pointsPerProblem;
      }
    }

    // Default points based on difficulty
    const defaultPoints: Record<QuestionDifficulty, number> = {
      EASY: 100,
      MEDIUM: 200,
      HARD: 300,
    };
    return defaultPoints[difficulty] || 100;
  }

  /**
   * Regenerate questions (if needed before publishing)
   */
  async regenerateQuestions(
    mockDriveId: string,
    userId: string,
    component: 'aptitude' | 'machine' | 'all',
  ) {
    this.logger.log(`Regenerating ${component} questions for mock drive: ${mockDriveId}`);

    const [user, mockDrive] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.mockDrive.findUnique({ where: { id: mockDriveId } }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!mockDrive) {
      throw new NotFoundException('Mock drive not found');
    }

    // Check permissions
    if (
      user.role === Role.INSTITUTION_ADMIN &&
      mockDrive.institutionId !== user.institutionId
    ) {
      throw new BadRequestException('Unauthorized');
    }

    // Check if mock drive has started
    if (mockDrive.status !== 'DRAFT') {
      throw new BadRequestException('Cannot regenerate questions after mock drive is published');
    }

    const criteria = mockDrive.eligibilityCriteria as any;
    const results = {
      aptitudeRegenerated: false,
      machineTestRegenerated: false,
    };

    if (component === 'aptitude' || component === 'all') {
      // Delete existing aptitude questions from temporary table
      await this.prisma.mockDriveAptitudeQuestion.deleteMany({
        where: { mockDriveId },
      });

      // Regenerate
      const aptitudeConfig = criteria?.aptitudeConfig;
      if (aptitudeConfig) {
        await this.generateAptitudeQuestions(mockDriveId, aptitudeConfig);
        results.aptitudeRegenerated = true;
      }
    }

    if (component === 'machine' || component === 'all') {
      // Delete existing generated problems from temporary table
      await this.prisma.mockDriveGeneratedProblem.deleteMany({
        where: { mockDriveId },
      });

      // Also delete links to existing problems (if using selected problems)
      await this.prisma.mockDriveMachineProblem.deleteMany({
        where: { mockDriveId },
      });

      // Regenerate
      const machineConfig = criteria?.machineTestConfig;
      if (machineConfig) {
        if (machineConfig.selectedProblems && machineConfig.selectedProblems.length > 0) {
          await this.linkSelectedProblems(mockDriveId, machineConfig.selectedProblems);
        } else if (machineConfig.problemDistribution && machineConfig.problemDistribution.length > 0) {
          await this.generateCodingProblems(mockDriveId, mockDrive.institutionId, machineConfig);
        }
        results.machineTestRegenerated = true;
      }
    }

    return {
      message: `${component} questions regenerated successfully`,
      results,
      note: 'AI Interview questions are not pre-generated and do not need regeneration',
    };
  }

  /**
   * Get generated questions preview (for admin review before publishing)
   */
  async getQuestionsPreview(mockDriveId: string, userId: string) {
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

    // Check permissions
    if (
      user.role === Role.INSTITUTION_ADMIN &&
      mockDrive.institutionId !== user.institutionId
    ) {
      throw new BadRequestException('Unauthorized');
    }

    // Get aptitude questions from temporary table
    const aptitudeQuestions = await this.prisma.mockDriveAptitudeQuestion.findMany({
      where: { mockDriveId },
      orderBy: { createdAt: 'asc' },
    });

    // Get generated coding problems from temporary table
    const generatedProblems = await this.prisma.mockDriveGeneratedProblem.findMany({
      where: { mockDriveId },
      orderBy: { orderIndex: 'asc' },
    });

    // Get linked problems from problem bank
    const linkedProblems = await this.prisma.mockDriveMachineProblem.findMany({
      where: { mockDriveId },
      include: {
        problem: true,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });

    // Get AI interview config (questions generated on-demand, not stored)
    const aiInterviewConfig = mockDrive.aiInterviewConfig as any;

    return {
      aptitude: {
        totalQuestions: aptitudeQuestions.length,
        hasQuestions: aptitudeQuestions.length > 0,
        breakdown: this.getBreakdown(aptitudeQuestions),
        questions: aptitudeQuestions.map((q) => ({
          id: q.id,
          questionPreview: q.question.substring(0, 100) + '...', // Preview only
          topic: q.topic,
          difficulty: q.difficulty,
          hasExplanation: !!q.explanation,
        })),
        qualityMetrics: {
          totalAttempts: aptitudeQuestions.reduce((sum, q) => sum + q.attemptCount, 0),
          averageSuccessRate: this.calculateAverageSuccessRate(aptitudeQuestions),
        },
      },
      machineTest: {
        generatedProblems: {
          totalProblems: generatedProblems.length,
          hasProblems: generatedProblems.length > 0,
          breakdown: this.getBreakdown(generatedProblems),
          totalPoints: generatedProblems.reduce((sum, p) => sum + p.points, 0),
          problems: generatedProblems.map((p) => ({
            id: p.id,
            title: p.title,
            difficulty: p.difficulty,
            topic: p.topic,
            points: p.points,
            orderIndex: p.orderIndex,
            testCasesCount: Array.isArray(p.testCases) ? (p.testCases as any[]).length : 0,
            hasHints: p.hints && p.hints.length > 0,
            isValidated: p.isTestCaseValidated,
          })),
          qualityMetrics: {
            totalAttempts: generatedProblems.reduce((sum, p) => sum + p.totalAttempts, 0),
            totalSolved: generatedProblems.reduce((sum, p) => sum + p.solvedCount, 0),
          },
        },
        linkedProblems: {
          totalProblems: linkedProblems.length,
          hasProblems: linkedProblems.length > 0,
          breakdown: this.getBreakdown(linkedProblems.map(lp => lp.problem)),
          totalPoints: linkedProblems.reduce((sum, lp) => sum + lp.points, 0),
          problems: linkedProblems.map((lp) => ({
            id: lp.problem.id,
            title: lp.problem.title,
            difficulty: lp.problem.difficulty,
            points: lp.points,
            orderIndex: lp.orderIndex,
            isPublic: lp.problem.isPublic,
            testCasesCount: Array.isArray(lp.problem.testCases) ? (lp.problem.testCases as any[]).length : 0,
          })),
        },
        totalProblems: generatedProblems.length + linkedProblems.length,
        totalPoints: generatedProblems.reduce((sum, p) => sum + p.points, 0) + 
                     linkedProblems.reduce((sum, lp) => sum + lp.points, 0),
      },
      aiInterview: {
        isConfigured: !!aiInterviewConfig,
        config: aiInterviewConfig || null,
        note: 'AI Interview questions are generated dynamically during the interview based on student resume and responses. No pre-generation required.',
      },
      summary: {
        totalAptitudeQuestions: aptitudeQuestions.length,
        totalCodingProblems: generatedProblems.length + linkedProblems.length,
        aiInterviewEnabled: !!aiInterviewConfig,
        readyToPublish: aptitudeQuestions.length > 0 || generatedProblems.length > 0 || linkedProblems.length > 0,
      },
    };
  }

  /**
   * Delete all generated questions for a mock drive (cleanup)
   */
  async deleteGeneratedQuestions(mockDriveId: string, userId: string) {
    this.logger.log(`Deleting generated questions for mock drive: ${mockDriveId}`);

    const [user, mockDrive] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.mockDrive.findUnique({ where: { id: mockDriveId } }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!mockDrive) {
      throw new NotFoundException('Mock drive not found');
    }

    // Check permissions
    if (
      user.role === Role.INSTITUTION_ADMIN &&
      mockDrive.institutionId !== user.institutionId
    ) {
      throw new BadRequestException('Unauthorized');
    }

    // Check if mock drive has started
    if (mockDrive.status !== 'DRAFT') {
      throw new BadRequestException('Cannot delete questions after mock drive is published');
    }

    // Delete aptitude questions
    const aptitudeDeleted = await this.prisma.mockDriveAptitudeQuestion.deleteMany({
      where: { mockDriveId },
    });

    // Delete generated problems
    const problemsDeleted = await this.prisma.mockDriveGeneratedProblem.deleteMany({
      where: { mockDriveId },
    });

    // Delete problem links
    const linksDeleted = await this.prisma.mockDriveMachineProblem.deleteMany({
      where: { mockDriveId },
    });

    return {
      message: 'All generated questions deleted successfully',
      deleted: {
        aptitudeQuestions: aptitudeDeleted.count,
        generatedProblems: problemsDeleted.count,
        problemLinks: linksDeleted.count,
      },
    };
  }

  // ============= Helper Methods =============

  /**
   * Get difficulty breakdown
   */
  private getBreakdown(items: Array<{ difficulty: QuestionDifficulty }>) {
    const breakdown = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0,
    };

    items.forEach(item => {
      breakdown[item.difficulty]++;
    });

    return breakdown;
  }

  /**
   * Calculate average success rate for aptitude questions
   */
  private calculateAverageSuccessRate(questions: any[]): number {
    if (questions.length === 0) return 0;

    const totalSuccessRate = questions.reduce(
      (sum, q) => sum + (q.successRate ? Number(q.successRate) : 0),
      0
    );

    return Math.round((totalSuccessRate / questions.length) * 100) / 100;
  }
}