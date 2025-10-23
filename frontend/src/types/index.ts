// src/types/index.ts

// Re-export all enums
export * from './enum';

import {
  Role,
  UserStatus,
  QuestionDifficulty,
  MachineTestStatus,
  ResumeAnalysisStatus,
  AiInterviewSessionStatus,
  AiInterviewQuestionCategory,
  ApplicationStatus,
  SubmissionStatus,
} from './enum';

// ===================================================================================
// ## API Response Types
// ===================================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  statusCode: number;
  timestamp: string;
  path?: string;
}

// Simple message response (no data)
export interface ApiMessage {
  success: boolean;
  message: string;
  error?: string;
}

// ===================================================================================
// ## Core Data Models
// ===================================================================================

export interface Institution {
  id: number;
  name: string;
  domain: string;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users?: number;
  };
}

export interface Profile {
  userId: string;
  fullName: string;
  graduationYear: number;
  profileImageUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  sscPercentage?: number | null;
  hscPercentage?: number | null;
  diplomaPercentage?: number | null;
  degreeSem1Cgpa?: number | null;
  degreeSem2Cgpa?: number | null;
  degreeSem3Cgpa?: number | null;
  degreeSem4Cgpa?: number | null;
  degreeSem5Cgpa?: number | null;
  degreeSem6Cgpa?: number | null;
  degreeSem7Cgpa?: number | null;
  degreeSem8Cgpa?: number | null;
  averageCgpa?: number | null;
  updatedAt: string;
}

export interface ProfileWithSkills extends Profile {
  skills: Array<{
    id: number;
    name: string;
    category: string;
  }>;
}

export interface TopicPerformance {
  averageScore: number;
  accuracy: number;
  totalAttempts: number;
  tag: {
    name: string;
    category: string;
  };
}

export interface Resume {
  id: number;
  userId: string;
  title: string;
  filename: string | null;
  storagePath: string;
  isPrimary: boolean;
  analysisStatus: ResumeAnalysisStatus;
  uploadedAt: string;
  updatedAt: string;
  analysis?: ResumeAnalysis | null;
}

export interface ResumeAnalysis {
  atsScore: number;
  formatScore: number;
  keywordsFound: string[];
  keywordsMissing?: string[];
  suggestions: string[];
}

export interface AppUser {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string | null;
  institution?: Pick<Institution, 'id' | 'name' | 'logoUrl'> | null;
  profile?: ProfileWithSkills | null;
  topicPerformance?: TopicPerformance[];
  resumes?: Resume[];
  aiInterviewSessions?: AiInterviewSessionSummary[];
  jobApplications?: JobApplication[];
  
  _count?: {
    resumes?: number;
    machineTestSubmissions?: number;
    aiInterviewSessions?: number;
    jobApplications?: number;
    [key: string]: number | undefined;
  };
}

export interface FullUserProfile {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string | null;
  profile: ProfileWithSkills | null;
  institution: Pick<Institution, 'id' | 'name' | 'logoUrl'> | null;
  resumes: Resume[];
  topicPerformance: TopicPerformance[];
  aiInterviewSessions: AiInterviewSessionSummary[];
  jobApplications: JobApplication[];
  _count?: {
    resumes?: number;
    machineTestSubmissions?: number;
    aiInterviewSessions?: number;
    jobApplications?: number;
    [key: string]: number | undefined;
  };
}

// ===================================================================================
// ## Authentication Types
// ===================================================================================

export interface AuthResponse {
  user: Omit<AppUser, 'hashedPassword'>;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  institutionId?: number;
}

export interface TokenVerificationResponse {
  valid: boolean;
  payload?: JwtPayload;
}

export interface EmailCheckResponse {
  available: boolean;
}

// ===================================================================================
// ## User Management Types (UPDATED & ENHANCED)
// ===================================================================================

export interface UpdateUserRoleDto {
  role: Role;
}

export interface UpdateUserStatusDto {
  status: UserStatus;
}

export interface BulkUpdateStatusDto {
  userIds: string[];
  status: UserStatus;
}

