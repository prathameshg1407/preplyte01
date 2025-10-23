import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsInt,
  IsDateString,
  Min,
  ValidateNested,
  IsObject,
  IsBoolean,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AptitudeTestConfigDto } from './aptitude-config.dto';
import { MachineTestConfigDto } from './machine-test-config.dto';
import { AiInterviewConfigDto } from './ai-interview-config.dto';

export class EligibilityCriteriaDto {
  @ApiPropertyOptional({ minimum: 0, maximum: 10, example: 7.0 })
  @IsOptional()
  minCgpa?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 10, example: 6.0 })
  @IsOptional()
  minSscPercentage?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 10, example: 6.0 })
  @IsOptional()
  minHscPercentage?: number;

  @ApiPropertyOptional({ 
    type: [String], 
    example: ['JavaScript', 'Python', 'Java'] 
  })
  @IsArray()
  @IsOptional()
  requiredSkills?: string[];

  @ApiPropertyOptional({ example: 0, description: 'Maximum active backlogs allowed' })
  @IsInt()
  @IsOptional()
  maxActiveBacklogs?: number;

  @ApiPropertyOptional({ description: 'Additional custom criteria' })
  @IsObject()
  @IsOptional()
  customCriteria?: Record<string, any>;
}

export class CreateMockDriveDto {
  @ApiProperty({ example: 'Tech Giants Mock Drive 2024' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ 
    example: 'Comprehensive mock drive simulating top tech company interviews' 
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    type: [Number], 
    example: [3, 4], 
    description: 'Eligible graduation years (1,2,3,4)' 
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  eligibleYear: number[];

  @ApiPropertyOptional({ type: EligibilityCriteriaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EligibilityCriteriaDto)
  eligibilityCriteria?: EligibilityCriteriaDto;

  // Test Configurations
  @ApiPropertyOptional({ type: AptitudeTestConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AptitudeTestConfigDto)
  aptitudeConfig?: AptitudeTestConfigDto;

  @ApiPropertyOptional({ type: MachineTestConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MachineTestConfigDto)
  machineTestConfig?: MachineTestConfigDto;

  @ApiPropertyOptional({ type: AiInterviewConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AiInterviewConfigDto)
  aiInterviewConfig?: AiInterviewConfigDto;

  // Timing
  @ApiProperty({ example: '2024-03-01T00:00:00Z' })
  @IsDateString()
  registrationStartDate: string;

  @ApiProperty({ example: '2024-03-10T23:59:59Z' })
  @IsDateString()
  registrationEndDate: string;

  @ApiProperty({ example: '2024-03-15T10:00:00Z' })
  @IsDateString()
  driveStartDate: string;

  @ApiProperty({ example: '2024-03-15T14:00:00Z' })
  @IsDateString()
  driveEndDate: string;

  @ApiProperty({ 
    minimum: 30, 
    example: 180, 
    description: 'Total duration in minutes' 
  })
  @IsInt()
  @Min(30)
  duration: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}