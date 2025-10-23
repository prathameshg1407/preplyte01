import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * A guard to initiate the Google OAuth2.0 authentication flow.
 * It uses the 'google' strategy.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}