import { Role } from '@prisma/client';
import { Request } from 'express';

/**
 * Extends the default Express Request object to include the user payload
 * that is attached by the JWT authentication guard after successful validation.
 */
export interface AuthenticatedRequest extends Request {
  user: {
    id: string; // The user's unique ID (CUID)
    email: string; // The user's email
    role: Role; // The user's role (e.g., STUDENT, SUPER_ADMIN)
    institutionId?: number; // The ID of the user's institution, if any
  };
}
