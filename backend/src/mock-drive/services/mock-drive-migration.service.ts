import { Injectable, Logger, BadRequestException, NotFoundException } from "@nestjs/common";
import { MockDriveStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class MockDriveMigrationService {
  private readonly logger = new Logger(MockDriveMigrationService.name);
  
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Migrate all quality questions (both aptitude and coding) from a completed mock drive
   */
  async migrateAllQualityQuestions(mockDriveId: string) {
    this.logger.log(`Starting migration for mock drive: ${mockDriveId}`);

    const mockDrive = await this.prisma.mockDrive.findUnique({
      where: { id: mockDriveId },
    });

    if (!mockDrive) {
      throw new NotFoundException('Mock drive not found');
    }

    if (mockDrive.status !== MockDriveStatus.COMPLETED) {
      throw new BadRequestException('Mock drive must be completed before migration');
    }

    const aptitudeResults = await this.migrateAptitudeQuestions(mockDriveId);
    const codingResults = await this.migrateCodingProblems(mockDriveId);

    return {
      mockDriveId,
      aptitudeQuestions: aptitudeResults,
      codingProblems: codingResults,
      totalMigrated: aptitudeResults.migrated + codingResults.migrated,
    };
  }

  /**
   * Migrate quality aptitude questions to permanent question bank
   */
  async migrateAptitudeQuestions(mockDriveId: string) {
    this.logger.log(`Migrating aptitude questions for mock drive: ${mockDriveId}`);

    const tempQuestions = await this.prisma.mockDriveAptitudeQuestion.findMany({
      where: { 
        mockDriveId,
        isMigrated: false, // Only migrate unmigrated questions
      },
    });

    const migrationResults = {
      total: tempQuestions.length,
      migrated: 0,
      skipped: 0,
      failed: 0,
      details: [] as any[],
    };

    for (const tempQuestion of tempQuestions) {
      try {
        // Quality checks
        const qualityScore = this.calculateAptitudeQualityScore(tempQuestion);
        
        if (qualityScore < 0.6) { // 60% threshold
          migrationResults.skipped++;
          migrationResults.details.push({
            questionId: tempQuestion.id,
            reason: 'Low quality score',
            score: qualityScore,
          });
          continue;
        }

        // Check minimum attempts
        if (tempQuestion.attemptCount < 10) {
          migrationResults.skipped++;
          migrationResults.details.push({
            questionId: tempQuestion.id,
            reason: 'Insufficient attempts (min 10 required)',
            attempts: tempQuestion.attemptCount,
          });
          continue;
        }

        // Check for duplicates
        const isDuplicate = await this.checkAptitudeDuplicate(tempQuestion);
        if (isDuplicate) {
          migrationResults.skipped++;
          migrationResults.details.push({
            questionId: tempQuestion.id,
            reason: 'Duplicate question exists',
          });
          continue;
        }

        // Migrate to main question bank
        const migratedQuestion = await this.prisma.aptitudeQuestion.create({
          data: {
            sourceQuestionId: Date.now() + Math.floor(Math.random() * 1000),
            question: tempQuestion.question,
            options: tempQuestion.options as Prisma.InputJsonValue,
            correctAnswer: tempQuestion.correctAnswer,
            difficulty: tempQuestion.difficulty,
            tags: {
              connectOrCreate: {
                where: { 
                  name_category: {
                    name: tempQuestion.topic,
                    category: 'APTITUDE_TOPIC',
                  }
                },
                create: {
                  name: tempQuestion.topic,
                  category: 'APTITUDE_TOPIC',
                },
              },
            },
          },
        });

        // Update temp question with migration info
        await this.prisma.mockDriveAptitudeQuestion.update({
          where: { id: tempQuestion.id },
          data: {
            isMigrated: true,
            migratedToId: migratedQuestion.id,
            migrationNotes: `Migrated on ${new Date().toISOString()} with quality score ${qualityScore.toFixed(2)}`,
          },
        });

        migrationResults.migrated++;
        migrationResults.details.push({
          questionId: tempQuestion.id,
          migratedToId: migratedQuestion.id,
          qualityScore,
          status: 'SUCCESS',
        });

      } catch (error) {
        migrationResults.failed++;
        this.logger.error(`Failed to migrate aptitude question ${tempQuestion.id}:`, error);
        migrationResults.details.push({
          questionId: tempQuestion.id,
          reason: 'Migration error',
          error: error.message,
          status: 'FAILED',
        });
      }
    }

    this.logger.log(`Aptitude migration complete: ${migrationResults.migrated} migrated, ${migrationResults.skipped} skipped, ${migrationResults.failed} failed`);

    return migrationResults;
  }

  /**
   * Migrate quality coding problems to permanent problem bank
   */
  async migrateCodingProblems(mockDriveId: string) {
    this.logger.log(`Migrating coding problems for mock drive: ${mockDriveId}`);

    const tempProblems = await this.prisma.mockDriveGeneratedProblem.findMany({
      where: { 
        mockDriveId,
        isMigrated: false,
      },
    });

    const migrationResults = {
      total: tempProblems.length,
      migrated: 0,
      skipped: 0,
      failed: 0,
      details: [] as any[],
    };

    // Get mock drive to get institutionId
    const mockDrive = await this.prisma.mockDrive.findUnique({
      where: { id: mockDriveId },
    });

    if (!mockDrive) {
      throw new NotFoundException('Mock drive not found');
    }

    for (const tempProblem of tempProblems) {
      try {
        // Quality checks
        const qualityScore = this.calculateCodingQualityScore(tempProblem);
        
        if (qualityScore < 0.65) { // 65% threshold for coding problems
          migrationResults.skipped++;
          migrationResults.details.push({
            problemId: tempProblem.id,
            reason: 'Low quality score',
            score: qualityScore,
          });
          continue;
        }

        // Check minimum attempts
        if (tempProblem.totalAttempts < 5) {
          migrationResults.skipped++;
          migrationResults.details.push({
            problemId: tempProblem.id,
            reason: 'Insufficient attempts (min 5 required)',
            attempts: tempProblem.totalAttempts,
          });
          continue;
        }

        // Check if test cases are validated
        if (!tempProblem.isTestCaseValidated) {
          migrationResults.skipped++;
          migrationResults.details.push({
            problemId: tempProblem.id,
            reason: 'Test cases not validated',
          });
          continue;
        }

        // Check for duplicates
        const isDuplicate = await this.checkCodingDuplicate(tempProblem);
        if (isDuplicate) {
          migrationResults.skipped++;
          migrationResults.details.push({
            problemId: tempProblem.id,
            reason: 'Similar problem exists',
          });
          continue;
        }

        // First, ensure the tag exists or create it
        const tag = await this.prisma.tag.upsert({
          where: {
            name_category: {
              name: tempProblem.topic,
              category: 'CODING_TOPIC',
            },
          },
          create: {
            name: tempProblem.topic,
            category: 'CODING_TOPIC',
          },
          update: {},
        });

        // Migrate to main problem bank
        const migratedProblem = await this.prisma.machineTestProblem.create({
          data: {
            title: tempProblem.title,
            description: tempProblem.description as Prisma.InputJsonValue,
            difficulty: tempProblem.difficulty,
            testCases: tempProblem.testCases as Prisma.InputJsonValue,
            institutionId: mockDrive.institutionId,
            isPublic: false, // Start as institution-specific
            tags: {
              create: {
                tag: {
                  connect: {
                    id: tag.id,
                  },
                },
              },
            },
          },
        });

        // Update temp problem with migration info
        await this.prisma.mockDriveGeneratedProblem.update({
          where: { id: tempProblem.id },
          data: {
            isMigrated: true,
            migratedToId: migratedProblem.id,
            migrationNotes: `Migrated on ${new Date().toISOString()} with quality score ${qualityScore.toFixed(2)}`,
          },
        });

        migrationResults.migrated++;
        migrationResults.details.push({
          problemId: tempProblem.id,
          migratedToId: migratedProblem.id,
          qualityScore,
          status: 'SUCCESS',
        });

      } catch (error) {
        migrationResults.failed++;
        this.logger.error(`Failed to migrate coding problem ${tempProblem.id}:`, error);
        migrationResults.details.push({
          problemId: tempProblem.id,
          reason: 'Migration error',
          error: error.message,
          status: 'FAILED',
        });
      }
    }

    this.logger.log(`Coding migration complete: ${migrationResults.migrated} migrated, ${migrationResults.skipped} skipped, ${migrationResults.failed} failed`);

    return migrationResults;
  }

  /**
   * Calculate quality score for aptitude questions
   */
  private calculateAptitudeQualityScore(question: any): number {
    let score = 1.0;

    // Check success rate if attempted
    if (question.attemptCount > 0) {
      const successRate = Number(question.successRate) / 100;
      
      // Penalize if too easy (>85% success) or too hard (<15% success)
      if (successRate > 0.85) {
        score *= 0.7;
      } else if (successRate < 0.15) {
        score *= 0.75;
      } else {
        // Reward questions with good balance (40-60% success rate)
        if (successRate >= 0.4 && successRate <= 0.6) {
          score *= 1.1;
        }
      }

      // Reward questions with more attempts (more data = more reliable)
      if (question.attemptCount >= 50) {
        score *= 1.05;
      } else if (question.attemptCount >= 20) {
        score *= 1.02;
      }
    }

    // Check question length (should be reasonable)
    if (question.question.length < 20 || question.question.length > 500) {
      score *= 0.8;
    }

    // Check if all options are present and reasonable
    const options = question.options as any;
    const optionLengths = Object.values(options).map((opt: any) => opt?.length || 0);
    if (optionLengths.some(len => len < 1 || len > 200)) {
      score *= 0.8;
    }

    // Check if options have reasonable variation in length
    const avgLength = optionLengths.reduce((a, b) => a + b, 0) / optionLengths.length;
    const variance = optionLengths.every(len => Math.abs(len - avgLength) < avgLength * 2);
    if (!variance) {
      score *= 0.9;
    }

    // Check if explanation exists
    if (!question.explanation || question.explanation.length < 10) {
      score *= 0.95;
    } else if (question.explanation.length > 50) {
      score *= 1.05; // Reward good explanations
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Calculate quality score for coding problems
   */
  private calculateCodingQualityScore(problem: any): number {
    let score = 1.0;

    // Check solve rate
    if (problem.totalAttempts > 0) {
      const solveRate = problem.solvedCount / problem.totalAttempts;
      
      // Penalize if too easy (>70% solve rate) or too hard (<5% solve rate)
      if (solveRate > 0.7) {
        score *= 0.75;
      } else if (solveRate < 0.05) {
        score *= 0.7;
      } else {
        // Reward problems with good balance (15-40% solve rate)
        if (solveRate >= 0.15 && solveRate <= 0.4) {
          score *= 1.1;
        }
      }

      // Reward problems with more attempts
      if (problem.totalAttempts >= 30) {
        score *= 1.1;
      } else if (problem.totalAttempts >= 15) {
        score *= 1.05;
      }
    }

    // Check if test cases are validated
    if (problem.isTestCaseValidated) {
      score *= 1.15;
    } else {
      score *= 0.5; // Heavy penalty for unvalidated test cases
    }

    // Check number of test cases
    const testCases = problem.testCases as any[];
    if (testCases && Array.isArray(testCases)) {
      if (testCases.length < 5) {
        score *= 0.8;
      } else if (testCases.length >= 10) {
        score *= 1.05;
      }

      // Check for hidden test cases
      const hiddenCount = testCases.filter((tc: any) => tc.isHidden).length;
      if (hiddenCount < testCases.length * 0.5) {
        score *= 0.9; // Should have at least 50% hidden test cases
      }
    }

    // Check title and description quality
    if (problem.title.length < 10 || problem.title.length > 100) {
      score *= 0.85;
    }

    const description = problem.description as any;
    if (!description || !description.problem || description.problem.length < 50) {
      score *= 0.8;
    }

    // Check if hints are provided
    if (problem.hints && problem.hints.length > 0) {
      score *= 1.05;
    }

    // Check difficulty-based solve rate expectations
    const expectedSolveRates = {
      EASY: { min: 0.4, max: 0.8 },
      MEDIUM: { min: 0.15, max: 0.5 },
      HARD: { min: 0.05, max: 0.3 },
    };

    if (problem.totalAttempts > 0) {
      const solveRate = problem.solvedCount / problem.totalAttempts;
      const expected = expectedSolveRates[problem.difficulty as keyof typeof expectedSolveRates];
      
      if (solveRate >= expected.min && solveRate <= expected.max) {
        score *= 1.1; // Reward if solve rate matches difficulty
      }
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Check for duplicate aptitude questions
   */
  private async checkAptitudeDuplicate(question: any): Promise<boolean> {
    // Check for exact or very similar questions
    const similar = await this.prisma.aptitudeQuestion.findFirst({
      where: {
        OR: [
          {
            question: {
              equals: question.question,
              mode: 'insensitive',
            },
          },
          {
            question: {
              contains: question.question.substring(0, Math.min(50, question.question.length)),
              mode: 'insensitive',
            },
            correctAnswer: question.correctAnswer,
            difficulty: question.difficulty,
          },
        ],
      },
    });

    return !!similar;
  }

  /**
   * Check for duplicate coding problems
   */
  private async checkCodingDuplicate(problem: any): Promise<boolean> {
    // Check for exact or very similar problems
    const similar = await this.prisma.machineTestProblem.findFirst({
      where: {
        OR: [
          {
            title: {
              equals: problem.title,
              mode: 'insensitive',
            },
          },
          {
            title: {
              contains: problem.title.substring(0, Math.min(30, problem.title.length)),
              mode: 'insensitive',
            },
            difficulty: problem.difficulty,
          },
        ],
      },
    });

    return !!similar;
  }

  /**
   * Get migration status for a mock drive
   */
  async getMigrationStatus(mockDriveId: string) {
    const [aptitudeQuestions, codingProblems] = await Promise.all([
      this.prisma.mockDriveAptitudeQuestion.findMany({
        where: { mockDriveId },
      }),
      this.prisma.mockDriveGeneratedProblem.findMany({
        where: { mockDriveId },
      }),
    ]);

    return {
      mockDriveId,
      aptitude: {
        total: aptitudeQuestions.length,
        migrated: aptitudeQuestions.filter(q => q.isMigrated).length,
        pending: aptitudeQuestions.filter(q => !q.isMigrated).length,
      },
      coding: {
        total: codingProblems.length,
        migrated: codingProblems.filter(p => p.isMigrated).length,
        pending: codingProblems.filter(p => !p.isMigrated).length,
      },
    };
  }

  /**
   * Validate test cases for a coding problem (mark as validated)
   */
  async validateProblemTestCases(problemId: string) {
    await this.prisma.mockDriveGeneratedProblem.update({
      where: { id: problemId },
      data: { isTestCaseValidated: true },
    });

    return { message: 'Test cases validated successfully' };
  }
}