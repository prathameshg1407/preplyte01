// // src/common/interceptors/cache.interceptor.ts
// import {
//   Injectable,
//   NestInterceptor,
//   ExecutionContext,
//   CallHandler,
//   Logger,
// } from '@nestjs/common';
// import { Observable, of } from 'rxjs';
// import { tap } from 'rxjs/operators';
// import { RedisService } from '@/redis/redis.service';
// import { Request } from 'express';

// @Injectable()
// export class CacheInterceptor implements NestInterceptor {
//   private readonly logger = new Logger(CacheInterceptor.name);
//   private readonly defaultTTL = 300; // 5 minutes

//   constructor(private readonly redis: RedisService) {}

//   async intercept(
//     context: ExecutionContext,
//     next: CallHandler,
//   ): Promise<Observable<any>> {
//     const request = context.switchToHttp().getRequest<Request>();
//     const { method, url } = request;

//     // Only cache GET requests
//     if (method !== 'GET') {
//       return next.handle();
//     }

//     const cacheKey = this.generateCacheKey(request);

//     try {
//       // Try to get from cache
//       const cachedData = await this.redis.cacheGet(cacheKey);

//       if (cachedData) {
//         this.logger.debug(`Cache HIT: ${cacheKey}`);
//         return of(cachedData);
//       }

//       this.logger.debug(`Cache MISS: ${cacheKey}`);

//       // If not in cache, execute handler and cache result
//       return next.handle().pipe(
//         tap(async (data) => {
//           try {
//             await this.redis.cacheSet(cacheKey, data, this.defaultTTL);
//             this.logger.debug(`Cached: ${cacheKey}`);
//           } catch (error) {
//             this.logger.error(`Failed to cache ${cacheKey}:`, error);
//           }
//         }),
//       );
//     } catch (error) {
//       this.logger.error(`Cache error for ${cacheKey}:`, error);
//       return next.handle();
//     }
//   }

//   private generateCacheKey(request: Request): string {
//     const { url, query, params } = request;
//     const userId = (request as any).user?.id || 'anonymous';
    
//     const queryString = JSON.stringify(query);
//     const paramsString = JSON.stringify(params);

//     return `cache:${userId}:${url}:${queryString}:${paramsString}`;
//   }
// }

