// bulk-update-status.dto.ts
import { IsArray, IsEnum, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { UserStatus } from '@prisma/client';

export class BulkUpdateStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  userIds: string[];

  @IsEnum(UserStatus)
  status: UserStatus;
}