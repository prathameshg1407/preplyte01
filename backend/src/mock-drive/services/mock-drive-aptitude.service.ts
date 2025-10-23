import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MockDriveAttemptStatus, Prisma, QuestionDifficulty } from '@prisma/client';

interface AptitudeAnswer {
  questionId: string; // Changed to string to match temp question IDs
  selectedAnswer: string; // 'A', 'B', 'C', or 'D'
}

interface SubmitAptitudeDto {
  answers: AptitudeAnswer[];
  timeTakenSeconds?: number;
}

@Injectable()
export class MockDriveAptitudeService {
  private readonly logger = new Logger(MockDriveAptitudeService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Start aptitude test for mock drive attempt
   */
  async startAptitudeTest(userId: string, attemptId: string) {
    this.logger.log(`Starting aptitude test for attempt ${attemptId}`);

    // 1. Validate attempt
    const attempt = await this.validateAttempt(userId, attemptId);

    // 2. Check if aptitude test already completed
    if (attempt.aptitudeResponseId) {
      throw new BadRequestException('Aptitude test already completed for this attempt');
    }

    // 3. Check if questions exist in temporary table for this mock drive
    let mockDriveQuestions = await this.prisma.mockDriveAptitudeQuestion.findMany({
      where: { mockDriveId: attempt.mockDriveId },
      orderBy: { createdAt: 'asc' },
    });

    // 4. If no questions exist, populate them from the test definition
    if (mockDriveQuestions.length === 0) {
      if (!attempt.mockDrive.aptitudeTestId) {
        throw new BadRequestException('Aptitude test not configured for this mock drive');
      }

      const aptitudeTest = await this.prisma.aptitudeTestDefinition.findUnique({
        where: { id: attempt.mockDrive.aptitudeTestId },
        include: {
          questions: {
            include: {
              question: {
                include: {
                  tags: true, // Include tags to derive topic
                },
              },
            },
          },
        },
      });

      if (!aptitudeTest) {
        throw new NotFoundException('Aptitude test not found');
      }

      if (aptitudeTest.questions.length === 0) {
        throw new BadRequestException('Aptitude test has no questions');
      }

      // Shuffle questions for randomization
      const shuffledQuestions = this.shuffleArray([...aptitudeTest.questions]);

      // Create temporary questions for this mock drive
      mockDriveQuestions = await Promise.all(
        shuffledQuestions.map(async (q) => {
          // Derive topic from tags or use default
          const topic = this.deriveTopicFromQuestion(q.question);
          
          return await this.prisma.mockDriveAptitudeQuestion.create({
            data: {
              mockDriveId: attempt.mockDriveId,
              question: q.question.question,
              options: q.question.options as Prisma.InputJsonValue,
              correctAnswer: q.question.correctAnswer,
              difficulty: q.question.difficulty,
              topic: topic, // Required field
              explanation: null, // Optional field
              attemptCount: 0,
              correctCount: 0,
              successRate: new Prisma.Decimal(0),
              isMigrated: false,
              migratedToId: q.question.id, // Store reference to original question
            },
          });
        })
      );

      // Sort by creation order after batch creation
      mockDriveQuestions.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    // 5. Track question attempts for quality metrics
    await this.prisma.mockDriveAptitudeQuestion.updateMany({
      where: { mockDriveId: attempt.mockDriveId },
      data: { attemptCount: { increment: 1 } },
    });

    this.logger.log(`Aptitude test started with ${mockDriveQuestions.length} questions`);

    return {
      message: 'Aptitude test started successfully',
      attemptId,
      mockDriveId: attempt.mockDriveId,
      totalQuestions: mockDriveQuestions.length,
      questions: mockDriveQuestions.map((q, index) => ({
        questionNumber: index + 1,
        questionId: q.id, // Use temp question ID
        question: q.question,
        options: q.options as any,
        difficulty: q.difficulty,
        topic: q.topic, // Include topic in response
      })),
    };
  }

  /**
   * Get aptitude test questions (in case of refresh)
   */
  async getAptitudeTest(userId: string, attemptId: string) {
    this.logger.log(`Getting aptitude test for attempt ${attemptId}`);

    const attempt = await this.validateAttempt(userId, attemptId);

    if (attempt.aptitudeResponseId) {
      // Already completed, return results instead
      return this.getAptitudeResults(userId, attemptId);
    }

    // Fetch from temporary questions table
    const mockDriveQuestions = await this.prisma.mockDriveAptitudeQuestion.findMany({
      where: { mockDriveId: attempt.mockDriveId },
      orderBy: { createdAt: 'asc' },
    });

    if (mockDriveQuestions.length === 0) {
      // If no questions exist yet, start the test to populate them
      return this.startAptitudeTest(userId, attemptId);
    }

    // Track question attempts for quality metrics (for refresh scenarios)
    await this.prisma.mockDriveAptitudeQuestion.updateMany({
      where: { mockDriveId: attempt.mockDriveId },
      data: { attemptCount: { increment: 1 } },
    });

    return {
      attemptId,
      mockDriveId: attempt.mockDriveId,
      totalQuestions: mockDriveQuestions.length,
      questions: mockDriveQuestions.map((q, index) => ({
        questionNumber: index + 1,
        questionId: q.id, // Use temp question ID
        question: q.question,
        options: q.options,
        difficulty: q.difficulty,
        topic: q.topic, // Include topic
      })),
      isCompleted: false,
    };
  }

  /**
   * Submit aptitude test answers
   */
  async submitAptitudeTest(
    userId: string,
    attemptId: string,
    dto: SubmitAptitudeDto,
  ) {
    this.logger.log(`Submitting aptitude test for attempt ${attemptId}`);

    // 1. Validate attempt
    const attempt = await this.validateAttempt(userId, attemptId);

    // 2. Check if already submitted
    if (attempt.aptitudeResponseId) {
      throw new BadRequestException('Aptitude test already submitted');
    }

    // 3. Get mock drive questions
    const mockDriveQuestions = await this.prisma.mockDriveAptitudeQuestion.findMany({
      where: { mockDriveId: attempt.mockDriveId },
      orderBy: { createdAt: 'asc' },
    });

    if (mockDriveQuestions.length === 0) {
      throw new NotFoundException('No questions found for this mock drive');
    }

    // 4. Validate all questions answered
    if (dto.answers.length !== mockDriveQuestions.length) {
      throw new BadRequestException(
        `Expected ${mockDriveQuestions.length} answers, got ${dto.answers.length}`,
      );
    }

    // 5. Calculate score and update metrics
    let correctCount = 0;
    const breakdown = {
      EASY: { correct: 0, total: 0 },
      MEDIUM: { correct: 0, total: 0 },
      HARD: { correct: 0, total: 0 },
    };

    const topicBreakdown: Record<string, { correct: number; total: number }> = {};

    // Process each answer and update success metrics
    for (const answer of dto.answers) {
      const question = mockDriveQuestions.find(q => q.id === answer.questionId);
      
      if (!question) {
        throw new BadRequestException(`Invalid question ID: ${answer.questionId}`);
      }

      const difficulty = question.difficulty as 'EASY' | 'MEDIUM' | 'HARD';
      breakdown[difficulty].total++;

      // Track topic-wise performance
      if (!topicBreakdown[question.topic]) {
        topicBreakdown[question.topic] = { correct: 0, total: 0 };
      }
      topicBreakdown[question.topic].total++;

      if (answer.selectedAnswer === question.correctAnswer) {
        correctCount++;
        breakdown[difficulty].correct++;
        topicBreakdown[question.topic].correct++;

        // Update success metrics for quality tracking
        const updatedQuestion = await this.prisma.mockDriveAptitudeQuestion.update({
          where: { id: answer.questionId },
          data: { 
            correctCount: { increment: 1 },
          },
        });

        // Calculate and update success rate
        const successRate = (updatedQuestion.correctCount / updatedQuestion.attemptCount) * 100;
        await this.prisma.mockDriveAptitudeQuestion.update({
          where: { id: answer.questionId },
          data: { successRate: new Prisma.Decimal(successRate) },
        });
      }
    }

    const total = mockDriveQuestions.length;
    const percentage = total > 0 ? (correctCount / total) * 100 : 0;

    // 6. Create aptitude response
    const aptitudeResponse = await this.prisma.aptitudeResponse.create({
      data: {
        userId,
        type: `mock_drive_${attempt.mockDriveId}`,
        answers: dto.answers as any,
        score: correctCount,
        total,
        percentage: new Prisma.Decimal(Math.round(percentage * 100) / 100),
      },
    });

    // 7. Link to mock drive attempt
    await this.prisma.mockDriveAttempt.update({
      where: { id: attemptId },
      data: {
        aptitudeResponseId: aptitudeResponse.id,
      },
    });

    this.logger.log(
      `Aptitude test submitted. Score: ${correctCount}/${total} (${percentage.toFixed(2)}%)`,
    );

    return {
      message: 'Aptitude test submitted successfully',
      attemptId,
      responseId: aptitudeResponse.id,
      score: correctCount,
      total,
      percentage: Math.round(percentage * 100) / 100,
      correctAnswers: correctCount,
      incorrectAnswers: total - correctCount,
      breakdown,
      topicBreakdown,
    };
  }

  /**
   * Get aptitude test results
   */
  async getAptitudeResults(userId: string, attemptId: string) {
    this.logger.log(`Getting aptitude results for attempt ${attemptId}`);

    const attempt = await this.validateAttempt(userId, attemptId);

    if (!attempt.aptitudeResponseId) {
      throw new NotFoundException('Aptitude test not completed yet');
    }

    const response = await this.prisma.aptitudeResponse.findUnique({
      where: { id: attempt.aptitudeResponseId },
    });

    if (!response) {
      throw new NotFoundException('Aptitude response not found');
    }

    // Get questions from temporary table
    const mockDriveQuestions = await this.prisma.mockDriveAptitudeQuestion.findMany({
      where: { mockDriveId: attempt.mockDriveId },
      orderBy: { createdAt: 'asc' },
    });

    const answers = response.answers as any as AptitudeAnswer[];

    // Create detailed breakdown
    const detailedResults = mockDriveQuestions.map((q) => {
      const userAnswer = answers.find((a) => a.questionId === q.id);
      const isCorrect = userAnswer?.selectedAnswer === q.correctAnswer;

      return {
        questionId: q.id,
        question: q.question,
        options: q.options,
        difficulty: q.difficulty,
        topic: q.topic,
        userAnswer: userAnswer?.selectedAnswer || 'NOT_ANSWERED',
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
        successRate: q.successRate ? Number(q.successRate) : 0,
        attemptCount: q.attemptCount,
        correctCount: q.correctCount,
      };
    });

    return {
      attemptId,
      responseId: response.id,
      score: response.score,
      total: response.total,
      percentage: Number(response.percentage),
      submittedAt: response.createdAt,
      breakdown: {
        byDifficulty: this.calculateDifficultyBreakdown(detailedResults),
        byTopic: this.calculateTopicBreakdown(detailedResults),
        byQuestion: detailedResults,
      },
      qualityMetrics: this.calculateQualityMetrics(mockDriveQuestions),
    };
  }

  /**
   * Get aptitude test statistics
   */
  async getAptitudeStats(userId: string, attemptId: string) {
    this.logger.log(`Getting aptitude stats for attempt ${attemptId}`);

    const attempt = await this.validateAttempt(userId, attemptId);

    if (!attempt.aptitudeResponseId) {
      return {
        attemptId,
        completed: false,
        score: 0,
        total: 0,
        percentage: 0,
      };
    }

    const response = await this.prisma.aptitudeResponse.findUnique({
      where: { id: attempt.aptitudeResponseId },
    });

    if (!response) {
      throw new NotFoundException('Aptitude response not found');
    }

    // Get questions from temporary table
    const mockDriveQuestions = await this.prisma.mockDriveAptitudeQuestion.findMany({
      where: { mockDriveId: attempt.mockDriveId },
      orderBy: { createdAt: 'asc' },
    });

    const answers = response.answers as any as AptitudeAnswer[];

    // Calculate stats by difficulty
    const statsByDifficulty = {
      EASY: { correct: 0, total: 0, percentage: 0 },
      MEDIUM: { correct: 0, total: 0, percentage: 0 },
      HARD: { correct: 0, total: 0, percentage: 0 },
    };

    // Calculate stats by topic
    const statsByTopic: Record<string, { correct: number; total: number; percentage: number }> = {};

    mockDriveQuestions.forEach((q) => {
      const difficulty = q.difficulty as 'EASY' | 'MEDIUM' | 'HARD';
      statsByDifficulty[difficulty].total++;

      // Initialize topic stats
      if (!statsByTopic[q.topic]) {
        statsByTopic[q.topic] = { correct: 0, total: 0, percentage: 0 };
      }
      statsByTopic[q.topic].total++;

      const userAnswer = answers.find((a) => a.questionId === q.id);
      if (userAnswer?.selectedAnswer === q.correctAnswer) {
        statsByDifficulty[difficulty].correct++;
        statsByTopic[q.topic].correct++;
      }
    });

    // Calculate percentages for difficulty
    Object.keys(statsByDifficulty).forEach((key) => {
      const stats = statsByDifficulty[key as keyof typeof statsByDifficulty];
      stats.percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    });

    // Calculate percentages for topics
    Object.keys(statsByTopic).forEach((topic) => {
      const stats = statsByTopic[topic];
      stats.percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    });

    return {
      attemptId,
      completed: true,
      score: response.score,
      total: response.total,
      percentage: Number(response.percentage),
      submittedAt: response.createdAt,
      statsByDifficulty,
      statsByTopic,
      strengths: this.identifyStrengths(statsByDifficulty),
      weaknesses: this.identifyWeaknesses(statsByDifficulty),
      qualityMetrics: this.calculateQualityMetrics(mockDriveQuestions),
    };
  }

  /**
   * Get aptitude leaderboard for mock drive
   */
  async getAptitudeLeaderboard(attemptId: string) {
    this.logger.log(`Getting aptitude leaderboard for attempt ${attemptId}`);

    const attempt = await this.prisma.mockDriveAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    // Get all attempts with aptitude responses for this mock drive
    const allAttempts = await this.prisma.mockDriveAttempt.findMany({
      where: {
        mockDriveId: attempt.mockDriveId,
        aptitudeResponseId: { not: null },
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        aptitudeResponse: true,
      },
    });

    // Sort by percentage (Prisma Decimal type needs proper handling)
    const sortedAttempts = allAttempts.sort((a, b) => {
      const aPercentage = Number(a.aptitudeResponse!.percentage);
      const bPercentage = Number(b.aptitudeResponse!.percentage);
      return bPercentage - aPercentage;
    });

    const leaderboard = sortedAttempts.map((att, index) => ({
      rank: index + 1,
      userId: att.userId,
      userName: att.user.profile?.fullName || att.user.email,
      score: att.aptitudeResponse!.score,
      total: att.aptitudeResponse!.total,
      percentage: Number(att.aptitudeResponse!.percentage),
      submittedAt: att.aptitudeResponse!.createdAt,
    }));

    // Get question quality metrics for the mock drive
    const questionMetrics = await this.prisma.mockDriveAptitudeQuestion.findMany({
      where: { mockDriveId: attempt.mockDriveId },
      select: {
        id: true,
        question: true,
        difficulty: true,
        topic: true,
        successRate: true,
        attemptCount: true,
        correctCount: true,
      },
      orderBy: { successRate: 'asc' },
    });

    return {
      mockDriveId: attempt.mockDriveId,
      totalParticipants: leaderboard.length,
      leaderboard,
      questionMetrics: {
        mostDifficult: questionMetrics.slice(0, 5).map(q => ({
          ...q,
          successRate: q.successRate ? Number(q.successRate) : 0,
        })),
        easiest: questionMetrics.slice(-5).reverse().map(q => ({
          ...q,
          successRate: q.successRate ? Number(q.successRate) : 0,
        })),
        averageSuccessRate: this.calculateAverageSuccessRate(questionMetrics),
      },
    };
  }

  /**
   * Migrate high-quality questions to permanent question bank
   */
  /**
 * Migrate high-quality questions to permanent question bank
 */
async migrateQualityQuestions(mockDriveId: string, minSuccessRate: number = 20, maxSuccessRate: number = 80) {
  this.logger.log(`Migrating quality questions from mock drive ${mockDriveId}`);

  // Find questions with good quality metrics
  const qualityQuestions = await this.prisma.mockDriveAptitudeQuestion.findMany({
    where: {
      mockDriveId,
      isMigrated: false,
      attemptCount: { gte: 10 }, // At least 10 attempts
      successRate: {
        gte: new Prisma.Decimal(minSuccessRate),
        lte: new Prisma.Decimal(maxSuccessRate),
      },
    },
  });

  // Fix: Properly type the migrated array
  const migrated: Array<{
    id: number;
    sourceQuestionId: number;
    question: string;
    options: Prisma.JsonValue;
    correctAnswer: string;
    difficulty: QuestionDifficulty;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  for (const question of qualityQuestions) {
    try {
      // Properly handle the JSON options field
      const optionsData = question.options as Prisma.JsonValue;
      
      // Create new permanent question
      const newQuestion = await this.prisma.aptitudeQuestion.create({
        data: {
          sourceQuestionId: Date.now() + Math.floor(Math.random() * 1000), // Generate unique ID
          question: question.question,
          options: optionsData as Prisma.InputJsonValue, // Cast to InputJsonValue
          correctAnswer: question.correctAnswer,
          difficulty: question.difficulty,
        },
      });

      // Mark as migrated
      await this.prisma.mockDriveAptitudeQuestion.update({
        where: { id: question.id },
        data: {
          isMigrated: true,
          migratedToId: newQuestion.id,
          migrationNotes: `Migrated on ${new Date().toISOString()} with success rate ${question.successRate}%`,
        },
      });

      migrated.push(newQuestion);
    } catch (error) {
      this.logger.error(`Failed to migrate question ${question.id}:`, error);
    }
  }

  this.logger.log(`Migrated ${migrated.length} questions to permanent bank`);

  return {
    message: 'Questions migrated successfully',
    migratedCount: migrated.length,
    migrated,
  };
}
  /**
   * Clean up temporary questions after mock drive ends
   */
  async cleanupMockDriveQuestions(mockDriveId: string, preserveHighQuality: boolean = true) {
    this.logger.log(`Cleaning up temporary questions for mock drive ${mockDriveId}`);

    let whereClause: any = { mockDriveId };

    if (preserveHighQuality) {
      // Preserve questions with good metrics for potential migration
      whereClause = {
        mockDriveId,
        OR: [
          { attemptCount: { lt: 10 } }, // Not enough data
          { successRate: { lt: new Prisma.Decimal(20) } }, // Too hard
          { successRate: { gt: new Prisma.Decimal(80) } }, // Too easy
          { isMigrated: true }, // Already migrated
        ],
      };
    }

    const deletedCount = await this.prisma.mockDriveAptitudeQuestion.deleteMany({
      where: whereClause,
    });

    this.logger.log(`Deleted ${deletedCount.count} temporary questions`);

    return {
      message: 'Temporary questions cleaned up successfully',
      deletedCount: deletedCount.count,
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
        mockDrive: true,
        aptitudeResponse: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Mock drive attempt not found');
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('This attempt does not belong to you');
    }

    if (attempt.status === MockDriveAttemptStatus.COMPLETED) {
      // Allow viewing results even if completed
      if (!attempt.aptitudeResponseId) {
        throw new BadRequestException('Attempt completed without aptitude test');
      }
    }

    if (attempt.status === MockDriveAttemptStatus.ABANDONED) {
      throw new BadRequestException('Attempt was abandoned');
    }

    return attempt;
  }

  /**
   * Derive topic from question tags or metadata
   */
  private deriveTopicFromQuestion(question: any): string {
    // If question has tags, use the first APTITUDE_TOPIC tag
    if (question.tags && question.tags.length > 0) {
      const aptitudeTag = question.tags.find((tag: any) => tag.category === 'APTITUDE_TOPIC');
      if (aptitudeTag) {
        return aptitudeTag.name;
      }
    }

    // Map difficulty to generic topics as fallback
    const topicMap: Record<QuestionDifficulty, string> = {
      [QuestionDifficulty.EASY]: 'Basic Aptitude',
      [QuestionDifficulty.MEDIUM]: 'Intermediate Aptitude',
      [QuestionDifficulty.HARD]: 'Advanced Aptitude',
    };

    return topicMap[question.difficulty] || 'General Aptitude';
  }

  /**
   * Calculate breakdown by difficulty
   */
  private calculateDifficultyBreakdown(results: any[]) {
    const breakdown = {
      EASY: { correct: 0, total: 0, percentage: 0, avgSuccessRate: 0 },
      MEDIUM: { correct: 0, total: 0, percentage: 0, avgSuccessRate: 0 },
      HARD: { correct: 0, total: 0, percentage: 0, avgSuccessRate: 0 },
    };

    const successRates = {
      EASY: [] as number[],
      MEDIUM: [] as number[],
      HARD: [] as number[],
    };

    results.forEach((r) => {
      const difficulty = r.difficulty as 'EASY' | 'MEDIUM' | 'HARD';
      breakdown[difficulty].total++;
      successRates[difficulty].push(r.successRate || 0);
      
      if (r.isCorrect) {
        breakdown[difficulty].correct++;
      }
    });

    // Calculate percentages and average success rates
    Object.keys(breakdown).forEach((key) => {
      const difficulty = key as 'EASY' | 'MEDIUM' | 'HARD';
      const stats = breakdown[difficulty];
      stats.percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      
      const rates = successRates[difficulty];
      stats.avgSuccessRate = rates.length > 0 
        ? rates.reduce((a, b) => a + b, 0) / rates.length 
        : 0;
    });

    return breakdown;
  }

  /**
   * Calculate breakdown by topic
   */
  private calculateTopicBreakdown(results: any[]) {
    const breakdown: Record<string, { correct: number; total: number; percentage: number }> = {};

    results.forEach((r) => {
      if (!breakdown[r.topic]) {
        breakdown[r.topic] = { correct: 0, total: 0, percentage: 0 };
      }
      
      breakdown[r.topic].total++;
      if (r.isCorrect) {
        breakdown[r.topic].correct++;
      }
    });

    // Calculate percentages
    Object.keys(breakdown).forEach((topic) => {
      const stats = breakdown[topic];
      stats.percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    });

    return breakdown;
  }

  /**
   * Calculate quality metrics for questions
   */
  private calculateQualityMetrics(questions: any[]) {
    const totalAttempts = questions.reduce((sum, q) => sum + q.attemptCount, 0);
    const totalCorrect = questions.reduce((sum, q) => sum + q.correctCount, 0);
    const overallSuccessRate = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;

    const byDifficulty = {
      EASY: { avgSuccessRate: 0, count: 0 },
      MEDIUM: { avgSuccessRate: 0, count: 0 },
      HARD: { avgSuccessRate: 0, count: 0 },
    };

    const byTopic: Record<string, { avgSuccessRate: number; count: number }> = {};

    questions.forEach((q) => {
      const difficulty = q.difficulty as 'EASY' | 'MEDIUM' | 'HARD';
      const successRate = q.successRate ? Number(q.successRate) : 0;
      
      byDifficulty[difficulty].avgSuccessRate += successRate;
      byDifficulty[difficulty].count++;

      if (!byTopic[q.topic]) {
        byTopic[q.topic] = { avgSuccessRate: 0, count: 0 };
      }
      byTopic[q.topic].avgSuccessRate += successRate;
      byTopic[q.topic].count++;
    });

    // Calculate averages for difficulty
    Object.keys(byDifficulty).forEach((key) => {
      const difficulty = key as 'EASY' | 'MEDIUM' | 'HARD';
      const stats = byDifficulty[difficulty];
      stats.avgSuccessRate = stats.count > 0 
        ? stats.avgSuccessRate / stats.count 
        : 0;
    });

    // Calculate averages for topics
    Object.keys(byTopic).forEach((topic) => {
      const stats = byTopic[topic];
      stats.avgSuccessRate = stats.count > 0 
        ? stats.avgSuccessRate / stats.count 
        : 0;
    });

    return {
      overallSuccessRate: Math.round(overallSuccessRate * 100) / 100,
      totalAttempts,
      totalCorrect,
      byDifficulty,
      byTopic,
    };
  }

  /**
   * Calculate average success rate
   */
  private calculateAverageSuccessRate(questions: any[]): number {
    if (questions.length === 0) return 0;
    
    const totalSuccessRate = questions.reduce(
      (sum, q) => sum + (q.successRate ? Number(q.successRate) : 0), 
      0
    );
    return Math.round((totalSuccessRate / questions.length) * 100) / 100;
  }

  /**
   * Identify strengths
   */
  private identifyStrengths(stats: any): string[] {
    const strengths: string[] = [];

    Object.entries(stats).forEach(([difficulty, data]: [string, any]) => {
      if (data.percentage >= 70) {
        strengths.push(`Strong performance in ${difficulty.toLowerCase()} questions (${data.percentage.toFixed(1)}%)`);
      }
    });

    if (strengths.length === 0) {
      strengths.push('Keep practicing to identify your strengths');
    }

    return strengths;
  }

  /**
   * Identify weaknesses
   */
  private identifyWeaknesses(stats: any): string[] {
    const weaknesses: string[] = [];

    Object.entries(stats).forEach(([difficulty, data]: [string, any]) => {
      if (data.percentage < 50 && data.total > 0) {
        weaknesses.push(`Need improvement in ${difficulty.toLowerCase()} questions (${data.percentage.toFixed(1)}%)`);
      }
    });

    if (weaknesses.length === 0 && Object.values(stats).some((s: any) => s.total > 0)) {
      weaknesses.push('Good overall performance, keep it up!');
    }

    return weaknesses;
  }

  /**
   * Shuffle array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}