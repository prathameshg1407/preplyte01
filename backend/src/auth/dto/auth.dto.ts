import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Defines the data structure required for a new user to register.
 * Uses class-validator decorators to enforce validation rules.
 */
export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name must not be empty.' })
  fullName: string;

  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @IsNotEmpty()
  password: string;
}



export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password must not be empty.' })
  password: string;
}