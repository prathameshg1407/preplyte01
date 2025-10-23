import { Role } from '@prisma/client';

/**
 * --- CRITICAL REFACTOR ---
 * This is the single source of truth for the JWT payload.
 * It defines the data encoded within the JWT and attached to the request object (`req.user`).
 *
 * Using a consistent interface across the entire application prevents bugs
 * and ensures type safety.
 */
export interface JwtPayload {
  /**
   * The subject of the token, containing the user's unique ID.
   * Standard JWT claim.
   */
  sub: string;

  /** The user's email address. */
  email: string;

  /** The user's role, used for authorization. */
  role: Role;

  /** Optional: The ID of the user's institution. */
  institutionId?: number;
}