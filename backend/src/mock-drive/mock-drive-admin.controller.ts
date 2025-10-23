import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { MockDriveAdminService } from './mock-drive-admin.service';
import { CreateMockDriveDto } from './dto/create-mock-drive.dto';
import { UpdateMockDriveDto } from './dto/update-mock-drive.dto';
import { QueryMockDriveDto } from './dto/query-mock-drive.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { InstitutionOwnershipGuard } from './guards/institution-ownership.guard';
import { MockDriveQuestionService } from './services/mock-drive-question.service';

@ApiTags('Mock Drive Admin')
@ApiBearerAuth()
@Controller('admin/mock-drives')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.INSTITUTION_ADMIN, Role.SUPER_ADMIN)
export class MockDriveAdminController {
  constructor(private readonly mockDriveAdminService: MockDriveAdminService,
    private readonly questionService: MockDriveQuestionService,) {}

  @Post()
  @ApiOperation({ summary: 'Create a new mock drive' })
  @ApiResponse({ status: 201, description: 'Mock drive created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createMockDriveDto: CreateMockDriveDto,
  ) {
    return this.mockDriveAdminService.create(userId, createMockDriveDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all mock drives for institution' })
  @ApiResponse({ status: 200, description: 'Returns paginated mock drives' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: QueryMockDriveDto,
  ) {
    return this.mockDriveAdminService.findAll(userId, query);
  }

  // ⚠️ FIXED: Static routes BEFORE dynamic routes
  @Get(':id')
  @ApiOperation({ summary: 'Get mock drive by ID' })
  @ApiResponse({ status: 200, description: 'Returns mock drive details' })
  @ApiResponse({ status: 404, description: 'Mock drive not found' })
  @UseGuards(InstitutionOwnershipGuard)
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.mockDriveAdminService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update mock drive' })
  @ApiResponse({ status: 200, description: 'Mock drive updated successfully' })
  @ApiResponse({ status: 404, description: 'Mock drive not found' })
  @UseGuards(InstitutionOwnershipGuard)
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateMockDriveDto: UpdateMockDriveDto,
  ) {
    return this.mockDriveAdminService.update(userId, id, updateMockDriveDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete mock drive' })
  @ApiResponse({ status: 204, description: 'Mock drive deleted successfully' })
  @ApiResponse({ status: 404, description: 'Mock drive not found' })
  @UseGuards(InstitutionOwnershipGuard)
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.mockDriveAdminService.remove(userId, id);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish mock drive' })
  @ApiResponse({ status: 200, description: 'Mock drive published successfully' })
  @UseGuards(InstitutionOwnershipGuard)
  async publish(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.mockDriveAdminService.publish(userId, id);
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish mock drive' })
  @ApiResponse({ status: 200, description: 'Mock drive unpublished successfully' })
  @UseGuards(InstitutionOwnershipGuard)
  async unpublish(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.mockDriveAdminService.unpublish(userId, id);
  }
@Post(':id/generate-questions')
  @UseGuards(InstitutionOwnershipGuard)
  @ApiOperation({ summary: 'Generate questions for mock drive using AI' })
  @ApiResponse({ status: 200, description: 'Questions generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or generation failed' })
  async generateQuestions(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.questionService.generateQuestionsForMockDrive(id, userId);
  }

  @Post(':id/regenerate-questions')
  @UseGuards(InstitutionOwnershipGuard)
  @ApiOperation({ summary: 'Regenerate questions (only in DRAFT status)' })
  @ApiResponse({ status: 200, description: 'Questions regenerated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot regenerate after publishing' })
  async regenerateQuestions(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { component: 'aptitude' | 'machine' | 'all' },
  ) {
    return this.questionService.regenerateQuestions(id, userId, body.component);
  }

  @Get(':id/questions-preview')
  @UseGuards(InstitutionOwnershipGuard)
  @ApiOperation({ summary: 'Preview generated questions' })
  @ApiResponse({ status: 200, description: 'Returns questions preview' })
  async getQuestionsPreview(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.questionService.getQuestionsPreview(id, userId);
  }
}


