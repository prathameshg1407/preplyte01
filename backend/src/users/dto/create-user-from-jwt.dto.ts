import { IsEmail, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

// Data that comes from the validated Auth0 JWT
export class CreateUserFromJwtDto {
  @IsString()
  @IsNotEmpty()
  auth0Id: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  tenantId?: number;
}