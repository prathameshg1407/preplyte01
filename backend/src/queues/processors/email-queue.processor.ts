// // src/queues/processors/email-queue.processor.ts
// import { Processor, Process } from '@nestjs/bull';
// import { Logger } from '@nestjs/common';
// import { Job } from 'bull';
// import { EmailService } from '@/email/email.service';

// @Processor('email-queue')
// export class EmailQueueProcessor {
//   private readonly logger = new Logger(EmailQueueProcessor.name);

//   constructor(private readonly emailService: EmailService) {}

//   @Process('welcome')
//   async handleWelcomeEmail(
//     job: Job<{ email: string; fullName: string; verificationToken: string }>,
//   ) {
//     const { email, fullName, verificationToken } = job.data;
//     this.logger.log(`Sending welcome email to: ${email}`);

//     try {
//       await this.emailService.sendWelcomeEmail(email, fullName, verificationToken);
//       return { success: true };
//     } catch (error) {
//       this.logger.error(`Failed to send welcome email to ${email}:`, error);
//       throw error;
//     }
//   }

//   @Process('password-reset')
//   async handlePasswordResetEmail(
//     job: Job<{ email: string; fullName: string; resetToken: string }>,
//   ) {
//     const { email, fullName, resetToken } = job.data;
//     this.logger.log(`Sending password reset email to: ${email}`);

//     try {
//       await this.emailService.sendPasswordResetEmail(email, fullName, resetToken);
//       return { success: true };
//     } catch (error) {
//       this.logger.error(`Failed to send password reset email to ${email}:`, error);
//       throw error;
//     }
//   }

//   @Process('password-changed')
//   async handlePasswordChangedEmail(
//     job: Job<{ email: string; fullName: string }>,
//   ) {
//     const { email, fullName } = job.data;
//     this.logger.log(`Sending password changed email to: ${email}`);

//     try {
//       await this.emailService.sendPasswordChangedEmail(email, fullName);
//       return { success: true };
//     } catch (error) {
//       this.logger.error(`Failed to send password changed email to ${email}:`, error);
//       throw error;
//     }
//   }
// }