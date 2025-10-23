import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { MockDriveService } from './mock-drive.service';
import { QueryMockDriveDto } from './dto/query-mock-drive.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Mock Drives (Student View)')
@ApiBearerAuth()
@Controller('mock-drives')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class MockDriveController {
  constructor(private readonly mockDriveService: MockDriveService) {}

  @Get()
  @ApiOperation({ summary: 'Get available mock drives for student' })
  @ApiResponse({ status: 200, description: 'Returns available mock drives' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: QueryMockDriveDto,
  ) {
    return this.mockDriveService.findAllForStudent(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get mock drive details' })
  @ApiResponse({ status: 200, description: 'Returns mock drive details' })
  @ApiResponse({ status: 404, description: 'Mock drive not found' })
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.mockDriveService.findOneForStudent(userId, id);
  }
}