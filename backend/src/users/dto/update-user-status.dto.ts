import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus } from '@prisma/client';

/**
 * Defines the data transfer object (DTO) for updating a user's status.
 * This is typically an admin-only action.
 */
export class UpdateUserStatusDto {
  @IsNotEmpty()
  @IsEnum(UserStatus, {
    message: `Status must be one of the following values: ${Object.values(
      UserStatus,
    ).join(', ')}`,
  })
  status: UserStatus;
}
