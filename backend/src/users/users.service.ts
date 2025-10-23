import { 
  Injectable, 
  NotFoundException, 
  Logger,
  InternalServerErrorException, 
  BadRequestException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  User, 
  Role, 
  UserStatus, 
  Prisma, 
  Profile, 
  QuestionDifficulty,
  SubmissionStatus,
  AiInterviewSessionStatus,
  ApplicationStatus
} from '@prisma/client';
// At the top of backend/src/users/users.service.ts
import * as bcrypt from 'bcryptjs';
import { addDays, subDays } from 'date-fns';

/**
 * Student dashboard statistics interface
 */
export interface StudentStats {
  role: Role;
  profile: {
    completionPercentage: number;
    hasResume: boolean;
  };
  aptitudeTests: {
    taken: number;
    averageScore: number;
    lastAttempt?: Date;
  };
  machineTests: {
    taken: number;
    completed: number;
    averageSuccessRate: number;
    history: Array<{
      id: number;
      difficulty: QuestionDifficulty;
      problemsCount: number;
      problemsPassed: number;
      problemsFailed: number;
      problemsIncomplete: number;
      createdAt: Date;
      completedAt?: Date | null;
    }>;
  };
  aiInterviews: {
    total: number;
    completed: number;
    averageScore: number;
    lastSession?: Date;
  };
  performance: {
    topSkills: Array<{
      name: string;
      category: string;
      averageScore: number;
      accuracy: number;
    }>;
    improvementAreas: Array<{
      name: string;
      category: string;
      averageScore: number;
      accuracy: number;
    }>;
  };
  jobApplications: {
    total: number;
    pending: number;
    shortlisted: number;
    rejected: number;
  };
}

export interface UserActivityMetrics {
  lastLoginAt?: Date;
  totalLogins: number;
  averageSessionDuration: number;
  lastActivityAt?: Date;
  activeDaysLast30: number;
  preferredLoginTime: string;
  deviceTypes: Array<{ device: string; count: number }>;
}

/**
 * User comparison interface
 */
