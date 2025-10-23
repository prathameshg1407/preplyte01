import { IsString, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

// Education DTO
export class EducationDto {
  @IsString()
  institution: string;

  @IsString()
  degree: string;

  @IsString()
  field: string;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  grade?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

// Experience DTO
export class ExperienceDto {
  @IsString()
  company: string;

  @IsString()
  role: string;

  @IsString()
  startDate: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsArray()
  @IsString({ each: true })
  responsibilities: string[];
}

// Project DTO
export class ProjectDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsArray()
  @IsString({ each: true })
  technologies: string[];

  @IsOptional()
  @IsString()
  duration?: string;
}

// Certification DTO
export class CertificationDto {
  @IsString()
  name: string;

  @IsString()
  issuer: string;

  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  verificationUrl?: string;
}

// User Profile DTO
export class UserProfileDto {
  @IsString()
  fullName: string;

  @IsString()
  email: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  githubUrl?: string;

  @IsOptional()
  @IsString()
  portfolioUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education: EducationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experience: ExperienceDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDto)
  projects: ProjectDto[];

  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  certifications: CertificationDto[];

  @IsArray()
  @IsString({ each: true })
  languages: string[];

  @IsArray()
  @IsString({ each: true })
  achievements: string[];
}

// Save Resume Data DTO
export class SaveResumeDataDto {
  @IsString()
  title: string;

  @ValidateNested()
  @Type(() => UserProfileDto)
  profileData: UserProfileDto;

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  customSettings?: any;
}

// Update Resume Data DTO
export class UpdateResumeDataDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserProfileDto)
  profileData?: UserProfileDto;

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  customSettings?: any;
}

// Generate Resume DTO
export class GenerateResumeDto {
  @IsEnum(['modern', 'minimal', 'professional', 'creative', 'corporate', 'elegant'])
  template: string;

  @ValidateNested()
  @Type(() => UserProfileDto)
  profileData: UserProfileDto;

  @IsOptional()
  @IsEnum(['pdf', 'preview'])
  format?: 'pdf' | 'preview';  // Added format field

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  fontFamily?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sectionsOrder?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hiddenSections?: string[];

  @IsOptional()
  customization?: any;
}