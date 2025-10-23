// // src/redis/redis.health.ts
// import { Injectable } from '@nestjs/common';
// import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
// import { RedisService } from './redis.service';

// @Injectable()
// export class RedisHealthIndicator extends HealthIndicator {
//   constructor(private readonly redisService: RedisService) {
//     super();
//   }

//   async isHealthy(key: string): Promise<HealthIndicatorResult> {
//     try {
//       await this.redisService.ping();
//       return this.getStatus(key, true, { message: 'Redis is healthy' });
//     } catch (error) {
//       throw new HealthCheckError(
//         'Redis health check failed',
//         this.getStatus(key, false, { message: error.message }),
//       );
//     }
//   }
// }