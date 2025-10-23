import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MockDriveAttemptService, TestComponent, ComponentStatus } from '../services/mock-drive-attempt.service';
import { MockDriveAiInterviewService } from '../services/mock-drive-ai-interview.service';
import { MockDriveMachineTestService } from '../services/mock-drive-machine-test.service';
import { MockDriveAptitudeService } from '../services/mock-drive-aptitude.service';
import { CompleteAttemptDto } from '../dto/complete-attempt.dto';
import { StartMockDriveInterviewBodyDto, SubmitMockDriveAnswerDto } from '../dto/mock-drive-interview.dto';
import { SubmitCodeDto } from '../../practice/machine-test/dto/submit-code.dto';
import { SubmitAptitudeDto } from '../dto/submit-aptitude.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Mock Drive Attempts')
@ApiBearerAuth()
@Controller('mock-drives')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MockDriveAttemptController {
  constructor(
    private readonly attemptService: MockDriveAttemptService,
    private readonly aiInterviewService: MockDriveAiInterviewService,
    private readonly machineTestService: MockDriveMachineTestService,
    private readonly aptitudeService: MockDriveAptitudeService,
  ) {}

  // ============================================================================
  // ATTEMPT MANAGEMENT ROUTES
  // ============================================================================

  @Post(':mockDriveId/start')
  @Roles(Role.STUDENT)
  @ApiOperation({ 
    summary: 'Start mock drive - automatically starts first test',
    description: 'Initiates mock drive and automatically starts with the first test component. Tests flow sequentially: Aptitude → Coding → AI Interview → Results'
  })
  @ApiParam({ name: 'mockDriveId', description: 'Mock drive ID' })
  @ApiResponse({ status: 201, description: 'Mock drive started, first test component loaded' })
  @ApiResponse({ status: 400, description: 'Already have an active attempt or invalid request' })
  @ApiResponse({ status: 403, description: 'Not registered or batch time not active' })
  @ApiResponse({ status: 404, description: 'Mock drive not found' })
  async startAttempt(
    @CurrentUser('id') userId: string,
    @Param('mockDriveId') mockDriveId: string,
  ) {
    return this.attemptService.startAttempt(userId, mockDriveId);
  }

  @Get(':mockDriveId/attempt/current')
  @Roles(Role.STUDENT)
  @ApiOperation({ 
    summary: 'Get current attempt with component status',
    description: 'Returns current attempt and which test component should be shown'
  })
  @ApiParam({ name: 'mockDriveId', description: 'Mock drive ID' })
  @ApiResponse({ status: 200, description: 'Returns current attempt with component status' })
  async getCurrentAttempt(
    @CurrentUser('id') userId: string,
    @Param('mockDriveId') mockDriveId: string,
  ) {
    return this.attemptService.getCurrentAttempt(userId, mockDriveId);
  }

  @Get('attempts/:attemptId/component-status')
  @Roles(Role.STUDENT)
  @ApiOperation({ 
    summary: 'Get current component status',
    description: 'Returns which test component should be shown currently'
  })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiResponse({ status: 200, description: 'Returns current component status' })
  async getComponentStatus(
    @Param('attemptId') attemptId: string,
  ) {
    return this.attemptService.getCurrentComponentStatus(attemptId);
  }

  @Post('attempts/:attemptId/next-component')
  @Roles(Role.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Move to next component',
    description: 'Automatically moves to next test component after completing current one'
  })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiResponse({ status: 200, description: 'Moved to next component' })
  @ApiResponse({ status: 400, description: 'Current component not completed' })
  async moveToNextComponent(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
  ) {
    return this.attemptService.moveToNextComponent(attemptId, userId);
  }

  @Get('my-attempts')
  @Roles(Role.STUDENT)
  @ApiOperation({ 
    summary: 'Get all my mock drive attempts',
    description: 'Returns all mock drive attempts for the current user'
  })
  @ApiResponse({ status: 200, description: 'Returns all user attempts' })
  async getMyAttempts(
    @CurrentUser('id') userId: string,
  ) {
    return this.attemptService.getMyAttempts(userId);
  }

  @Get('attempts/:attemptId')
  @Roles(Role.STUDENT, Role.INSTITUTION_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Get attempt details',
    description: 'Returns detailed information about a specific attempt'
  })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiResponse({ status: 200, description: 'Returns attempt details with component status' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  async getAttemptDetails(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
  ) {
    return this.attemptService.getAttemptDetails(attemptId, userId);
  }

  @Get('attempts/:attemptId/progress')
  @Roles(Role.STUDENT)
  @ApiOperation({ 
    summary: 'Get attempt progress',
    description: 'Returns progress across all test components'
  })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiResponse({ status: 200, description: 'Returns comprehensive progress information' })
  async getAttemptProgress(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
  ) {
    return this.attemptService.getAttemptProgress(attemptId, userId);
  }

  @Post('attempts/:attemptId/complete')
  @Roles(Role.STUDENT)
  @ApiOperation({ 
    summary: '[AUTO] Complete mock drive',
    description: 'Auto-completes when all tests are done. Usually called automatically.'
  })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiResponse({ status: 200, description: 'Attempt completed with results' })
  @ApiResponse({ status: 400, description: 'Cannot complete - tests incomplete' })
  async completeAttempt(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
    @Body() dto: CompleteAttemptDto,
  ) {
    return this.attemptService.completeAttempt(attemptId, userId, dto);
  }

  @Post('attempts/:attemptId/abandon')
  @Roles(Role.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Abandon attempt',
    description: 'Abandons the current attempt. Cannot be resumed.'
  })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiResponse({ status: 200, description: 'Attempt abandoned' })
  async abandonAttempt(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
  ) {
    return this.attemptService.abandonAttempt(attemptId, userId);
  }

  // ============================================================================
  // APTITUDE TEST ROUTES (Auto-shown when it's the current component)
  // ============================================================================

  @Get('attempts/:attemptId/aptitude')
  @Roles(Role.STUDENT)
  @ApiOperation({ 
    summary: 'Get aptitude test',
    description: 'Auto-starts and returns questions if not started. Returns results if completed.'
  })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiResponse({ status: 200, description: 'Returns aptitude test questions or results' })
  async getAptitudeTest(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
  ) {
    return this.aptitudeService.getAptitudeTest(userId, attemptId);
  }

  @Post('attempts/:attemptId/aptitude/submit')
  @Roles(Role.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Submit aptitude answers',
    description: 'Submits answers and automatically moves to next component'
  })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiResponse({ status: 200, description: 'Answers submitted, next component ready' })
  async submitAptitudeTest(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
    @Body() submitAptitudeDto: SubmitAptitudeDto,
  ) {
    const result = await this.aptitudeService.submitAptitudeTest(
      userId,
      attemptId,
      submitAptitudeDto,
    );

    // Auto-move to next component
    const nextComponent = await this.attemptService.moveToNextComponent(attemptId, userId);

    return {
      ...result,
      nextComponent,
    };
  }

  @Get('attempts/:attemptId/aptitude/results')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get aptitude results' })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiResponse({ status: 200, description: 'Returns detailed results' })
  async getAptitudeResults(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
  ) {
    return this.aptitudeService.getAptitudeResults(userId, attemptId);
  }

  @Get('attempts/:attemptId/aptitude/stats')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get aptitude statistics' })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiResponse({ status: 200, description: 'Returns statistics' })
  async getAptitudeStats(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
  ) {
    return this.aptitudeService.getAptitudeStats(userId, attemptId);
  }

  // ============================================================================
  // MACHINE TEST ROUTES (Auto-shown after aptitude)
  // ============================================================================

  @Get('attempts/:attemptId/machine-test')
  @Roles(Role.STUDENT)
  @ApiOperation({ 
    summary: 'Get coding problems',
    description: 'Auto-starts and returns problems if not started'
  })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiResponse({ status: 200, description: 'Returns coding problems' })
  async getMachineTest(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
  ) {
    return this.machineTestService.getMachineTestDetails(userId, attemptId);
  }

  @Post('attempts/:attemptId/machine-test/submit/:problemId')
  @Roles(Role.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Submit code solution',
    description: 'Submits code for evaluation. Auto-moves to next component after all problems attempted.'
  })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiParam({ name: 'problemId', description: 'Problem ID (cuid)', type: String })
  @ApiResponse({ status: 200, description: 'Code evaluated' })
  async submitCode(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
    @Param('problemId') problemId: string,
    @Body() submitCodeDto: SubmitCodeDto,
  ) {
    const result = await this.machineTestService.submitCode(
      userId,
      attemptId,
      problemId,
      submitCodeDto,
    );

    // Check if should move to next component
    const componentStatus = await this.attemptService.getCurrentComponentStatus(attemptId);

    return {
      ...result,
      componentStatus,
    };
  }

  @Get('attempts/:attemptId/machine-test/problem/:problemId/submissions')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get problem submissions' })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiParam({ name: 'problemId', description: 'Problem ID', type: String })
  @ApiResponse({ status: 200, description: 'Returns submissions' })
  async getProblemSubmissions(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
    @Param('problemId') problemId: string,
  ) {
    return this.machineTestService.getProblemSubmissions(userId, attemptId, problemId);
  }

  @Get('attempts/:attemptId/machine-test/submissions')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get all submissions' })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiResponse({ status: 200, description: 'Returns all submissions' })
  async getAllSubmissions(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
  ) {
    return this.machineTestService.getAllSubmissions(userId, attemptId);
  }

  @Get('attempts/:attemptId/machine-test/stats')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get coding statistics' })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiResponse({ status: 200, description: 'Returns statistics' })
  async getMachineTestStats(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
  ) {
    return this.machineTestService.getMachineTestStats(userId, attemptId);
  }

  // ============================================================================
  // AI INTERVIEW ROUTES (Auto-shown after coding test)
  // ============================================================================

 @Post('attempts/:attemptId/ai-interview/start')
