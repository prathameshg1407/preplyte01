import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class InstitutionOwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const mockDriveId = request.params.id;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Super admin can access all
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    // Institution admin must own the mock drive
    if (user.role === Role.INSTITUTION_ADMIN) {
      const mockDrive = await this.prisma.mockDrive.findUnique({
        where: { id: mockDriveId },
        select: { institutionId: true },
      });

      if (!mockDrive) {
        throw new NotFoundException('Mock drive not found');
      }

      if (mockDrive.institutionId !== user.institutionId) {
        throw new ForbiddenException(
          'You can only manage mock drives from your institution',
        );
      }

      return true;
    }

    throw new ForbiddenException('Insufficient permissions');
  }
}