import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Res,
  HttpStatus,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ResumeBuilderService } from './resume-builder.service';
import { 
  SaveResumeDataDto, 
  UpdateResumeDataDto,
  GenerateResumeDto 
} from './dto/resume-builder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('resume-builder')
@UseGuards(JwtAuthGuard)
export class ResumeBuilderController {
  private readonly logger = new Logger(ResumeBuilderController.name);

  constructor(private readonly resumeBuilderService: ResumeBuilderService) {}

  // ===================================================================================
  // Resume Data Management
  // ===================================================================================

  /**
   * Save resume data (create new resume)
   * @route POST /resume-builder/save
   */
  @Post('save')
  async saveResumeData(
    @GetUser() user: JwtPayload,
    @Body() data: SaveResumeDataDto,
  ) {
    this.logger.log(`User ${user.sub} saving resume: ${data.title}`);
    return this.resumeBuilderService.saveResumeData(user.sub, data);
  }

  /**
   * Get all saved resumes
   * @route GET /resume-builder/resumes
   */
  @Get('resumes')
  async getSavedResumes(@GetUser() user: JwtPayload) {
    this.logger.log(`User ${user.sub} fetching saved resumes`);
    return this.resumeBuilderService.getSavedResumes(user.sub);
  }

  /**
   * Get specific resume details
   * @route GET /resume-builder/resume/:id
   */
  @Get('resume/:id')
  async getResumeDetails(
    @GetUser() user: JwtPayload,
    @Param('id', ParseIntPipe) resumeId: number,
  ) {
    this.logger.log(`User ${user.sub} fetching resume ${resumeId}`);
    return this.resumeBuilderService.getResumeDetails(user.sub, resumeId);
  }

  /**
   * Update resume data
   * @route PUT /resume-builder/resume/:id
   */
  @Put('resume/:id')
  async updateResumeData(
    @GetUser() user: JwtPayload,
    @Param('id', ParseIntPipe) resumeId: number,
    @Body() data: UpdateResumeDataDto,
  ) {
    this.logger.log(`User ${user.sub} updating resume ${resumeId}`);
    return this.resumeBuilderService.updateResumeData(user.sub, resumeId, data);
  }

  /**
   * Delete resume
   * @route DELETE /resume-builder/resume/:id
   */
  @Delete('resume/:id')
  async deleteResume(
    @GetUser() user: JwtPayload,
    @Param('id', ParseIntPipe) resumeId: number,
  ) {
    this.logger.log(`User ${user.sub} deleting resume ${resumeId}`);
    return this.resumeBuilderService.deleteResume(user.sub, resumeId);
  }

  // ===================================================================================
  // Resume Generation
  // ===================================================================================

  /**
   * Generate resume PDF or preview
   * @route POST /resume-builder/generate
   */
  @Post('generate')
  async generateResume(
    @GetUser() user: JwtPayload,
    @Body() options: GenerateResumeDto,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(`User ${user.sub} generating resume with template: ${options.template}`);
      
      // If format is 'preview', return base64
      if (options.format === 'preview') {
        const pdfBuffer = await this.resumeBuilderService.generateResume(
          user.sub,
          options,
        );
        
        return res.status(HttpStatus.OK).json({
          preview: pdfBuffer.toString('base64'),
          template: options.template,
        });
      }
      
      // Otherwise, return PDF file
      const pdfBuffer = await this.resumeBuilderService.generateResume(
        user.sub,
        options,
      );

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume-${options.template}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      });

      res.status(HttpStatus.OK).send(pdfBuffer);
    } catch (error) {
      this.logger.error(`Error generating resume for user ${user.sub}: ${error.message}`);
      res.status(HttpStatus.BAD_REQUEST).json({
        message: error.message || 'Failed to generate resume',
      });
    }
  }

  /**
   * Generate resume preview (base64) - Deprecated, use /generate with format=preview
   * @route POST /resume-builder/generate-preview
   */
  @Post('generate-preview')
  async generatePreview(
    @GetUser() user: JwtPayload,
    @Body() options: GenerateResumeDto,
  ) {
    this.logger.log(`User ${user.sub} generating preview with template: ${options.template}`);
    
    const pdfBuffer = await this.resumeBuilderService.generateResume(
      user.sub,
      options,
    );
    
    return {
      preview: pdfBuffer.toString('base64'),
      template: options.template,
    };
  }

  /**
   * Download saved resume
   * @route GET /resume-builder/resume/:id/download
   */
  @Get('resume/:id/download')
  async downloadSavedResume(
    @GetUser() user: JwtPayload,
    @Param('id', ParseIntPipe) resumeId: number,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(`User ${user.sub} downloading resume ${resumeId}`);
      
      const resume = await this.resumeBuilderService.getResumeDetails(
        user.sub,
        resumeId,
      );

      if (!resume || !resume.content) {
        return res.status(HttpStatus.NOT_FOUND).json({
          message: 'Resume not found',
        });
      }

      const content = JSON.parse(resume.content);
      const pdfBuffer = await this.resumeBuilderService.generateResumeFromData(
        content.profileData || content.profile,
        content.template || 'modern',
        content.customSettings,
      );

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${resume.title}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      });

      res.status(HttpStatus.OK).send(pdfBuffer);
    } catch (error) {
      this.logger.error(`Error downloading resume ${resumeId} for user ${user.sub}: ${error.message}`);
      res.status(HttpStatus.BAD_REQUEST).json({
        message: error.message || 'Failed to download resume',
      });
    }
  }

  // ===================================================================================
  // ATS Check
  // ===================================================================================

  /**
   * Check ATS score for uploaded resume
   * @route POST /resume-builder/ats-check
   */
  @Post('ats-check')
  @UseInterceptors(FileInterceptor('resume'))
  async checkATSScore(
    @GetUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body('jobRole') jobRole: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.logger.log(`User ${user.sub} checking ATS score for role: ${jobRole}`);
    return this.resumeBuilderService.checkAtsScore(file.path, jobRole);
  }
}