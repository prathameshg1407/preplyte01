import { Module } from '@nestjs/common';
import { InstitutionsService } from './institutions.service';
import { InstitutionsController } from './institutions.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * The InstitutionsModule encapsulates all functionality related to managing
 * educational institutions within the platform.
 */
@Module({
  imports: [PrismaModule], // Provides PrismaService to the module
  controllers: [InstitutionsController],
  providers: [InstitutionsService],
})
export class InstitutionsModule {}
