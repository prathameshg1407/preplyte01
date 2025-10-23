import { Injectable, CanActivate, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ExecutionContext } from '@nestjs/common';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class WsThrottlerGuard implements CanActivate {
  private readonly logger = new Logger(WsThrottlerGuard.name);
  private readonly limit = 10; // max requests
  private readonly ttl = 60; // seconds
  private readonly blockDuration = 60; // seconds

  // In-memory storage for rate limiting (consider using Redis in production)
  private readonly storage = new Map<string, RateLimitRecord>();

  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const ip = this.getClientIp(client);
    const key = `ws:${ip}`;
    const now = Date.now();

    // Get or create record
    let record = this.storage.get(key);
    
    if (!record || now > record.resetTime) {
      // Create new record or reset expired one
      record = {
        count: 0,
        resetTime: now + (this.ttl * 1000)
      };
    }

    // Increment count
    record.count += 1;
    this.storage.set(key, record);

    // Clean up expired entries periodically
    if (Math.random() < 0.01) { // 1% chance to trigger cleanup
      this.cleanupExpiredEntries();
    }

    if (record.count > this.limit) {
      const retryIn = Math.ceil((record.resetTime - now) / 1000);
      this.logger.warn(`Rate limit exceeded for ${ip} — hits: ${record.count}, limit: ${this.limit}`);
      
      throw new WsException({
        event: 'error',
        data: {
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded. Try again in ${retryIn} seconds.`,
          meta: {
            limit: this.limit,
            ttl: this.ttl,
            hits: record.count,
            retryIn,
          },
        },
      });
    }

    return true;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, record] of this.storage.entries()) {
      if (now > record.resetTime) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.storage.delete(key));
    
    if (expiredKeys.length > 0) {
      this.logger.debug(`Cleaned up ${expiredKeys.length} expired rate limit entries`);
    }
  }

  private getClientIp(client: any): string {
    if (client?.handshake?.address) {
      return client.handshake.address;
    }
    if (client?.conn?.remoteAddress) {
      return client.conn.remoteAddress;
    }
    if (client?._socket?.remoteAddress) {
      return client._socket.remoteAddress;
    }
    if (client?.request?.connection?.remoteAddress) {
      return client.request.connection.remoteAddress;
    }
    if (client?.socket?.remoteAddress) {
      return client.socket.remoteAddress;
    }
    return client?.id ?? 'unknown';
  }
}