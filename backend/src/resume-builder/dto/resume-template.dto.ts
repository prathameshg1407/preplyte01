import { IsString, IsOptional, IsArray } from "class-validator";

// dto/resume-template.dto.ts
export class GenerateResumeDto {
    @IsString()
    template: 'modern' | 'minimal' | 'professional' | 'creative' | 'corporate' | 'elegant';
  
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
  }
  
  export class SaveResumeDto {
    @IsString()
    title: string;
  
    @IsString()
    template: string;
  
    @IsOptional()
    customSettings?: any;
  }