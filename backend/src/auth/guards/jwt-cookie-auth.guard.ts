// src/auth/guards/jwt-cookie-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtCookieAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies['jwt-token'];
    if (!token) {
      throw new UnauthorizedException('JWT token not found in cookies');
    }
    request.headers.authorization = `Bearer ${token}`;
    return request;
  }
}
