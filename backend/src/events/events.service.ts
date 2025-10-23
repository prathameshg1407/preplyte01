// src/events/events.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { CreateInternshipPostingDto } from './dto/create-internship-posting.dto';
import { CreateHackathonPostingDto } from './dto/create-hackathon-posting.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // == Job Posting Methods
  // =================================================================

  async createJobPosting(dto: CreateJobPostingDto, admin: JwtPayload) {
    if (!admin.institutionId) {
      throw new ForbiddenException('Admin must be associated with an institution.');
    }
    const data = {
      ...dto,
      applicationDeadline: dto.applicationDeadline ? new Date(dto.applicationDeadline) : null,
      institutionId: admin.institutionId,
      eligibilityCriteria: (dto.eligibilityCriteria as Prisma.JsonObject) ?? Prisma.JsonNull,
    };
    return this.prisma.jobPosting.create({ data });
  }

  async getJobPostingWithStatus(jobId: number, user: JwtPayload) {
    const jobPosting = await this.prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!jobPosting || (user.institutionId && jobPosting.institutionId !== user.institutionId)) {
      throw new NotFoundException('Job posting not found.');
    }
    const application = user.role === 'STUDENT' ? await this.prisma.jobApplication.findUnique({
      where: { userId_jobId: { userId: user.sub, jobId } }
    }) : null;
    return { ...jobPosting, applicationStatus: application?.status || null };
  }

  async applyForJob(jobId: number, student: JwtPayload) {
    const existingApplication = await this.prisma.jobApplication.findUnique({
        where: { userId_jobId: { userId: student.sub, jobId } }
    });
    if (existingApplication) {
        throw new ConflictException('You have already applied for this job.');
    }
    return this.prisma.jobApplication.create({
      data: { jobId, userId: student.sub },
    });
  }

  async getJobApplicants(jobId: number, admin: JwtPayload) {
    const jobPosting = await this.prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!jobPosting || jobPosting.institutionId !== admin.institutionId) {
      throw new NotFoundException('Job posting not found.');
    }

    const registered = await this.prisma.jobApplication.findMany({
      where: { jobId },
      include: { user: { include: { profile: true } } },
    });
    const registeredUserIds = registered.map(app => app.userId);

    const eligibleButNotRegistered = await this.findEligibleUsers(
      jobPosting.eligibilityCriteria as Prisma.JsonObject,
      admin.institutionId,
      registeredUserIds
    );
    
    return {
      registered: registered.map(r => r.user),
      eligibleButNotRegistered,
    };
  }

  // =================================================================
  // == Internship Posting Methods
  // =================================================================

  async createInternshipPosting(dto: CreateInternshipPostingDto, admin: JwtPayload) {
    if (!admin.institutionId) {
      throw new ForbiddenException('Admin must be associated with an institution.');
    }
    const data = {
      ...dto,
      applicationDeadline: dto.applicationDeadline ? new Date(dto.applicationDeadline) : null,
      institutionId: admin.institutionId,
      eligibilityCriteria: (dto.eligibilityCriteria as Prisma.JsonObject) ?? Prisma.JsonNull,
    };
    return this.prisma.internshipPosting.create({ data });
  }

  async getInternshipPostingWithStatus(internshipId: number, user: JwtPayload) {
    const internshipPosting = await this.prisma.internshipPosting.findUnique({ where: { id: internshipId } });
    if (!internshipPosting || (user.institutionId && internshipPosting.institutionId !== user.institutionId)) {
      throw new NotFoundException('Internship posting not found.');
    }
    const application = user.role === 'STUDENT' ? await this.prisma.internshipApplication.findUnique({
      where: { userId_internshipId: { userId: user.sub, internshipId } }
    }) : null;
    return { ...internshipPosting, applicationStatus: application?.status || null };
  }

  async applyForInternship(internshipId: number, student: JwtPayload) {
    const existingApplication = await this.prisma.internshipApplication.findUnique({
        where: { userId_internshipId: { userId: student.sub, internshipId } }
    });
    if (existingApplication) {
        throw new ConflictException('You have already applied for this internship.');
    }
    return this.prisma.internshipApplication.create({
      data: { internshipId, userId: student.sub },
    });
  }

  async getInternshipApplicants(internshipId: number, admin: JwtPayload) {
    const internshipPosting = await this.prisma.internshipPosting.findUnique({ where: { id: internshipId } });
    if (!internshipPosting || internshipPosting.institutionId !== admin.institutionId) {
      throw new NotFoundException('Internship posting not found.');
    }

    const registered = await this.prisma.internshipApplication.findMany({
      where: { internshipId },
      include: { user: { include: { profile: true } } },
    });
    const registeredUserIds = registered.map(app => app.userId);

    const eligibleButNotRegistered = await this.findEligibleUsers(
      internshipPosting.eligibilityCriteria as Prisma.JsonObject,
      admin.institutionId,
      registeredUserIds
    );
    
    return {
      registered: registered.map(r => r.user),
      eligibleButNotRegistered,
    };
  }

  // =================================================================
  // == Hackathon Posting Methods
  // =================================================================

  async createHackathonPosting(dto: CreateHackathonPostingDto, admin: JwtPayload) {
    if (!admin.institutionId) {
      throw new ForbiddenException('Admin must be associated with an institution.');
    }
    const data = {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      registrationDeadline: dto.registrationDeadline ? new Date(dto.registrationDeadline) : null,
      institutionId: admin.institutionId,
      eligibilityCriteria: (dto.eligibilityCriteria as Prisma.JsonObject) ?? Prisma.JsonNull,
    };
    return this.prisma.hackathonPosting.create({ data });
  }

  async getHackathonPostingWithStatus(hackathonId: number, user: JwtPayload) {
    const hackathonPosting = await this.prisma.hackathonPosting.findUnique({ where: { id: hackathonId } });
    if (!hackathonPosting || (user.institutionId && hackathonPosting.institutionId !== user.institutionId)) {
      throw new NotFoundException('Hackathon posting not found.');
    }
    const registration = user.role === 'STUDENT' ? await this.prisma.hackathonRegistration.findUnique({
      where: { userId_hackathonId: { userId: user.sub, hackathonId } }
    }) : null;
    return { ...hackathonPosting, registrationStatus: registration?.status || null };
  }

  async registerForHackathon(hackathonId: number, student: JwtPayload) {
    const existingRegistration = await this.prisma.hackathonRegistration.findUnique({
        where: { userId_hackathonId: { userId: student.sub, hackathonId } }
    });
    if (existingRegistration) {
        throw new ConflictException('You have already registered for this hackathon.');
    }
    return this.prisma.hackathonRegistration.create({
      data: { hackathonId, userId: student.sub },
    });
  }

  async getHackathonRegistrants(hackathonId: number, admin: JwtPayload) {
    const hackathonPosting = await this.prisma.hackathonPosting.findUnique({ where: { id: hackathonId } });
    if (!hackathonPosting || hackathonPosting.institutionId !== admin.institutionId) {
      throw new NotFoundException('Hackathon posting not found.');
    }

    const registered = await this.prisma.hackathonRegistration.findMany({
      where: { hackathonId },
      include: { user: { include: { profile: true } } },
    });
    const registeredUserIds = registered.map(reg => reg.userId);

    const eligibleButNotRegistered = await this.findEligibleUsers(
      hackathonPosting.eligibilityCriteria as Prisma.JsonObject,
      admin.institutionId,
      registeredUserIds
    );
    
    return {
      registered: registered.map(r => r.user),
      eligibleButNotRegistered,
    };
  }

  // =================================================================
  // == General & Helper Methods
  // =================================================================
  
  async getPostingsForUser(user: JwtPayload) {
    if (!user.institutionId) {
      return { jobs: [], internships: [], hackathons: [] };
    }
    
    const findManyArgs = { 
      where: { institutionId: user.institutionId }, 
      orderBy: { createdAt: 'desc' as const } 
    };

    const [jobs, internships, hackathons] = await this.prisma.$transaction([
      this.prisma.jobPosting.findMany(findManyArgs),
      this.prisma.internshipPosting.findMany(findManyArgs),
      this.prisma.hackathonPosting.findMany(findManyArgs),
    ]);

    return { jobs, internships, hackathons };
  }

  private async findEligibleUsers(criteria: Prisma.JsonObject | null, institutionId: number, excludedUserIds: string[]) {
    const userWhere: Prisma.UserWhereInput = {
      institutionId: institutionId,
      id: { notIn: excludedUserIds },
      role: 'STUDENT',
    };

    const profileWhere: Prisma.ProfileWhereInput = {};
    
    if (criteria) {
      if (criteria.minSscPercentage) {
        profileWhere.sscPercentage = { gte: Number(criteria.minSscPercentage) };
      }
      if (criteria.minHscPercentage) {
        profileWhere.hscPercentage = { gte: Number(criteria.minHscPercentage) };
      }
      if (criteria.minAverageCgpa) {
        profileWhere.averageCgpa = { gte: Number(criteria.minAverageCgpa) };
      }
      if (criteria.graduationYears && Array.isArray(criteria.graduationYears) && criteria.graduationYears.length > 0) {
        profileWhere.graduationYear = { in: criteria.graduationYears as number[] };
      }
    }

    if (Object.keys(profileWhere).length > 0) {
      userWhere.profile = profileWhere;
    }

    return this.prisma.user.findMany({
      where: userWhere,
      include: { profile: true },
    });
  }
}
