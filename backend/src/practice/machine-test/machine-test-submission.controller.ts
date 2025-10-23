import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { MachineTestSubmissionService } from './machine-test-submission.service';
import { SubmitCodeDto } from './dto/submit-code.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
// --- UPDATE: Using the standardized decorator and interface ---
import { GetUser } from 'src/auth/decorators/user.decorator';
import type { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

/**
 * Controller for handling code submissions for machine test problems.
 */
@ApiBearerAuth()
@ApiTags('Practice - Machine Test Submission')
@Controller('machine-test-submission')
@UseGuards(JwtAuthGuard)
export class MachineTestSubmissionController {
  constructor(
    private readonly submissionService: MachineTestSubmissionService,
  ) {}

  /**
   * Submits code for a specific problem within a machine test for evaluation.
   * @route POST /machine-test-submission/submit/:problemId
   * @param problemId - The ID of the problem being answered.
   * @param submitCodeDto - The DTO containing the source code, language, and test ID.
   * @param user - The JWT payload of the authenticated user, injected by the decorator.
   * @returns The detailed results of the code evaluation.
   */
  @Post('submit/:problemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit code for a machine test problem and get results',
  })
  @ApiResponse({ status: 200, description: 'Code evaluated successfully.' })
  @ApiResponse({ status: 404, description: 'Problem not found.' })
  submitCode(
    @Param('problemId', ParseIntPipe) problemId: number,
    @Body() submitCodeDto: SubmitCodeDto,
    // --- UPDATE: Using the standard GetUser decorator for consistency and type safety ---
    @GetUser() user: JwtPayload,
  ) {
    // Pass the user ID from the JWT payload's 'sub' property to the service.
    return this.submissionService.submitAndEvaluate(
      problemId,
      submitCodeDto.machineTestId,
      user.sub,
      submitCodeDto,
    );
  }
}
