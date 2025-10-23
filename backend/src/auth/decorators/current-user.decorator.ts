// src/auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUser } from '../types';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as any;
    
    // Map 'sub' to 'id' for consistency
    if (user && user.sub && !user.id) {
      user.id = user.sub;
    }
    
    return data ? user?.[data] : user;
  },
);