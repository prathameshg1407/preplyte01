import { Controller, Get, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { UsersService } from './users/users.service';
import type { Request } from 'express'; // Import the standard Express Request type

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * A public endpoint that does not require authentication.
   * Accessible at GET /api/public
   */
  @Get('public')
  getPublic(): { message: string } {
    return { message: this.appService.getHello() };
  }

  /**
   * A protected endpoint to get the full profile of the logged-in user.
   * This is an alias for 'auth/me' and provides a much richer dataset than just the JWT payload.
   * Accessible at GET /api/profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard) // Use the JWT guard to ensure the user is logged in
  getProfile(@Req() req: Request) {
    // Add a guard clause to ensure req.user exists before using it.
    // This satisfies TypeScript's strict checks and improves runtime safety.
    if (!req.user) {
      throw new UnauthorizedException('No user found on request.');
    }
    
    // The global type definition ensures `req.user` is correctly typed,
    // so we can safely access `req.user.id`.
    return this.usersService.getFullUserProfile(req.user.id);
  }
}
