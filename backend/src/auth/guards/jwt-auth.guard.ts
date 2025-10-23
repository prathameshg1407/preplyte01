import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * A standard guard to protect routes by verifying a JWT bearer token in the
 * Authorization header. It uses the 'jwt' strategy by default.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}