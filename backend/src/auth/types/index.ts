// src/auth/types/index.ts
import { Role, UserStatus } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  institutionId?: number;
  sessionId: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface JwtUser {
  id: string;
  email: string;
  role: Role;
  institutionId?: number;
  sessionId: string;
  status: UserStatus;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: Role;
    fullName?: string;
    profileImageUrl?: string;
    institutionId?: number;
    status: UserStatus;
  };
  tokens: AuthTokens;
}

export interface SessionData {
  userId: string;
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  lastActivity: Date;
}