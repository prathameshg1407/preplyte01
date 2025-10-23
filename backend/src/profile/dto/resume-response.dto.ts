// dto/resume-response.dto.ts
import { ResumeAnalysisStatus } from '@prisma/client';

export class ResumeResponseDto {
  id: number;
  title: string;
  storagePath: string;
  content?: string;
  analysisStatus: ResumeAnalysisStatus;
  isPrimary: boolean;
  filename?: string;
  createdAt: Date;
  updatedAt: Date;
  uploadedAt: Date;
  analysis?: {
    id: number;
    atsScore: number;
    keywordsFound: string[];
    keywordsMissing: string[];
    formatScore: number;
    suggestions: string[];
    analysisDate: Date;
  };
}