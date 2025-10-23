// src/events/dto/eligibility-criteria.dto.ts
import { IsOptional, IsNumber, IsArray, IsInt, Min, Max } from 'class-validator';

export class EligibilityCriteriaDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minSscPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minHscPercentage?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  minAverageCgpa?: number; // New field for CGPA criteria

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  graduationYears?: number[];
}