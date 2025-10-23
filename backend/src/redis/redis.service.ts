// // src/redis/redis.service.ts
// import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import Redis, { Redis as RedisClient } from 'ioredis';

// @Injectable()
// export class RedisService implements OnModuleInit, OnModuleDestroy {
//   private readonly logger = new Logger(RedisService.name);
//   private client: RedisClient;
//   private subscriber: RedisClient;
//   private publisher: RedisClient;

//   constructor(private readonly configService: ConfigService) {}

//   async onModuleInit() {
//     const redisConfig = {
//       host: this.configService.get('REDIS_HOST', 'localhost'),
//       port: this.configService.get('REDIS_PORT', 6379),
//       password: this.configService.get('REDIS_PASSWORD'),
//       db: this.configService.get('REDIS_DB', 0),
//       retryStrategy: (times: number) => {
//         const delay = Math.min(times * 50, 2000);
//         return delay;
//       },
//       maxRetriesPerRequest: 3,
//       enableReadyCheck: true,
//       enableOfflineQueue: true,
//     };

//     // Main client for general operations
//     this.client = new Redis(redisConfig);
    
//     // Separate clients for pub/sub
//     this.subscriber = new Redis(redisConfig);
//     this.publisher = new Redis(redisConfig);

//     this.client.on('connect', () => {
//       this.logger.log('Redis client connected');
//     });

//     this.client.on('ready', () => {
//       this.logger.log('Redis client ready');
//     });

//     this.client.on('error', (error) => {
//       this.logger.error('Redis client error:', error);
//     });

//     this.client.on('close', () => {
//       this.logger.warn('Redis client connection closed');
//     });

//     this.client.on('reconnecting', () => {
//       this.logger.log('Redis client reconnecting...');
//     });

//     // Test connection
//     try {
//       await this.client.ping();
//       this.logger.log('Redis connection successful');
//     } catch (error) {
//       this.logger.error('Redis connection failed:', error);
//       throw error;
//     }
//   }

//   async onModuleDestroy() {
//     await Promise.all([
//       this.client.quit(),
//       this.subscriber.quit(),
//       this.publisher.quit(),
//     ]);
//     this.logger.log('Redis connections closed');
//   }

//   // ==================== BASIC OPERATIONS ====================

//   async get(key: string): Promise<string | null> {
//     try {
//       return await this.client.get(key);
//     } catch (error) {
//       this.logger.error(`Error getting key ${key}:`, error);
//       throw error;
//     }
//   }

//   async set(
//     key: string,
//     value: string | number,
//     mode?: 'EX' | 'PX',
//     duration?: number,
//   ): Promise<'OK'> {
//     try {
//       if (mode && duration) {
//         return await this.client.set(key, value, mode, duration);
//       }
//       return await this.client.set(key, value);
//     } catch (error) {
//       this.logger.error(`Error setting key ${key}:`, error);
//       throw error;
//     }
//   }

//   async setex(key: string, seconds: number, value: string): Promise<'OK'> {
//     try {
//       return await this.client.setex(key, seconds, value);
//     } catch (error) {
//       this.logger.error(`Error setting key with expiry ${key}:`, error);
//       throw error;
//     }
//   }

//   async del(...keys: string[]): Promise<number> {
//     try {
//       return await this.client.del(...keys);
//     } catch (error) {
//       this.logger.error(`Error deleting keys:`, error);
//       throw error;
//     }
//   }

//   async exists(...keys: string[]): Promise<number> {
//     try {
//       return await this.client.exists(...keys);
//     } catch (error) {
//       this.logger.error(`Error checking existence:`, error);
//       throw error;
//     }
//   }

//   async expire(key: string, seconds: number): Promise<number> {
//     try {
//       return await this.client.expire(key, seconds);
//     } catch (error) {
//       this.logger.error(`Error setting expiry for ${key}:`, error);
//       throw error;
//     }
//   }

//   async ttl(key: string): Promise<number> {
//     try {
//       return await this.client.ttl(key);
//     } catch (error) {
//       this.logger.error(`Error getting TTL for ${key}:`, error);
//       throw error;
//     }
//   }

//   async incr(key: string): Promise<number> {
//     try {
//       return await this.client.incr(key);
//     } catch (error) {
//       this.logger.error(`Error incrementing ${key}:`, error);
//       throw error;
//     }
//   }

//   async decr(key: string): Promise<number> {
//     try {
//       return await this.client.decr(key);
//     } catch (error) {
//       this.logger.error(`Error decrementing ${key}:`, error);
//       throw error;
//     }
//   }