export interface BulkUpdateStatusResult {
  updated: number;
  failed: string[];
}

export interface TransferUserDto {
  institutionId: number;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordResetDto {
  token: string;
  newPassword: string;
}

export interface PasswordResetInitiateDto {
  email: string;
}

export interface PasswordResetTokenResponse {
  token: string;
  expiresAt: string;
}

export interface UserListFilters {
  page?: number;
  limit?: number;
  role?: Role;
  status?: UserStatus;
  institutionId?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchUsersDto {
  query: string;
  limit?: number;
}

// ===================================================================================
// ## User Activity & Analytics Types (NEW)
// ===================================================================================

/**
 * User activity metrics
 */
export interface UserActivityMetrics {
  lastLoginAt?: string;
  totalLogins: number;
  averageSessionDuration: number; // in minutes
  lastActivityAt?: string;
  activeDaysLast30: number;
  preferredLoginTime: string; // e.g., "14:00"
  deviceTypes: Array<{
    device: 'Desktop' | 'Mobile' | 'Tablet';
    count: number;
  }>;
}

/**
 * User comparison with peers
 */
export interface UserComparison {
  user: {
    id: string;
    name: string;
    metrics: StudentStats | null;
  };
  percentileRank: {
    overall: number;
    aptitude: number;
    coding: number;
    interview: number;
  };
  peerAverage: {
    aptitude: number;
    coding: number;
    interview: number;
  };
}

/**
 * User engagement score (0-100)
 */
export interface UserEngagementScore {
  score: number;
  breakdown: {
    loginScore: number; // max 30
    testScore: number; // max 30
    applicationScore: number; // max 20
    interviewScore: number; // max 20
  };
}

/**
 * User session details
 */
export interface UserSession {
  id: string;
  userAgent?: string | null;
  createdAt: string;
  expiresAt: string;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  isExpired: boolean;
}

/**
 * Force logout result
 */
export interface ForceLogoutResult {
  sessionsInvalidated: number;
}

/**
 * User creation from JWT (OAuth)
 */
export interface CreateUserFromJwtDto {
  email: string;
  fullName: string;
  provider: string;
  providerId: string;
  profileImageUrl?: string;
  institutionDomain?: string;
}

/**
 * User creation (direct)
 */
export interface CreateUserDto {
  email: string;
  password?: string;
  fullName: string;
  role?: Role;
  institutionId?: number;
}

/**
 * User response DTO
 */
export interface UserResponseDto {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string | null;
  profile?: {
    fullName: string;
    profileImageUrl?: string | null;
  } | null;
  institution?: {
    id: number;
    name: string;
  } | null;
}

/**
 * User list item
 */
export interface UserListItem {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string | null;
  profile: {
    fullName: string;
    profileImageUrl?: string | null;
    graduationYear?: number;
  } | null;
  institution: {
    name: string;
  } | null;
  _count: {
    machineTestSubmissions: number;
    aiInterviewSessions: number;
    jobApplications: number;
  };
}

// ===================================================================================
// ## Profile Management Types
// ===================================================================================

export interface UpdateProfileDto {
  fullName?: string;
  graduationYear?: number;
  profileImageUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  sscPercentage?: number | null;
  hscPercentage?: number | null;
  diplomaPercentage?: number | null;
  degreeSem1Cgpa?: number | null;
  degreeSem2Cgpa?: number | null;
  degreeSem3Cgpa?: number | null;
  degreeSem4Cgpa?: number | null;
  degreeSem5Cgpa?: number | null;
  degreeSem6Cgpa?: number | null;
  degreeSem7Cgpa?: number | null;
  degreeSem8Cgpa?: number | null;
  skills?: string[];
}

export interface UploadResumeDto {
  title?: string;
  isPrimary?: boolean;
}

export interface ProfileCompletionStatus {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  requiredFields: string[];
  completedFields: string[];
  suggestions: string[];
}

// ===================================================================================
// ## Dashboard & Statistics Types
// ===================================================================================

export interface StudentStats {
  role: Role.STUDENT;
  profile: {
    completionPercentage: number;
    hasResume: boolean;
  };
  aptitudeTests: {
    taken: number;
    averageScore: number;
    lastAttempt?: string;
  };
  machineTests: {
    taken: number;
    completed: number;
    averageSuccessRate: number;
    history: MachineTestHistoryItem[];
  };
  aiInterviews: {
    total: number;
    completed: number;
    averageScore: number;
    lastSession?: string;
  };
  performance: {
    topSkills: Array<{
      name: string;
      category: string;
      averageScore: number;
      accuracy: number;
    }>;
    improvementAreas: Array<{
      name: string;
      category: string;
      averageScore: number;
      accuracy: number;
    }>;
  };
  jobApplications: {
    total: number;
    pending: number;
    shortlisted: number;
    rejected: number;
  };
}

export interface InstitutionStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  byRole: {
    students: number;
    institutionAdmins: number;
    superAdmins: number;
  };
}

// ===================================================================================
// ## Practice & Test Types
// ===================================================================================

export interface AptitudeQuestion {
  id: number;
  question: string;
  options: { id: string; text: string }[];
  difficulty: QuestionDifficulty;
  tags: string[];
}

export interface UserAnswer {
  questionId: number;
  selectedOption: string;
}

export interface AptitudeResultDetail {
  questionId: number;
  correct: boolean;
  correctAnswer: string;
  userAnswer: string;
}

export interface AptitudeResponse {
  id: number;
  type: string;
  score: number;
  total: number;
  percentage: number;
  createdAt: string;
  answers: AptitudeResultDetail[];
}

export interface AptitudeResults {
  results: AptitudeResultDetail[];
  score: number;
  total: number;
  percentage: number;
}

export interface AptitudeHistory {
  totalTestsTaken: number;
  responses: AptitudeResponse[];
}

export interface SubmitAptitudeRequest {
  type: string;
  answers: UserAnswer[];
  totalQuestions: number;
}

export interface GetRandomQuestionsParams {
  tags?: string[];
  difficulty?: QuestionDifficulty;
}

// ===================================================================================
// ## Machine Test Types
// ===================================================================================

export interface MachineTestProblem {
  id: number;
  title: string;
  description: any;
  difficulty: QuestionDifficulty;
  testCases: {
    sample: { input: string; output: string }[];
  };
  tags: string[];
  isPublic: boolean;
}

export interface MachineTest {
  id: number;
  userId: string;
  difficulty: QuestionDifficulty;
  status: MachineTestStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  problems: {
    problem: MachineTestProblem;
  }[];
}

export interface MachineTestHistoryItem {
  id: number;
  difficulty: QuestionDifficulty;
  problemsCount: number;
  problemsPassed: number;
  problemsFailed: number;
  problemsIncomplete: number;
  createdAt: string;
  completedAt?: string | null;
}

export interface MachineTestHistory {
  totalTestsTaken: number;
  history: MachineTestHistoryItem[];
}

export interface SubmitMachineTestCodeRequest {
  source_code: string;
  language_id: number;
  stdin?: string;
  machineTestId?: number;
}

export interface GenerateTestRequest {
  difficulty: QuestionDifficulty;
  count: number;
}

export interface ProgrammingLanguage {
  id: number;
  name: string;
  version?: string | null;
  isSupported: boolean;
}

export interface MachineTestSubmission {
  id: number;
  userId?: string | null;
  problemId: number;
  machineTestId?: number | null;
  sourceCode: string;
  languageId: number;
  stdin?: string | null;
  judge0Response: any;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
  language?: ProgrammingLanguage;
  problem?: MachineTestProblem;
}

// ===================================================================================
// ## AI Interview Types
// ===================================================================================

export interface AiInterviewQuestion {
  category: AiInterviewQuestionCategory;
  question: string;
  isFollowup?: boolean;
}

export interface AiInterviewQuestions {
  INTRODUCTORY: string[];
  TECHNICAL: string[];
  PROJECT_BASED: string[];
  BEHAVIORAL: string[];
  SITUATIONAL: string[];
  CLOSING: string[];
}

export interface AiInterviewSession {
  id: string;
  userId: string;
  resumeId?: number | null;
  jobTitle?: string | null;
  companyName?: string | null;
  status: AiInterviewSessionStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  questions: AiInterviewQuestions;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface AiInterviewSessionSummary {
  id: string;
  status: AiInterviewSessionStatus;
  createdAt: string;
  completedAt?: string | null;
  _count: {
    responses: number;
  };
  feedback?: {
    overallScore: number;
    keyStrengths: string[];
    areasForImprovement: string[];
  } | null;
}

export interface AiInterviewResponse {
  id: string;
  sessionId: string;
  category: AiInterviewQuestionCategory;
  question: string;
  answer: string;
  isFollowup: boolean;
  scoresJson?: any;
  feedbackText?: string | null;
  timeTakenSeconds?: number | null;
  timestamp: string;
}

export interface QuestionFeedback {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface AiInterviewFeedback {
  id: string;
  sessionId: string;
  userId: string;
  overallScore: number;
  overallSummary: string;
  keyStrengths: string[];
  areasForImprovement: string[];
  feedbackJson: any;
  createdAt: string;
  feedbackByCategory?: Array<{
    category: AiInterviewQuestionCategory;
    score: number;
    summary: string;
    detailedFeedback: QuestionFeedback[];
  }>;
}

export interface StartAiInterviewDto {
  resumeId?: number;
  jobTitle?: string;
  companyName?: string;
}

export interface SubmitAiInterviewAnswerDto {
  sessionId: string;
  answer: string;
}

export interface AiInterviewStats {
  totalSessions: number;
  completedSessions: number;
  sessionsWithFeedback: number;
  averageScore: number;
  averageResponsesPerSession: number;
  topStrengths: Array<{
    strength: string;
    count: number;
  }>;
  topImprovementAreas: Array<{
    area: string;
    count: number;
  }>;
  recentSessions: Array<{
    id: string;
    status: AiInterviewSessionStatus;
    createdAt: string;
    completedAt?: string | null;
    responsesCount: number;
    score?: number;
  }>;
}

// ===================================================================================
// ## Events & Postings Types
// ===================================================================================

export interface EligibilityCriteria {
  minSscPercentage?: number;
  minHscPercentage?: number;
  minAverageCgpa?: number;
  graduationYears?: number[];
}

export interface JobPosting {
  id: number;
  title: string;
  description: string;
  eligibilityCriteria: EligibilityCriteria | null;
  location: string | null;
  salary: string | null;
  applicationDeadline: string | null;
  institutionId: number;
  createdAt: string;
  updatedAt: string;
  institution?: Pick<Institution, 'id' | 'name'>;
  _count?: {
    applications?: number;
  };
}

export interface InternshipPosting {
  id: number;
  title: string;
  description: string;
  eligibilityCriteria: EligibilityCriteria | null;
  location: string | null;
  stipend: string | null;
  duration: string | null;
  applicationDeadline: string | null;
  institutionId: number;
  createdAt: string;
  updatedAt: string;
  institution?: Pick<Institution, 'id' | 'name'>;
  _count?: {
    applications?: number;
  };
}

export interface HackathonPosting {
  id: number;
  title: string;
  description: string;
  eligibilityCriteria: EligibilityCriteria | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  prizes: string | null;
  registrationDeadline: string | null;
  institutionId: number;
  createdAt: string;
  updatedAt: string;
  institution?: Pick<Institution, 'id' | 'name'>;
  _count?: {
    registrations?: number;
  };
}

export interface JobApplication {
  id: number;
  userId: string;
  jobId: number;
  resumeId?: number | null;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  job?: Pick<JobPosting, 'title' | 'location'>;
}

export interface InternshipApplication {
  id: number;
  userId: string;
  internshipId: number;
  resumeId?: number | null;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  internship?: Pick<InternshipPosting, 'title' | 'location'>;
}

export interface HackathonRegistration {
  id: number;
  userId: string;
  hackathonId: number;
  teamName: string | null;
  status: ApplicationStatus;
  registeredAt: string;
  updatedAt: string;
  hackathon?: Pick<HackathonPosting, 'title' | 'location'>;
}

export interface CreateJobPostingDto {
  title: string;
  description: string;
  eligibilityCriteria?: EligibilityCriteria;
  location?: string;
  salary?: string;
  applicationDeadline?: string;
}

export interface CreateInternshipPostingDto {
  title: string;
  description: string;
  eligibilityCriteria?: EligibilityCriteria;
  location?: string;
  stipend?: string;
  duration?: string;
  applicationDeadline?: string;
}

export interface CreateHackathonPostingDto {
  title: string;
  description: string;
  eligibilityCriteria?: EligibilityCriteria;
  location?: string;
  startDate?: string;
  endDate?: string;
  prizes?: string;
  registrationDeadline?: string;
}

export interface EventApplicantsResponse {
  registered: AppUser[];
  eligibleButNotRegistered: AppUser[];
}

// ===================================================================================
// ## Tag & Performance Types
// ===================================================================================

export interface Tag {
  id: number;
  name: string;
  category: string;
  parentId?: number | null;
}

export interface PerformanceByTopic {
  name: string;
  category: string;
  averageScore: number;
  accuracy: number;
  totalAttempts: number;
}

// ===================================================================================
// ## Admin & Dashboard Types
// ===================================================================================

/**
 * User distribution by status
 */
export interface UserStatusDistribution {
  ACTIVE: number;
  SUSPENDED: number;
  DELETED: number;
  PENDING_PROFILE_COMPLETION: number;
}

/**
 * Question/Problem distribution by difficulty
 */
export interface DifficultyDistribution {
  EASY: number;
  MEDIUM: number;
  HARD: number;
}

/**
 * Application status distribution
 */
export interface ApplicationStatusDistribution {
  PENDING: number;
  REVIEWED: number;
  SHORTLISTED: number;
  REJECTED: number;
  ACCEPTED: number;
}

/**
 * Platform growth metrics
 */
export interface GrowthMetrics {
  usersThisMonth: number;
  usersLastMonth: number;
  growthPercentage: number;
}

/**
 * Base statistics interface shared by all admin types
 */
interface BaseAdminStats {
  role: string;
  generatedAt: Date | string;
}

/**
 * Super Admin comprehensive statistics
 */
export interface SuperAdminStats extends BaseAdminStats {
  role: 'SUPER_ADMIN';
  totalUsers: number;
  usersByStatus: UserStatusDistribution;
  usersByRole: {
    students: number;
    institutionAdmins: number;
    superAdmins: number;
  };
  totalInstitutions: number;
  assessmentContent: {
    totalAptitudeQuestions: number;
    aptitudeByDifficulty: DifficultyDistribution;
    totalCodingProblems: number;
    codingByDifficulty: DifficultyDistribution;
    publicCodingProblems: number;
  };
  platformActivity: {
    totalSubmissions: number;
    totalAiInterviews: number;
    totalResumes: number;
    activeSessionsCount: number;
  };
  growth: GrowthMetrics;
}

/**
 * Institution Admin comprehensive statistics
 */
export interface InstitutionAdminStats extends BaseAdminStats {
  role: 'INSTITUTION_ADMIN';
  institutionId: number;
  institutionName: string;
  students: {
    total: number;
    active: number;
    suspended: number;
    pendingProfileCompletion: number;
    byGraduationYear: Record<number, number>;
  };
  assessmentPerformance: {
    averageAptitudeScore: number;
    totalAptitudeAttempts: number;
    averageCodingScore: number;
    totalCodingSubmissions: number;
    topPerformers: Array<{
      userId: string;
      name: string;
      averageScore: number;
    }>;
  };
  careerOpportunities: {
    jobs: {
      total: number;
      active: number;
      applications: ApplicationStatusDistribution;
    };
    internships: {
      total: number;
      active: number;
      applications: ApplicationStatusDistribution;
    };
    hackathons: {
      total: number;
      upcoming: number;
      registrations: ApplicationStatusDistribution;
    };
  };
  aiInterviews: {
    totalSessions: number;
    completedSessions: number;
    averageScore: number;
    thisMonth: number;
  };
  content: {
    aptitudeTests: number;
    codingProblems: number;
    batches: number;
  };
  recentActivity: {
    lastWeekSubmissions: number;
    lastWeekApplications: number;
    lastWeekRegistrations: number;
  };
}

/**
 * Union type for all admin statistics
 */
export type AdminStats = SuperAdminStats | InstitutionAdminStats;

/**
 * Time range filter for statistics
 */
export interface StatsTimeRangeDto {
  startDate?: Date | string;
  endDate?: Date | string;
  range?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

/**
 * User analytics response
 */
export interface UserAnalytics {
  registrationTrend: Array<{
    date: string;
    count: number;
  }>;
  loginActivity: Array<{
    date: string;
    count: number;
  }>;
  roleDistribution: Record<string, number>;
  statusChanges: Array<{
    date: string;
    status: UserStatus;
    count: number;
  }>;
}

/**
 * Assessment analytics response
 */
export interface AssessmentAnalytics {
  submissionTrend: Array<{
    date: string;
    count: number;
  }>;
  difficultyPerformance: Record<QuestionDifficulty, {
    attempts: number;
    successRate: number;
  }>;
  topicPerformance: Array<{
    topic: string;
    averageScore: number;
    totalAttempts: number;
  }>;
  languageUsage: Array<{
    language: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * Institution detailed statistics (for Super Admin)
 */
export interface InstitutionDetailedStats {
  id: number;
  name: string;
  domain: string;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    batches: number;
    machineTestProblems: number;
    aptitudeTestDefinitions: number;
    jobPostings: number;
    internshipPostings: number;
    hackathonPostings: number;
  };
  statistics: InstitutionAdminStats;
}

/**
 * Platform health metrics
 */
export interface PlatformHealthMetrics {
  databaseSize: {
    tables: number;
    size: string;
  };
  activeSessions: number;
  queuedSubmissions: number;
  failedJobs: number;
  systemResources: {
    cpu: number;
    memory: number;
    disk: number;
  };
  timestamp: Date | string;
}

/**
 * Export format options
 */
export type ExportFormat = 'csv' | 'excel' | 'json';

/**
 * Export stats request
 */
export interface ExportStatsRequest {
  format?: ExportFormat;
  timeRange?: StatsTimeRangeDto;
}

/**
 * Enhanced student stats with additional metrics
 */
export interface EnhancedStudentStats extends StudentStats {
  lastActivity?: string;
  streakDays?: number;
  completedChallenges?: number;
  upcomingDeadlines?: Array<{
    type: 'job' | 'internship' | 'hackathon';
    title: string;
    deadline: string;
  }>;
}

// ===================================================================================
// ## Session Management Types
// ===================================================================================

export interface Session {
  id: string;
  userId: string;
  sessionToken: string;
  userAgent?: string | null;
  createdAt: string;
  expiresAt: string;
}

// ===================================================================================
// ## Social Account Types
// ===================================================================================

export interface SocialAccount {
  id: string;
  provider: string;
  providerId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// ===================================================================================
// ## Batch Management Types
// ===================================================================================

export interface Batch {
  id: number;
  name: string;
  institutionId: number;
  createdAt: string;
  updatedAt: string;
}

// ===================================================================================
// ## Aptitude Test Definition Types
// ===================================================================================

export interface AptitudeTestDefinition {
  id: number;
  name: string;
  description?: string | null;
  institutionId: number;
  _count?: {
    questions: number;
  };
}

// ===================================================================================
// ## Export Additional Enum Types
// ===================================================================================

export { SubmissionStatus, TagCategory } from './enum';