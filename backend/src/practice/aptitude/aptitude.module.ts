import { Module } from '@nestjs/common';
import { AptitudeController } from './aptitude.controller';
import { AptitudeService } from './aptitude.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * The AptitudeModule encapsulates all functionality related to the
 * practice aptitude tests.
 */
@Module({
  imports: [PrismaModule],
  controllers: [AptitudeController],
  providers: [AptitudeService],
})
export class AptitudeModule {}
