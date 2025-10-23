// src/events/dto/create-internship-posting.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EligibilityCriteriaDto } from './eligibility-criteria.dto';

export class CreateInternshipPostingDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => EligibilityCriteriaDto)
  eligibilityCriteria?: EligibilityCriteriaDto;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  stipend?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsDateString()
  applicationDeadline?: string;
}