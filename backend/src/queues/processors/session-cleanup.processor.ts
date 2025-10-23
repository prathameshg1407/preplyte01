// // src/queues/processors/session-cleanup.processor.ts
// import { Processor, Process } from '@nestjs/bull';
// import { Logger } from '@nestjs/common';
// import { Job } from 'bull';
// import { PrismaService } from '@/prisma/prisma.service';

// @Processor('session-cleanup')
// export class SessionCleanupProcessor {
//   private readonly logger = new Logger(SessionCleanupProcessor.name);

//   constructor(private readonly prisma: PrismaService) {}

//   @Process('cleanup-expired')
//   async handleCleanupExpired(job: Job) {
//     this.logger.log('Starting expired session cleanup');

//     try {
//       const result = await this.prisma.session.deleteMany({
//         where: {
//           expiresAt: {
//             lt: new Date(),
//           },
//         },
//       });

//       this.logger.log(`Cleaned up ${result.count} expired sessions`);
//       return { success: true, count: result.count };
//     } catch (error) {
//       this.logger.error('Failed to cleanup expired sessions:', error);
//       throw error;
//     }
//   }

//   @Process('cleanup-user-sessions')
//   async handleCleanupUserSessions(job: Job<{ userId: string }>) {
//     const { userId } = job.data;
//     this.logger.log(`Cleaning up sessions for user: ${userId}`);

//     try {
//       const result = await this.prisma.session.deleteMany({
//         where: { userId },
//       });

//       this.logger.log(`Cleaned up ${result.count} sessions for user ${userId}`);
//       return { success: true, count: result.count };
//     } catch (error) {
//       this.logger.error(`Failed to cleanup sessions for user ${userId}:`, error);
//       throw error;
//     }
//   }
// }

