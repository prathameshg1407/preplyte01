import {
  Controller,
  Get,
  UseGuards,
  Put,
  Body,
  ValidationPipe,
  UsePipes,
  BadRequestException,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Delete,
  Param,
  Res,
  StreamableFile,
  Logger,
  ClassSerializerInterceptor,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GetUser } from '../auth/decorators/user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UploadResumeDto } from './dto/upload-resume.dto';
import type { Response } from 'express';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);

  constructor(private readonly profileService: ProfileService) {}

  /**
   * Gets the current user's profile
   * @route GET /profile/me
   */
  @Get('me')
  async getMyProfile(@GetUser() user: JwtPayload): Promise<ApiResponse<any>> {
    const profile = await this.profileService.getProfile(user.sub);
    
    if (!profile) {
      return {
        success: false,
        message: 'Profile not found. Please complete your profile setup.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: profile,
    };
  }

  /**
   * Updates the current user's profile
   * @route PUT /profile/me
   */
  @Put('me')
  @UsePipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: true,
    transform: true,
  }))
  async updateMyProfile(
    @GetUser() user: JwtPayload,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ApiResponse<any>> {
    this.logger.log(`User ${user.sub} updating profile`);
    
    const updatedProfile = await this.profileService.updateProfile(
      user.sub,
      updateProfileDto,
    );

    return {
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile,
    };
  }

  /**
   * Uploads/updates profile picture
   * @route POST /profile/me/avatar
   */
  @Post('me/avatar')
  @UseGuards(ThrottlerGuard)
  @UseInterceptors(FileInterceptor('profilePicture', {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  async updateMyProfilePicture(
    @GetUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    ) file: Express.Multer.File,
  ): Promise<ApiResponse<{ imageUrl: string }>> {
    this.logger.log(`User ${user.sub} uploading profile picture`);
    
    const result = await this.profileService.updateProfilePicture(user.sub, file);

    return {
      success: true,
      message: result.message,
      data: { imageUrl: result.imageUrl },
    };
  }

  /**
   * Gets profile completion status
   * @route GET /profile/me/completion-status
   */
  @Get('me/completion-status')
  async getProfileCompletionStatus(
    @GetUser() user: JwtPayload,
  ): Promise<ApiResponse<any>> {
    const status = await this.profileService.getProfileCompletionStatus(user.sub);

    return {
      success: true,
      message: status.isComplete 
        ? 'Profile is complete' 
        : `Profile is ${status.completionPercentage}% complete`,
      data: status,
    };
  }

  // --- Resume Management Endpoints ---

  /**
   * Gets all resumes for the current user
   * @route GET /profile/me/resumes
   */
  @Get('me/resumes')
  @Roles(Role.STUDENT)
  async getMyResumes(
    @GetUser() user: JwtPayload,
    @Query('includeAnalysis') includeAnalysis?: string,
  ): Promise<ApiResponse<any[]>> {
    const resumes = await this.profileService.getResumes(user.sub);

    return {
      success: true,
      message: `Found ${resumes.length} resume(s)`,
      data: resumes,
    };
  }

  /**
   * Downloads a specific resume file
   * @route GET /profile/me/resumes/:resumeId/download
   */
  @Get('me/resumes/:resumeId/download')
  @Roles(Role.STUDENT)
  async downloadResumeFile(
    @GetUser() user: JwtPayload,
    @Param('resumeId', ParseIntPipe) resumeId: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    this.logger.log(`User ${user.sub} downloading resume ${resumeId}`);
    
    const { buffer, contentType, filename } = await this.profileService.getResumeFile(
      user.sub,
      resumeId,
    );

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    return new StreamableFile(buffer);
  }

  /**
   * Views a resume file inline
   * @route GET /profile/me/resumes/:resumeId/view
   */
  @Get('me/resumes/:resumeId/view')
  @Roles(Role.STUDENT)
  async viewResumeFile(
    @GetUser() user: JwtPayload,
    @Param('resumeId', ParseIntPipe) resumeId: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, contentType, filename } = await this.profileService.getResumeFile(
      user.sub,
      resumeId,
    );

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    return new StreamableFile(buffer);
  }

  /**
   * Uploads a new resume
   * @route POST /profile/me/resumes
   */
  @Post('me/resumes')
  @Roles(Role.STUDENT)
  @UseGuards(ThrottlerGuard)
  @UseInterceptors(FileInterceptor('resumeFile', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  }))
  @UsePipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: true,
    transform: true,
  }))
  async uploadResume(
    @GetUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ 
            fileType: /^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
          }),
        ],
      }),
    ) file: Express.Multer.File,
    @Body() uploadResumeDto: UploadResumeDto,
  ): Promise<ApiResponse<any>> {
    this.logger.log(`User ${user.sub} uploading resume`);
    
    const resume = await this.profileService.addResume(
      user.sub,
      file,
      uploadResumeDto,
    );

    return {
      success: true,
      message: 'Resume uploaded successfully',
      data: resume,
    };
  }

  /**
   * Sets a resume as primary
   * @route PUT /profile/me/resumes/:resumeId/primary
   */
  @Put('me/resumes/:resumeId/primary')
  @Roles(Role.STUDENT)
  async setPrimaryResume(
    @GetUser() user: JwtPayload,
    @Param('resumeId', ParseIntPipe) resumeId: number,
  ): Promise<ApiResponse<any>> {
    this.logger.log(`User ${user.sub} setting resume ${resumeId} as primary`);
    
    const resume = await this.profileService.setPrimaryResume(user.sub, resumeId);

    return {
      success: true,
      message: 'Primary resume updated successfully',
      data: resume,
    };
  }

  /**
   * Deletes a resume
   * @route DELETE /profile/me/resumes/:resumeId
   */
  @Delete('me/resumes/:resumeId')
  @Roles(Role.STUDENT)
  async deleteResume(
    @GetUser() user: JwtPayload,
    @Param('resumeId', ParseIntPipe) resumeId: number,
  ): Promise<ApiResponse<any>> {
    this.logger.log(`User ${user.sub} deleting resume ${resumeId}`);
    
    const deletedResume = await this.profileService.deleteResume(user.sub, resumeId);

    return {
      success: true,
      message: 'Resume deleted successfully',
      data: deletedResume,
    };
  }

  /**
   * Bulk updates profile fields
   * @route PATCH /profile/me/bulk-update
   */
  @Put('me/bulk-update')
  @UsePipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: true,
    transform: true,
  }))
  async bulkUpdateProfile(
    @GetUser() user: JwtPayload,
    @Body() updates: Partial<UpdateProfileDto>,
  ): Promise<ApiResponse<any>> {
    this.logger.log(`User ${user.sub} performing bulk profile update`);
    
    const updatedProfile = await this.profileService.updateProfile(
      user.sub,
      updates,
    );

    return {
      success: true,
      message: 'Profile fields updated successfully',
      data: updatedProfile,
    };
  }
}