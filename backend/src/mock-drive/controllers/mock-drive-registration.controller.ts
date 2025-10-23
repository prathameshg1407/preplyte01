import {
  Controller,
  Get,
  Post,
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
import { MockDriveRegistrationService } from '../services/mock-drive-registration.service';
import { MockDriveBatchService } from '../services/mock-drive-batch.service';
import { RegisterMockDriveDto } from '../dto/register-mock-drive.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Mock Drive Registration (Student)')
@ApiBearerAuth()
@Controller('mock-drives')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class MockDriveRegistrationController {
  constructor(
    private readonly registrationService: MockDriveRegistrationService,
    private readonly batchService: MockDriveBatchService, // ✅ FIXED: Proper injection
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register for a mock drive' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Not eligible or already registered' })
  async register(
    @CurrentUser('id') userId: string,
    @Body() registerDto: RegisterMockDriveDto,
  ) {
    return this.registrationService.registerForMockDrive(
      userId,
      registerDto.mockDriveId,
    );
  }

  @Get('my-registrations')
  @ApiOperation({ summary: 'Get my mock drive registrations' })
  @ApiResponse({ status: 200, description: 'Returns user registrations' })
  async getMyRegistrations(@CurrentUser('id') userId: string) {
    return this.registrationService.getMyRegistrations(userId);
  }

  @Delete('registrations/:registrationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel registration' })
  @ApiResponse({ status: 200, description: 'Registration cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  async cancelRegistration(
    @CurrentUser('id') userId: string,
    @Param('registrationId') registrationId: string,
  ) {
    return this.registrationService.cancelRegistration(userId, registrationId);
  }

  @Get(':id/eligibility')
  @ApiOperation({ summary: 'Check eligibility for a mock drive' })
  @ApiResponse({ status: 200, description: 'Returns eligibility status' })
  async checkEligibility(
    @CurrentUser('id') userId: string,
    @Param('id') mockDriveId: string,
  ) {
    return this.registrationService.checkEligibility(userId, mockDriveId);
  }

  @Get(':id/my-batch')
  @ApiOperation({ summary: 'Get my assigned batch for a mock drive' })
  @ApiResponse({ status: 200, description: 'Returns batch details' })
  @ApiResponse({ status: 404, description: 'Not assigned to any batch' })
  async getMyBatch(
    @CurrentUser('id') userId: string,
    @Param('id') mockDriveId: string,
  ) {
    // ✅ FIXED: Use properly injected service
    return this.batchService.getMyBatch(userId, mockDriveId);
  }
}