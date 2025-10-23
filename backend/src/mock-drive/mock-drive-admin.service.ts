import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMockDriveDto } from './dto/create-mock-drive.dto';
import { UpdateMockDriveDto } from './dto/update-mock-drive.dto';
import { QueryMockDriveDto } from './dto/query-mock-drive.dto';
import { MockDriveStatus, Role, Prisma } from '@prisma/client';

@Injectable()
export class MockDriveAdminService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateMockDriveDto) {
    // Get user with institution
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { institution: true },
    });

    if (!user || user.role !== Role.INSTITUTION_ADMIN) {
      throw new ForbiddenException('Only institution admins can create mock drives');
    }

    if (!user.institutionId) {
      throw new BadRequestException('User must be associated with an institution');
    }

    // Validate dates
    this.validateDates(dto);

    // Validate at least one test is configured
    if (!dto.aptitudeConfig && !dto.machineTestConfig && !dto.aiInterviewConfig) {
      throw new BadRequestException(
        'At least one test type must be configured (Aptitude, Machine Test, or AI Interview)',
      );
    }

    // Calculate total duration from individual test durations
    const calculatedDuration = this.calculateTotalDuration(dto);
    if (dto.duration !== calculatedDuration) {
      throw new BadRequestException(
        `Total duration (${dto.duration}) doesn't match sum of test durations (${calculatedDuration})`,
      );
    }

    // Start transaction
    return await this.prisma.$transaction(async (tx) => {
      // Build create data object
      const createData: Prisma.MockDriveCreateInput = {
        title: dto.title,
        description: dto.description,
        institution: {
          connect: { id: user.institutionId! }
        },
        eligibleYear: dto.eligibleYear,
        eligibilityCriteria: (dto.eligibilityCriteria || {}) as Prisma.InputJsonValue,
        registrationStartDate: new Date(dto.registrationStartDate),
        registrationEndDate: new Date(dto.registrationEndDate),
        driveStartDate: new Date(dto.driveStartDate),
        driveEndDate: new Date(dto.driveEndDate),
        duration: dto.duration,
        isPublished: dto.isPublished || false,
        status: dto.isPublished
          ? MockDriveStatus.REGISTRATION_OPEN
          : MockDriveStatus.DRAFT,
        createdBy: userId,
      };

      // Add aptitude test if configured
      if (dto.aptitudeConfig?.existingTestId) {
        createData.aptitudeTest = {
          connect: { id: dto.aptitudeConfig.existingTestId }
        };
      }

      // Add AI interview config if provided
      if (dto.aiInterviewConfig) {
        createData.aiInterviewConfig = JSON.parse(JSON.stringify(dto.aiInterviewConfig)) as Prisma.InputJsonValue;
      }

      // Create mock drive
      const mockDrive = await tx.mockDrive.create({
        data: createData,
      });

      // Handle machine test problems
      if (dto.machineTestConfig) {
        await this.handleMachineTestProblems(
          tx,
          mockDrive.id,
          dto.machineTestConfig,
          user.institutionId!,
        );
      }

      // Fetch complete mock drive with relations
      return await tx.mockDrive.findUnique({
        where: { id: mockDrive.id },
        include: {
          institution: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
          aptitudeTest: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          machineTestProblems: {
            include: {
              problem: {
                select: {
                  id: true,
                  title: true,
                  difficulty: true,
                },
              },
            },
            orderBy: {
              orderIndex: 'asc',
            },
          },
          _count: {
            select: {
              registrations: true,
              attempts: true,
            },
          },
        },
      });
    });
  }

  async findAll(userId: string, query: QueryMockDriveDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== Role.INSTITUTION_ADMIN) {
      throw new ForbiddenException('Only institution admins can view all mock drives');
    }

    // Check if institution admin has an institution ID
    if (!user.institutionId) {
      throw new ForbiddenException('Institution admin must have an institution ID');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { status, search, eligibleYear, isPublished, sortBy, sortOrder } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.MockDriveWhereInput = {
      institutionId: user.institutionId,
    };

    if (status) {
      where.status = status;
    }

    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    if (eligibleYear) {
      where.eligibleYear = {
        has: eligibleYear,
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy safely
    const orderBy: Prisma.MockDriveOrderByWithRelationInput = {};
    if (sortBy && (sortBy === 'createdAt' || sortBy === 'driveStartDate' || sortBy === 'title')) {
      orderBy[sortBy] = sortOrder ?? 'desc';
    } else {
      orderBy.createdAt = sortOrder ?? 'desc';
    }

    const [mockDrives, total] = await Promise.all([
      this.prisma.mockDrive.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          institution: {
            select: {
              id: true,
              name: true,
            },
          },
          aptitudeTest: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              registrations: true,
              attempts: true,
              machineTestProblems: true,
            },
          },
        },
      }),
      this.prisma.mockDrive.count({ where }),
    ]);

    return {
      data: mockDrives,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const mockDrive = await this.prisma.mockDrive.findUnique({
      where: { id },
      include: {
        institution: true,
        aptitudeTest: {
          include: {
            questions: {
              include: {
                question: {
                  select: {
                    id: true,
                    question: true,
                    difficulty: true,
                    tags: true,
                  },
                },
              },
            },
          },
        },
        machineTestProblems: {
          include: {
            problem: {
              select: {
                id: true,
                title: true,
                difficulty: true,
                tags: true,
              },
            },
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
        _count: {
          select: {
            registrations: true,
            attempts: true,
            results: true,
          },
        },
      },
    });

    if (!mockDrive) {
      throw new NotFoundException('Mock drive not found');
    }

    // Check ownership
    if (
      user.role === Role.INSTITUTION_ADMIN &&
      mockDrive.institutionId !== user.institutionId
    ) {
      throw new ForbiddenException('You can only view mock drives from your institution');
    }

    return mockDrive;
  }

  async update(userId: string, id: string, dto: UpdateMockDriveDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const existingMockDrive = await this.prisma.mockDrive.findUnique({
      where: { id },
      include: {
        registrations: true,
      },
    });

    if (!existingMockDrive) {
      throw new NotFoundException('Mock drive not found');
    }

    // Check ownership
    if (
      user.role === Role.INSTITUTION_ADMIN &&
      existingMockDrive.institutionId !== user.institutionId
    ) {
      throw new ForbiddenException('You can only update mock drives from your institution');
    }

    // Don't allow major changes if registrations exist
    if (existingMockDrive.registrations.length > 0) {
      if (dto.driveStartDate || dto.driveEndDate || dto.eligibleYear) {
        throw new BadRequestException(
          'Cannot modify dates or eligibility after students have registered',
        );
      }
    }

    // Validate dates if provided
    if (
      dto.registrationStartDate ||
      dto.registrationEndDate ||
      dto.driveStartDate ||
      dto.driveEndDate
    ) {
      this.validateDates({
        ...existingMockDrive,
        ...dto,
        registrationStartDate:
          dto.registrationStartDate || existingMockDrive.registrationStartDate.toISOString(),
        registrationEndDate:
          dto.registrationEndDate || existingMockDrive.registrationEndDate.toISOString(),
        driveStartDate: dto.driveStartDate || existingMockDrive.driveStartDate.toISOString(),
        driveEndDate: dto.driveEndDate || existingMockDrive.driveEndDate.toISOString(),
      } as any);
    }

    return await this.prisma.$transaction(async (tx) => {
      // Update machine test problems if provided
      if (dto.machineTestConfig) {
        // Delete existing problems
        await tx.mockDriveMachineProblem.deleteMany({
          where: { mockDriveId: id },
        });

        // Add new problems
        await this.handleMachineTestProblems(
          tx,
          id,
          dto.machineTestConfig,
          existingMockDrive.institutionId,
        );
      }

      // Build update data
      const updateData: Prisma.MockDriveUpdateInput = {};

      if (dto.title) updateData.title = dto.title;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.eligibleYear) updateData.eligibleYear = dto.eligibleYear;
      if (dto.eligibilityCriteria)
        updateData.eligibilityCriteria = dto.eligibilityCriteria as Prisma.InputJsonValue;
      
      // Handle aptitude test relation
      if (dto.aptitudeConfig?.existingTestId !== undefined) {
        if (dto.aptitudeConfig.existingTestId) {
          updateData.aptitudeTest = {
            connect: { id: dto.aptitudeConfig.existingTestId }
          };
        } else {
          updateData.aptitudeTest = {
            disconnect: true
          };
        }
      }
      
      // Handle AI interview config - only update if provided
      if (dto.aiInterviewConfig) {
        updateData.aiInterviewConfig = JSON.parse(JSON.stringify(dto.aiInterviewConfig)) as Prisma.InputJsonValue;
      }
      
      if (dto.registrationStartDate)
        updateData.registrationStartDate = new Date(dto.registrationStartDate);
      if (dto.registrationEndDate)
        updateData.registrationEndDate = new Date(dto.registrationEndDate);
      if (dto.driveStartDate) updateData.driveStartDate = new Date(dto.driveStartDate);
      if (dto.driveEndDate) updateData.driveEndDate = new Date(dto.driveEndDate);
      if (dto.duration) updateData.duration = dto.duration;
      if (dto.isPublished !== undefined) updateData.isPublished = dto.isPublished;

      // Update mock drive
      const updated = await tx.mockDrive.update({
        where: { id },
        data: updateData,
        include: {
          institution: {
            select: {
              id: true,
              name: true,
            },
          },
          aptitudeTest: {
            select: {
              id: true,
              name: true,
            },
          },
          machineTestProblems: {
            include: {
              problem: {
                select: {
                  id: true,
                  title: true,
                  difficulty: true,
                },
              },
            },
          },
        },
      });

      return updated;
    });
  }

  async remove(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const mockDrive = await this.prisma.mockDrive.findUnique({
      where: { id },
      include: {
        registrations: true,
        attempts: true,
      },
    });

    if (!mockDrive) {
      throw new NotFoundException('Mock drive not found');
    }

    // Check ownership
    if (
      user.role === Role.INSTITUTION_ADMIN &&
      mockDrive.institutionId !== user.institutionId
    ) {
      throw new ForbiddenException('You can only delete mock drives from your institution');
    }

    // Don't allow deletion if attempts exist
    if (mockDrive.attempts.length > 0) {
      throw new BadRequestException(
        'Cannot delete mock drive with existing attempts. Archive it instead.',
      );
    }

    await this.prisma.mockDrive.delete({
      where: { id },
    });

    return { message: 'Mock drive deleted successfully' };
  }

  async publish(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const mockDrive = await this.prisma.mockDrive.findUnique({
      where: { id },
    });

    if (!mockDrive) {
      throw new NotFoundException('Mock drive not found');
    }

    if (user.role === Role.INSTITUTION_ADMIN && mockDrive.institutionId !== user.institutionId) {
      throw new ForbiddenException('You can only publish mock drives from your institution');
    }

    if (mockDrive.isPublished) {
      throw new BadRequestException('Mock drive is already published');
    }

    return await this.prisma.mockDrive.update({
      where: { id },
      data: {
        isPublished: true,
        status: MockDriveStatus.REGISTRATION_OPEN,
      },
    });
  }

  async unpublish(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const mockDrive = await this.prisma.mockDrive.findUnique({
      where: { id },
      include: {
        registrations: true,
      },
    });

    if (!mockDrive) {
      throw new NotFoundException('Mock drive not found');
    }

    if (user.role === Role.INSTITUTION_ADMIN && mockDrive.institutionId !== user.institutionId) {
      throw new ForbiddenException('You can only unpublish mock drives from your institution');
    }

    if (mockDrive.registrations.length > 0) {
      throw new BadRequestException('Cannot unpublish mock drive with existing registrations');
    }

    return await this.prisma.mockDrive.update({
      where: { id },
      data: {
        isPublished: false,
        status: MockDriveStatus.DRAFT,
      },
    });
  }

  // Helper methods
  private validateDates(dto: Partial<CreateMockDriveDto & { registrationStartDate: string; registrationEndDate: string; driveStartDate: string; driveEndDate: string }>) {
    if (
      !dto.registrationStartDate ||
      !dto.registrationEndDate ||
      !dto.driveStartDate ||
      !dto.driveEndDate
    ) {
      return; // Skip validation if dates are not provided
    }

    const regStart = new Date(dto.registrationStartDate);
    const regEnd = new Date(dto.registrationEndDate);
    const driveStart = new Date(dto.driveStartDate);
    const driveEnd = new Date(dto.driveEndDate);

    if (regEnd <= regStart) {
      throw new BadRequestException('Registration end date must be after start date');
    }

    if (driveStart <= regEnd) {
      throw new BadRequestException('Drive start date must be after registration end date');
    }

    if (driveEnd <= driveStart) {
      throw new BadRequestException('Drive end date must be after start date');
    }
  }

  private calculateTotalDuration(dto: CreateMockDriveDto): number {
    let total = 0;

    if (dto.aptitudeConfig) {
      total += dto.aptitudeConfig.durationMinutes;
    }

    if (dto.machineTestConfig) {
      total += dto.machineTestConfig.durationMinutes;
    }

    if (dto.aiInterviewConfig) {
      total += dto.aiInterviewConfig.durationMinutes;
    }

    return total;
  }

  private async handleMachineTestProblems(
    tx: any,
    mockDriveId: string,
    config: any,
    institutionId: number,
  ) {
    let problems: any[] = [];

    // Handle manually selected problems
    if (config.selectedProblems && config.selectedProblems.length > 0) {
      problems = config.selectedProblems.map((p: any, index: number) => ({
        mockDriveId,
        problemId: p.problemId,
        points: p.points,
        orderIndex: p.orderIndex ?? index,
      }));
    }
    // Handle auto-generated distribution
    else if (config.problemDistribution && config.problemDistribution.length > 0) {
      const selectedProblemIds = new Set<number>();

      for (const dist of config.problemDistribution) {
        const where: any = {
          difficulty: dist.difficulty,
          OR: [{ isPublic: true }, { institutionId }],
        };

        if (dist.topics && dist.topics.length > 0) {
          where.tags = {
            some: {
              tag: {
                name: { in: dist.topics },
              },
            },
          };
        }

        const availableProblems = await tx.machineTestProblem.findMany({
          where,
          take: dist.count * 2, // Get more to ensure uniqueness
        });

        // Randomly select required count
        const shuffled = availableProblems.sort(() => Math.random() - 0.5);
        const selected = shuffled
          .filter((p: any) => !selectedProblemIds.has(p.id))
          .slice(0, dist.count);

        selected.forEach((problem: any) => {
          selectedProblemIds.add(problem.id);
          problems.push({
            mockDriveId,
            problemId: problem.id,
            points: dist.pointsPerProblem,
            orderIndex: problems.length,
          });
        });
      }
    }

    if (problems.length > 0) {
      await tx.mockDriveMachineProblem.createMany({
        data: problems,
      });
    }
  }
}