//   async incrby(key: string, increment: number): Promise<number> {
//     try {
//       return await this.client.incrby(key, increment);
//     } catch (error) {
//       this.logger.error(`Error incrementing ${key} by ${increment}:`, error);
//       throw error;
//     }
//   }

//   // ==================== HASH OPERATIONS ====================

//   async hset(key: string, field: string, value: string): Promise<number> {
//     try {
//       return await this.client.hset(key, field, value);
//     } catch (error) {
//       this.logger.error(`Error setting hash field ${key}:${field}:`, error);
//       throw error;
//     }
//   }

//   async hget(key: string, field: string): Promise<string | null> {
//     try {
//       return await this.client.hget(key, field);
//     } catch (error) {
//       this.logger.error(`Error getting hash field ${key}:${field}:`, error);
//       throw error;
//     }
//   }

//   async hgetall(key: string): Promise<Record<string, string>> {
//     try {
//       return await this.client.hgetall(key);
//     } catch (error) {
//       this.logger.error(`Error getting all hash fields ${key}:`, error);
//       throw error;
//     }
//   }

//   async hdel(key: string, ...fields: string[]): Promise<number> {
//     try {
//       return await this.client.hdel(key, ...fields);
//     } catch (error) {
//       this.logger.error(`Error deleting hash fields ${key}:`, error);
//       throw error;
//     }
//   }

//   async hincrby(key: string, field: string, increment: number): Promise<number> {
//     try {
//       return await this.client.hincrby(key, field, increment);
//     } catch (error) {
//       this.logger.error(`Error incrementing hash field ${key}:${field}:`, error);
//       throw error;
//     }
//   }

//   // ==================== SET OPERATIONS ====================

//   async sadd(key: string, ...members: string[]): Promise<number> {
//     try {
//       return await this.client.sadd(key, ...members);
//     } catch (error) {
//       this.logger.error(`Error adding to set ${key}:`, error);
//       throw error;
//     }
//   }

//   async srem(key: string, ...members: string[]): Promise<number> {
//     try {
//       return await this.client.srem(key, ...members);
//     } catch (error) {
//       this.logger.error(`Error removing from set ${key}:`, error);
//       throw error;
//     }
//   }

//   async smembers(key: string): Promise<string[]> {
//     try {
//       return await this.client.smembers(key);
//     } catch (error) {
//       this.logger.error(`Error getting set members ${key}:`, error);
//       throw error;
//     }
//   }

//   async sismember(key: string, member: string): Promise<number> {
//     try {
//       return await this.client.sismember(key, member);
//     } catch (error) {
//       this.logger.error(`Error checking set membership ${key}:`, error);
//       throw error;
//     }
//   }

//   // ==================== SORTED SET OPERATIONS ====================

//   async zadd(
//     key: string,
//     score: number,
//     member: string,
//   ): Promise<number | string> {
//     try {
//       return await this.client.zadd(key, score, member);
//     } catch (error) {
//       this.logger.error(`Error adding to sorted set ${key}:`, error);
//       throw error;
//     }
//   }

//   async zrange(key: string, start: number, stop: number): Promise<string[]> {
//     try {
//       return await this.client.zrange(key, start, stop);
//     } catch (error) {
//       this.logger.error(`Error getting sorted set range ${key}:`, error);
//       throw error;
//     }
//   }

//   async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
//     try {
//       return await this.client.zrevrange(key, start, stop);
//     } catch (error) {
//       this.logger.error(`Error getting reverse sorted set range ${key}:`, error);
//       throw error;
//     }
//   }

//   async zrem(key: string, ...members: string[]): Promise<number> {
//     try {
//       return await this.client.zrem(key, ...members);
//     } catch (error) {
//       this.logger.error(`Error removing from sorted set ${key}:`, error);
//       throw error;
//     }
//   }

//   async zremrangebyscore(
//     key: string,
//     min: number | string,
//     max: number | string,
//   ): Promise<number> {
//     try {
//       return await this.client.zremrangebyscore(key, min, max);
//     } catch (error) {
//       this.logger.error(`Error removing by score from sorted set ${key}:`, error);
//       throw error;
//     }
//   }

//   // ==================== LIST OPERATIONS ====================

//   async lpush(key: string, ...values: string[]): Promise<number> {
//     try {
//       return await this.client.lpush(key, ...values);
//     } catch (error) {
//       this.logger.error(`Error pushing to list ${key}:`, error);
//       throw error;
//     }
//   }

