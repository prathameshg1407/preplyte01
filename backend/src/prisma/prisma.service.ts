// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /**
   * Initializes the Prisma connection when the module is initialized.
   * This ensures the database is connected before any application logic runs.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Disconnects the Prisma client when the application is shutting down.
   * This is crucial for proper resource management.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
