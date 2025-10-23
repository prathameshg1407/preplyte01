// dto/profile-completion.dto.ts
export class ProfileCompletionResponseDto {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  requiredFields: string[];
  completedFields: string[];
}