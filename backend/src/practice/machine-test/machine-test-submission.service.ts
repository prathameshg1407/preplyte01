import { Injectable, Logger, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { SubmissionStatus } from '@prisma/client';

interface TestCase {
  input: string;
  output: string;
}

interface TestCases {
  sampleTestCases?: TestCase[];
  hiddenTestCases?: TestCase[];
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
export class MachineTestSubmissionService {
  private readonly logger = new Logger(MachineTestSubmissionService.name);
  private readonly rapidApiUrl: string;
  private readonly rapidApiKey: string;
  private readonly rapidApiHost: string;
  private readonly languageMap: { [key: number]: number } = {
    63: 93, // Judge0 JS to DB JS
    71: 94, // Judge0 Python to DB Python
    62: 62, // Java matches
    54: 54, // C++ matches
    74: 74, // TypeScript matches
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // RapidAPI configuration
    this.rapidApiUrl = this.configService.get('RAPIDAPI_JUDGE0_URL', 'https://judge0-ce.p.rapidapi.com');
    this.rapidApiKey = this.configService.getOrThrow('RAPIDAPI_KEY');
    this.rapidApiHost = this.configService.get('RAPIDAPI_HOST', 'judge0-ce.p.rapidapi.com');
    
    this.logger.log(`RapidAPI Judge0 configured: ${this.rapidApiUrl}`);
  }

  async submitAndEvaluate(
    problemId: number,
    machineTestId: number,
    userId: string,
    submitCodeDto: SubmitCodeDto,
  ) {
    this.logger.log(
      `Starting evaluation for problem ${problemId} by user ${userId} for test ${machineTestId}`,
    );

    const problem = await this.prisma.machineTestProblem.findUnique({
      where: { id: problemId },
      select: { testCases: true },
    });
    if (!problem) {
      throw new NotFoundException(`Machine test problem with ID ${problemId} not found.`);
    }

    const testCasesData = problem.testCases as TestCases;
    const testCases = [
      ...(testCasesData?.sampleTestCases || []),
      ...(testCasesData?.hiddenTestCases || []),
    ];
    if (testCases.length === 0) {
      throw new HttpException('Problem has no test cases configured.', HttpStatus.BAD_REQUEST);
    }

    const testCaseResults: Judge0Result[] = [];
    for (const testCase of testCases) {
      const payload = {
        source_code: submitCodeDto.source_code,
        language_id: submitCodeDto.language_id,
        stdin: this.encodeBase64(testCase.input),
        expected_output: this.encodeBase64(testCase.output),
        cpu_time_limit: 2,
        memory_limit: 128000,
      };

      const result = await this.executeCode(payload);
      testCaseResults.push({ ...result, testCaseInput: testCase.input });

      if (result.status.description === 'Compilation Error') {
        break;
      }
    }

    const passedCount = testCaseResults.filter(
      (r) => r.status.description === 'Accepted',
    ).length;
    const finalStatus = this.determineFinalStatus(passedCount, testCases.length, testCaseResults);
    const score = (passedCount / testCases.length) * 100;

    const dbLanguageId = this.languageMap[submitCodeDto.language_id];
    if (!dbLanguageId) {
      throw new HttpException(
        `Unsupported language ID: ${submitCodeDto.language_id}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const dbResponse = await this.prisma.machineTestSubmission.create({
      data: {
        userId,
        problemId,
        machineTestId,
        sourceCode: this.decodeBase64(submitCodeDto.source_code) ?? '',
        languageId: dbLanguageId,
        stdin: this.decodeBase64(submitCodeDto.stdin) ?? null,
        judge0Response: testCaseResults as any,
        status: finalStatus,
      },
    });

    this.logger.log(
      `Evaluation complete for problem ${problemId}. Final status: ${finalStatus}, Score: ${score}`,
    );

    return {
      submissionId: dbResponse.id,
      finalStatus,
      score,
      passedCount,
      totalCases: testCases.length,
      results: testCaseResults.map((r) => ({
        status: r.status.description,
        input: r.testCaseInput,
        output: this.decodeBase64(r.stdout),
        expected: this.decodeBase64(r.expected_output),
        error: this.decodeBase64(r.stderr || r.compile_output || r.message),
      })),
    };
  }

  private async executeCode(payload: any): Promise<Judge0Result> {
    const maxRetries = 3;
    let attempt = 0;

    // RapidAPI headers
    const headers = {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': this.rapidApiKey,
      'X-RapidAPI-Host': this.rapidApiHost,
    };

    while (attempt < maxRetries) {
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
        
        // Poll for results with wait parameter
        const resultResponse = await firstValueFrom(
          this.httpService.get(
            `${this.rapidApiUrl}/submissions/${token}?base64_encoded=true&fields=*`,
            { headers },
          ),
        );

        // If status is still processing, wait a bit more
        let result = resultResponse.data;
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
        this.logger.error(`RapidAPI Judge0 error (attempt ${attempt + 1}): ${error.message}`, error.stack);
        
        if (error.response?.status === 429) {
          attempt++;
          if (attempt === maxRetries) {
            throw new HttpException(
              'RapidAPI rate limit exceeded. Please try again later.',
              HttpStatus.TOO_MANY_REQUESTS,
            );
          }
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
          continue;
        }
        
        if (error.response?.status === 401) {
          throw new HttpException(
            'Invalid RapidAPI key. Please check your configuration.',
            HttpStatus.UNAUTHORIZED,
          );
        }
        
        if (error.response?.status === 403) {
          throw new HttpException(
            'RapidAPI subscription issue. Please check your subscription.',
            HttpStatus.FORBIDDEN,
          );
        }
        
        throw new HttpException(
          error.response?.data?.message || 'Could not connect to Judge0 service via RapidAPI.',
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
    
    throw new HttpException(
      'Failed to connect to Judge0 via RapidAPI after retries.',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

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

  private encodeBase64 = (s: string | null | undefined): string | null =>
    s ? Buffer.from(s).toString('base64') : null;
  private decodeBase64 = (s: string | null | undefined): string | null =>
    s ? Buffer.from(s, 'base64').toString('utf-8') : null;
}