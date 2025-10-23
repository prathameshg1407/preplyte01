import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MachineTestProblemsService } from './machine-test-problems.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { QuestionDifficulty } from '@prisma/client';

/**
 * Controller for browsing and viewing machine test (coding) problems.
 */
@ApiBearerAuth()
@ApiTags('Practice - Machine Test Problems')
@Controller('machine-test-problems')
@UseGuards(JwtAuthGuard)
export class MachineTestProblemsController {
  constructor(
    private readonly machineTestProblemsService: MachineTestProblemsService,
  ) {}

  /**
   * Retrieves a list of all available machine test problems, with optional filters.
   * @route GET /machine-test-problems
   * @param difficulty - Optional filter for problem difficulty.
   * @param count - Optional limit for the number of problems to return.
   * @returns An array of machine test problems.
   */
  @Get()
  @ApiOperation({
    summary: 'Get all machine test problems with optional filters',
  })
  @ApiResponse({ status: 200, description: 'Successfully retrieved problems.' })
  @ApiQuery({
    name: 'difficulty',
    required: false,
    description: 'Filter problems by difficulty level.',
    enum: QuestionDifficulty,
  })
  @ApiQuery({
    name: 'count',
    required: false,
    description: 'Limit the number of problems returned.',
    type: Number,
  })
  findAll(
    @Query('difficulty') difficulty?: QuestionDifficulty,
    @Query('count', new ParseIntPipe({ optional: true })) count?: number,
  ) {
    return this.machineTestProblemsService.findAll({ difficulty, count });
  }

  /**
   * Retrieves a single machine test problem by its unique ID.
   * @route GET /machine-test-problems/:id
   * @param id - The ID of the problem to retrieve.
   * @returns A single machine test problem object.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single machine test problem by ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved the problem.',
  })
  @ApiResponse({ status: 404, description: 'Problem not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.machineTestProblemsService.findOne(id);
  }
}
