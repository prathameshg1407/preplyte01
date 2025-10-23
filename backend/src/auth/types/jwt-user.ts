import { Role } from '@prisma/client';

/**
 * Defines the structure of the user object that is attached to the request
 * after JWT validation. It contains the essential, non-sensitive user data.
 */
export type JwtUser = {
  id: string;
  sub: string;
  email: string;
  role: Role;
  institutionId?: number | null; // ADD THIS LINE
};