// // src/auth/listeners/auth-events.listener.ts
// import { Injectable, Logger } from '@nestjs/common';
// import { OnEvent } from '@nestjs/event-emitter';
// import { EmailService } from '@/email/email.service';

// @Injectable()
// export class AuthEventsListener {
//   private readonly logger = new Logger(AuthEventsListener.name);

//   constructor(private readonly emailService: EmailService) {}

//   @OnEvent('user.registered')
//   async handleUserRegistered(payload: {
//     userId: string;
//     email: string;
//     fullName: string;
//     verificationToken: string;
//   }) {
//     this.logger.log(`User registered event: ${payload.userId}`);
    
//     try {
//       await this.emailService.sendWelcomeEmail(
//         payload.email,
//         payload.fullName,
//         payload.verificationToken,
//       );
//     } catch (error) {
//       this.logger.error(`Failed to send welcome email: ${error.message}`);
//     }
//   }

//   @OnEvent('password.reset.requested')
//   async handlePasswordResetRequested(payload: {
//     userId: string;
//     email: string;
//     fullName: string;
//     resetToken: string;
//   }) {
//     this.logger.log(`Password reset requested: ${payload.userId}`);
    
//     try {
//       await this.emailService.sendPasswordResetEmail(
//         payload.email,
//         payload.fullName,
//         payload.resetToken,
//       );
//     } catch (error) {
//       this.logger.error(`Failed to send password reset email: ${error.message}`);
//     }
//   }

//   @OnEvent('password.changed')
//   async handlePasswordChanged(payload: {
//     userId: string;
//     email: string;
//     fullName: string;
//   }) {
//     this.logger.log(`Password changed: ${payload.userId}`);
    
//     try {
//       await this.emailService.sendPasswordChangedEmail(
//         payload.email,
//         payload.fullName,
//       );
//     } catch (error) {
//       this.logger.error(`Failed to send password changed email: ${error.message}`);
//     }
//   }

//   @OnEvent('user.login')
//   handleUserLogin(payload: { userId: string; sessionId: string }) {
//     this.logger.log(`User logged in: ${payload.userId}, Session: ${payload.sessionId}`);
//     // Add analytics, suspicious login detection, etc.
//   }

//   @OnEvent('user.logout')
//   handleUserLogout(payload: { userId: string; sessionId: string }) {
//     this.logger.log(`User logged out: ${payload.userId}`);
//   }
// }