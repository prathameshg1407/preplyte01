import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
  Res,
  Logger,
  UseInterceptors,
  ClassSerializerInterceptor,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { UsersService } from '../users/users.service';
import type { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { User as PrismaUser } from '@prisma/client';
import { GetUser } from './decorators/user.decorator';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';

interface AuthResponse {
  user: Omit<PrismaUser, 'hashedPassword'>;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registers a new user account
   * @route POST /auth/register
   */
  @Post('register')
  @UseGuards(ThrottlerGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<ApiResponse<Omit<PrismaUser, 'hashedPassword'>>> {
    this.logger.log(`Registration attempt for email: ${registerDto.email}`);
    
    const user = await this.authService.register(registerDto);
    
    return {
      success: true,
      message: 'Registration successful. Please complete your profile.',
      data: user,
    };
  }

  /**
   * Authenticates a user with email and password
   * @route POST /auth/login
   */
  @Post('login')
  @UseGuards(ThrottlerGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<ApiResponse<AuthResponse>> {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);
    
    const { user, accessToken, refreshToken } = await this.authService.login(loginDto);
    
    return {
      success: true,
      message: 'Login successful',
      data: {
        user,
        accessToken,
        refreshToken,
        expiresIn: 3600, // 1 hour in seconds
      },
    };
  }

  /**
   * Refreshes the access token using a refresh token
   * @route POST /auth/refresh
   */
  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @GetUser() user: JwtPayload,
    @Body('refreshToken') refreshToken: string,
  ): Promise<ApiResponse<{ accessToken: string; expiresIn: number }>> {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    // Validate refresh token
    const payload = await this.authService.validateToken(refreshToken);
    
    if (payload.sub !== user.sub) {
      throw new BadRequestException('Invalid refresh token');
    }

    // Generate new access token
    const userRecord = await this.usersService.findOneById(user.sub);
    const accessToken = await this.authService.generateToken(userRecord);

    return {
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        expiresIn: 3600,
      },
    };
  }

  /**
   * Logs out the current user (client should discard tokens)
   * @route POST /auth/logout
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@GetUser() user: JwtPayload): Promise<ApiResponse<null>> {
    this.logger.log(`User ${user.sub} logged out`);
    
    // In a production environment, you might want to:
    // - Blacklist the token
    // - Clear server-side sessions
    // - Update last logout timestamp
    
    return {
      success: true,
      message: 'Logged out successfully',
      data: null,
    };
  }

  /**
   * Gets the current authenticated user's profile
   * @route GET /auth/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@GetUser() user: JwtPayload): Promise<ApiResponse<any>> {
    const profile = await this.usersService.getFullUserProfile(user.sub);
    
    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: profile,
    };
  }

  /**
   * Verifies if a token is valid
   * @route POST /auth/verify
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyToken(
    @Body('token') token: string,
  ): Promise<ApiResponse<{ valid: boolean; payload?: JwtPayload }>> {
    if (!token) {
      return {
        success: false,
        message: 'Token is required',
        data: { valid: false },
      };
    }

    try {
      const payload = await this.authService.validateToken(token);
      return {
        success: true,
        message: 'Token is valid',
        data: { valid: true, payload },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Token is invalid or expired',
        data: { valid: false },
      };
    }
  }

  // --- OAuth Endpoints ---

  /**
   * Initiates Google OAuth2 authentication
   * @route GET /auth/google
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(): Promise<void> {
    // Handled by Passport Google strategy
  }

  /**
   * Handles Google OAuth2 callback
   * @route GET /auth/google/callback
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleRedirect(@Req() req: Request, @Res() res: Response): Promise<void> {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';

    try {
      if (!req.user) {
        throw new Error('Google authentication failed');
      }

      const user = req.user as PrismaUser;
      const { user: authUser, accessToken } = await this.authService.validateSocialUser(
        'google',
        user.id,
        user.email,
        (user as any).displayName,
        (user as any).picture,
      );

      const loginData = {
        user: authUser,
        accessToken,
        expiresIn: 3600,
      };

      // Send data to parent window and close popup
      const script = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication</title>
        </head>
        <body>
          <script>
            try {
              const data = ${JSON.stringify(loginData)};
              if (window.opener) {
                window.opener.postMessage(
                  { type: 'auth_success', payload: data },
                  '${frontendUrl}'
                );
                window.close();
              } else {
                // Fallback: redirect if not in popup
                window.location.href = '${frontendUrl}/auth/callback?token=' + data.accessToken;
              }
            } catch (error) {
              console.error('Auth error:', error);
              if (window.opener) {
                window.opener.postMessage(
                  { type: 'auth_error', message: error.message },
                  '${frontendUrl}'
                );
                window.close();
              } else {
                window.location.href = '${frontendUrl}/auth/error';
              }
            }
          </script>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(script);
    } catch (error) {
      this.logger.error(`Google OAuth error: ${error.message}`);
      
      const errorScript = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Error</title>
        </head>
        <body>
          <script>
            const message = ${JSON.stringify(error.message || 'Authentication failed')};
            if (window.opener) {
              window.opener.postMessage(
                { type: 'auth_error', message },
                '${frontendUrl}'
              );
              window.close();
            } else {
              window.location.href = '${frontendUrl}/auth/error';
            }
          </script>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(errorScript);
    }
  }

  /**
   * Checks if an email is already registered
   * @route POST /auth/check-email
   */
  @Post('check-email')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  async checkEmail(
    @Body('email') email: string,
  ): Promise<ApiResponse<{ available: boolean }>> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const existingUser = await this.usersService.findOneByEmail(email);
    
    return {
      success: true,
      message: existingUser ? 'Email is already registered' : 'Email is available',
      data: { available: !existingUser },
    };
  }
}