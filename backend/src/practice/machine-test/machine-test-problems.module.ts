import { Module } from '@nestjs/common';
import { MachineTestProblemsService } from './machine-test-problems.service';
import { MachineTestProblemsController } from './machine-test-problems.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MachineTestProblemsController],
  providers: [MachineTestProblemsService],
})
export class MachineTestProblemsModule {}
