// // src/queues/processors/token-cleanup.processor.ts
// import { Processor, Process } from '@nestjs/bull';
// import { Logger } from '@nestjs/common';
// import { Job } from 'bull';
// import { PrismaService } from '@/prisma/prisma.service';

// @Processor('token-cleanup')
// export class TokenCleanupProcessor {
//   private readonly logger = new Logger(TokenCleanupProcessor.name);

//   constructor(private readonly prisma: PrismaService) {}

//   @Process('cleanup-expired')
//   async handleCleanupExpired(job: Job) {
//     this.logger.log('Starting expired token cleanup');

//     try {
//       const [emailTokens, passwordTokens, lockouts] = await Promise.all([
//         this.prisma.emailVerificationToken.deleteMany({
//           where: { expiresAt: { lt: new Date() } },
//         }),
//         this.prisma.passwordResetToken.deleteMany({
//           where: { expiresAt: { lt: new Date() } },
//         }),
//         this.prisma.accountLockout.deleteMany({
//           where: { lockedUntil: { lt: new Date() } },
//         }),
//       ]);

//       const totalCleaned =
//         emailTokens.count + passwordTokens.count + lockouts.count;

//       this.logger.log(
//         `Cleaned up ${totalCleaned} expired tokens (Email: ${emailTokens.count}, Password: ${passwordTokens.count}, Lockouts: ${lockouts.count})`,
//       );

//       return { success: true, count: totalCleaned };
//     } catch (error) {
//       this.logger.error('Failed to cleanup expired tokens:', error);
//       throw error;
//     }
//   }
// }

