// // src/redis/redis.module.ts
// import { Module, Global } from '@nestjs/common';
// import { RedisService } from './redis.service';
// import { RedisHealthIndicator } from './redis.health';

// @Global()
// @Module({
//   providers: [RedisService, RedisHealthIndicator],
//   exports: [RedisService, RedisHealthIndicator],
// })
// export class RedisModule {}