import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterMockDriveDto {
  @ApiProperty({ example: 'clxxxxxxxxx' })
  @IsString()
  @IsNotEmpty()
  mockDriveId: string;
}

export class CancelRegistrationDto {
  @ApiProperty({ example: 'clxxxxxxxxx' })
  @IsString()
  @IsNotEmpty()
  registrationId: string;
}