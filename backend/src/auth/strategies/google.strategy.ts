import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { User as PrismaUser } from '@prisma/client';

type MaybeUserWrapper = PrismaUser | { user: PrismaUser; accessToken?: string; [k: string]: any } | null | undefined;

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.getOrThrow('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  /**
   * Type-guard helper: extract a PrismaUser whether the service returned:
   *  - PrismaUser
   *  - { user: PrismaUser, ... }
   *  - or nullish / unexpected shapes
   */
  private extractPrismaUser(result: MaybeUserWrapper): PrismaUser | null {
    if (!result) return null;

    // Case: wrapper object like { user: PrismaUser, accessToken: string }
    if (typeof result === 'object' && 'user' in result && (result as any).user && typeof (result as any).user === 'object') {
      return (result as any).user as PrismaUser;
    }

    // Case: plain PrismaUser returned directly
    if (typeof result === 'object' && 'id' in result && 'email' in result) {
      return result as PrismaUser;
    }

    return null;
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const providerId = profile.id;
    const email = profile.emails?.[0]?.value;
    if (!email) {
      // Google may not expose email if the user hid it — treat as bad request
      return done(new BadRequestException('Google login requires a public email address.'), false);
    }

    try {
      const fullName = [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ');
      const profileImageUrl = profile.photos?.[0]?.value;

      // The authService method may return different shapes (user or wrapper).
      const rawResult: MaybeUserWrapper = await this.authService.validateSocialUser(
        'google',
        providerId,
        email,
        fullName,
        profileImageUrl,
      );

      const userFromDb = this.extractPrismaUser(rawResult);
      if (!userFromDb) {
        // Defensive: if we couldn't extract a user, fail gracefully
        return done(new InternalServerErrorException('Could not process user.'), false);
      }

      // Convert institutionId null -> undefined to match what other parts of app / Passport may expect
      const passportUser = {
        ...userFromDb,
        institutionId: userFromDb.institutionId === null ? undefined : userFromDb.institutionId,
      };

      // Pass the user to Passport
      return done(null, passportUser);
    } catch (error) {
      // Bubble up the error to Passport (it will be handled by Nest's exception filters/middleware)
      return done(error as Error, false);
    }
  }
}
