import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MockDriveRegistrationStatus,
  Role,
  UserStatus,
} from '@prisma/client';

@Injectable()
export class MockDriveRegistrationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Register student for a mock drive
   */
  async registerForMockDrive(userId: string, mockDriveId: string) {
    // Get user with profile
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user || user.role !== Role.STUDENT) {
      throw new ForbiddenException('Only students can register for mock drives');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Your account is not active');
    }

    if (!user.institutionId) {
      throw new BadRequestException('You must be associated with an institution');
    }

    // Get mock drive
    const mockDrive = await this.prisma.mockDrive.findUnique({
      where: { id: mockDriveId },
      include: {
        registrations: {
          where: { userId },
        },
      },
    });

    if (!mockDrive) {
      throw new NotFoundException('Mock drive not found');
    }

    // Validation checks
    if (!mockDrive.isPublished) {
      throw new BadRequestException('This mock drive is not published yet');
    }

    if (mockDrive.institutionId !== user.institutionId) {
      throw new ForbiddenException('This mock drive is not available for your institution');
    }

    // Check if already registered
    if (mockDrive.registrations.length > 0) {
      throw new BadRequestException('You are already registered for this mock drive');
    }

    // Check registration period
    const now = new Date();
    const regStart = new Date(mockDrive.registrationStartDate);
    const regEnd = new Date(mockDrive.registrationEndDate);

    if (now < regStart) {
      throw new BadRequestException('Registration has not started yet');
    }

    if (now > regEnd) {
      throw new BadRequestException('Registration period has ended');
    }

    // Check eligible year
    if (user.profile?.graduationYear) {
      const currentYear = new Date().getFullYear();
      const studentYear = user.profile.graduationYear - currentYear;

      if (studentYear > 0 && studentYear <= 4) {
        if (!mockDrive.eligibleYear.includes(studentYear)) {
          throw new BadRequestException(
            `This mock drive is not open for Year ${studentYear} students`
          );
        }
      }
    }

    // Check eligibility criteria
    if (mockDrive.eligibilityCriteria && typeof mockDrive.eligibilityCriteria === 'object') {
      const criteria = mockDrive.eligibilityCriteria as any;

      // Check CGPA
      if (criteria.minCgpa && user.profile?.averageCgpa) {
        const cgpa = parseFloat(user.profile.averageCgpa.toString());
        if (cgpa < criteria.minCgpa) {
          throw new BadRequestException(
            `Minimum CGPA required: ${criteria.minCgpa}, Your CGPA: ${cgpa}`
          );
        }
      }

      // Check SSC percentage
      if (criteria.minSscPercentage && user.profile?.sscPercentage) {
        const ssc = parseFloat(user.profile.sscPercentage.toString());
        if (ssc < criteria.minSscPercentage) {
          throw new BadRequestException(
            `Minimum SSC percentage required: ${criteria.minSscPercentage}%, Your percentage: ${ssc}%`
          );
        }
      }

      // Check HSC percentage
      if (criteria.minHscPercentage && user.profile?.hscPercentage) {
        const hsc = parseFloat(user.profile.hscPercentage.toString());
        if (hsc < criteria.minHscPercentage) {
          throw new BadRequestException(
            `Minimum HSC percentage required: ${criteria.minHscPercentage}%, Your percentage: ${hsc}%`
          );
        }
      }

      // Check required skills
      if (criteria.requiredSkills && Array.isArray(criteria.requiredSkills) && criteria.requiredSkills.length > 0) {
        const userSkills = await this.prisma.profile.findUnique({
          where: { userId },
          include: {
            skills: true,
          },
        });

        const userSkillNames = userSkills?.skills.map(s => s.name.toLowerCase()) || [];
        const missingSkills = criteria.requiredSkills.filter(
          (skill: string) => !userSkillNames.includes(skill.toLowerCase())
        );

        if (missingSkills.length > 0) {
          throw new BadRequestException(
            `Required skills missing: ${missingSkills.join(', ')}`
          );
        }
      }
    }

    // Create registration
    const registration = await this.prisma.mockDriveRegistration.create({
      data: {
        mockDriveId,
        userId,
        status: MockDriveRegistrationStatus.REGISTERED,
      },
      include: {
        mockDrive: {
          select: {
            id: true,
            title: true,
            driveStartDate: true,
            driveEndDate: true,
          },
        },
      },
    });

    return registration;
  }

  /**
   * Cancel registration
   */
  async cancelRegistration(userId: string, registrationId: string) {
    const registration = await this.prisma.mockDriveRegistration.findUnique({
      where: { id: registrationId },
      include: {
        mockDrive: true,
        batchStudent: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own registration');
    }

    // Check if mock drive has started
    const now = new Date();
    if (now >= new Date(registration.mockDrive.driveStartDate)) {
      throw new BadRequestException('Cannot cancel registration after drive has started');
    }

    // Check if student is in a batch
    if (registration.batchStudent) {
      throw new BadRequestException(
        'You have been assigned to a batch. Please contact admin to cancel registration'
      );
    }

    // Update status to CANCELLED instead of deleting
    await this.prisma.mockDriveRegistration.update({
      where: { id: registrationId },
      data: {
        status: MockDriveRegistrationStatus.CANCELLED,
      },
    });

    return {
      message: 'Registration cancelled successfully',
    };
  }

  /**
   * Get my registrations
   */
  async getMyRegistrations(userId: string) {
    const registrations = await this.prisma.mockDriveRegistration.findMany({
      where: {
        userId,
        status: {
          not: MockDriveRegistrationStatus.CANCELLED,
        },
      },
      include: {
        mockDrive: {
          select: {
            id: true,
            title: true,
            description: true,
            registrationStartDate: true,
            registrationEndDate: true,
            driveStartDate: true,
            driveEndDate: true,
            duration: true,
            status: true,
            isPublished: true,
          },
        },
        batchStudent: {
          include: {
            batch: true,
          },
        },
      },
      orderBy: {
        registeredAt: 'desc',
      },
    });

    return registrations;
  }

  /**
   * Check eligibility for a mock drive
   */
  async checkEligibility(userId: string, mockDriveId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            skills: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const mockDrive = await this.prisma.mockDrive.findUnique({
      where: { id: mockDriveId },
    });

    if (!mockDrive) {
      throw new NotFoundException('Mock drive not found');
    }

    const reasons: string[] = [];
    let eligible = true;

    // Check institution
    if (mockDrive.institutionId !== user.institutionId) {
      eligible = false;
      reasons.push('This mock drive is not available for your institution');
    }

    // Check eligible year
    if (user.profile?.graduationYear) {
      const currentYear = new Date().getFullYear();
      const studentYear = user.profile.graduationYear - currentYear;

      if (studentYear > 0 && studentYear <= 4) {
        if (!mockDrive.eligibleYear.includes(studentYear)) {
          eligible = false;
          reasons.push(`This mock drive is only for Year ${mockDrive.eligibleYear.join(', ')} students`);
        }
      }
    }

    // Check eligibility criteria
    if (mockDrive.eligibilityCriteria && typeof mockDrive.eligibilityCriteria === 'object') {
      const criteria = mockDrive.eligibilityCriteria as any;

      if (criteria.minCgpa && user.profile?.averageCgpa) {
        const cgpa = parseFloat(user.profile.averageCgpa.toString());
        if (cgpa < criteria.minCgpa) {
          eligible = false;
          reasons.push(`Minimum CGPA required: ${criteria.minCgpa} (Your CGPA: ${cgpa})`);
        }
      }

      if (criteria.minSscPercentage && user.profile?.sscPercentage) {
        const ssc = parseFloat(user.profile.sscPercentage.toString());
        if (ssc < criteria.minSscPercentage) {
          eligible = false;
          reasons.push(`Minimum SSC percentage required: ${criteria.minSscPercentage}%`);
        }
      }

      if (criteria.minHscPercentage && user.profile?.hscPercentage) {
        const hsc = parseFloat(user.profile.hscPercentage.toString());
        if (hsc < criteria.minHscPercentage) {
          eligible = false;
          reasons.push(`Minimum HSC percentage required: ${criteria.minHscPercentage}%`);
        }
      }

      if (criteria.requiredSkills && Array.isArray(criteria.requiredSkills) && criteria.requiredSkills.length > 0) {
        const userSkillNames = user.profile?.skills.map(s => s.name.toLowerCase()) || [];
        const missingSkills = criteria.requiredSkills.filter(
          (skill: string) => !userSkillNames.includes(skill.toLowerCase())
        );

        if (missingSkills.length > 0) {
          eligible = false;
          reasons.push(`Required skills missing: ${missingSkills.join(', ')}`);
        }
      }
    }

    return {
      eligible,
      reasons: eligible ? [] : reasons,
    };
  }

  async getRegistrationsForAdmin(
  userId: string,
  mockDriveId: string,
  params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  },
) {
  // Verify user has access
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  const mockDrive = await this.prisma.mockDrive.findUnique({
    where: { id: mockDriveId },
  });

  if (!mockDrive) {
    throw new NotFoundException('Mock drive not found');
  }

  if (
    user?.role === Role.INSTITUTION_ADMIN &&
    mockDrive.institutionId !== user.institutionId
  ) {
    throw new ForbiddenException(
      'You can only view registrations for your institution',
    );
  }

  const { page, limit, search, status } = params;
  const skip = (page - 1) * limit;

  const where: any = { mockDriveId };

  if (status && status !== 'all') {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { user: { email: { contains: search, mode: 'insensitive' } } },
      {
        user: {
          profile: { fullName: { contains: search, mode: 'insensitive' } },
        },
      },
    ];
  }

  const [registrations, total] = await Promise.all([
    this.prisma.mockDriveRegistration.findMany({
      where,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        batchStudent: {
          include: {
            batch: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        registeredAt: 'desc',
      },
    }),
    this.prisma.mockDriveRegistration.count({ where }),
  ]);

  return {
    data: registrations,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
}