import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBatchDto } from '../dto/create-batch.dto';
import { UpdateBatchDto } from '../dto/update-batch.dto';
import { Role, MockDriveRegistrationStatus } from '@prisma/client';

@Injectable()
export class MockDriveBatchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a batch
   */
  async createBatch(
    userId: string,
    mockDriveId: string,
    createBatchDto: CreateBatchDto,
  ) {
    // Verify user is admin and owns the mock drive
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== Role.INSTITUTION_ADMIN) {
      throw new ForbiddenException('Only institution admins can create batches');
    }

    const mockDrive = await this.prisma.mockDrive.findUnique({
      where: { id: mockDriveId },
    });

    if (!mockDrive) {
      throw new NotFoundException('Mock drive not found');
    }

    if (mockDrive.institutionId !== user.institutionId) {
      throw new ForbiddenException('You can only create batches for your institution');
    }

    // Validate batch times are within drive period
    const batchStart = new Date(createBatchDto.startTime);
    const batchEnd = new Date(createBatchDto.endTime);
    const driveStart = new Date(mockDrive.driveStartDate);
    const driveEnd = new Date(mockDrive.driveEndDate);

    if (batchStart < driveStart || batchEnd > driveEnd) {
      throw new BadRequestException(
        'Batch time must be within the mock drive period'
      );
    }

    if (batchEnd <= batchStart) {
      throw new BadRequestException('Batch end time must be after start time');
    }

    // Check for duplicate batch name
    const existingBatch = await this.prisma.mockDriveBatch.findUnique({
      where: {
        mockDriveId_batchName: {
          mockDriveId,
          batchName: createBatchDto.batchName,
        },
      },
    });

    if (existingBatch) {
      throw new BadRequestException('A batch with this name already exists');
    }

    // Create batch
    const batch = await this.prisma.mockDriveBatch.create({
      data: {
        mockDriveId,
        batchName: createBatchDto.batchName,
        startTime: new Date(createBatchDto.startTime),
        endTime: new Date(createBatchDto.endTime),
        maxStudents: createBatchDto.maxStudents,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    return batch;
  }

  /**
   * Get all batches for a mock drive
   */
  async getBatches(userId: string, mockDriveId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== Role.INSTITUTION_ADMIN) {
      throw new ForbiddenException('Only institution admins can view batches');
    }

    const mockDrive = await this.prisma.mockDrive.findUnique({
      where: { id: mockDriveId },
    });

    if (!mockDrive) {
      throw new NotFoundException('Mock drive not found');
    }

    if (mockDrive.institutionId !== user.institutionId) {
      throw new ForbiddenException('You can only view batches for your institution');
    }

    const batches = await this.prisma.mockDriveBatch.findMany({
      where: { mockDriveId },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
        students: {
          include: {
            registration: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    profile: {
                      select: {
                        fullName: true,
                        graduationYear: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return batches;
  }

  /**
   * Get single batch
   */
  async getBatch(userId: string, mockDriveId: string, batchId: string) {
    const batch = await this.prisma.mockDriveBatch.findUnique({
      where: { id: batchId },
      include: {
        mockDrive: true,
        _count: {
          select: {
            students: true,
          },
        },
        students: {
          include: {
            registration: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    profile: {
                      select: {
                        fullName: true,
                        graduationYear: true,
                        averageCgpa: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    if (batch.mockDriveId !== mockDriveId) {
      throw new BadRequestException('Batch does not belong to this mock drive');
    }

    // Verify ownership
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== Role.INSTITUTION_ADMIN) {
      throw new ForbiddenException('Only institution admins can view batch details');
    }

    if (batch.mockDrive.institutionId !== user.institutionId) {
      throw new ForbiddenException('You can only view batches for your institution');
    }

    return batch;
  }

  /**
   * Update batch
   */
  async updateBatch(
    userId: string,
    mockDriveId: string,
    batchId: string,
    updateBatchDto: UpdateBatchDto,
  ) {
    const batch = await this.prisma.mockDriveBatch.findUnique({
      where: { id: batchId },
      include: {
        mockDrive: true,
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    // Verify ownership
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== Role.INSTITUTION_ADMIN) {
      throw new ForbiddenException('Only institution admins can update batches');
    }

    if (batch.mockDrive.institutionId !== user.institutionId) {
      throw new ForbiddenException('You can only update batches for your institution');
    }

    // Validate time changes
    if (updateBatchDto.startTime || updateBatchDto.endTime) {
      const startTime = updateBatchDto.startTime
        ? new Date(updateBatchDto.startTime)
        : batch.startTime;
      const endTime = updateBatchDto.endTime
        ? new Date(updateBatchDto.endTime)
        : batch.endTime;

      if (endTime <= startTime) {
        throw new BadRequestException('End time must be after start time');
      }

      // Check if within drive period
      const driveStart = new Date(batch.mockDrive.driveStartDate);
      const driveEnd = new Date(batch.mockDrive.driveEndDate);

      if (startTime < driveStart || endTime > driveEnd) {
        throw new BadRequestException(
          'Batch time must be within the mock drive period'
        );
      }
    }

    const updatedBatch = await this.prisma.mockDriveBatch.update({
      where: { id: batchId },
      data: {
        ...(updateBatchDto.batchName && { batchName: updateBatchDto.batchName }),
        ...(updateBatchDto.startTime && {
          startTime: new Date(updateBatchDto.startTime),
        }),
        ...(updateBatchDto.endTime && {
          endTime: new Date(updateBatchDto.endTime),
        }),
        ...(updateBatchDto.maxStudents !== undefined && {
          maxStudents: updateBatchDto.maxStudents,
        }),
        ...(updateBatchDto.isActive !== undefined && {
          isActive: updateBatchDto.isActive,
        }),
      },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    return updatedBatch;
  }

  /**
   * Delete batch
   */
  async deleteBatch(userId: string, mockDriveId: string, batchId: string) {
    const batch = await this.prisma.mockDriveBatch.findUnique({
      where: { id: batchId },
      include: {
        mockDrive: true,
        students: true,
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    // Verify ownership
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== Role.INSTITUTION_ADMIN) {
      throw new ForbiddenException('Only institution admins can delete batches');
    }

    if (batch.mockDrive.institutionId !== user.institutionId) {
      throw new ForbiddenException('You can only delete batches for your institution');
    }

    // Check if batch has students
    if (batch.students.length > 0) {
      throw new BadRequestException(
        'Cannot delete batch with assigned students. Remove students first.'
      );
    }

    await this.prisma.mockDriveBatch.delete({
      where: { id: batchId },
    });

    return {
      message: 'Batch deleted successfully',
    };
  }

  /**
   * Assign students to batch
   */
  async assignStudents(
    userId: string,
    mockDriveId: string,
    batchId: string,
    studentIds: string[],
  ) {
    const batch = await this.prisma.mockDriveBatch.findUnique({
      where: { id: batchId },
      include: {
        mockDrive: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    // Verify ownership
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== Role.INSTITUTION_ADMIN) {
      throw new ForbiddenException('Only institution admins can assign students');
    }

    if (batch.mockDrive.institutionId !== user.institutionId) {
      throw new ForbiddenException(
        'You can only assign students to batches in your institution'
      );
    }

    // Check batch capacity
    if (batch.maxStudents) {
      const availableSlots = batch.maxStudents - batch._count.students;
      if (studentIds.length > availableSlots) {
        throw new BadRequestException(
          `Batch only has ${availableSlots} available slots`
        );
      }
    }

    // Get registrations for these students
    const registrations = await this.prisma.mockDriveRegistration.findMany({
      where: {
        mockDriveId,
        userId: { in: studentIds },
        status: MockDriveRegistrationStatus.REGISTERED,
      },
    });

    if (registrations.length !== studentIds.length) {
      throw new BadRequestException(
        'Some students are not registered for this mock drive'
      );
    }

    // Check if any students are already in a batch
    const existingAssignments = await this.prisma.mockDriveBatchStudent.findMany({
      where: {
        registrationId: { in: registrations.map((r) => r.id) },
      },
    });

    if (existingAssignments.length > 0) {
      throw new BadRequestException(
        'Some students are already assigned to a batch'
      );
    }

    // Assign students to batch
    const batchStudents = await this.prisma.$transaction(
      registrations.map((registration) =>
        this.prisma.mockDriveBatchStudent.create({
          data: {
            batchId,
            registrationId: registration.id,
          },
        })
      )
    );

    // Update registration status
    await this.prisma.mockDriveRegistration.updateMany({
      where: {
        id: { in: registrations.map((r) => r.id) },
      },
      data: {
        status: MockDriveRegistrationStatus.BATCH_ASSIGNED,
      },
    });

    return {
      message: `${batchStudents.length} students assigned to batch successfully`,
      assignedCount: batchStudents.length,
    };
  }

  /**
   * Remove student from batch
   */
  async removeStudent(
    userId: string,
    mockDriveId: string,
    batchId: string,
    studentId: string,
  ) {
    const batch = await this.prisma.mockDriveBatch.findUnique({
      where: { id: batchId },
      include: {
        mockDrive: true,
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    // Verify ownership
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== Role.INSTITUTION_ADMIN) {
      throw new ForbiddenException('Only institution admins can remove students');
    }

    if (batch.mockDrive.institutionId !== user.institutionId) {
      throw new ForbiddenException(
        'You can only remove students from batches in your institution'
      );
    }

    // Find the student's registration
    const registration = await this.prisma.mockDriveRegistration.findUnique({
      where: {
        mockDriveId_userId: {
          mockDriveId,
          userId: studentId,
        },
      },
      include: {
        batchStudent: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Student registration not found');
    }

    if (!registration.batchStudent || registration.batchStudent.batchId !== batchId) {
      throw new BadRequestException('Student is not in this batch');
    }

    // Remove from batch
    await this.prisma.mockDriveBatchStudent.delete({
      where: {
        id: registration.batchStudent.id,
      },
    });

    // Update registration status back to REGISTERED
    await this.prisma.mockDriveRegistration.update({
      where: { id: registration.id },
      data: {
        status: MockDriveRegistrationStatus.REGISTERED,
      },
    });

    return {
      message: 'Student removed from batch successfully',
    };
  }

  /**
   * Get unassigned registered students for a mock drive
   */
  async getUnassignedStudents(userId: string, mockDriveId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== Role.INSTITUTION_ADMIN) {
      throw new ForbiddenException('Only institution admins can view students');
    }

    const mockDrive = await this.prisma.mockDrive.findUnique({
      where: { id: mockDriveId },
    });

    if (!mockDrive) {
      throw new NotFoundException('Mock drive not found');
    }

    if (mockDrive.institutionId !== user.institutionId) {
      throw new ForbiddenException(
        'You can only view students for your institution'
      );
    }

    const unassignedStudents = await this.prisma.mockDriveRegistration.findMany({
      where: {
        mockDriveId,
        status: MockDriveRegistrationStatus.REGISTERED,
        batchStudent: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                graduationYear: true,
                averageCgpa: true,
              },
            },
          },
        },
      },
      orderBy: {
        registeredAt: 'asc',
      },
    });

    return unassignedStudents;
  }

  /**
   * Get student's assigned batch (for student use)
   */
  async getMyBatch(userId: string, mockDriveId: string) {
    const registration = await this.prisma.mockDriveRegistration.findUnique({
      where: {
        mockDriveId_userId: {
          mockDriveId,
          userId,
        },
      },
      include: {
        batchStudent: {
          include: {
            batch: true,
          },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('You are not registered for this mock drive');
    }

    if (!registration.batchStudent) {
      return null;
    }

    return registration.batchStudent.batch;
  }
}