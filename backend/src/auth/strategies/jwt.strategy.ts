import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * --- CRITICAL PERFORMANCE & SECURITY FIX ---
   * This validate method is now stateless. It does NOT query the database.
   * After Passport verifies the JWT's signature and expiration, this method
   * simply returns the payload that was embedded in the token.
   * This is fast, efficient, and the standard way to handle JWTs.
   *
   * The user data in the token is trusted because the token's signature is valid.
   */
  validate(payload: JwtPayload): JwtPayload {
    if (!payload || !payload.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException('Invalid JWT payload.');
    }
    // Passport will attach this returned object to the `request.user` property.
    return payload;
  }
}