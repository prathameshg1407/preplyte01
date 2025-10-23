import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AptitudeService } from './aptitude.service';
import {
  CheckAnswerDto,
  SubmitPracticeAptitudeDto,  GetRandomQuestionsDto,
} from './dto/aptitude.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
// --- UPDATE: Using the standardized decorator and interface ---
import { GetUser } from '../../auth/decorators/user.decorator';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

/**
 * Controller for handling practice aptitude tests.
 */
@ApiBearerAuth()
@ApiTags('Practice - Aptitude')
@Controller('aptitude')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AptitudeController {
  private readonly logger = new Logger(AptitudeController.name);

  constructor(private readonly aptitudeService: AptitudeService) {}

  /**
   * Retrieves the aptitude test history for the currently logged-in student.
   * @route GET /aptitude/history
   * @roles STUDENT
   * @param user - The JWT payload of the authenticated user.
   * @returns The user's aptitude test history.
   */
  @Get('history')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: "Get the logged-in student's aptitude test history" })
  @ApiResponse({ status: 200, description: 'Successfully retrieved aptitude history.' })
  getMyAptitudeHistory(@GetUser() user: JwtPayload) {
    this.logger.log(`Fetching aptitude history for user: ${user.sub}`);
    return this.aptitudeService.getUserAptitudeHistory(user.sub);
  }

  /**
   * Fetches a specified number of random aptitude questions, with optional filters.
   * @route GET /aptitude/random/:count
   * @param count - The number of random questions to fetch.
   * @param query - Optional query parameters for filtering by tags and difficulty.
   * @returns An array of random question objects.
   */
  @Get('random/:count')
  @ApiOperation({ summary: 'Get random aptitude questions' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved random questions.' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  getRandomQuestions(
    @Param('count', ParseIntPipe) count: number,
    @Query() query: GetRandomQuestionsDto,
  ) {
    this.logger.debug(`Fetching ${count} random questions with filters: ${JSON.stringify(query)}`);
    return this.aptitudeService.getRandomQuestions(count, query);
  }

  /**
   * Checks a single answer for correctness without saving the result.
   * @route POST /aptitude/check-answer
   * @param checkAnswerDto - The question ID and the user's selected answer.
   * @returns An object indicating if the answer was correct and the correct answer text.
   */
  @Post('check-answer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check a single aptitude answer' })
  @ApiResponse({ status: 200, description: 'Answer checked successfully.' })
  checkAnswer(@Body() checkAnswerDto: CheckAnswerDto) {
    return this.aptitudeService.checkAnswer(checkAnswerDto);
  }

  /**
   * Submits a full aptitude test, calculates the score, and saves the results.
   * @route POST /aptitude/submit
   * @param submitAptitudeDto - The complete set of answers and test metadata.
   * @param user - The JWT payload of the authenticated user.
   * @returns The final results of the test, including score and percentage.
   */
  @Post('submit')
  @ApiOperation({ summary: 'Submit aptitude test answers' })
  @ApiResponse({ status: 201, description: 'Test submitted and results returned.' })
  submitAptitudeTest(
    @Body() SubmitPracticeAptitudeDto: SubmitPracticeAptitudeDto,
    @GetUser() user: JwtPayload,
  ) {
    this.logger.log(`Processing test submission for user: ${user.sub}`);
    return this.aptitudeService.submitAptitudeTest(SubmitPracticeAptitudeDto, user.sub);
  }
}
