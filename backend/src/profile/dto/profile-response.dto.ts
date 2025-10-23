export class ProfileResponseDto {
  userId: string;
  fullName: string;
  graduationYear: number;
  profileImageUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
  sscPercentage?: number;
  hscPercentage?: number;
  diplomaPercentage?: number;
  degreeSem1Cgpa?: number;
  degreeSem2Cgpa?: number;
  degreeSem3Cgpa?: number;
  degreeSem4Cgpa?: number;
  degreeSem5Cgpa?: number;
  degreeSem6Cgpa?: number;
  degreeSem7Cgpa?: number;
  degreeSem8Cgpa?: number;
  averageCgpa?: number; // Added averageCgpa
  updatedAt: Date;
  skills: Array<{
    id: number;
    name: string;
    category: string;
  }>;
}