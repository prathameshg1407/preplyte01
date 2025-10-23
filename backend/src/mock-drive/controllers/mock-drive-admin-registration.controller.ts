import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { MockDriveRegistrationService } from '../services/mock-drive-registration.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Mock Drive Admin - Registrations')
@ApiBearerAuth()
@Controller('admin/mock-drives')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.INSTITUTION_ADMIN, Role.SUPER_ADMIN)
export class MockDriveAdminRegistrationController {
  constructor(
    private readonly registrationService: MockDriveRegistrationService,
  ) {}

  // ✅ FIXED: Moved to proper admin path
  @Get(':mockDriveId/registrations')
  @ApiOperation({ summary: 'Get all registrations for a mock drive' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns paginated registrations' })
  async getRegistrations(
    @CurrentUser('id') userId: string,
    @Param('mockDriveId') mockDriveId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    // ✅ FIXED: Delegate to service instead of inline Prisma queries
    return this.registrationService.getRegistrationsForAdmin(
      userId,
      mockDriveId,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
      },
    );
  }
}