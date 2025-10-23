import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { MachineTestService } from './machine-test.service';
import { GenerateTestDto } from './dto/generate-test.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
// --- UPDATE: Using the standardized decorator and interface ---
import { GetUser } from '../../auth/decorators/user.decorator';
import type { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

/**
 * Controller for generating and retrieving machine test sessions.
 */
@ApiBearerAuth()
@ApiTags('Practice - Machine Test')
@Controller('machine-test')
@UseGuards(JwtAuthGuard)
export class MachineTestController {
  constructor(private readonly machineTestService: MachineTestService) {}

  /**
   * Generates a new machine test for the authenticated user.
   * @route POST /machine-test/generate
   * @param generateTestDto - The desired difficulty and number of questions.
   * @param user - The JWT payload of the authenticated user.
   * @returns The newly created machine test object with its problems.
   */
  @Post('generate')
  @ApiOperation({
    summary: 'Generate a new machine test for the authenticated user',
  })
  @ApiResponse({ status: 201, description: 'Test generated successfully.' })
  @ApiResponse({
    status: 404,
    description: 'Not enough questions available for the requested difficulty.',
  })
  generateTest(
    @Body() generateTestDto: GenerateTestDto,
    @GetUser() user: JwtPayload,
  ) {
    return this.machineTestService.generateTest(user.sub, generateTestDto);
  }

  /**
   * Retrieves the details of a specific machine test owned by the authenticated user.
   * @route GET /machine-test/:id
   * @param id - The ID of the machine test to retrieve.
   * @param user - The JWT payload of the authenticated user.
   * @returns The machine test object with its problems.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get the details of a specific machine test owned by the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved the test details.',
  })
  @ApiResponse({ status: 404, description: 'Test not found for this user.' })
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.machineTestService.findOne(id, user.sub);
  }
}