@Roles(Role.STUDENT)
@ApiOperation({ summary: 'Start AI interview', description: 'Starts AI interview with resume' })
@ApiParam({ name: 'attemptId', description: 'Attempt ID' })
@ApiResponse({ status: 201, description: 'Interview started' })
async startAiInterview(
  @CurrentUser('id') userId: string,
  @Param('attemptId') attemptId: string,
  @Body() dto: StartMockDriveInterviewBodyDto, // only resumeId now
) {
  return this.aiInterviewService.startMockDriveInterview(userId, attemptId, dto.resumeId);
}

  @Get('attempts/:attemptId/ai-interview/session')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get interview session' })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiResponse({ status: 200, description: 'Returns session details' })
  async getAiInterviewSession(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
  ) {
    return this.aiInterviewService.getCurrentSession(userId, attemptId);
  }

  @Get('attempts/:attemptId/ai-interview/next-question')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get next question' })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiResponse({ status: 200, description: 'Returns next question' })
  async getNextQuestion(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
  ) {
    return this.aiInterviewService.getNextQuestion(userId, attemptId);
  }
@Post('attempts/:attemptId/ai-interview/answer')
@Roles(Role.STUDENT)
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Submit interview answer' })
@ApiParam({ name: 'attemptId', description: 'Attempt ID' })
@ApiResponse({ status: 200, description: 'Answer submitted' })
async submitAiInterviewAnswer(
  @CurrentUser('id') userId: string,
  @Param('attemptId') attemptId: string,
  @Body() dto: SubmitMockDriveAnswerDto, // no attemptId in body anymore
) {
  return this.aiInterviewService.submitAnswer(userId, attemptId, dto);
}

  @Post('attempts/:attemptId/ai-interview/complete')
  @Roles(Role.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Complete interview',
    description: 'Completes interview and auto-completes entire mock drive'
  })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiResponse({ status: 200, description: 'Interview completed, mock drive finished' })
  async completeAiInterview(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
  ) {
    const result = await this.aiInterviewService.completeInterview(userId, attemptId);

    // Auto-complete the entire mock drive
    const finalResult = await this.attemptService.autoCompleteAttempt(attemptId, userId);

    return {
      interview: result,
      mockDrive: finalResult,
    };
  }

  @Get('attempts/:attemptId/ai-interview/feedback')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get interview feedback' })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID' })
  @ApiResponse({ status: 200, description: 'Returns feedback' })
  async getAiInterviewFeedback(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
  ) {
    return this.aiInterviewService.getFeedback(userId, attemptId);
  }

  // ============================================================================
  // DEPRECATED ROUTES
  // ============================================================================

  @Post('attempts/:attemptId/link-aptitude/:responseId')
  @Roles(Role.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[DEPRECATED] Use aptitude/submit instead' })
  async linkAptitudeResponse(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
    @Param('responseId', ParseIntPipe) responseId: number,
  ) {
    return this.attemptService.linkAptitudeResponse(attemptId, userId, responseId);
  }

  @Post('attempts/:attemptId/link-machine-test/:testId')
  @Roles(Role.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[DEPRECATED] Not needed with new flow' })
  async linkMachineTest(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
    @Param('testId', ParseIntPipe) testId: number,
  ) {
    return this.attemptService.linkMachineTest(attemptId, userId, testId);
  }
}