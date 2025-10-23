import { Role, UserStatus, QuestionDifficulty, ApplicationStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Base statistics interface shared by all admin types
 */
interface BaseAdminStats {
  role: string;
  generatedAt: Date;
}

/**
 * User distribution by status
 */
export interface UserStatusDistribution {
  [UserStatus.ACTIVE]: number;
  [UserStatus.SUSPENDED]: number;
  [UserStatus.DELETED]: number;
  [UserStatus.PENDING_PROFILE_COMPLETION]: number;
}

/**
 * Question distribution by difficulty
 */
export interface DifficultyDistribution {
  [QuestionDifficulty.EASY]: number;
  [QuestionDifficulty.MEDIUM]: number;
  [QuestionDifficulty.HARD]: number;
}

/**
 * Application status distribution
 */
export interface ApplicationStatusDistribution {
  [ApplicationStatus.PENDING]: number;
  [ApplicationStatus.REVIEWED]: number;
  [ApplicationStatus.SHORTLISTED]: number;
  [ApplicationStatus.REJECTED]: number;
  [ApplicationStatus.ACCEPTED]: number;
}

/**
 * Platform growth metrics
 */
export interface GrowthMetrics {
  usersThisMonth: number;
  usersLastMonth: number;
  growthPercentage: number;
}

/**
 * Super Admin statistics
 */
export class SuperAdminStats implements BaseAdminStats {
  @ApiProperty({ enum: ['SUPER_ADMIN'] })
  role: 'SUPER_ADMIN';

  @ApiProperty()
  generatedAt: Date;

  @ApiProperty({ description: 'Total number of users on the platform' })
  totalUsers: number;

  @ApiProperty({ description: 'User distribution by status' })
  usersByStatus: UserStatusDistribution;

  @ApiProperty({ description: 'User distribution by role' })
  usersByRole: {
    students: number;
    institutionAdmins: number;
    superAdmins: number;
  };

  @ApiProperty({ description: 'Total number of institutions' })
  totalInstitutions: number;

  @ApiProperty({ description: 'Assessment content statistics' })
  assessmentContent: {
    totalAptitudeQuestions: number;
    aptitudeByDifficulty: DifficultyDistribution;
    totalCodingProblems: number;
    codingByDifficulty: DifficultyDistribution;
    publicCodingProblems: number;
  };

  @ApiProperty({ description: 'Platform activity metrics' })
  platformActivity: {
    totalSubmissions: number;
    totalAiInterviews: number;
    totalResumes: number;
    activeSessionsCount: number;
  };

  @ApiProperty({ description: 'Platform growth metrics' })
  growth: GrowthMetrics;
}

/**
 * Institution Admin statistics
 */
export class InstitutionAdminStats implements BaseAdminStats {
  @ApiProperty({ enum: ['INSTITUTION_ADMIN'] })
  role: 'INSTITUTION_ADMIN';

  @ApiProperty()
  generatedAt: Date;

  @ApiProperty({ description: 'Institution ID' })
  institutionId: number;

  @ApiProperty({ description: 'Institution name' })
  institutionName: string;

  @ApiProperty({ description: 'Student statistics' })
  students: {
    total: number;
    active: number;
    suspended: number;
    pendingProfileCompletion: number;
    byGraduationYear: Record<number, number>;
  };

  @ApiProperty({ description: 'Assessment performance' })
  assessmentPerformance: {
    averageAptitudeScore: number;
    totalAptitudeAttempts: number;
    averageCodingScore: number;
    totalCodingSubmissions: number;
    topPerformers: Array<{
      userId: string;
      name: string;
      averageScore: number;
    }>;
  };

  @ApiProperty({ description: 'Career opportunities' })
  careerOpportunities: {
    jobs: {
      total: number;
      active: number;
      applications: ApplicationStatusDistribution;
    };
    internships: {
      total: number;
      active: number;
      applications: ApplicationStatusDistribution;
    };
    hackathons: {
      total: number;
      upcoming: number;
      registrations: ApplicationStatusDistribution;
    };
  };

  @ApiProperty({ description: 'AI Interview statistics' })
  aiInterviews: {
    totalSessions: number;
    completedSessions: number;
    averageScore: number;
    thisMonth: number;
  };

  @ApiProperty({ description: 'Content created by institution' })
  content: {
    aptitudeTests: number;
    codingProblems: number;
    batches: number;
  };

  @ApiProperty({ description: 'Recent activity' })
  recentActivity: {
    lastWeekSubmissions: number;
    lastWeekApplications: number;
    lastWeekRegistrations: number;
  };
}

/**
 * Union type for all admin statistics
 */
export type AdminStats = SuperAdminStats | InstitutionAdminStats;

/**
 * Time range filter for statistics
 */
export class StatsTimeRangeDto {
  @ApiProperty({ 
    required: false, 
    description: 'Start date for statistics range',
    type: String,
    format: 'date-time',
    example: '2024-01-01T00:00:00Z'
  })
  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid ISO 8601 date string' })
  @Type(() => Date)
  startDate?: Date | string;

  @ApiProperty({ 
    required: false, 
    description: 'End date for statistics range',
    type: String,
    format: 'date-time',
    example: '2024-12-31T23:59:59Z'
  })
  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid ISO 8601 date string' })
  @Type(() => Date)
  endDate?: Date | string;

  @ApiProperty({ 
    required: false, 
    enum: ['day', 'week', 'month', 'quarter', 'year'],
    description: 'Predefined time range',
    example: 'month'
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'quarter', 'year'], {
    message: 'range must be one of: day, week, month, quarter, year'
  })
  range?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}