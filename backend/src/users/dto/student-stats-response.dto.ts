import { ApiProperty } from '@nestjs/swagger';
import { Role, QuestionDifficulty } from '@prisma/client';

class ProfileStatsDto {
  @ApiProperty()
  completionPercentage: number;

  @ApiProperty()
  hasResume: boolean;
}

class AptitudeStatsDto {
  @ApiProperty()
  taken: number;

  @ApiProperty()
  averageScore: number;

  @ApiProperty({ required: false })
  lastAttempt?: Date;
}

class MachineTestHistoryDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: QuestionDifficulty })
  difficulty: QuestionDifficulty;

  @ApiProperty()
  problemsCount: number;

  @ApiProperty()
  problemsPassed: number;

  @ApiProperty()
  problemsFailed: number;

  @ApiProperty()
  problemsIncomplete: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  completedAt?: Date;
}

class MachineTestStatsDto {
  @ApiProperty()
  taken: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  averageSuccessRate: number;

  @ApiProperty({ type: [MachineTestHistoryDto] })
  history: MachineTestHistoryDto[];
}

class AiInterviewStatsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  averageScore: number;

  @ApiProperty({ required: false })
  lastSession?: Date;
}

class SkillMetricDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  averageScore: number;

  @ApiProperty()
  accuracy: number;
}

class PerformanceStatsDto {
  @ApiProperty({ type: [SkillMetricDto] })
  topSkills: SkillMetricDto[];

  @ApiProperty({ type: [SkillMetricDto] })
  improvementAreas: SkillMetricDto[];
}

class JobApplicationStatsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  pending: number;

  @ApiProperty()
  shortlisted: number;

  @ApiProperty()
  rejected: number;
}

export class StudentStatsResponseDto {
  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ type: ProfileStatsDto })
  profile: ProfileStatsDto;

  @ApiProperty({ type: AptitudeStatsDto })
  aptitudeTests: AptitudeStatsDto;

  @ApiProperty({ type: MachineTestStatsDto })
  machineTests: MachineTestStatsDto;

  @ApiProperty({ type: AiInterviewStatsDto })
  aiInterviews: AiInterviewStatsDto;

  @ApiProperty({ type: PerformanceStatsDto })
  performance: PerformanceStatsDto;

  @ApiProperty({ type: JobApplicationStatsDto })
  jobApplications: JobApplicationStatsDto;
}