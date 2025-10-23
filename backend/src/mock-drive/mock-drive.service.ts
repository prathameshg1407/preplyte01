import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryMockDriveDto } from './dto/query-mock-drive.dto';
import { Role, Prisma } from '@prisma/client';

@Injectable()
export class MockDriveService {
  constructor(private prisma: PrismaService) {}

  async findAllForStudent(userId: string, query: QueryMockDriveDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user || user.role !== Role.STUDENT) {
      throw new ForbiddenException('Only students can view available mock drives');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (!user.institutionId) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    const { status, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.MockDriveWhereInput = {
      institutionId: user.institutionId,
      isPublished: true,
    };

    if (status) {
      where.status = status;
    }

    // Filter by eligible year based on user's graduation year
    if (user.profile?.graduationYear) {
      const currentYear = new Date().getFullYear();
      const studentYear = user.profile.graduationYear - currentYear;

      if (studentYear > 0 && studentYear <= 4) {
        where.eligibleYear = {
          has: studentYear,
        };
      }
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
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      }),
      this.prisma.mockDrive.count({ where }),
    ]);

    // Check if user is registered for each drive
    const driveIds = mockDrives.map((d) => d.id);
    const userRegistrations = await this.prisma.mockDriveRegistration.findMany({
      where: {
        userId,
        mockDriveId: { in: driveIds },
      },
    });

    const registrationMap = new Map(userRegistrations.map((r) => [r.mockDriveId, r]));

    const drivesWithRegistration = mockDrives.map((drive) => ({
      ...drive,
      userRegistration: registrationMap.get(drive.id) || null,
      isRegistered: registrationMap.has(drive.id),
    }));

    return {
      data: drivesWithRegistration,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneForStudent(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const mockDrive = await this.prisma.mockDrive.findUnique({
      where: { id },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            registrations: true,
            machineTestProblems: true,
          },
        },
      },
    });

    if (!mockDrive) {
      throw new NotFoundException('Mock drive not found');
    }

    // Check if student can view this drive
    if (user.role === Role.STUDENT) {
      if (!mockDrive.isPublished) {
        throw new ForbiddenException('This mock drive is not published');
      }

      if (mockDrive.institutionId !== user.institutionId) {
        throw new ForbiddenException('This mock drive is not available for your institution');
      }
    }

    // Check registration status
    const registration = await this.prisma.mockDriveRegistration.findUnique({
      where: {
        mockDriveId_userId: {
          mockDriveId: id,
          userId,
        },
      },
    });

    return {
      ...mockDrive,
      userRegistration: registration,
      isRegistered: !!registration,
    };
  }
}