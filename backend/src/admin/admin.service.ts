import {
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, UserStatus, QuestionDifficulty, ApplicationStatus } from '@prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { 
  AdminStats, 
  SuperAdminStats, 
  InstitutionAdminStats,
  StatsTimeRangeDto,
  ApplicationStatusDistribution,
  DifficultyDistribution,
  UserStatusDistribution,
} from './dto/admin-stats.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private statsCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private prisma: PrismaService) {}

  /**
   * Get dashboard statistics based on user role
   */
  async getDashboardStats(
    user: JwtPayload,
    timeRange?: StatsTimeRangeDto,
  ): Promise<AdminStats> {
    const cacheKey = `stats:${user.sub}:${JSON.stringify(timeRange ?? {})}`;

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      let stats: AdminStats;

      if (user.role === Role.SUPER_ADMIN) {
        stats = await this.getSuperAdminStats(timeRange);
      } else if (user.role === Role.INSTITUTION_ADMIN) {
        if (!user.institutionId) {
          throw new InternalServerErrorException(
            'Institution admin must have an associated institution ID.',
          );
        }
        stats = await this.getInstitutionAdminStats(user.institutionId, timeRange);
      } else {
        throw new ForbiddenException('User role is not authorized to view statistics.');
      }

      // Cache the result
      this.setCache(cacheKey, stats);
      return stats;
    } catch (error: any) {
      this.logger.error(`Error fetching dashboard stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Super Admin statistics
   */
  private async getSuperAdminStats(timeRange?: StatsTimeRangeDto): Promise<SuperAdminStats> {
    // Use parallel queries for better performance
    const [
      userStats,
      institutionCount,
      assessmentStats,
      activityStats,
      growthStats,
    ] = await Promise.all([
      this.getUserStatistics(),
      this.prisma.institution.count(),
      this.getAssessmentStatistics(),
      this.getActivityStatistics(timeRange),
      this.getGrowthStatistics(),
    ]);

    return {
      role: 'SUPER_ADMIN',
      generatedAt: new Date(),
      totalUsers: userStats.total,
      usersByStatus: userStats.byStatus,
      usersByRole: userStats.byRole,
      totalInstitutions: institutionCount,
      assessmentContent: assessmentStats,
      platformActivity: activityStats,
      growth: growthStats,
    };
  }

  /**
   * Get Institution Admin statistics
   */
  private async getInstitutionAdminStats(
    institutionId: number,
    timeRange?: StatsTimeRangeDto,
  ): Promise<InstitutionAdminStats> {
    const dateFilter = this.getDateFilter(timeRange);

    // Verify institution exists
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
      select: { name: true },
    });

    if (!institution) {
      throw new NotFoundException('Institution not found');
    }

    // Parallel queries for institution-specific data
    const [
      studentStats,
      assessmentPerformance,
      careerOpportunities,
      aiInterviewStats,
      contentStats,
      recentActivity,
    ] = await Promise.all([
      this.getStudentStatistics(institutionId),
      this.getInstitutionAssessmentPerformance(institutionId),
      this.getCareerOpportunities(institutionId, dateFilter),
      this.getAiInterviewStatistics(institutionId, dateFilter),
      this.getInstitutionContent(institutionId),
      this.getRecentActivity(institutionId),
    ]);

    return {
      role: 'INSTITUTION_ADMIN',
      generatedAt: new Date(),
      institutionId,
      institutionName: institution.name,
      students: studentStats,
      assessmentPerformance,
      careerOpportunities,
      aiInterviews: aiInterviewStats,
      content: contentStats,
      recentActivity,
    };
  }

  /**
   * Get user statistics for Super Admin
   */
  private async getUserStatistics() {
    const [total, byStatus, byRole] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
    ]);

    const statusDistribution: UserStatusDistribution = {
      [UserStatus.ACTIVE]: 0,
      [UserStatus.SUSPENDED]: 0,
      [UserStatus.DELETED]: 0,
      [UserStatus.PENDING_PROFILE_COMPLETION]: 0,
    };

    byStatus.forEach((item) => {
      statusDistribution[item.status] = item._count;
    });

    const roleDistribution = {
      students: 0,
      institutionAdmins: 0,
      superAdmins: 0,
    };

    byRole.forEach((item) => {
      switch (item.role) {
        case Role.STUDENT:
          roleDistribution.students = item._count;
          break;
        case Role.INSTITUTION_ADMIN:
          roleDistribution.institutionAdmins = item._count;
          break;
        case Role.SUPER_ADMIN:
          roleDistribution.superAdmins = item._count;
          break;
      }
    });

    return {
      total,
      byStatus: statusDistribution,
      byRole: roleDistribution,
    };
  }

  /**
   * Get assessment statistics
   */
  private async getAssessmentStatistics() {
    const [
      aptitudeStats,
      codingStats,
    ] = await Promise.all([
      this.prisma.aptitudeQuestion.groupBy({
        by: ['difficulty'],
        _count: true,
      }),
      this.prisma.machineTestProblem.aggregate({
        _count: true,
        where: { isPublic: true },
      }),
    ]);

    const aptitudeDifficulty: DifficultyDistribution = {
      [QuestionDifficulty.EASY]: 0,
      [QuestionDifficulty.MEDIUM]: 0,
      [QuestionDifficulty.HARD]: 0,
    };

    aptitudeStats.forEach((item) => {
      aptitudeDifficulty[item.difficulty] = item._count;
    });

    const codingDifficulty = await this.prisma.machineTestProblem.groupBy({
      by: ['difficulty'],
      _count: true,
    });

    const codingDifficultyDist: DifficultyDistribution = {
      [QuestionDifficulty.EASY]: 0,
      [QuestionDifficulty.MEDIUM]: 0,
      [QuestionDifficulty.HARD]: 0,
    };

    codingDifficulty.forEach((item) => {
      codingDifficultyDist[item.difficulty] = item._count;
    });

    return {
      totalAptitudeQuestions: Object.values(aptitudeDifficulty).reduce((a, b) => a + b, 0),
      aptitudeByDifficulty: aptitudeDifficulty,
      totalCodingProblems: Object.values(codingDifficultyDist).reduce((a, b) => a + b, 0),
      codingByDifficulty: codingDifficultyDist,
      publicCodingProblems: codingStats._count,
    };
  }

  /**
   * Get platform activity statistics
   */
  private async getActivityStatistics(timeRange?: StatsTimeRangeDto) {
    const submissionFilter = this.createDateFilter(timeRange, 'createdAt');
    const resumeFilter = this.createDateFilter(timeRange, 'uploadedAt');

    const [
      totalSubmissions,
      totalAiInterviews,
      totalResumes,
      activeSessionsCount,
    ] = await Promise.all([
      this.prisma.machineTestSubmission.count(submissionFilter as any),
      this.prisma.aiInterviewSession.count(submissionFilter as any),
      this.prisma.resume.count(resumeFilter as any),
      this.prisma.session.count({
        where: {
          expiresAt: { gt: new Date() },
        },
      }),
    ]);

    return {
      totalSubmissions,
      totalAiInterviews,
      totalResumes,
      activeSessionsCount,
    };
  }

  /**
   * Get growth statistics
   */
  private async getGrowthStatistics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [usersThisMonth, usersLastMonth] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),
    ]);

    const growthPercentage = usersLastMonth === 0 
      ? 100 
      : ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100;

    return {
      usersThisMonth,
      usersLastMonth,
      growthPercentage: Math.round(growthPercentage * 100) / 100,
    };
  }

  /**
   * Get student statistics for an institution
   */
  private async getStudentStatistics(institutionId: number) {
    const students = await this.prisma.user.findMany({
      where: {
        institutionId,
        role: Role.STUDENT,
      },
      select: {
        status: true,
        profile: {
          select: { graduationYear: true },
        },
      },
    });

    const byStatus = {
      total: students.length,
      active: 0,
      suspended: 0,
      pendingProfileCompletion: 0,
    };

    const byGraduationYear: Record<number, number> = {};

    students.forEach((student) => {
      // Count by status
      switch (student.status) {
        case UserStatus.ACTIVE:
          byStatus.active++;
          break;
        case UserStatus.SUSPENDED:
          byStatus.suspended++;
          break;
        case UserStatus.PENDING_PROFILE_COMPLETION:
          byStatus.pendingProfileCompletion++;
          break;
      }

      // Count by graduation year
      if (student.profile?.graduationYear) {
        byGraduationYear[student.profile.graduationYear] = 
          (byGraduationYear[student.profile.graduationYear] || 0) + 1;
      }
    });

    return {
      ...byStatus,
      byGraduationYear,
    };
  }

  /**
   * Get institution assessment performance
   */
  private async getInstitutionAssessmentPerformance(institutionId: number) {
    const [aptitudeStats, codingStats, topPerformers] = await Promise.all([
      this.prisma.aptitudeResponse.aggregate({
        where: {
          user: { institutionId },
        },
        _avg: { percentage: true },
        _count: true,
      }),
      this.prisma.machineTestSubmission.aggregate({
        where: {
          user: { institutionId },
          status: 'PASS',
        },
        _count: true,
      }),
      this.getTopPerformers(institutionId, 5),
    ]);

    const totalCodingSubmissions = await this.prisma.machineTestSubmission.count({
      where: { user: { institutionId } },
    });

    return {
      averageAptitudeScore: Number(aptitudeStats._avg.percentage || 0),
      totalAptitudeAttempts: aptitudeStats._count,
      averageCodingScore: totalCodingSubmissions > 0 
        ? (codingStats._count / totalCodingSubmissions) * 100 
        : 0,
      totalCodingSubmissions,
      topPerformers,
    };
  }

  /**
   * Get top performers for an institution
   */
  private async getTopPerformers(institutionId: number, limit: number) {
    const topPerformers = await this.prisma.userTopicPerformance.findMany({
      where: {
        user: { institutionId },
      },
      select: {
        userId: true,
        averageScore: true,
        user: {
          select: {
            profile: { select: { fullName: true } },
          },
        },
      },
      orderBy: { averageScore: 'desc' },
      take: limit,
    });

    return topPerformers.map((performer) => ({
      userId: performer.userId,
      name: performer.user.profile?.fullName || 'Unknown',
      averageScore: Number(performer.averageScore),
    }));
  }

  /**
   * Get career opportunities statistics
   */
  private async getCareerOpportunities(institutionId: number, dateFilter: any) {
    const now = new Date();
    
    // Extract dates from dateFilter
    let startDate = new Date(0);
    let endDate = new Date();
    
    if (dateFilter.where?.createdAt) {
      startDate = dateFilter.where.createdAt.gte || startDate;
      endDate = dateFilter.where.createdAt.lte || endDate;
    }

    const [jobStats, internshipStats, hackathonStats] = await Promise.all([
      this.getJobStats(institutionId, now, startDate, endDate),
      this.getInternshipStats(institutionId, now, startDate, endDate),
      this.getHackathonStats(institutionId, now, dateFilter),
    ]);

    return {
      jobs: jobStats,
      internships: internshipStats,
      hackathons: hackathonStats,
    };
  }

  /**
   * Get job statistics - Fixed with appliedAt
   */
  private async getJobStats(institutionId: number, now: Date, startDate: Date, endDate: Date) {
    const [total, active, applications] = await Promise.all([
      this.prisma.jobPosting.count({ where: { institutionId } }),
      this.prisma.jobPosting.count({
        where: {
          institutionId,
          applicationDeadline: { gte: now },
        },
      }),
      this.prisma.jobApplication.groupBy({
        by: ['status'],
        where: {
          job: {
            institutionId: institutionId,
          },
          appliedAt: {  // Fixed: Using appliedAt for JobApplication
            gte: startDate,
            lte: endDate,
          },
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const applicationDist: ApplicationStatusDistribution = {
      [ApplicationStatus.PENDING]: 0,
      [ApplicationStatus.REVIEWED]: 0,
      [ApplicationStatus.SHORTLISTED]: 0,
      [ApplicationStatus.REJECTED]: 0,
      [ApplicationStatus.ACCEPTED]: 0,
    };

    applications.forEach((app) => {
      applicationDist[app.status] = app._count._all;
    });

    return {
      total,
      active,
      applications: applicationDist,
    };
  }

  /**
   * Get internship statistics - Fixed with appliedAt
   */
  private async getInternshipStats(institutionId: number, now: Date, startDate: Date, endDate: Date) {
    const [total, active, applications] = await Promise.all([
      this.prisma.internshipPosting.count({ where: { institutionId } }),
      this.prisma.internshipPosting.count({
        where: {
          institutionId,
          applicationDeadline: { gte: now },
        },
      }),
      this.prisma.internshipApplication.groupBy({
        by: ['status'],
        where: {
          internship: { 
            institutionId 
          },
          appliedAt: {  // Fixed: Using appliedAt for InternshipApplication
            gte: startDate,
            lte: endDate,
          },
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const applicationDist: ApplicationStatusDistribution = {
      [ApplicationStatus.PENDING]: 0,
      [ApplicationStatus.REVIEWED]: 0,
      [ApplicationStatus.SHORTLISTED]: 0,
      [ApplicationStatus.REJECTED]: 0,
      [ApplicationStatus.ACCEPTED]: 0,
    };

    applications.forEach((app) => {
      applicationDist[app.status] = app._count._all;
    });

    return {
      total,
      active,
      applications: applicationDist,
    };
  }

  /**
   * Get hackathon statistics - Fixed with registeredAt
   */
  private async getHackathonStats(institutionId: number, now: Date, dateFilter: any) {
    // Transform the dateFilter for HackathonRegistration
    const hackathonRegFilter = dateFilter.where?.createdAt 
      ? { registeredAt: dateFilter.where.createdAt }
      : {};
  
    const [total, upcoming, registrations] = await Promise.all([
      this.prisma.hackathonPosting.count({ where: { institutionId } }),
      this.prisma.hackathonPosting.count({
        where: {
          institutionId,
          registrationDeadline: { gte: now },
        },
      }),
      this.prisma.hackathonRegistration.groupBy({
        by: ['status'],
        where: {
          hackathon: { institutionId },
          ...hackathonRegFilter, // Fixed: Using registeredAt for HackathonRegistration
        },
        _count: true,
      }),
    ]);
  
    const registrationDist: ApplicationStatusDistribution = {
      [ApplicationStatus.PENDING]: 0,
      [ApplicationStatus.REVIEWED]: 0,
      [ApplicationStatus.SHORTLISTED]: 0,
      [ApplicationStatus.REJECTED]: 0,
      [ApplicationStatus.ACCEPTED]: 0,
    };
  
    registrations.forEach((reg) => {
      registrationDist[reg.status] = reg._count;
    });
  
    return {
      total,
      upcoming,
      registrations: registrationDist,
    };
  }

  /**
   * Get AI interview statistics
   */
  private async getAiInterviewStatistics(institutionId: number, _dateFilter: any) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [sessions, feedback, thisMonthCount] = await Promise.all([
      this.prisma.aiInterviewSession.aggregate({
        where: {
          user: { institutionId },
        },
        _count: { id: true },
      }),
      this.prisma.aiInterviewFeedback.aggregate({
        where: {
          user: { institutionId },
        },
        _avg: { overallScore: true },
        _count: true,
      }),
      this.prisma.aiInterviewSession.count({
        where: {
          user: { institutionId },
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    return {
      totalSessions: sessions._count.id,
      completedSessions: feedback._count,
      averageScore: Number(feedback._avg.overallScore || 0),
      thisMonth: thisMonthCount,
    };
  }

  /**
   * Get institution content statistics
   */
  private async getInstitutionContent(institutionId: number) {
    const [aptitudeTests, codingProblems, batches] = await Promise.all([
      this.prisma.aptitudeTestDefinition.count({
        where: { institutionId },
      }),
      this.prisma.machineTestProblem.count({
        where: { institutionId },
      }),
      this.prisma.batch.count({
        where: { institutionId },
      }),
    ]);

    return {
      aptitudeTests,
      codingProblems,
      batches,
    };
  }

  /**
   * Get recent activity for an institution - Fixed with correct date fields
   */
  private async getRecentActivity(institutionId: number) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [submissions, jobApps, internApps, hackRegs] = await Promise.all([
      this.prisma.machineTestSubmission.count({
        where: {
          user: { institutionId },
          createdAt: { gte: oneWeekAgo },  // Correct: createdAt for submissions
        },
      }),
      this.prisma.jobApplication.count({
        where: {
          user: { institutionId },
          appliedAt: { gte: oneWeekAgo },  // Fixed: appliedAt for job applications
        },
      }),
      this.prisma.internshipApplication.count({
        where: {
          user: { institutionId },
          appliedAt: { gte: oneWeekAgo },  // Fixed: appliedAt for internship applications
        },
      }),
      this.prisma.hackathonRegistration.count({
        where: {
          user: { institutionId },
          registeredAt: { gte: oneWeekAgo },  // Fixed: registeredAt for hackathon registrations
        },
      }),
    ]);

    return {
      lastWeekSubmissions: submissions,
      lastWeekApplications: jobApps + internApps,
      lastWeekRegistrations: hackRegs,
    };
  }

  /**
   * Get user analytics (Super Admin only)
   */
  async getUserAnalytics(startDate?: Date, endDate?: Date) {
    const dateFilter = this.getDateRangeFilter(startDate, endDate);

    const [
      registrationTrend,
      loginActivity,
      roleDistribution,
      statusChanges,
    ] = await Promise.all([
      this.getRegistrationTrend(dateFilter),
      this.getLoginActivity(dateFilter),
      this.getRoleDistribution(),
      this.getStatusChanges(dateFilter),
    ]);

    return {
      registrationTrend,
      loginActivity,
      roleDistribution,
      statusChanges,
    };
  }

  /**
   * Get assessment analytics
   */
  async getAssessmentAnalytics(user: JwtPayload, timeRange?: StatsTimeRangeDto) {
    const dateFilter = this.getDateFilter(timeRange);
    const institutionFilter = user.role === Role.INSTITUTION_ADMIN 
      ? { institutionId: user.institutionId }
      : {};

    const [
      submissionTrend,
      difficultyPerformance,
      topicPerformance,
      languageUsage,
    ] = await Promise.all([
      this.getSubmissionTrend(dateFilter, institutionFilter),
      this.getDifficultyPerformance(institutionFilter),
      this.getTopicPerformance(institutionFilter),
      this.getLanguageUsage(institutionFilter),
    ]);

    return {
      submissionTrend,
      difficultyPerformance,
      topicPerformance,
      languageUsage,
    };
  }

  /**
   * Get institution-specific statistics (for Super Admin)
   */
  async getInstitutionStats(institutionId: number) {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
      include: {
        _count: {
          select: {
            users: true,
            batches: true,
            machineTestProblems: true,
            aptitudeTestDefinitions: true,
            jobPostings: true,
            internshipPostings: true,
            hackathonPostings: true,
          },
        },
      },
    });

    if (!institution) {
      throw new NotFoundException('Institution not found');
    }

    return {
      ...institution,
      statistics: await this.getInstitutionAdminStats(institutionId),
    };
  }

  /**
   * Get platform health metrics
   */
  async getHealthMetrics() {
    const [
      databaseSize,
      activeSessions,
      queuedSubmissions,
      failedJobs,
      systemResources,
    ] = await Promise.all([
      this.getDatabaseMetrics(),
      this.prisma.session.count({
        where: { expiresAt: { gt: new Date() } },
      }),
      this.prisma.machineTestSubmission.count({
        where: { status: 'QUEUED' },
      }),
      this.getFailedJobsCount(),
      this.getSystemResources(),
    ]);

    return {
      databaseSize,
      activeSessions,
      queuedSubmissions,
      failedJobs,
      systemResources,
      timestamp: new Date(),
    };
  }

  /**
   * Export statistics in various formats
   */
  async exportStats(
    user: JwtPayload,
    format: 'csv' | 'excel' | 'json',
    timeRange?: StatsTimeRangeDto,
  ) {
    const stats = await this.getDashboardStats(user, timeRange);

    switch (format) {
      case 'csv':
        return this.convertToCSV(stats);
      case 'excel':
        return this.convertToExcel(stats);
      case 'json':
      default:
        return stats;
    }
  }

  // Helper methods

  /**
   * Create date filter with custom field name
   */
  private createDateFilter(
    timeRange: StatsTimeRangeDto | undefined, 
    fieldName: string = 'createdAt'
  ): any {
    if (!timeRange) return {};

    let startDate: Date;
    let endDate = new Date();

    if (timeRange.range) {
      switch (timeRange.range) {
        case 'day':
          startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
          break;
        case 'quarter':
          startDate = new Date(endDate.getFullYear(), Math.floor(endDate.getMonth() / 3) * 3, 1);
          break;
        case 'year':
          startDate = new Date(endDate.getFullYear(), 0, 1);
          break;
        default:
          return {};
      }
    } else if (timeRange.startDate || timeRange.endDate) {
      startDate = this.toDate(timeRange.startDate, new Date(0))!;
      endDate = this.toDate(timeRange.endDate, new Date())!;
    } else {
      return {};
    }

    return {
      where: {
        [fieldName]: {
          gte: startDate,
          lte: endDate,
        },
      },
    };
  }

  private getDateFilter(timeRange?: StatsTimeRangeDto) {
    if (!timeRange) return {};

    let startDate: Date;
    let endDate = new Date();

    if (timeRange.range) {
      switch (timeRange.range) {
        case 'day':
          startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
          break;
        case 'quarter':
          startDate = new Date(endDate.getFullYear(), Math.floor(endDate.getMonth() / 3) * 3, 1);
          break;
        case 'year':
          startDate = new Date(endDate.getFullYear(), 0, 1);
          break;
        default:
          return {};
      }
    } else {
      // Convert string dates to Date objects if needed
      startDate = timeRange.startDate 
        ? (typeof timeRange.startDate === 'string' ? new Date(timeRange.startDate) : timeRange.startDate)
        : new Date(0);
      
      endDate = timeRange.endDate 
        ? (typeof timeRange.endDate === 'string' ? new Date(timeRange.endDate) : timeRange.endDate)
        : new Date();
    }

    return {
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    };
  }

  private getDateRangeFilter(startDate?: Date | string, endDate?: Date | string) {
    if (!startDate && !endDate) return {};
    
    // Convert string dates to Date objects
    const start = startDate 
      ? (typeof startDate === 'string' ? new Date(startDate) : startDate)
      : undefined;
    
    const end = endDate 
      ? (typeof endDate === 'string' ? new Date(endDate) : endDate)
      : undefined;
    
    return {
      where: {
        createdAt: {
          ...(start && { gte: start }),
          ...(end && { lte: end }),
        },
      },
    };
  }

  // Placeholder implementations for additional methods
  private async getRegistrationTrend(_dateFilter: any) {
    return [];
  }

  private async getLoginActivity(_dateFilter: any) {
    return [];
  }

  private async getRoleDistribution() {
    return {};
  }

  private async getStatusChanges(_dateFilter: any) {
    return [];
  }

  private async getSubmissionTrend(_dateFilter: any, _institutionFilter: any) {
    return [];
  }

  private async getDifficultyPerformance(_institutionFilter: any) {
    return {};
  }

  private async getTopicPerformance(_institutionFilter: any) {
    return [];
  }

  private async getLanguageUsage(_institutionFilter: any) {
    return [];
  }

  private async getDatabaseMetrics() {
    return { tables: 0, size: '0 MB' };
  }

  private async getFailedJobsCount() {
    return 0;
  }

  private async getSystemResources() {
    return { cpu: 0, memory: 0, disk: 0 };
  }

  private convertToCSV(data: any): string {
    return JSON.stringify(data);
  }

  private convertToExcel(data: any): Buffer {
    return Buffer.from(JSON.stringify(data));
  }

  // Cache helpers
  private getFromCache(key: string): any {
    const cached = this.statsCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.statsCache.set(key, { data, timestamp: Date.now() });
  }

  // Scheduled cache cleanup
  @Cron(CronExpression.EVERY_10_MINUTES)
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.statsCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.statsCache.delete(key);
      }
    }
    this.logger.debug(`Cache cleanup completed. Current size: ${this.statsCache.size}`);
  }

  /**
   * Convert string or Date to Date object
   */
  private toDate(value: Date | string | undefined, defaultValue?: Date): Date | undefined {
    if (!value) return defaultValue;
    return typeof value === 'string' ? new Date(value) : value;
  }
}