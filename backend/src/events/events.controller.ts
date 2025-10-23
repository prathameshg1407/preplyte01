// src/events/events.controller.ts
import { Controller, Post, Get, Param, Body, UseGuards, ParseIntPipe, ValidationPipe, UsePipes } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/decorators/user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { CreateInternshipPostingDto } from './dto/create-internship-posting.dto';
import { CreateHackathonPostingDto } from './dto/create-hackathon-posting.dto';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(private eventsService: EventsService) {}

  // =================================================================
  // == General Event Fetching
  // =================================================================

  @Get()
  @Roles(Role.STUDENT, Role.INSTITUTION_ADMIN, Role.SUPER_ADMIN)
  getPostingsForUser(@GetUser() user: JwtPayload) {
    return this.eventsService.getPostingsForUser(user);
  }

  // =================================================================
  // == Job Postings
  // =================================================================

  @Post('jobs')
  @Roles(Role.INSTITUTION_ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  createJobPosting(@Body() dto: CreateJobPostingDto, @GetUser() admin: JwtPayload) {
    return this.eventsService.createJobPosting(dto, admin);
  }

  @Get('jobs/:id')
  getJobPostingWithStatus(@Param('id', ParseIntPipe) jobId: number, @GetUser() user: JwtPayload) {
    return this.eventsService.getJobPostingWithStatus(jobId, user);
  }

  @Post('jobs/:id/apply')
  @Roles(Role.STUDENT)
  applyForJob(@Param('id', ParseIntPipe) jobId: number, @GetUser() student: JwtPayload) {
    return this.eventsService.applyForJob(jobId, student);
  }

  @Get('jobs/:id/applicants')
  @Roles(Role.INSTITUTION_ADMIN)
  getJobApplicants(@Param('id', ParseIntPipe) jobId: number, @GetUser() admin: JwtPayload) {
    return this.eventsService.getJobApplicants(jobId, admin);
  }

  // =================================================================
  // == Internship Postings
  // =================================================================

  @Post('internships')
  @Roles(Role.INSTITUTION_ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  createInternshipPosting(@Body() dto: CreateInternshipPostingDto, @GetUser() admin: JwtPayload) {
    return this.eventsService.createInternshipPosting(dto, admin);
  }

  @Get('internships/:id')
  getInternshipPostingWithStatus(@Param('id', ParseIntPipe) internshipId: number, @GetUser() user: JwtPayload) {
    return this.eventsService.getInternshipPostingWithStatus(internshipId, user);
  }

  @Post('internships/:id/apply')
  @Roles(Role.STUDENT)
  applyForInternship(@Param('id', ParseIntPipe) internshipId: number, @GetUser() student: JwtPayload) {
    return this.eventsService.applyForInternship(internshipId, student);
  }

  @Get('internships/:id/applicants')
  @Roles(Role.INSTITUTION_ADMIN)
  getInternshipApplicants(@Param('id', ParseIntPipe) internshipId: number, @GetUser() admin: JwtPayload) {
    return this.eventsService.getInternshipApplicants(internshipId, admin);
  }

  // =================================================================
  // == Hackathon Postings
  // =================================================================

  @Post('hackathons')
  @Roles(Role.INSTITUTION_ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  createHackathonPosting(@Body() dto: CreateHackathonPostingDto, @GetUser() admin: JwtPayload) {
    return this.eventsService.createHackathonPosting(dto, admin);
  }

  @Get('hackathons/:id')
  getHackathonPostingWithStatus(@Param('id', ParseIntPipe) hackathonId: number, @GetUser() user: JwtPayload) {
    return this.eventsService.getHackathonPostingWithStatus(hackathonId, user);
  }

  @Post('hackathons/:id/register')
  @Roles(Role.STUDENT)
  registerForHackathon(@Param('id', ParseIntPipe) hackathonId: number, @GetUser() student: JwtPayload) {
    return this.eventsService.registerForHackathon(hackathonId, student);
  }

  @Get('hackathons/:id/registrants')
  @Roles(Role.INSTITUTION_ADMIN)
  getHackathonRegistrants(@Param('id', ParseIntPipe) hackathonId: number, @GetUser() admin: JwtPayload) {
    return this.eventsService.getHackathonRegistrants(hackathonId, admin);
  }
}
