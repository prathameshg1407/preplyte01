import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MockDriveAttemptStatus, SubmissionStatus, Prisma } from '@prisma/client';
import { SubmitCodeDto } from '../../practice/machine-test/dto/submit-code.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface Judge0Result {
  status: { id: number; description: string };
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  expected_output: string | null;
  testCaseInput: string;
}

@Injectable()
export class MockDriveMachineTestService {
  private readonly logger = new Logger(MockDriveMachineTestService.name);
  private readonly rapidApiUrl: string;
  private readonly rapidApiKey: string;
  private readonly rapidApiHost: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.rapidApiUrl = this.configService.get('RAPIDAPI_JUDGE0_URL', 'https://judge0-ce.p.rapidapi.com');
    this.rapidApiKey = this.configService.getOrThrow('RAPIDAPI_KEY');
    this.rapidApiHost = this.configService.get('RAPIDAPI_HOST', 'judge0-ce.p.rapidapi.com');
  }

  /**
   * Start machine test for mock drive attempt
   */
  async startMachineTest(userId: string, attemptId: string) {
    this.logger.log(`Starting machine test for attempt ${attemptId}`);

    // 1. Validate attempt
    const attempt = await this.validateAttempt(userId, attemptId);

    // 2. Get AI-generated problems for this mock drive
    const generatedProblems = await this.prisma.mockDriveGeneratedProblem.findMany({
      where: { mockDriveId: attempt.mockDriveId },
      orderBy: { orderIndex: 'asc' },
    });

    if (generatedProblems.length === 0) {
      throw new BadRequestException('Machine test not configured for this mock drive');
    }

    // 3. Track problem attempts for quality metrics
    await this.prisma.mockDriveGeneratedProblem.updateMany({
      where: { mockDriveId: attempt.mockDriveId },
      data: { totalAttempts: { increment: 1 } },
    });

    this.logger.log(`Machine test started with ${generatedProblems.length} problems`);

    return {
      message: 'Machine test started successfully',
      attemptId,
      mockDriveId: attempt.mockDriveId,
      totalProblems: generatedProblems.length,
      problems: generatedProblems.map((p) => ({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        topic: p.topic,
        points: p.points,
        orderIndex: p.orderIndex,
        description: p.description,
        hints: p.hints,
      })),
    };
  }

  /**
   * Get machine test details (in case of refresh)
   */
  async getMachineTestDetails(userId: string, attemptId: string) {
    this.logger.log(`Getting machine test details for attempt ${attemptId}`);

    const attempt = await this.validateAttempt(userId, attemptId);

    // Get AI-generated problems
    const generatedProblems = await this.prisma.mockDriveGeneratedProblem.findMany({
      where: { mockDriveId: attempt.mockDriveId },
      orderBy: { orderIndex: 'asc' },
    });

    if (generatedProblems.length === 0) {
      // If no problems exist yet, start the test to populate them
      return this.startMachineTest(userId, attemptId);
    }

    // Get user's submissions
    const submissions = await this.prisma.mockDriveProblemSubmission.findMany({
      where: {
        attemptId,
        userId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      attemptId,
      mockDriveId: attempt.mockDriveId,
      totalProblems: generatedProblems.length,
      problems: generatedProblems.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        topic: p.topic,
        points: p.points,
        orderIndex: p.orderIndex,
        hints: p.hints,
        submissions: submissions.filter((s) => s.generatedProblemId === p.id),
        totalSubmissions: submissions.filter((s) => s.generatedProblemId === p.id).length,
      })),
      totalSubmissions: submissions.length,
    };
  }

  /**
   * Submit code for a problem
   */
  async submitCode(
    userId: string,
    attemptId: string,
    problemId: string,
    submitCodeDto: SubmitCodeDto,
  ) {
    this.logger.log(`Submitting code for problem ${problemId}, attempt ${attemptId}`);

    // 1. Validate attempt
    const attempt = await this.validateAttempt(userId, attemptId);

    // 2. Get the problem
    const problem = await this.prisma.mockDriveGeneratedProblem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    // 3. Verify problem belongs to this mock drive
    if (problem.mockDriveId !== attempt.mockDriveId) {
      throw new BadRequestException('Problem does not belong to this mock drive');
    }

    // 4. Get test cases
    const testCases = problem.testCases as any as TestCase[];
    if (!testCases || testCases.length === 0) {
      throw new BadRequestException('Problem has no test cases configured');
    }

    // 5. Execute code against test cases
    const testCaseResults: Judge0Result[] = [];
    const startTime = Date.now();

    for (const testCase of testCases) {
      const payload = {
        source_code: submitCodeDto.source_code,
        language_id: submitCodeDto.language_id,
        stdin: this.encodeBase64(testCase.input),
        expected_output: this.encodeBase64(testCase.expectedOutput),
        cpu_time_limit: 2,
        memory_limit: 128000,
      };

      const result = await this.executeCode(payload);
      testCaseResults.push({ ...result, testCaseInput: testCase.input });

      // Break on compilation error
      if (result.status.description === 'Compilation Error') {
        break;
      }
    }

    const timeTakenSeconds = Math.floor((Date.now() - startTime) / 1000);

    // 6. Calculate results
    const passedCount = testCaseResults.filter(
      (r) => r.status.description === 'Accepted',
    ).length;
    const finalStatus = this.determineFinalStatus(passedCount, testCases.length, testCaseResults);
    const score = (passedCount / testCases.length) * 100;
    const earnedPoints = (score / 100) * problem.points;

    // 7. Save submission
    const submission = await this.prisma.mockDriveProblemSubmission.create({
      data: {
        generatedProblemId: problemId,
        userId,
        attemptId,
        sourceCode: this.decodeBase64(submitCodeDto.source_code) ?? '',
        languageId: submitCodeDto.language_id,
        testCaseResults: testCaseResults as any,
        status: finalStatus,
        timeTakenSeconds,
      },
    });

    // 8. Update problem quality metrics
    await this.updateProblemMetrics(problemId, finalStatus);

    this.logger.log(
      `Code submitted for problem ${problemId}. Status: ${finalStatus}, Score: ${score}`,
    );

    return {
      submissionId: submission.id,
      finalStatus,
      score,
      passedCount,
      totalCases: testCases.length,
      maxPoints: problem.points,
      earnedPoints,
      timeTakenSeconds,
      results: testCaseResults.map((r, index) => ({
        testCase: index + 1,
        isHidden: testCases[index].isHidden,
        status: r.status.description,
        input: testCases[index].isHidden ? '[Hidden]' : r.testCaseInput,
        output: testCases[index].isHidden ? '[Hidden]' : this.decodeBase64(r.stdout),
        expected: testCases[index].isHidden ? '[Hidden]' : this.decodeBase64(r.expected_output),
        error: this.decodeBase64(r.stderr || r.compile_output || r.message),
      })),
    };
  }

  /**
   * Get submissions for a specific problem
   */
  async getProblemSubmissions(
    userId: string,
    attemptId: string,
    problemId: string,
  ) {
    this.logger.log(`Getting submissions for problem ${problemId}, attempt ${attemptId}`);

    await this.validateAttempt(userId, attemptId);

    const submissions = await this.prisma.mockDriveProblemSubmission.findMany({
      where: {
        generatedProblemId: problemId,
        attemptId,
        userId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      problemId,
      attemptId,
      submissions,
      totalSubmissions: submissions.length,
    };
  }

  /**
   * Get all submissions for the machine test
   */
  async getAllSubmissions(userId: string, attemptId: string) {
    this.logger.log(`Getting all submissions for attempt ${attemptId}`);

    await this.validateAttempt(userId, attemptId);

    const submissions = await this.prisma.mockDriveProblemSubmission.findMany({
      where: {
        attemptId,
        userId,
      },
      include: {
        generatedProblem: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            topic: true,
            points: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by problem
    const byProblem = submissions.reduce((acc, sub) => {
      const problemId = sub.generatedProblemId;
      if (!acc[problemId]) {
        acc[problemId] = [];
      }
      acc[problemId].push(sub);
      return acc;
    }, {} as Record<string, typeof submissions>);

    return {
      attemptId,
      submissions,
      byProblem,
      totalSubmissions: submissions.length,
    };
  }

  /**
   * Complete machine test
   */
  async completeMachineTest(userId: string, attemptId: string) {
    this.logger.log(`Completing machine test for attempt ${attemptId}`);

    await this.validateAttempt(userId, attemptId);

    // Calculate final scores
    const stats = await this.getMachineTestStats(userId, attemptId);

    this.logger.log(`Machine test completed for attempt ${attemptId}`);

    return {
      message: 'Machine test completed successfully',
      attemptId,
      stats,
    };
  }

  /**
   * Get machine test statistics
   */
  /**
 * Get machine test statistics
 */
async getMachineTestStats(userId: string, attemptId: string) {
  this.logger.log(`Getting machine test stats for attempt ${attemptId}`);

  const attempt = await this.validateAttempt(userId, attemptId);

  // Get all problems
  const problems = await this.prisma.mockDriveGeneratedProblem.findMany({
    where: { mockDriveId: attempt.mockDriveId },
    orderBy: { orderIndex: 'asc' },
  });

  // Get all submissions
  const submissions = await this.prisma.mockDriveProblemSubmission.findMany({
    where: { attemptId, userId },
  });

  // Calculate stats by difficulty
  const statsByDifficulty = {
    EASY: { solved: 0, attempted: 0, total: 0, maxPoints: 0, earnedPoints: 0 },
    MEDIUM: { solved: 0, attempted: 0, total: 0, maxPoints: 0, earnedPoints: 0 },
    HARD: { solved: 0, attempted: 0, total: 0, maxPoints: 0, earnedPoints: 0 },
  };

  // Calculate best score for each problem
  const problemScores = problems.map((problem) => {
    const difficulty = problem.difficulty as 'EASY' | 'MEDIUM' | 'HARD';
    statsByDifficulty[difficulty].total++;
    statsByDifficulty[difficulty].maxPoints += problem.points;

    const problemSubmissions = submissions.filter(
      (s) => s.generatedProblemId === problem.id,
    );

    if (problemSubmissions.length === 0) {
      return {
        problemId: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        topic: problem.topic,
        maxPoints: problem.points,
        earnedPoints: 0,
        score: 0,
        status: 'NOT_ATTEMPTED',
        submissions: 0,
        bestTime: null as number | null, // Fix: explicitly type as number | null
      };
    }

    statsByDifficulty[difficulty].attempted++;

    // Find best submission
    let bestScore = 0;
    let bestStatus = 'FAIL';
    let bestTime: number | null = null; // Fix: explicitly type the variable

    problemSubmissions.forEach((sub) => {
      const results = sub.testCaseResults as any;
      if (!results || !Array.isArray(results)) return;

      const passed = results.filter((r: any) => r.status.description === 'Accepted').length;
      const total = results.length;
      const score = (passed / total) * 100;

      if (score > bestScore) {
        bestScore = score;
        bestStatus = sub.status;
        bestTime = sub.timeTakenSeconds; // Now this is correctly typed
      }
    });

    const earnedPoints = (bestScore / 100) * problem.points;
    statsByDifficulty[difficulty].earnedPoints += earnedPoints;

    if (bestScore === 100) {
      statsByDifficulty[difficulty].solved++;
    }

    return {
      problemId: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      topic: problem.topic,
      maxPoints: problem.points,
      earnedPoints,
      score: bestScore,
      status: bestStatus,
      submissions: problemSubmissions.length,
      bestTime, // Now correctly typed as number | null
    };
  });

  // Calculate overall stats
  const totalMaxPoints = problems.reduce((sum, p) => sum + p.points, 0);
  const totalEarnedPoints = problemScores.reduce((sum, s) => sum + s.earnedPoints, 0);
  const percentage = totalMaxPoints > 0 ? (totalEarnedPoints / totalMaxPoints) * 100 : 0;

  const solvedProblems = problemScores.filter((s) => s.score === 100).length;
  const attemptedProblems = problemScores.filter((s) => s.status !== 'NOT_ATTEMPTED').length;

  return {
    attemptId,
    totalProblems: problems.length,
    solvedProblems,
    attemptedProblems,
    totalSubmissions: submissions.length,
    totalMaxPoints,
    totalEarnedPoints,
    percentage: Math.round(percentage * 100) / 100,
    statsByDifficulty,
    problemScores,
    strengths: this.identifyStrengths(statsByDifficulty),
    weaknesses: this.identifyWeaknesses(statsByDifficulty),
    qualityMetrics: this.calculateQualityMetrics(problems),
  };
}

  /**
   * Get leaderboard for problem (within mock drive)
   */
  async getProblemLeaderboard(
    attemptId: string,
    problemId: string,
    limit: number = 50,
  ) {
    this.logger.log(`Getting leaderboard for problem ${problemId}`);

    const attempt = await this.prisma.mockDriveAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    // Get all attempts for this mock drive
    const allAttempts = await this.prisma.mockDriveAttempt.findMany({
      where: { mockDriveId: attempt.mockDriveId },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    const leaderboard = await Promise.all(
      allAttempts.map(async (att) => {
        const submissions = await this.prisma.mockDriveProblemSubmission.findMany({
          where: {
            generatedProblemId: problemId,
            attemptId: att.id,
          },
          orderBy: { createdAt: 'asc' },
        });

        if (submissions.length === 0) return null;

        let bestScore = 0;
        let bestTime = Infinity;
        let bestSubmission = submissions[0];

        submissions.forEach((sub) => {
          const results = sub.testCaseResults as any;
          if (!results || !Array.isArray(results)) return;

          const passed = results.filter((r: any) => r.status.description === 'Accepted').length;
          const total = results.length;
          const score = (passed / total) * 100;

          if (
            score > bestScore ||
            (score === bestScore && (sub.timeTakenSeconds || 0) < bestTime)
          ) {
            bestScore = score;
            bestTime = sub.timeTakenSeconds || 0;
            bestSubmission = sub;
          }
        });

        return {
          userId: att.userId,
          userName: att.user.profile?.fullName || att.user.email,
          score: bestScore,
          submissions: submissions.length,
          timeTaken: bestSubmission.timeTakenSeconds,
          submittedAt: bestSubmission.createdAt,
        };
      }),
    );

    const validLeaderboard = leaderboard
      .filter((entry) => entry !== null)
      .sort((a, b) => {
        if (b!.score !== a!.score) return b!.score - a!.score;
        if ((a!.timeTaken || 0) !== (b!.timeTaken || 0)) return (a!.timeTaken || 0) - (b!.timeTaken || 0);
        return a!.submittedAt.getTime() - b!.submittedAt.getTime();
      })
      .slice(0, limit);

    return {
      problemId,
      totalParticipants: validLeaderboard.length,
      leaderboard: validLeaderboard.map((entry, index) => ({
        rank: index + 1,
        ...entry,
      })),
    };
  }

  /**
   * Get overall leaderboard for machine test
   */
  async getMachineTestLeaderboard(attemptId: string, limit: number = 50) {
    this.logger.log(`Getting machine test leaderboard for attempt ${attemptId}`);

    const attempt = await this.prisma.mockDriveAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    // Get all attempts for this mock drive
    const allAttempts = await this.prisma.mockDriveAttempt.findMany({
      where: { mockDriveId: attempt.mockDriveId },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    // Get all problems
    const problems = await this.prisma.mockDriveGeneratedProblem.findMany({
      where: { mockDriveId: attempt.mockDriveId },
    });

    const leaderboard = await Promise.all(
      allAttempts.map(async (att) => {
        const submissions = await this.prisma.mockDriveProblemSubmission.findMany({
          where: { attemptId: att.id },
        });

        if (submissions.length === 0) return null;

        let totalScore = 0;
        let totalMaxScore = 0;
        let solvedCount = 0;

        problems.forEach((problem) => {
          const problemSubmissions = submissions.filter(
            (s) => s.generatedProblemId === problem.id,
          );
          totalMaxScore += problem.points;

          if (problemSubmissions.length === 0) return;

          let bestScore = 0;
          problemSubmissions.forEach((sub) => {
            const results = sub.testCaseResults as any;
            if (!results || !Array.isArray(results)) return;

            const passed = results.filter((r: any) => r.status.description === 'Accepted').length;
            const total = results.length;
            const score = (passed / total) * 100;

            if (score > bestScore) {
              bestScore = score;
            }
          });

          const earnedPoints = (bestScore / 100) * problem.points;
          totalScore += earnedPoints;

          if (bestScore === 100) {
            solvedCount++;
          }
        });

        const percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

        return {
          userId: att.userId,
          userName: att.user.profile?.fullName || att.user.email,
          totalScore,
          totalMaxScore,
          percentage,
          solvedProblems: solvedCount,
          totalProblems: problems.length,
          submissionsCount: submissions.length,
        };
      }),
    );

    const validLeaderboard = leaderboard
      .filter((entry) => entry !== null && entry.submissionsCount > 0)
      .sort((a, b) => {
        if (b!.percentage !== a!.percentage) return b!.percentage - a!.percentage;
        if (b!.solvedProblems !== a!.solvedProblems) return b!.solvedProblems - a!.solvedProblems;
        return a!.submissionsCount - b!.submissionsCount;
      })
      .slice(0, limit);

    return {
      mockDriveId: attempt.mockDriveId,
      totalParticipants: validLeaderboard.length,
      leaderboard: validLeaderboard.map((entry, index) => ({
        rank: index + 1,
        ...entry,
      })),
    };
  }

  // ============= Private Helper Methods =============

  /**
   * Validate mock drive attempt
   */
  private async validateAttempt(userId: string, attemptId: string) {
    const attempt = await this.prisma.mockDriveAttempt.findUnique({
      where: { id: attemptId },
      include: { mockDrive: true },
    });

    if (!attempt) {
      throw new NotFoundException('Mock drive attempt not found');
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('This attempt does not belong to you');
    }

    if (attempt.status === MockDriveAttemptStatus.COMPLETED) {
      // Allow viewing results
    }

    if (attempt.status === MockDriveAttemptStatus.ABANDONED) {
      throw new BadRequestException('Attempt was abandoned');
    }

    return attempt;
  }

  /**
   * Update problem quality metrics
   */
  private async updateProblemMetrics(
    problemId: string,
    status: SubmissionStatus,
  ) {
    const updateData: any = {
      totalAttempts: { increment: 1 },
    };

    if (status === SubmissionStatus.PASS) {
      updateData.solvedCount = { increment: 1 };
    } else if (status === SubmissionStatus.PARTIAL) {
      updateData.partialSolveCount = { increment: 1 };
    } else if (
      status === SubmissionStatus.FAIL ||
      status === SubmissionStatus.COMPILE_ERROR ||
      status === SubmissionStatus.RUNTIME_ERROR
    ) {
      updateData.failedCount = { increment: 1 };
    }

    await this.prisma.mockDriveGeneratedProblem.update({
      where: { id: problemId },
      data: updateData,
    });
  }

  /**
   * Execute code using Judge0 via RapidAPI
   */
  private async executeCode(payload: any): Promise<Judge0Result> {
    const headers = {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': this.rapidApiKey,
      'X-RapidAPI-Host': this.rapidApiHost,
    };

    try {
      // Submit the code
      const submitResponse = await firstValueFrom(
        this.httpService.post(
          `${this.rapidApiUrl}/submissions?base64_encoded=true&fields=*`,
          payload,
          { headers },
        ),
      );

      const token = submitResponse.data.token;

      // Poll for results
      let result = submitResponse.data;
      let pollAttempts = 0;
      const maxPollAttempts = 10;

      while (result.status.id <= 2 && pollAttempts < maxPollAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const pollResponse = await firstValueFrom(
          this.httpService.get(
            `${this.rapidApiUrl}/submissions/${token}?base64_encoded=true&fields=*`,
            { headers },
          ),
        );
        result = pollResponse.data;
        pollAttempts++;
      }

      return {
        ...result,
        stdout: result.stdout,
        stderr: result.stderr,
        compile_output: result.compile_output,
        message: result.message,
        expected_output: payload.expected_output,
        testCaseInput: '',
      };
    } catch (error) {
      this.logger.error(`Judge0 execution error: ${error.message}`, error.stack);
      throw new BadRequestException('Code execution failed. Please try again.');
    }
  }

  /**
   * Determine final status based on test results
   */
  private determineFinalStatus(
    passed: number,
    total: number,
    results: Judge0Result[],
  ): SubmissionStatus {
    if (results.some((r) => r.status.description === 'Compilation Error'))
      return SubmissionStatus.COMPILE_ERROR;
    if (results.some((r) => r.status.description.includes('Runtime Error')))
      return SubmissionStatus.RUNTIME_ERROR;
    if (results.some((r) => r.status.description === 'Time Limit Exceeded'))
      return SubmissionStatus.TIMEOUT;
    if (passed === total) return SubmissionStatus.PASS;
    if (passed > 0) return SubmissionStatus.PARTIAL;
    return SubmissionStatus.FAIL;
  }

  /**
   * Calculate quality metrics for problems
   */
  private calculateQualityMetrics(problems: any[]) {
    const totalAttempts = problems.reduce((sum, p) => sum + p.totalAttempts, 0);
    const totalSolved = problems.reduce((sum, p) => sum + p.solvedCount, 0);
    const overallSolveRate = totalAttempts > 0 ? (totalSolved / totalAttempts) * 100 : 0;

    const byDifficulty = {
      EASY: { avgSolveRate: 0, count: 0 },
      MEDIUM: { avgSolveRate: 0, count: 0 },
      HARD: { avgSolveRate: 0, count: 0 },
    };

    problems.forEach((p) => {
      const difficulty = p.difficulty as 'EASY' | 'MEDIUM' | 'HARD';
      const solveRate = p.totalAttempts > 0 ? (p.solvedCount / p.totalAttempts) * 100 : 0;
      
      byDifficulty[difficulty].avgSolveRate += solveRate;
      byDifficulty[difficulty].count++;
    });

    // Calculate averages
    Object.keys(byDifficulty).forEach((key) => {
      const difficulty = key as 'EASY' | 'MEDIUM' | 'HARD';
      const stats = byDifficulty[difficulty];
      stats.avgSolveRate = stats.count > 0 
        ? stats.avgSolveRate / stats.count 
        : 0;
    });

    return {
      overallSolveRate: Math.round(overallSolveRate * 100) / 100,
      totalAttempts,
      totalSolved,
      byDifficulty,
    };
  }

  /**
   * Identify strengths
   */
  private identifyStrengths(stats: any): string[] {
    const strengths: string[] = [];

    Object.entries(stats).forEach(([difficulty, data]: [string, any]) => {
      const percentage = data.maxPoints > 0 ? (data.earnedPoints / data.maxPoints) * 100 : 0;
      if (percentage >= 70 && data.attempted > 0) {
        strengths.push(
          `Strong performance in ${difficulty.toLowerCase()} problems (${percentage.toFixed(1)}%)`
        );
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
      const percentage = data.maxPoints > 0 ? (data.earnedPoints / data.maxPoints) * 100 : 0;
      if (percentage < 50 && data.attempted > 0) {
        weaknesses.push(
          `Need improvement in ${difficulty.toLowerCase()} problems (${percentage.toFixed(1)}%)`
        );
      }
    });

    if (weaknesses.length === 0 && Object.values(stats).some((s: any) => s.attempted > 0)) {
      weaknesses.push('Good overall performance, keep it up!');
    }

    return weaknesses;
  }

  private encodeBase64 = (s: string | null | undefined): string | null =>
    s ? Buffer.from(s).toString('base64') : null;

  private decodeBase64 = (s: string | null | undefined): string | null =>
    s ? Buffer.from(s, 'base64').toString('utf-8') : null;
}