// // src/auth/guards/throttle.guard.ts
// import { Injectable, ExecutionContext } from '@nestjs/common';
// import { ThrottlerGuard } from '@nestjs/throttler';
// import { Reflector } from '@nestjs/core';
// import { SKIP_THROTTLE_KEY } from '../decorators/skip-throttle.decorator';

// @Injectable()
// export class CustomThrottlerGuard extends ThrottlerGuard {
//   constructor(private reflector: Reflector) {
//     super();
//   }

//   protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
//     const skipThrottle = this.reflector.getAllAndOverride<boolean>(
//       SKIP_THROTTLE_KEY,
//       [context.getHandler(), context.getClass()]
//     );
    
//     return skipThrottle || false;
//   }

//   protected getTracker(req: Record<string, any>): string {
//     return req.ips?.length ? req.ips[0] : req.ip;
//   }
// }
