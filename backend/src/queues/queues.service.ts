// // src/queues/queues.service.ts
// import { Injectable, Logger } from '@nestjs/common';
// import { InjectQueue } from '@nestjs/bull';
// import { Queue } from 'bull';
// import { Cron, CronExpression } from '@nestjs/schedule';

// @Injectable()
// export class QueuesService {
//   private readonly logger = new Logger(QueuesService.name);

//   constructor(
//     @InjectQueue('session-cleanup') private sessionQueue: Queue,
//     @InjectQueue('token-cleanup') private tokenQueue: Queue,
//     @InjectQueue('email-queue') private emailQueue: Queue,
//     @InjectQueue('analytics') private analyticsQueue: Queue,
//   ) {}

//   // ==================== SESSION CLEANUP ====================

//   @Cron(CronExpression.EVERY_HOUR)
//   async scheduleSessionCleanup() {
//     this.logger.log('Scheduling session cleanup job');
//     await this.sessionQueue.add('cleanup-expired', {}, { priority: 1 });
//   }

//   async cleanupUserSessions(userId: string) {
//     await this.sessionQueue.add('cleanup-user-sessions', { userId });
//   }

//   // ==================== TOKEN CLEANUP ====================

//   @Cron(CronExpression.EVERY_6_HOURS)
//   async scheduleTokenCleanup() {
//     this.logger.log('Scheduling token cleanup job');
//     await this.tokenQueue.add('cleanup-expired', {}, { priority: 1 });
//   }

//   // ==================== EMAIL QUEUE ====================

//   async sendWelcomeEmail(data: {
//     email: string;
//     fullName: string;
//     verificationToken: string;
//   }) {
//     await this.emailQueue.add(
//       'welcome',
//       data,
//       {
//         attempts: 3,
//         backoff: {
//           type: 'exponential',
//           delay: 5000,
//         },
//       },
//     );
//   }

//   async sendPasswordResetEmail(data: {
//     email: string;
//     fullName: string;
//     resetToken: string;
//   }) {
//     await this.emailQueue.add('password-reset', data, { priority: 2 });
//   }

//   async sendPasswordChangedEmail(data: { email: string; fullName: string }) {
//     await this.emailQueue.add('password-changed', data);
//   }

//   // ==================== ANALYTICS ====================

//   async trackUserActivity(data: {
//     userId: string;
//     action: string;
//     metadata?: any;
//   }) {
//     await this.analyticsQueue.add('user-activity', data, { priority: 3 });
//   }

//   async generateDailyReport() {
//     await this.analyticsQueue.add('daily-report', {
//       date: new Date().toISOString(),
//     });
//   }

//   // ==================== QUEUE MANAGEMENT ====================

//   async getQueueStats(queueName: string) {
//     const queue = this[`${queueName}Queue`] as Queue;
//     if (!queue) {
//       throw new Error(`Queue ${queueName} not found`);
//     }

//     const [waiting, active, completed, failed, delayed] = await Promise.all([
//       queue.getWaitingCount(),
//       queue.getActiveCount(),
//       queue.getCompletedCount(),
//       queue.getFailedCount(),
//       queue.getDelayedCount(),
//     ]);

//     return {
//       queueName,
//       waiting,
//       active,
//       completed,
//       failed,
//       delayed,
//       total: waiting + active + completed + failed + delayed,
//     };
//   }

//   async pauseQueue(queueName: string) {
//     const queue = this[`${queueName}Queue`] as Queue;
//     await queue.pause();
//     this.logger.warn(`Queue ${queueName} paused`);
//   }

//   async resumeQueue(queueName: string) {
//     const queue = this[`${queueName}Queue`] as Queue;
//     await queue.resume();
//     this.logger.log(`Queue ${queueName} resumed`);
//   }

//   async cleanQueue(queueName: string) {
//     const queue = this[`${queueName}Queue`] as Queue;
//     await queue.clean(5000, 'completed');
//     await queue.clean(10000, 'failed');
//     this.logger.log(`Queue ${queueName} cleaned`);
//   }
// }

