// // src/auth/services/session.service.ts
// import { Injectable, Logger } from '@nestjs/common';
// import { PrismaService } from '@/prisma/prisma.service';
// import { Session } from '@prisma/client';
// import * as crypto from 'crypto';

// @Injectable()
// export class SessionService {
//   private readonly logger = new Logger(SessionService.name);

//   constructor(private readonly prisma: PrismaService) {}

//   async createSession(
//     userId: string,
//     ipAddress?: string,
//     userAgent?: string,
//     rememberMe = false,
//   ): Promise<Session> {
//     const sessionToken = crypto.randomBytes(32).toString('hex');
//     const expiresAt = rememberMe
//       ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
//       : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

//     const session = await this.prisma.session.create({
//       data: {
//         userId,
//         sessionToken,
//         ipAddress,
//         userAgent,
//         expiresAt,
//       },
//     });

//     this.logger.log(`Session created: ${session.id} for user: ${userId}`);
//     return session;
//   }

//   async validateSession(sessionId: string, userId: string): Promise<Session | null> {
//     const session = await this.prisma.session.findFirst({
//       where: {
//         id: sessionId,
//         userId,
//         expiresAt: { gt: new Date() },
//       },
//       include: { user: true },
//     });

//     return session;
//   }

//   async getActiveSessions(userId: string): Promise<Session[]> {
//     return this.prisma.session.findMany({
//       where: {
//         userId,
//         expiresAt: { gt: new Date() },
//       },
//       orderBy: { createdAt: 'desc' },
//     });
//   }

//   async revokeSession(sessionId: string): Promise<void> {
//     await this.prisma.session.delete({
//       where: { id: sessionId },
//     });
//   }

//   async revokeAllUserSessions(userId: string): Promise<void> {
//     await this.prisma.session.deleteMany({
//       where: { userId },
//     });
//   }

//   async cleanupExpiredSessions(): Promise<number> {
//     const result = await this.prisma.session.deleteMany({
//       where: {
//         expiresAt: { lt: new Date() },
//       },
//     });

//     this.logger.log(`Cleaned up ${result.count} expired sessions`);
//     return result.count;
//   }
// }
