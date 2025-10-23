import { Module } from '@nestjs/common';
import { MachineTestService } from './machine-test.service';
import { MachineTestController } from './machine-test.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MachineTestController],
  providers: [MachineTestService],
  
})
export class MachineTestModule {}
