import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * A custom parameter decorator to extract the authenticated user object from the request.
 * It's now type-safe and consistent with the JwtPayload.
 *
 * @example
 * // To get the entire user payload object:
 * findData(@User() user: JwtPayload) { ... }
 *
 * @example
 * // To get a specific property from the payload (e.g., the user's ID):
 * findData(@User('sub') userId: string) { ... }
 */
export const GetUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | JwtPayload[keyof JwtPayload] => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
      throw new InternalServerErrorException('User object not found on request. Ensure JwtAuthGuard is applied.');
    }

    return data ? user[data] : user;
  },
);