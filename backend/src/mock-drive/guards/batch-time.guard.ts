import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BatchTimeGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const mockDriveId = request.params.id || request.body.mockDriveId;

    if (!userId || !mockDriveId) {
      throw new ForbiddenException('Invalid request');
    }

    // Get user's batch assignment
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
      throw new ForbiddenException('You are not registered for this mock drive');
    }

    if (!registration.batchStudent) {
      throw new ForbiddenException(
        'You have not been assigned to a batch yet. Please contact admin.'
      );
    }

    const batch = registration.batchStudent.batch;
    const now = new Date();
    const batchStart = new Date(batch.startTime);
    const batchEnd = new Date(batch.endTime);

    if (now < batchStart) {
      throw new ForbiddenException(
        `Your batch starts at ${batchStart.toLocaleString()}. Please wait until then.`
      );
    }

    if (now > batchEnd) {
      throw new ForbiddenException(
        'Your batch time has ended. You can no longer attempt this mock drive.'
      );
    }

    if (!batch.isActive) {
      throw new ForbiddenException('Your batch is currently inactive.');
    }

    return true;
  }
}