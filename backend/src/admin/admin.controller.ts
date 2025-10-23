import { 
  Controller, 
  Get, 
  UseGuards, 
  Query,
  Param,
  ParseIntPipe,
  UseInterceptors,
  HttpStatus,
  HttpCode,
  HttpException,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { GetUser } from '../auth/decorators/user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { 
  SuperAdminStats, 
  InstitutionAdminStats, 
  StatsTimeRangeDto 
} from './dto/admin-stats.dto';

/**
 * Controller for handling administrative endpoints.
 * Provides dashboard statistics and management capabilities.
 */
@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  
  /**
   * Retrieves comprehensive dashboard statistics
   */
  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @UseInterceptors(CacheInterceptor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get dashboard statistics',
    description: 'Returns role-specific dashboard statistics for admins' 
  })
  @ApiQuery({ 
    name: 'startDate', 
    required: false, 
    type: Date, 
    description: 'Start date for statistics range' 
  })
  @ApiQuery({ 
    name: 'endDate', 
    required: false, 
    type: Date, 
    description: 'End date for statistics range' 
  })
  @ApiQuery({ 
    name: 'range', 
    required: false, 
    enum: ['day', 'week', 'month', 'quarter', 'year'], 
    description: 'Predefined time range' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statistics retrieved successfully',
    content: {
      'application/json': {
        schema: {
          oneOf: [
            { $ref: '#/components/schemas/SuperAdminStats' },
            { $ref: '#/components/schemas/InstitutionAdminStats' },
          ],
        },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions' 
  })
  @ApiResponse({ 
    status: HttpStatus.SERVICE_UNAVAILABLE, 
    description: 'Database temporarily unavailable' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Internal server error' 
  })
  async getDashboardStats(
    @GetUser() user: JwtPayload,
    @Query(new ValidationPipe({ 
      transform: true, 
      whitelist: true, 
      forbidNonWhitelisted: false,
      skipMissingProperties: true,
    })) timeRange?: StatsTimeRangeDto,
  ) {
    try {
      this.logger.log(
        `Fetching dashboard stats for user ${user.email} (${user.role})${
          timeRange?.range ? ` with range: ${timeRange.range}` : ''
        }`
      );

      const stats = await this.adminService.getDashboardStats(user, timeRange);

      this.logger.log(`Successfully fetched stats for ${user.email}`);
      
      return {
        success: true,
        data: stats,
      };
    } catch (error: any) {
      this.logger.error(
        `Error fetching dashboard stats for ${user.email}: ${error.message}`,
        error.stack
      );

      // Handle database connection errors
      if (error.code === 'P1001') {
        throw new HttpException(
          {
            success: false,
            message: 'Database temporarily unavailable. Please try again in a moment.',
            error: 'DATABASE_UNAVAILABLE',
            details: 'The database server is not responding. It may be paused or restarting.',
            timestamp: new Date().toISOString(),
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Handle Prisma timeout errors
      if (error.code === 'P1008') {
        throw new HttpException(
          {
            success: false,
            message: 'Database operation timed out. Please try again.',
            error: 'DATABASE_TIMEOUT',
            timestamp: new Date().toISOString(),
          },
          HttpStatus.REQUEST_TIMEOUT,
        );
      }

      // Re-throw HTTP exceptions
      if (error.status) {
        throw error;
      }

      // Generic error fallback
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch dashboard statistics',
          error: error.message || 'UNKNOWN_ERROR',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get detailed user analytics (Super Admin only)
   */
  @Get('analytics/users')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get user analytics',
    description: 'Detailed user analytics and trends (Super Admin only)' 
  })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User analytics retrieved successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.SERVICE_UNAVAILABLE, 
    description: 'Database temporarily unavailable' 
  })
  async getUserAnalytics(
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    try {
      this.logger.log('Fetching user analytics');
      const analytics = await this.adminService.getUserAnalytics(startDate, endDate);
      
      return {
        success: true,
        data: analytics,
      };
    } catch (error: any) {
      this.logger.error(`Error fetching user analytics: ${error.message}`);
      
      if (error.code === 'P1001') {
        throw new HttpException(
          {
            success: false,
            message: 'Database temporarily unavailable',
            error: 'DATABASE_UNAVAILABLE',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      
      throw error;
    }
  }

  /**
   * Get assessment performance analytics
   */
  @Get('analytics/assessments')
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get assessment analytics',
    description: 'Performance analytics for assessments' 
  })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ 
    name: 'range', 
    required: false, 
    enum: ['day', 'week', 'month', 'quarter', 'year'] 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Assessment analytics retrieved successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.SERVICE_UNAVAILABLE, 
    description: 'Database temporarily unavailable' 
  })
  async getAssessmentAnalytics(
    @GetUser() user: JwtPayload,
    @Query(new ValidationPipe({ 
      transform: true, 
      whitelist: true, 
      forbidNonWhitelisted: false,
      skipMissingProperties: true,
    })) timeRange?: StatsTimeRangeDto,
  ) {
    try {
      this.logger.log(`Fetching assessment analytics for ${user.email}`);
      const analytics = await this.adminService.getAssessmentAnalytics(user, timeRange);
      
      return {
        success: true,
        data: analytics,
      };
    } catch (error: any) {
      this.logger.error(`Error fetching assessment analytics: ${error.message}`);
      
      if (error.code === 'P1001') {
        throw new HttpException(
          {
            success: false,
            message: 'Database temporarily unavailable',
            error: 'DATABASE_UNAVAILABLE',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      
      throw error;
    }
  }

  /**
   * Get institution-specific statistics (Super Admin only)
   */
  @Get('institutions/:id/stats')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get institution statistics',
    description: 'Detailed statistics for a specific institution (Super Admin only)' 
  })
  @ApiParam({ name: 'id', type: Number, description: 'Institution ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Institution statistics retrieved successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Institution not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.SERVICE_UNAVAILABLE, 
    description: 'Database temporarily unavailable' 
  })
  async getInstitutionStats(
    @Param('id', ParseIntPipe) institutionId: number,
  ) {
    try {
      this.logger.log(`Fetching stats for institution ID: ${institutionId}`);
      const stats = await this.adminService.getInstitutionStats(institutionId);
      
      return {
        success: true,
        data: stats,
      };
    } catch (error: any) {
      this.logger.error(`Error fetching institution stats: ${error.message}`);
      
      if (error.code === 'P1001') {
        throw new HttpException(
          {
            success: false,
            message: 'Database temporarily unavailable',
            error: 'DATABASE_UNAVAILABLE',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      
      throw error;
    }
  }

  /**
   * Get platform health metrics
   */
  @Get('health/metrics')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get platform health metrics',
    description: 'System health and performance metrics (Super Admin only)' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Health metrics retrieved successfully' 
  })
  async getHealthMetrics() {
    try {
      this.logger.log('Fetching platform health metrics');
      const metrics = await this.adminService.getHealthMetrics();
      
      return {
        success: true,
        data: metrics,
      };
    } catch (error: any) {
      this.logger.error(`Error fetching health metrics: ${error.message}`);
      
      if (error.code === 'P1001') {
        throw new HttpException(
          {
            success: false,
            message: 'Database temporarily unavailable',
            error: 'DATABASE_UNAVAILABLE',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      
      throw error;
    }
  }

  /**
   * Export statistics as CSV/Excel/JSON
   */
  @Get('export/stats')
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Export statistics',
    description: 'Export dashboard statistics in various formats' 
  })
  @ApiQuery({ 
    name: 'format', 
    enum: ['csv', 'excel', 'json'],
    required: false,
    description: 'Export format (default: json)' 
  })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ 
    name: 'range', 
    required: false, 
    enum: ['day', 'week', 'month', 'quarter', 'year'] 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statistics exported successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.SERVICE_UNAVAILABLE, 
    description: 'Database temporarily unavailable' 
  })
  async exportStats(
    @GetUser() user: JwtPayload,
    @Query('format') format: 'csv' | 'excel' | 'json' = 'json',
    @Query(new ValidationPipe({ 
      transform: true, 
      whitelist: true, 
      forbidNonWhitelisted: false,
      skipMissingProperties: true,
    })) timeRange?: StatsTimeRangeDto,
  ) {
    try {
      this.logger.log(`Exporting stats in ${format} format for ${user.email}`);
      const exportedData = await this.adminService.exportStats(user, format, timeRange);
      
      return {
        success: true,
        format,
        data: exportedData,
        generatedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(`Error exporting stats: ${error.message}`);
      
      if (error.code === 'P1001') {
        throw new HttpException(
          {
            success: false,
            message: 'Database temporarily unavailable',
            error: 'DATABASE_UNAVAILABLE',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      
      throw error;
    }
  }

  /**
   * Quick database connectivity test
   */
  
}