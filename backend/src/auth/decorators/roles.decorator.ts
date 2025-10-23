import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
/**
 * Custom decorator to specify which user roles are allowed to access a route.
 * @param {...Role[]} roles - An array of Role enums (e.g., STUDENT, SUPER_ADMIN).
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);