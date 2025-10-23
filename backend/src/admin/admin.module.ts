import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register({
      ttl: 300, // 5 minutes default TTL
      max: 100, // maximum items in cache
    }),
    ScheduleModule.forRoot(),
  ],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService], // Export for use in other modules if needed
})
export class AdminModule {}