//   async rpush(key: string, ...values: string[]): Promise<number> {
//     try {
//       return await this.client.rpush(key, ...values);
//     } catch (error) {
//       this.logger.error(`Error pushing to list ${key}:`, error);
//       throw error;
//     }
//   }

//   async lpop(key: string): Promise<string | null> {
//     try {
//       return await this.client.lpop(key);
//     } catch (error) {
//       this.logger.error(`Error popping from list ${key}:`, error);
//       throw error;
//     }
//   }

//   async rpop(key: string): Promise<string | null> {
//     try {
//       return await this.client.rpop(key);
//     } catch (error) {
//       this.logger.error(`Error popping from list ${key}:`, error);
//       throw error;
//     }
//   }

//   async lrange(key: string, start: number, stop: number): Promise<string[]> {
//     try {
//       return await this.client.lrange(key, start, stop);
//     } catch (error) {
//       this.logger.error(`Error getting list range ${key}:`, error);
//       throw error;
//     }
//   }

//   // ==================== PUB/SUB OPERATIONS ====================

//   async publish(channel: string, message: string): Promise<number> {
//     try {
//       return await this.publisher.publish(channel, message);
//     } catch (error) {
//       this.logger.error(`Error publishing to ${channel}:`, error);
//       throw error;
//     }
//   }

//   async subscribe(
//     channel: string,
//     callback: (channel: string, message: string) => void,
//   ): Promise<void> {
//     try {
//       await this.subscriber.subscribe(channel);
//       this.subscriber.on('message', callback);
//     } catch (error) {
//       this.logger.error(`Error subscribing to ${channel}:`, error);
//       throw error;
//     }
//   }

//   async unsubscribe(channel: string): Promise<void> {
//     try {
//       await this.subscriber.unsubscribe(channel);
//     } catch (error) {
//       this.logger.error(`Error unsubscribing from ${channel}:`, error);
//       throw error;
//     }
//   }

//   // ==================== PATTERN MATCHING ====================

//   async keys(pattern: string): Promise<string[]> {
//     try {
//       return await this.client.keys(pattern);
//     } catch (error) {
//       this.logger.error(`Error getting keys with pattern ${pattern}:`, error);
//       throw error;
//     }
//   }

//   async scan(
//     cursor: string | number,
//     pattern?: string,
//     count?: number,
//   ): Promise<[string, string[]]> {
//     try {
//       const args: any[] = [cursor];
//       if (pattern) {
//         args.push('MATCH', pattern);
//       }
//       if (count) {
//         args.push('COUNT', count);
//       }
//       return await this.client.scan(...args);
//     } catch (error) {
//       this.logger.error(`Error scanning keys:`, error);
//       throw error;
//     }
//   }

//   // ==================== UTILITY METHODS ====================

//   async flushdb(): Promise<'OK'> {
//     try {
//       return await this.client.flushdb();
//     } catch (error) {
//       this.logger.error(`Error flushing database:`, error);
//       throw error;
//     }
//   }

//   async ping(): Promise<'PONG'> {
//     try {
//       return await this.client.ping();
//     } catch (error) {
//       this.logger.error(`Error pinging Redis:`, error);
//       throw error;
//     }
//   }

//   getClient(): RedisClient {
//     return this.client;
//   }

//   // ==================== CACHE HELPERS ====================

//   async cacheSet<T>(
//     key: string,
//     value: T,
//     ttl: number = 3600,
//   ): Promise<'OK'> {
//     try {
//       const serialized = JSON.stringify(value);
//       return await this.setex(key, ttl, serialized);
//     } catch (error) {
//       this.logger.error(`Error caching ${key}:`, error);
//       throw error;
//     }
//   }

//   async cacheGet<T>(key: string): Promise<T | null> {
//     try {
//       const value = await this.get(key);
//       if (!value) return null;
//       return JSON.parse(value) as T;
//     } catch (error) {
//       this.logger.error(`Error getting cache ${key}:`, error);
//       return null;
//     }
//   }

//   async cacheDelete(key: string): Promise<number> {
//     return this.del(key);
//   }

//   async cacheDeletePattern(pattern: string): Promise<number> {
//     try {
//       const keys = await this.keys(pattern);
//       if (keys.length === 0) return 0;
//       return await this.del(...keys);
//     } catch (error) {
//       this.logger.error(`Error deleting cache pattern ${pattern}:`, error);
//       throw error;
//     }
//   }
// }