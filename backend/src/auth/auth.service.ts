import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { User, Role, UserStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds: number = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Validates a JWT token
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      this.logger.debug(`Token validated for user: ${payload.sub}`);
      return payload;
    } catch (error) {
      this.logger.warn(`Token validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Registers a new user with email and password
   */
  async register(registerDto: RegisterDto): Promise<Omit<User, 'hashedPassword'>> {
    const { fullName, email, password } = registerDto;

    // Validate input
    if (!fullName?.trim()) {
      throw new BadRequestException('Full name is required');
    }

    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email format');
    }

    if (!this.isValidPassword(password)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
      );
    }

    // Check for existing user
    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Find institution by email domain
    const emailDomain = email.split('@')[1];
    const institution = await this.prisma.institution.findUnique({
      where: { domain: emailDomain },
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);

    try {
      // Create user and profile in transaction
      const newUser = await this.prisma.$transaction(
        async (tx) => {
          const user = await tx.user.create({
            data: {
              email,
              hashedPassword,
              role: Role.STUDENT,
              status: UserStatus.PENDING_PROFILE_COMPLETION,
              institutionId: institution?.id,
            },
          });

          await tx.profile.create({
            data: {
              userId: user.id,
              fullName: fullName.trim(),
              graduationYear: new Date().getFullYear() + 4, // Default to 4 years from now
            },
          });

          return user;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 10000,
        }
      );

      this.logger.log(`New user registered: ${newUser.email}`);
      const { hashedPassword: _, ...result } = newUser;
      return result;
    } catch (error) {
      this.logger.error(`Registration failed for ${email}: ${error.message}`);
      if (error.code === 'P2002') {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  /**
   * Authenticates a user with email and password
   */
  async login(loginDto: LoginDto): Promise<{
    user: Omit<User, 'hashedPassword'>;
    accessToken: string;
    refreshToken?: string;
  }> {
    const { email, password } = loginDto;

    // Find user with profile
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: {
          select: {
            fullName: true,
            profileImageUrl: true,
          },
        },
      },
    });

    if (!user || !user.hashedPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is suspended or deleted
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Your account has been suspended');
    }

    if (user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('This account no longer exists');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accessToken = await this.generateToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    this.logger.log(`User logged in: ${user.email}`);
    const { hashedPassword: _, ...result } = user;
    
    return { 
      user: result, 
      accessToken, 
      refreshToken 
    };
  }

  /**
   * Generates a JWT access token
   */
  async generateToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId ?? undefined,
    };
    
    return this.jwtService.sign(payload, {
      expiresIn: '1h',
    });
  }

  /**
   * Generates a JWT refresh token
   */
  async generateRefreshToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId ?? undefined,
    };
    
    return this.jwtService.sign(payload, {
      expiresIn: '7d',
    });
  }

  /**
   * Validates and registers/logs in a user via social provider
   */
  async validateSocialUser(
    provider: string,
    providerId: string,
    email: string,
    fullName?: string,
    profileImageUrl?: string,
  ): Promise<{ user: User; accessToken: string }> {
    // Validate email
    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email from social provider');
    }

    // Check for existing user
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      include: { 
        socialAccounts: true,
        profile: true,
      },
    });

    if (existingUser) {
      // Link social account if not already linked
      const socialAccount = existingUser.socialAccounts.find(
        (account) =>
          account.provider === provider && account.providerId === providerId,
      );
      
      if (!socialAccount) {
        await this.prisma.socialAccount.create({
          data: { provider, providerId, userId: existingUser.id },
        });
        this.logger.log(`Linked ${provider} account for user: ${existingUser.email}`);
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: existingUser.id },
        data: { lastLoginAt: new Date() },
      });

      const accessToken = await this.generateToken(existingUser);
      return { user: existingUser, accessToken };
    }

    // Create new user via social login
    const emailDomain = email.split('@')[1];
    const institution = await this.prisma.institution.findUnique({
      where: { domain: emailDomain },
    });

    try {
      const newUser = await this.prisma.$transaction(
        async (tx) => {
          const user = await tx.user.create({
            data: {
              email,
              role: Role.STUDENT,
              status: UserStatus.PENDING_PROFILE_COMPLETION,
              institutionId: institution?.id,
              lastLoginAt: new Date(),
              socialAccounts: {
                create: { provider, providerId },
              },
            },
          });

          await tx.profile.create({
            data: {
              userId: user.id,
              fullName: fullName?.trim() || email.split('@')[0],
              profileImageUrl: profileImageUrl,
              graduationYear: new Date().getFullYear() + 4,
            },
          });

          return user;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 10000,
        }
      );

      this.logger.log(`New user registered via ${provider}: ${newUser.email}`);
      const accessToken = await this.generateToken(newUser);
      return { user: newUser, accessToken };
    } catch (error) {
      this.logger.error(`Social registration failed for ${email}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validates email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates password strength
   */
  private isValidPassword(password: string): boolean {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  }
}