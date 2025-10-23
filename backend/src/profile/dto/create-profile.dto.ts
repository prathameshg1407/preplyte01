// dto/create-profile.dto.ts
import {
  IsString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export class CreateProfileDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1990)
  @Max(2030)
  @Type(() => Number)
  graduationYear: number;

  @IsOptional()
  @IsUrl()
  profileImageUrl?: string;

  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Transform(({ value }) => (value ? new Decimal(value) : undefined))
  sscPercentage?: Decimal;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Transform(({ value }) => (value ? new Decimal(value) : undefined))
  hscPercentage?: Decimal;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Transform(({ value }) => (value ? new Decimal(value) : undefined))
  diplomaPercentage?: Decimal;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  @Transform(({ value }) => (value ? new Decimal(value) : undefined))
  degreeSem1Cgpa?: Decimal;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  @Transform(({ value }) => (value ? new Decimal(value) : undefined))
  degreeSem2Cgpa?: Decimal;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  @Transform(({ value }) => (value ? new Decimal(value) : undefined))
  degreeSem3Cgpa?: Decimal;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  @Transform(({ value }) => (value ? new Decimal(value) : undefined))
  degreeSem4Cgpa?: Decimal;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  @Transform(({ value }) => (value ? new Decimal(value) : undefined))
  degreeSem5Cgpa?: Decimal;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  @Transform(({ value }) => (value ? new Decimal(value) : undefined))
  degreeSem6Cgpa?: Decimal;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  @Transform(({ value }) => (value ? new Decimal(value) : undefined))
  degreeSem7Cgpa?: Decimal;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  @Transform(({ value }) => (value ? new Decimal(value) : undefined))
  degreeSem8Cgpa?: Decimal;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];
}