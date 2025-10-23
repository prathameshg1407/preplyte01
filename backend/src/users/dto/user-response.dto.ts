import { ApiProperty } from '@nestjs/swagger';
import { Role, UserStatus } from '@prisma/client';
import { Exclude, Expose, Type } from 'class-transformer';

export class ProfileDto {
  @ApiProperty()
  @Expose()
  fullName: string;

  @ApiProperty()
  @Expose()
  profileImageUrl?: string;

  @ApiProperty()
  @Expose()
  graduationYear?: number;

  @ApiProperty()
  @Expose()
  linkedinUrl?: string;

  @ApiProperty()
  @Expose()
  githubUrl?: string;

  @ApiProperty()
  @Expose()
  sscPercentage?: number;

  @ApiProperty()
  @Expose()
  hscPercentage?: number;

  @ApiProperty()
  @Expose()
  averageCgpa?: number;
}

export class InstitutionDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  logoUrl?: string;
}

export class UserResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty({ enum: Role })
  @Expose()
  role: Role;

  @ApiProperty({ enum: UserStatus })
  @Expose()
  status: UserStatus;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  lastLoginAt?: Date;

  @ApiProperty({ type: ProfileDto })
  @Expose()
  @Type(() => ProfileDto)
  profile?: ProfileDto;

  @ApiProperty({ type: InstitutionDto })
  @Expose()
  @Type(() => InstitutionDto)
  institution?: InstitutionDto;

  @Exclude()
  password: string;

  @Exclude()
  refreshToken?: string;

  @Exclude()
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}