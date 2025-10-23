// // src/common/interceptors/rate-limit-headers.interceptor.ts
// import {
//   Injectable,
//   NestInterceptor,
//   ExecutionContext,
//   CallHandler,
// } from '@nestjs/common';
// import { Observable } from 'rxjs';
// import { tap } from 'rxjs/operators';
// import { Response } from 'express';
// import { RateLimitService } from '@/auth/services/rate-limit.service';

// @Injectable()
// export class RateLimitHeadersInterceptor implements NestInterceptor {
//   constructor(private readonly rateLimitService: RateLimitService) {}

//   async intercept(
//     context: ExecutionContext,
//     next: CallHandler,
//   ): Promise<Observable<any>> {
//     const response = context.switchToHttp().getResponse<Response>();
//     const request = context.switchToHttp().getRequest();
    
//     const identifier = request.ip || 'unknown';
    
//     try {
//       const status = await this.rateLimitService.getStatus(identifier, 'api');
      
//       response.setHeader('X-RateLimit-Limit', '100');
//       response.setHeader('X-RateLimit-Remaining', status.remainingPoints.toString());
//       response.setHeader('X-RateLimit-Reset', status.resetTime.toString());
//     } catch (error) {
//       // Silent fail - don't block request
//     }

//     return next.handle();
//   }
// }