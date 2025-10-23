// // src/email/email.service.ts
// import { Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import * as nodemailer from 'nodemailer';
// import { Transporter } from 'nodemailer';

// @Injectable()
// export class EmailService {
//   private readonly logger = new Logger(EmailService.name);
//   private transporter: Transporter;

//   constructor(private readonly configService: ConfigService) {
//     this.transporter = nodemailer.createTransport({
//       host: this.configService.get('SMTP_HOST'),
//       port: this.configService.get('SMTP_PORT'),
//       secure: false,
//       auth: {
//         user: this.configService.get('SMTP_USER'),
//         pass: this.configService.get('SMTP_PASS'),
//       },
//     });
//   }

//   async sendWelcomeEmail(email: string, fullName: string, verificationToken: string) {
//     const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${verificationToken}`;

//     try {
//       await this.transporter.sendMail({
//         from: this.configService.get('EMAIL_FROM'),
//         to: email,
//         subject: 'Welcome to Preplyte - Verify Your Email',
//         html: this.getWelcomeEmailTemplate(fullName, verificationUrl),
//       });

//       this.logger.log(`Welcome email sent to: ${email}`);
//     } catch (error) {
//       this.logger.error(`Failed to send welcome email: ${error.message}`);
//       throw error;
//     }
//   }

//   async sendPasswordResetEmail(email: string, fullName: string, resetToken: string) {
//     const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;

//     try {
//       await this.transporter.sendMail({
//         from: this.configService.get('EMAIL_FROM'),
//         to: email,
//         subject: 'Reset Your Password - Preplyte',
//         html: this.getPasswordResetTemplate(fullName, resetUrl),
//       });

//       this.logger.log(`Password reset email sent to: ${email}`);
//     } catch (error) {
//       this.logger.error(`Failed to send password reset email: ${error.message}`);
//       throw error;
//     }
//   }

//   async sendPasswordChangedEmail(email: string, fullName: string) {
//     try {
//       await this.transporter.sendMail({
//         from: this.configService.get('EMAIL_FROM'),
//         to: email,
//         subject: 'Your Password Has Been Changed - Preplyte',
//         html: this.getPasswordChangedTemplate(fullName),
//       });

//       this.logger.log(`Password changed notification sent to: ${email}`);
//     } catch (error) {
//       this.logger.error(`Failed to send password changed email: ${error.message}`);
//       throw error;
//     }
//   }

//   private getWelcomeEmailTemplate(fullName: string, verificationUrl: string): string {
//     return `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <style>
//           body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//           .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//           .button { 
//             display: inline-block; 
//             padding: 12px 24px; 
//             background-color: #4F46E5; 
//             color: white; 
//             text-decoration: none; 
//             border-radius: 6px; 
//             margin: 20px 0;
//           }
//           .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <h1>Welcome to Preplyte, ${fullName}!</h1>
//           <p>Thank you for registering. Please verify your email address to get started.</p>
//           <a href="${verificationUrl}" class="button">Verify Email Address</a>
//           <p>Or copy and paste this link in your browser:</p>
//           <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
//           <p>This link will expire in 24 hours.</p>
//           <div class="footer">
//             <p>If you didn't create an account, please ignore this email.</p>
//             <p>&copy; ${new Date().getFullYear()} Preplyte. All rights reserved.</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;
//   }

//   private getPasswordResetTemplate(fullName: string, resetUrl: string): string {
//     return `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <style>
//           body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//           .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//           .button { 
//             display: inline-block; 
//             padding: 12px 24px; 
//             background-color: #EF4444; 
//             color: white; 
//             text-decoration: none; 
//             border-radius: 6px; 
//             margin: 20px 0;
//           }
//           .warning { background-color: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0; }
//           .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <h1>Reset Your Password</h1>
//           <p>Hi ${fullName},</p>
//           <p>We received a request to reset your password. Click the button below to create a new password:</p>
//           <a href="${resetUrl}" class="button">Reset Password</a>
//           <p>Or copy and paste this link in your browser:</p>
//           <p style="word-break: break-all; color: #EF4444;">${resetUrl}</p>
//           <div class="warning">
//             <strong>⚠️ Important:</strong>
//             <ul>
//               <li>This link will expire in 1 hour</li>
//               <li>If you didn't request this, please ignore this email</li>
//               <li>Your password will remain unchanged</li>
//             </ul>
//           </div>
//           <div class="footer">
//             <p>&copy; ${new Date().getFullYear()} Preplyte. All rights reserved.</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;
//   }

//   private getPasswordChangedTemplate(fullName: string): string {
//     return `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <style>
//           body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//           .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//           .success { background-color: #D1FAE5; padding: 15px; border-left: 4px solid #10B981; margin: 20px 0; }
//           .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <h1>Password Changed Successfully</h1>
//           <p>Hi ${fullName},</p>
//           <div class="success">
//             <p><strong>✓ Your password has been successfully changed.</strong></p>
//           </div>
//           <p>If you made this change, no further action is required.</p>
//           <p>If you didn't change your password, please contact our support team immediately at support@preplyte.com</p>
//           <div class="footer">
//             <p>&copy; ${new Date().getFullYear()} Preplyte. All rights reserved.</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;
//   }
// }