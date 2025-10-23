// src/common/utils/request.util.ts
import { Request } from 'express';

export class RequestUtil {
  static getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    }
    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  static getUserAgent(request: Request): string {
    return request.headers['user-agent'] || 'unknown';
  }

  static getRequestId(request: Request): string {
    return (request.headers['x-request-id'] as string) || crypto.randomUUID();
  }
}