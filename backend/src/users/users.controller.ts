import {
  Controller,
  Get,
  UseGuards,
  Put,
  Param,
  Body,
  Query,
  ValidationPipe,
  UsePipes,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  ParseIntPipe,
  DefaultValuePipe,
  Logger,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, UserStatus, Prisma } from '@prisma/client';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { GetUser } from '../auth/decorators/user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ApiResponse, PaginatedResponse } from 'src/common/interfaces/api-response.interface';
import { BulkUpdateStatusDto } from './dto/bulk-update-status.dto';
import { PasswordResetDto } from './dto/password-reset.dto';
import { TransferUserDto } from './dto/transfer-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * Gets current student's dashboard statistics
   * @route GET /users/stats/me
   */
  @Get('stats/me')
  @Roles(Role.STUDENT)
  async getMyStats(@GetUser() user: JwtPayload): Promise<ApiResponse<any>> {
    this.logger.log(`Fetching stats for student ${user.sub}`);
    
    const stats = await this.usersService.getStudentStats(user.sub);
    
    if (!stats) {
      throw new NotFoundException('Statistics not available for this user');
    }

    return {
      success: true,
      message: 'Statistics retrieved successfully',
      data: stats,
    };
  }

  /**
   * Gets AI interview statistics for current user
   * @route GET /users/ai-interviews/stats
   */
  @Get('ai-interviews/stats')
  @Roles(Role.STUDENT)
  async getMyAiInterviewStats(@GetUser() user: JwtPayload): Promise<ApiResponse<any>> {
    const stats = await this.usersService.getAiInterviewStats(user.sub);

    return {
      success: true,
      message: 'AI interview statistics retrieved successfully',
      data: stats,
    };
  }

  /**
   * Gets paginated list of users (admin only)
   * @route GET /users
   */
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  async findAll(
    @GetUser() loggedInUser: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('role') role?: Role,
    @Query('status') status?: UserStatus,
    @Query('institutionId', new DefaultValuePipe(0), ParseIntPipe) institutionId?: number,
    @Query('search') search?: string,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy: string = 'createdAt',
    @Query('sortOrder', new DefaultValuePipe('desc')) sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<PaginatedResponse<any>> {
    // Validate pagination
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    // Role filter
    if (role && Object.values(Role).includes(role)) {
      where.role = role;
    }

    // Status filter
    if (status && Object.values(UserStatus).includes(status)) {
      where.status = status;
    }

    // Search filter
    if (search && search.trim()) {
      where.OR = [
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { profile: { fullName: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    // Institution filter based on admin role
    if (loggedInUser.role === Role.INSTITUTION_ADMIN) {
      if (!loggedInUser.institutionId) {
        throw new ForbiddenException('You are not associated with an institution');
      }
      where.institutionId = loggedInUser.institutionId;
    } else if (institutionId && institutionId > 0) {
      where.institutionId = institutionId;
    }

    // Build orderBy
    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    const validSortFields = ['createdAt', 'updatedAt', 'email', 'lastLoginAt'];
    
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy as keyof Prisma.UserOrderByWithRelationInput] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const skip = (page - 1) * limit;

    const result = await this.usersService.findAll({
      skip,
      take: limit,
      where,
      orderBy,
    });

    const totalPages = Math.ceil(result.total / limit);

    return {
      success: true,
      message: `Found ${result.total} user(s)`,
      data: result.users,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Gets a specific user's profile
   * @route GET /users/:id
   */
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN, Role.STUDENT)
  async findOne(
    @Param('id') userId: string,
    @GetUser() loggedInUser: JwtPayload,
  ): Promise<ApiResponse<any>> {
    // Authorization checks
    if (loggedInUser.role === Role.STUDENT && loggedInUser.sub !== userId) {
      throw new ForbiddenException('You can only view your own profile');
    }

    if (loggedInUser.role === Role.INSTITUTION_ADMIN) {
      const targetUser = await this.usersService.findOneById(userId);
      if (targetUser.institutionId !== loggedInUser.institutionId) {
        throw new ForbiddenException('User not in your institution');
      }
    }

    const profile = await this.usersService.getFullUserProfile(userId);

    return {
      success: true,
      message: 'User profile retrieved successfully',
      data: profile,
    };
  }

  /**
   * Updates a user's role (super admin only)
   * @route PUT /users/:id/role
   */
  @Put(':id/role')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updateRole(
    @Param('id') userId: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
  ): Promise<ApiResponse<any>> {
    this.logger.log(`Updating role for user ${userId} to ${updateRoleDto.role}`);

    // Prevent self role change
    const user = await this.usersService.findOneById(userId);
    if (user.role === Role.SUPER_ADMIN) {
      throw new BadRequestException('Cannot change role of super admin');
    }

    const updatedUser = await this.usersService.updateUserRole(
      userId,
      updateRoleDto.role,
    );

    return {
      success: true,
      message: `User role updated to ${updateRoleDto.role}`,
      data: updatedUser,
    };
  }

  /**
   * Updates a user's status
   * @route PUT /users/:id/status
   */
  @Put(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updateStatus(
    @Param('id') userId: string,
    @Body() updateStatusDto: UpdateUserStatusDto,
    @GetUser() loggedInUser: JwtPayload,
  ): Promise<ApiResponse<any>> {
    this.logger.log(`Updating status for user ${userId} to ${updateStatusDto.status}`);

    // Authorization check for institution admin
    if (loggedInUser.role === Role.INSTITUTION_ADMIN) {
      const targetUser = await this.usersService.findOneById(userId);
      if (targetUser.institutionId !== loggedInUser.institutionId) {
        throw new ForbiddenException('User not in your institution');
      }

      // Institution admins cannot delete users
      if (updateStatusDto.status === UserStatus.DELETED) {
        throw new ForbiddenException('Institution admins cannot delete users');
      }
    }

    // Prevent self status change
    if (userId === loggedInUser.sub) {
      throw new BadRequestException('Cannot change your own status');
    }

    const updatedUser = await this.usersService.updateUserStatus(
      userId,
      updateStatusDto.status,
    );

    return {
      success: true,
      message: `User status updated to ${updateStatusDto.status}`,
      data: updatedUser,
    };
  }

  /**
   * Gets user statistics by institution (admin only)
   * @route GET /users/stats/by-institution
   */
  @Get('stats/by-institution')
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  async getInstitutionStats(
    @GetUser() loggedInUser: JwtPayload,
    @Query('institutionId', new DefaultValuePipe(0), ParseIntPipe) institutionId?: number,
  ): Promise<ApiResponse<any>> {
    let targetInstitutionId: number | undefined;

    if (loggedInUser.role === Role.INSTITUTION_ADMIN) {
      if (!loggedInUser.institutionId) {
        throw new ForbiddenException('You are not associated with an institution');
      }
      targetInstitutionId = loggedInUser.institutionId;
    } else if (institutionId && institutionId > 0) {
      targetInstitutionId = institutionId;
    }

    // Get aggregated stats
    const stats = await this.usersService.findAll({
      where: targetInstitutionId ? { institutionId: targetInstitutionId } : {},
    });

    // Calculate summary statistics
    const summary = {
      totalUsers: stats.total,
      activeUsers: stats.users.filter(u => u.status === UserStatus.ACTIVE).length,
      pendingUsers: stats.users.filter(u => u.status === UserStatus.PENDING_PROFILE_COMPLETION).length,
      suspendedUsers: stats.users.filter(u => u.status === UserStatus.SUSPENDED).length,
      byRole: {
        students: stats.users.filter(u => u.role === Role.STUDENT).length,
        institutionAdmins: stats.users.filter(u => u.role === Role.INSTITUTION_ADMIN).length,
        superAdmins: stats.users.filter(u => u.role === Role.SUPER_ADMIN).length,
      },
    };

    return {
      success: true,
      message: 'Institution statistics retrieved successfully',
      data: summary,
    };
  }

  /**
   * Searches users by various criteria
   * @route GET /users/search
   */
  @Get('search')
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  async searchUsers(
    @GetUser() loggedInUser: JwtPayload,
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<ApiResponse<any[]>> {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const where: Prisma.UserWhereInput = {
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { profile: { fullName: { contains: query, mode: 'insensitive' } } },
      ],
    };

    if (loggedInUser.role === Role.INSTITUTION_ADMIN) {
      where.institutionId = loggedInUser.institutionId;
    }

    const result = await this.usersService.findAll({
      take: Math.min(limit, 50),
      where,
    });

    return {
      success: true,
      message: `Found ${result.users.length} user(s)`,
      data: result.users,
    };
  }


  /**
   * Bulk update user status
   * @route PUT /users/bulk/status
   */
  @Put('bulk/status')
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @HttpCode(HttpStatus.OK)
  async bulkUpdateStatus(
    @Body() dto: BulkUpdateStatusDto,
    @GetUser() user: JwtPayload,
  ): Promise<ApiResponse<any>> {
    const result = await this.usersService.bulkUpdateStatus(
      dto.userIds,
      dto.status,
      user.sub,
    );

    return {
      success: true,
      message: `Updated ${result.updated} users`,
      data: result,
    };
  }

  /**
   * Get user activity metrics
   * @route GET /users/:id/activity
   */
  @Get(':id/activity')
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  async getUserActivity(
    @Param('id') userId: string,
    @GetUser() loggedInUser: JwtPayload,
  ): Promise<ApiResponse<any>> {
    // Authorization check
    if (loggedInUser.role === Role.INSTITUTION_ADMIN) {
      const user = await this.usersService.findOneById(userId);
      if (user.institutionId !== loggedInUser.institutionId) {
        throw new ForbiddenException('User not in your institution');
      }
    }

    const metrics = await this.usersService.getUserActivityMetrics(userId);

    return {
      success: true,
      message: 'Activity metrics retrieved',
      data: metrics,
    };
  }

  /**
   * Compare user with peers
   * @route GET /users/:id/compare
   */
  @Get(':id/compare')
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN, Role.STUDENT)
  async compareUser(
    @Param('id') userId: string,
    @Query('group') group: 'institution' | 'batch' | 'all' = 'institution',
    @GetUser() loggedInUser: JwtPayload,
  ): Promise<ApiResponse<any>> {
    // Authorization check
    if (loggedInUser.role === Role.STUDENT && loggedInUser.sub !== userId) {
      throw new ForbiddenException('You can only view your own comparison');
    }

    const comparison = await this.usersService.compareUserWithPeers(userId, group);

    return {
      success: true,
      message: 'User comparison generated',
      data: comparison,
    };
  }

  /**
   * Transfer user to different institution
   * @route PUT /users/:id/transfer
   */
  @Put(':id/transfer')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async transferUser(
    @Param('id') userId: string,
    @Body() dto: TransferUserDto,
    @GetUser() user: JwtPayload,
  ): Promise<ApiResponse<any>> {
    const result = await this.usersService.transferUserToInstitution(
      userId,
      dto.institutionId,
      user.sub,
    );

    return {
      success: true,
      message: 'User transferred successfully',
      data: result,
    };
  }

  /**
   * Force logout user
   * @route POST /users/:id/logout
   */
  @Post(':id/logout')
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @HttpCode(HttpStatus.OK)
  async forceLogout(
    @Param('id') userId: string,
    @GetUser() loggedInUser: JwtPayload,
  ): Promise<ApiResponse<any>> {
    // Authorization check
    if (loggedInUser.role === Role.INSTITUTION_ADMIN) {
      const user = await this.usersService.findOneById(userId);
      if (user.institutionId !== loggedInUser.institutionId) {
        throw new ForbiddenException('User not in your institution');
      }
    }

    const result = await this.usersService.forceLogout(userId);

    return {
      success: true,
      message: `Invalidated ${result.sessionsInvalidated} sessions`,
      data: result,
    };
  }

  /**
   * Get user's active sessions
   * @route GET /users/:id/sessions
   */
  @Get(':id/sessions')
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN, Role.STUDENT)
  async getUserSessions(
    @Param('id') userId: string,
    @GetUser() loggedInUser: JwtPayload,
  ): Promise<ApiResponse<any>> {
    // Authorization check
    if (loggedInUser.role === Role.STUDENT && loggedInUser.sub !== userId) {
      throw new ForbiddenException('You can only view your own sessions');
    }

    const sessions = await this.usersService.getUserSessions(userId);

    return {
      success: true,
      message: 'Sessions retrieved',
      data: sessions,
    };
  }

  /**
   * Initiate password reset
   * @route POST /users/password-reset/initiate
   */
  @Post('password-reset/initiate')
  @HttpCode(HttpStatus.OK)
  async initiatePasswordReset(
    @Body('email') email: string,
  ): Promise<ApiResponse<any>> {
    const result = await this.usersService.initiatePasswordReset(email);

    // In production, send email instead of returning token
    return {
      success: true,
      message: 'Password reset initiated',
      data: process.env.NODE_ENV === 'development' ? result : null,
    };
  }

  /**
   * Complete password reset
   * @route POST /users/password-reset/complete
   */
  @Post('password-reset/complete')
  @HttpCode(HttpStatus.OK)
  async completePasswordReset(
    @Body() dto: PasswordResetDto,
  ): Promise<ApiResponse<void>> {
    await this.usersService.completePasswordReset(dto.token, dto.newPassword);

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }

  /**
   * Get user engagement score
   * @route GET /users/:id/engagement
   */
  @Get(':id/engagement')
  async getUserEngagement(
    @Param('id') userId: string,
    @GetUser() loggedInUser: JwtPayload,
  ): Promise<ApiResponse<number>> {
    // Authorization check
    if (loggedInUser.role === Role.STUDENT && loggedInUser.sub !== userId) {
      throw new ForbiddenException('You can only view your own engagement');
    }

    const score = await this.usersService.getUserEngagementScore(userId);

    return {
      success: true,
      message: 'Engagement score calculated',
      data: score,
    };
  }

  /**
   * Export users to CSV
   * @route GET /users/export
   */
  @Get('export')
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  async exportUsers(
    @GetUser() loggedInUser: JwtPayload,
    @Query('format') format: 'csv' | 'json' = 'csv',
  ): Promise<any> {
    // Implementation would generate CSV/JSON file
    // This is a placeholder
    return {
      success: true,
      message: 'Export initiated',
      data: { format },
    };
  }
}