export interface UserComparison {
  user: {
    id: string;
    name: string;
    metrics: any;
  };
  percentileRank: {
    overall: number;
    aptitude: number;
    coding: number;
    interview: number;
  };
  peerAverage: any;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds a user by email with institution
   */
  async findOneByEmail(email: string): Promise<(User & { institution: any }) | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
        include: { institution: true },
      });
    } catch (error) {
      this.logger.error(`Error finding user by email ${email}: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  /**
   * Finds a user by ID with profile
   */
  async findOneById(id: string): Promise<User & { profile: Profile | null }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: { profile: true },
      });
      
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error finding user by ID ${id}: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  /**
   * Gets comprehensive user profile
   */
  async getFullUserProfile(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          profile: {
            include: {
              skills: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
          institution: { 
            select: { 
              id: true, 
              name: true, 
              logoUrl: true 
            } 
          },
          resumes: {
            select: {
              id: true,
              title: true,
              storagePath: true,
              isPrimary: true,
              analysisStatus: true,
              uploadedAt: true,
              analysis: {
                select: {
                  atsScore: true,
                  formatScore: true,
                },
              },
            },
            orderBy: { isPrimary: 'desc' },
            take: 5,
          },
          topicPerformance: {
            orderBy: { averageScore: 'desc' },
            take: 10,
            select: {
              averageScore: true,
              accuracy: true,
              totalAttempts: true,
              tag: { 
                select: { 
                  name: true, 
                  category: true 
                } 
              },
            },
          },
          aiInterviewSessions: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              completedAt: true,
              _count: {
                select: {
                  responses: true,
                },
              },
              feedback: {
                select: {
                  overallScore: true,
                  keyStrengths: true,
                  areasForImprovement: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          jobApplications: {
            select: {
              id: true,
              status: true,
              appliedAt: true,
              job: {
                select: {
                  title: true,
                  location: true,
                },
              },
            },
            orderBy: { appliedAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error fetching full profile for user ${id}: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch user profile');
    }
  }

  /**
   * Gets paginated list of users
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<{ users: any[]; total: number; page: number; pageSize: number }> {
    const { skip = 0, take = 10, where, orderBy } = params;

    try {
      const [users, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({
          skip,
          take,
          where,
          orderBy: orderBy || { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            lastLoginAt: true,
            profile: {
              select: {
                fullName: true,
                profileImageUrl: true,
                graduationYear: true,
              },
            },
            institution: {
              select: {
                name: true,
              },
            },
            _count: {
              select: {
                machineTestSubmissions: true,
                aiInterviewSessions: true,
                jobApplications: true,
              },
            },
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      return { 
        users, 
        total,
        page: Math.floor(skip / take) + 1,
        pageSize: take,
      };
    } catch (error) {
      this.logger.error(`Error fetching users: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  /**
   * Updates user role (admin only)
   */
  async updateUserRole(id: string, newRole: Role): Promise<User> {
    await this.findOneById(id);
    
    try {
      return await this.prisma.user.update({
        where: { id },
        data: { 
          role: newRole,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Error updating role for user ${id}: ${error.message}`);
      throw new InternalServerErrorException('Failed to update user role');
    }
  }

  /**
   * Updates user status (admin only)
   */
  async updateUserStatus(id: string, newStatus: UserStatus): Promise<User> {
    await this.findOneById(id);
    
    try {
      return await this.prisma.user.update({
        where: { id },
        data: { 
          status: newStatus,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Error updating status for user ${id}: ${error.message}`);
      throw new InternalServerErrorException('Failed to update user status');
    }
  }

  /**
   * Gets comprehensive student statistics
   */
  async getStudentStats(userId: string): Promise<StudentStats | null> {
    const user = await this.findOneById(userId);

    if (user.role !== Role.STUDENT) {
      return null;
    }

    try {
      const [
        profile,
        resumeCount,
        aptitudeResponses,
        machineTestsData,
        aiInterviewData,
        topPerformance,
        bottomPerformance,
        // Individual counts for job applications
        totalApplications,
        pendingApplications,
        shortlistedApplications,
        rejectedApplications,
      ] = await this.prisma.$transaction([
        // Profile completion
        this.prisma.profile.findUnique({
          where: { userId },
          include: {
            skills: true,
          },
        }),
        
        // Resume count
        this.prisma.resume.count({ 
          where: { userId } 
        }),
        
        // Aptitude test stats
        this.prisma.aptitudeResponse.findMany({
          where: { userId },
          select: {
            percentage: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        
        // Machine test stats
        this.prisma.machineTest.findMany({
          where: { userId },
          include: {
            problems: {
              include: {
                problem: true,
              },
            },
            submissions: {
              where: { userId },
              select: {
                problemId: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        
        // AI Interview stats
        this.prisma.aiInterviewSession.findMany({
          where: { userId },
          select: {
            status: true,
            createdAt: true,
            completedAt: true,
            feedback: {
              select: {
                overallScore: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        
        // Top performance areas
        this.prisma.userTopicPerformance.findMany({
          where: { userId },
          orderBy: { averageScore: 'desc' },
          take: 5,
          include: {
            tag: true,
          },
        }),
        
        // Areas for improvement
        this.prisma.userTopicPerformance.findMany({
          where: { 
            userId,
            averageScore: { lt: 50 },
          },
          orderBy: { averageScore: 'asc' },
          take: 5,
          include: {
            tag: true,
          },
        }),
        
        // Job application stats - Fixed: Separate counts instead of groupBy
        this.prisma.jobApplication.count({
          where: { userId },
        }),
        
        this.prisma.jobApplication.count({
          where: { 
            userId,
            status: ApplicationStatus.PENDING,
          },
        }),
        
        this.prisma.jobApplication.count({
          where: { 
            userId,
            status: ApplicationStatus.SHORTLISTED,
          },
        }),
        
        this.prisma.jobApplication.count({
          where: { 
            userId,
            status: ApplicationStatus.REJECTED,
          },
        }),
      ]);

      // Calculate profile completion
      const profileCompletion = this.calculateProfileCompletion(profile);

      // Calculate aptitude stats
      const aptitudeStats = {
        taken: aptitudeResponses.length,
        averageScore: aptitudeResponses.length > 0
          ? aptitudeResponses.reduce((sum, r) => sum + r.percentage.toNumber(), 0) / aptitudeResponses.length
          : 0,
        lastAttempt: aptitudeResponses[0]?.createdAt,
      };

      // Process machine test data
      const machineTestHistory = machineTestsData.map((test) => {
        const problemsCount = test.problems.length;
        const submissionMap = new Map<number, SubmissionStatus>();
        
        test.submissions.forEach(sub => {
          const currentStatus = submissionMap.get(sub.problemId);
          if (!currentStatus || sub.status === SubmissionStatus.PASS) {
            submissionMap.set(sub.problemId, sub.status);
          }
        });

        const problemsPassed = Array.from(submissionMap.values())
          .filter(status => status === SubmissionStatus.PASS).length;
        const problemsFailed = Array.from(submissionMap.values())
          .filter(status => status !== SubmissionStatus.PASS).length;
        const problemsIncomplete = problemsCount - submissionMap.size;

        return {
          id: test.id,
          difficulty: test.difficulty,
          problemsCount,
          problemsPassed,
          problemsFailed,
          problemsIncomplete,
          createdAt: test.createdAt,
          completedAt: test.completedAt,
        };
      });

      // Calculate machine test stats
      const completedTests = machineTestHistory.filter(t => t.completedAt).length;
      const averageSuccessRate = machineTestHistory.length > 0
        ? machineTestHistory.reduce((sum, t) => 
            sum + (t.problemsPassed / (t.problemsCount || 1)) * 100, 0
          ) / machineTestHistory.length
        : 0;

      // Calculate AI interview stats
      const completedInterviews = aiInterviewData.filter(
        s => s.status === AiInterviewSessionStatus.COMPLETED
      ).length;
      
      const scoredInterviews = aiInterviewData.filter(s => s.feedback?.overallScore);
      const averageInterviewScore = scoredInterviews.length > 0
        ? scoredInterviews.reduce((sum, s) => 
            sum + (s.feedback?.overallScore?.toNumber() || 0), 0
          ) / scoredInterviews.length
        : 0;

      // Build job stats from individual counts
      const jobStats = {
        total: totalApplications,
        pending: pendingApplications,
        shortlisted: shortlistedApplications,
        rejected: rejectedApplications,
      };

      return {
        role: Role.STUDENT,
        profile: {
          completionPercentage: profileCompletion,
          hasResume: resumeCount > 0,
        },
        aptitudeTests: aptitudeStats,
        machineTests: {
          taken: machineTestsData.length,
          completed: completedTests,
          averageSuccessRate: Math.round(averageSuccessRate * 100) / 100,
          history: machineTestHistory.slice(0, 10),
        },
        aiInterviews: {
          total: aiInterviewData.length,
          completed: completedInterviews,
          averageScore: Math.round(averageInterviewScore * 100) / 100,
          lastSession: aiInterviewData[0]?.createdAt,
        },
        performance: {
          topSkills: topPerformance.map(p => ({
            name: p.tag.name,
            category: p.tag.category,
            averageScore: p.averageScore.toNumber(),
            accuracy: p.accuracy.toNumber(),
          })),
          improvementAreas: bottomPerformance.map(p => ({
            name: p.tag.name,
            category: p.tag.category,
            averageScore: p.averageScore.toNumber(),
            accuracy: p.accuracy.toNumber(),
          })),
        },
        jobApplications: jobStats,
      };
    } catch (error) {
      this.logger.error(`Error fetching student stats for ${userId}: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch student statistics');
    }
  }

  /**
   * Calculates profile completion percentage
   */
  private calculateProfileCompletion(profile: any): number {
    if (!profile) return 0;

    const fields = [
      'fullName',
      'graduationYear',
      'profileImageUrl',
      'linkedinUrl',
      'githubUrl',
      'sscPercentage',
      'hscPercentage',
      'averageCgpa',
      'skills',
    ];

    const completedFields = fields.filter(field => {
      if (field === 'skills') {
        return profile.skills && profile.skills.length > 0;
      }
      return profile[field] !== null && profile[field] !== undefined;
    });

    return Math.round((completedFields.length / fields.length) * 100);
  }

  /**
   * Gets AI interview statistics
   */
  async getAiInterviewStats(userId: string) {
    try {
      const sessions = await this.prisma.aiInterviewSession.findMany({
        where: { userId },
        include: {
          feedback: {
            select: {
              overallScore: true,
              keyStrengths: true,
              areasForImprovement: true,
            },
          },
          _count: {
            select: {
              responses: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const completed = sessions.filter(s => s.status === AiInterviewSessionStatus.COMPLETED);
      const withFeedback = sessions.filter(s => s.feedback);
      
      const scores = withFeedback
        .map(s => s.feedback?.overallScore?.toNumber() || 0)
        .filter(score => score > 0);

      const averageScore = scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;

      // Aggregate strengths and improvement areas
      const allStrengths = new Map<string, number>();
      const allImprovements = new Map<string, number>();

      withFeedback.forEach(session => {
        session.feedback?.keyStrengths?.forEach(strength => {
          allStrengths.set(strength, (allStrengths.get(strength) || 0) + 1);
        });
        session.feedback?.areasForImprovement?.forEach(area => {
          allImprovements.set(area, (allImprovements.get(area) || 0) + 1);
        });
      });

      return {
        totalSessions: sessions.length,
        completedSessions: completed.length,
        sessionsWithFeedback: withFeedback.length,
        averageScore: Math.round(averageScore * 100) / 100,
        averageResponsesPerSession: sessions.length > 0
          ? Math.round(
              sessions.reduce((sum, s) => sum + s._count.responses, 0) / sessions.length
            )
          : 0,
        topStrengths: Array.from(allStrengths.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([strength, count]) => ({ strength, count })),
        topImprovementAreas: Array.from(allImprovements.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([area, count]) => ({ area, count })),
        recentSessions: sessions.slice(0, 10).map(s => ({
          id: s.id,
          status: s.status,
          createdAt: s.createdAt,
          completedAt: s.completedAt,
          responsesCount: s._count.responses,
          score: s.feedback?.overallScore?.toNumber(),
        })),
      };
    } catch (error) {
      this.logger.error(`Error fetching AI interview stats for ${userId}: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch AI interview statistics');
    }
  }
   /**
   * Bulk update user status
   */
  async bulkUpdateStatus(
    userIds: string[], 
    newStatus: UserStatus,
    updatedBy: string
  ): Promise<{ updated: number; failed: string[] }> {
    const failed: string[] = [];
    let updated = 0;

    try {
      await this.prisma.$transaction(async (tx) => {
        for (const userId of userIds) {
          try {
            await tx.user.update({
              where: { id: userId },
              data: { 
                status: newStatus,
                updatedAt: new Date(),
              },
            });
            updated++;
          } catch (error) {
            failed.push(userId);
            this.logger.error(`Failed to update user ${userId}: ${error.message}`);
          }
        }
      });

      return { updated, failed };
    } catch (error) {
      this.logger.error(`Bulk status update failed: ${error.message}`);
      throw new InternalServerErrorException('Bulk update failed');
    }
  }

  /**
   * Gets user activity metrics
   */
  async getUserActivityMetrics(userId: string): Promise<UserActivityMetrics> {
    try {
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      const [user, sessions, recentActivity] = await this.prisma.$transaction([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { lastLoginAt: true },
        }),
        
        this.prisma.session.findMany({
          where: { 
            userId,
            createdAt: { gte: thirtyDaysAgo },
          },
          select: {
            createdAt: true,
            expiresAt: true,
            userAgent: true,
          },
        }),
        
        // Get recent activities
        this.prisma.$queryRaw<{ last_activity: Date }[]>`
          SELECT MAX(created_at) as last_activity
          FROM (
            SELECT created_at FROM machine_test_submissions WHERE user_id = ${userId}
            UNION ALL
            SELECT created_at FROM aptitude_responses WHERE user_id = ${userId}
            UNION ALL
            SELECT created_at FROM ai_interview_sessions WHERE user_id = ${userId}
          ) as activities
        `,
      ]);

      // Calculate metrics
      const totalLogins = sessions.length;
      const activeDays = new Set(sessions.map(s => 
        s.createdAt.toISOString().split('T')[0]
      )).size;

      // Calculate average session duration
      const sessionDurations = sessions.map(s => 
        s.expiresAt.getTime() - s.createdAt.getTime()
      );
      const avgDuration = sessionDurations.length > 0
        ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
        : 0;

      // Analyze login times
      const loginHours = sessions.map(s => s.createdAt.getHours());
      const hourCounts = loginHours.reduce((acc, hour) => {
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      const preferredHour = Object.entries(hourCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '0';

      // Analyze devices
      const deviceMap = new Map<string, number>();
      sessions.forEach(s => {
        if (s.userAgent) {
          const device = this.parseDeviceType(s.userAgent);
          deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
        }
      });

      return {
        lastLoginAt: user?.lastLoginAt || undefined,
        totalLogins,
        averageSessionDuration: Math.round(avgDuration / 1000 / 60), // in minutes
        lastActivityAt: recentActivity[0]?.last_activity,
        activeDaysLast30: activeDays,
        preferredLoginTime: `${preferredHour}:00`,
        deviceTypes: Array.from(deviceMap.entries()).map(([device, count]) => ({
          device,
          count,
        })),
      };
    } catch (error) {
      this.logger.error(`Error fetching activity metrics: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch activity metrics');
    }
  }

  /**
   * Compare user with peers
   */
  async compareUserWithPeers(
    userId: string,
    comparisonGroup?: 'institution' | 'batch' | 'all'
  ): Promise<UserComparison> {
    try {
      const user = await this.findOneById(userId);
      
      // Build comparison filter
      const whereClause: Prisma.UserWhereInput = {
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
      };

      if (comparisonGroup === 'institution' && user.institutionId) {
        whereClause.institutionId = user.institutionId;
      }

      // Get user's metrics
      const userMetrics = await this.getStudentStats(userId);
      
      // Get peer metrics
      const peers = await this.prisma.user.findMany({
        where: whereClause,
        select: { id: true },
      });

      const peerStats = await Promise.all(
        peers.map(peer => this.getStudentStats(peer.id))
      );

      // Calculate percentiles
      const calculatePercentile = (value: number, values: number[]): number => {
        const sorted = values.sort((a, b) => a - b);
        const index = sorted.findIndex(v => v >= value);
        return index === -1 ? 100 : (index / sorted.length) * 100;
      };

      const aptitudeScores = peerStats
        .filter(s => s)
        .map(s => s!.aptitudeTests.averageScore);
      
      const codingScores = peerStats
        .filter(s => s)
        .map(s => s!.machineTests.averageSuccessRate);
      
      const interviewScores = peerStats
        .filter(s => s)
        .map(s => s!.aiInterviews.averageScore);

      const overallScores = peerStats
        .filter(s => s)
        .map(s => {
          const apt = s!.aptitudeTests.averageScore || 0;
          const code = s!.machineTests.averageSuccessRate || 0;
          const int = s!.aiInterviews.averageScore || 0;
          return (apt + code + int) / 3;
        });

      return {
        user: {
          id: user.id,
          name: user.profile?.fullName || user.email,
          metrics: userMetrics,
        },
        percentileRank: {
          overall: calculatePercentile(
            ((userMetrics?.aptitudeTests.averageScore || 0) +
             (userMetrics?.machineTests.averageSuccessRate || 0) +
             (userMetrics?.aiInterviews.averageScore || 0)) / 3,
            overallScores
          ),
          aptitude: calculatePercentile(
            userMetrics?.aptitudeTests.averageScore || 0,
            aptitudeScores
          ),
          coding: calculatePercentile(
            userMetrics?.machineTests.averageSuccessRate || 0,
            codingScores
          ),
          interview: calculatePercentile(
            userMetrics?.aiInterviews.averageScore || 0,
            interviewScores
          ),
        },
        peerAverage: {
          aptitude: aptitudeScores.reduce((a, b) => a + b, 0) / aptitudeScores.length || 0,
          coding: codingScores.reduce((a, b) => a + b, 0) / codingScores.length || 0,
          interview: interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length || 0,
        },
      };
    } catch (error) {
      this.logger.error(`Error comparing user: ${error.message}`);
      throw new InternalServerErrorException('Failed to compare user');
    }
  }

  /**
   * Transfer user to different institution
   */
  async transferUserToInstitution(
    userId: string,
    newInstitutionId: number,
    transferredBy: string
  ): Promise<User> {
    try {
      const user = await this.findOneById(userId);
      
      if (user.role === Role.SUPER_ADMIN) {
        throw new BadRequestException('Cannot transfer super admin');
      }

      const institution = await this.prisma.institution.findUnique({
        where: { id: newInstitutionId },
      });

      if (!institution) {
        throw new NotFoundException('Institution not found');
      }

      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          institutionId: newInstitutionId,
          updatedAt: new Date(),
        },
        include: { institution: true },
      });
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error transferring user: ${error.message}`);
      throw new InternalServerErrorException('Failed to transfer user');
    }
  }

  /**
   * Force logout user (invalidate all sessions)
   */
  async forceLogout(userId: string): Promise<{ sessionsInvalidated: number }> {
    try {
      const result = await this.prisma.session.deleteMany({
        where: { userId },
      });

      return { sessionsInvalidated: result.count };
    } catch (error) {
      this.logger.error(`Error forcing logout: ${error.message}`);
      throw new InternalServerErrorException('Failed to force logout');
    }
  }

  /**
   * Get user's active sessions
   */
  async getUserSessions(userId: string) {
    try {
      const sessions = await this.prisma.session.findMany({
        where: {
          userId,
          expiresAt: { gt: new Date() },
        },
        select: {
          id: true,
          userAgent: true,
          createdAt: true,
          expiresAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return sessions.map(session => ({
        ...session,
        device: this.parseDeviceType(session.userAgent || ''),
        isExpired: session.expiresAt < new Date(),
      }));
    } catch (error) {
      this.logger.error(`Error fetching sessions: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch sessions');
    }
  }

  /**
   * Generate password reset token
   */
  async initiatePasswordReset(email: string): Promise<{ token: string; expiresAt: Date }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = this.generateSecureToken();
    const expiresAt = addDays(new Date(), 1);

    // Store token in sessions table with special identifier
    await this.prisma.session.create({
      data: {
        userId: user.id,
        sessionToken: `reset_${token}`,
        expiresAt,
        userAgent: 'password-reset',
      },
    });

    return { token, expiresAt };
  }

  /**
   * Complete password reset
   */
  async completePasswordReset(token: string, newPassword: string): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { sessionToken: `reset_${token}` },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: session.userId },
        data: { hashedPassword },
      }),
      this.prisma.session.delete({
        where: { id: session.id },
      }),
    ]);
  }

  /**
   * Get user engagement score
   */
  async getUserEngagementScore(userId: string): Promise<number> {
    try {
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      const [
        loginCount,
        testCount,
        applicationCount,
        interviewCount,
      ] = await this.prisma.$transaction([
        this.prisma.session.count({
          where: {
            userId,
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
        this.prisma.machineTest.count({
          where: {
            userId,
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
        this.prisma.jobApplication.count({
          where: {
            userId,
            appliedAt: { gte: thirtyDaysAgo },
          },
        }),
        this.prisma.aiInterviewSession.count({
          where: {
            userId,
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
      ]);

      // Calculate engagement score (0-100)
      const loginScore = Math.min(loginCount * 5, 30); // Max 30 points
      const testScore = Math.min(testCount * 10, 30); // Max 30 points
      const applicationScore = Math.min(applicationCount * 10, 20); // Max 20 points
      const interviewScore = Math.min(interviewCount * 10, 20); // Max 20 points

      return loginScore + testScore + applicationScore + interviewScore;
    } catch (error) {
      this.logger.error(`Error calculating engagement score: ${error.message}`);
      return 0;
    }
  }

  /**
   * Helper: Parse device type from user agent
   */
  private parseDeviceType(userAgent: string): string {
    if (/mobile/i.test(userAgent)) return 'Mobile';
    if (/tablet/i.test(userAgent)) return 'Tablet';
    return 'Desktop';
  }

  /**
   * Helper: Generate secure token
   */
  private generateSecureToken(): string {
    return Array.from({ length: 32 }, () => 
      Math.random().toString(36)[2]
    ).join('');
  }
}