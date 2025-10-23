import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { MockDriveBatchService } from '../services/mock-drive-batch.service';
import { CreateBatchDto } from '../dto/create-batch.dto';
import { UpdateBatchDto } from '../dto/update-batch.dto';
import { AssignStudentsToBatchDto } from '../dto/assign-students-batch.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Mock Drive Batch Management')
@ApiBearerAuth()
@Controller('admin/mock-drives/:mockDriveId/batches')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.INSTITUTION_ADMIN, Role.SUPER_ADMIN)
export class MockDriveBatchController {
  constructor(private readonly batchService: MockDriveBatchService) {}

  @Post()
  @ApiOperation({ summary: 'Create a batch for mock drive' })
  @ApiResponse({ status: 201, description: 'Batch created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createBatch(
    @CurrentUser('id') userId: string,
    @Param('mockDriveId') mockDriveId: string,
    @Body() createBatchDto: CreateBatchDto,
  ) {
    return this.batchService.createBatch(userId, mockDriveId, createBatchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all batches for a mock drive' })
  @ApiResponse({ status: 200, description: 'Returns all batches' })
  async getBatches(
    @CurrentUser('id') userId: string,
    @Param('mockDriveId') mockDriveId: string,
  ) {
    return this.batchService.getBatches(userId, mockDriveId);
  }

  // ✅ FIXED: Static route BEFORE dynamic :batchId
  @Get('unassigned-students')
  @ApiOperation({ summary: 'Get unassigned registered students' })
  @ApiResponse({ status: 200, description: 'Returns unassigned students' })
  async getUnassignedStudents(
    @CurrentUser('id') userId: string,
    @Param('mockDriveId') mockDriveId: string,
  ) {
    return this.batchService.getUnassignedStudents(userId, mockDriveId);
  }

  @Get(':batchId')
  @ApiOperation({ summary: 'Get batch details' })
  @ApiResponse({ status: 200, description: 'Returns batch details' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async getBatch(
    @CurrentUser('id') userId: string,
    @Param('mockDriveId') mockDriveId: string,
    @Param('batchId') batchId: string,
  ) {
    return this.batchService.getBatch(userId, mockDriveId, batchId);
  }

  @Patch(':batchId')
  @ApiOperation({ summary: 'Update batch' })
  @ApiResponse({ status: 200, description: 'Batch updated successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async updateBatch(
    @CurrentUser('id') userId: string,
    @Param('mockDriveId') mockDriveId: string,
    @Param('batchId') batchId: string,
    @Body() updateBatchDto: UpdateBatchDto,
  ) {
    return this.batchService.updateBatch(
      userId,
      mockDriveId,
      batchId,
      updateBatchDto,
    );
  }

  @Delete(':batchId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete batch' })
  @ApiResponse({ status: 200, description: 'Batch deleted successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async deleteBatch(
    @CurrentUser('id') userId: string,
    @Param('mockDriveId') mockDriveId: string,
    @Param('batchId') batchId: string,
  ) {
    return this.batchService.deleteBatch(userId, mockDriveId, batchId);
  }

  @Post(':batchId/assign-students')
  @ApiOperation({ summary: 'Assign students to batch' })
  @ApiResponse({ status: 200, description: 'Students assigned successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async assignStudents(
    @CurrentUser('id') userId: string,
    @Param('mockDriveId') mockDriveId: string,
    @Param('batchId') batchId: string,
    @Body() assignDto: AssignStudentsToBatchDto,
  ) {
    return this.batchService.assignStudents(
      userId,
      mockDriveId,
      batchId,
      assignDto.studentIds,
    );
  }

  @Delete(':batchId/students/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove student from batch' })
  @ApiResponse({ status: 200, description: 'Student removed successfully' })
  async removeStudent(
    @CurrentUser('id') userId: string,
    @Param('mockDriveId') mockDriveId: string,
    @Param('batchId') batchId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.batchService.removeStudent(
      userId,
      mockDriveId,
      batchId,
      studentId,
    );
  }
}