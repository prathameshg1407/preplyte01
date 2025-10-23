// ============================================================================
// ENUMS - Matching Backend Prisma Schema
// ============================================================================

export enum MockDriveStatus {
  DRAFT = 'DRAFT',
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MockDriveRegistrationStatus {
  REGISTERED = 'REGISTERED',
  BATCH_ASSIGNED = 'BATCH_ASSIGNED',
  CANCELLED = 'CANCELLED',
  DISQUALIFIED = 'DISQUALIFIED',
}

export enum MockDriveAttemptStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
  DISQUALIFIED = 'DISQUALIFIED',
}

export enum QuestionDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum AiInterviewQuestionCategory {
  INTRODUCTORY = 'INTRODUCTORY',
  TECHNICAL = 'TECHNICAL',
  PROJECT_BASED = 'PROJECT_BASED',
  BEHAVIORAL = 'BEHAVIORAL',
  SITUATIONAL = 'SITUATIONAL',
  CLOSING = 'CLOSING',
}

// NEW: Test Component Flow Enum
export enum TestComponent {
  APTITUDE = 'APTITUDE',
  MACHINE_TEST = 'MACHINE_TEST',
  AI_INTERVIEW = 'AI_INTERVIEW',
  COMPLETED = 'COMPLETED',
}

// ============================================================================
// CONFIGURATION DTOs
// ============================================================================

export interface AptitudeQuestionDistribution {
  difficulty: QuestionDifficulty;
  count: number;
  topics?: string[];
}

export interface AptitudeTestConfig {
  questionDistribution?: AptitudeQuestionDistribution[];
  totalQuestions: number;
  durationMinutes: number;
  maxScore?: number;
}

export interface MachineProblemDistribution {
  difficulty: QuestionDifficulty;
  count: number;
  pointsPerProblem: number;
  topics?: string[];
}

export interface SelectedMachineProblem {
  problemId: number;
  points: number;
  orderIndex?: number;
}

export interface MachineTestConfig {
  problemDistribution?: MachineProblemDistribution[];
  selectedProblems?: SelectedMachineProblem[];
  totalProblems: number;
  durationMinutes: number;
  maxScore?: number;
  allowMultipleSubmissions?: boolean;
}

export interface AiInterviewConfig {
  jobTitle?: string;
  companyName?: string;
  totalQuestions: number;
  durationMinutes: number;
  requireResume?: boolean;
  maxScore?: number;
  enableFollowUps?: boolean;
}

export interface EligibilityCriteria {
  minCgpa?: number;
  minSscPercentage?: number;
  minHscPercentage?: number;
  requiredSkills?: string[];
  maxActiveBacklogs?: number;
  customCriteria?: Record<string, any>;
  // Internal storage (don't show in UI)
  aptitudeConfig?: AptitudeTestConfig;
  machineTestConfig?: MachineTestConfig;
}

// ============================================================================
// MOCK DRIVE CRUD DTOs
// ============================================================================

export interface CreateMockDriveDto {
  title: string;
  description?: string;
  eligibleYear: number[];
  eligibilityCriteria?: EligibilityCriteria;
  aptitudeConfig?: AptitudeTestConfig;
  machineTestConfig?: MachineTestConfig;
  aiInterviewConfig?: AiInterviewConfig;
  registrationStartDate: string;
  registrationEndDate: string;
  driveStartDate: string;
  driveEndDate: string;
  duration: number;
  isPublished?: boolean;
  generateQuestionsNow?: boolean;
}

export interface UpdateMockDriveDto extends Partial<CreateMockDriveDto> {}

export interface QueryMockDriveDto {
  page?: number;
  limit?: number;
  status?: MockDriveStatus;
  search?: string;
  eligibleYear?: number;
  isPublished?: boolean;
  sortBy?: 'createdAt' | 'driveStartDate' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface UserProfile {
  fullName: string;
  graduationYear?: number;
  averageCgpa?: number;
  profileImageUrl?: string;
}

export interface UserBasicInfo {
  id: string;
  email: string;
  profile: UserProfile;
}

export interface Institution {
  id: number;
  name: string;
  domain?: string;
  logoUrl?: string;
}

export interface MockDrive {
  id: string;
  title: string;
  description?: string;
  institutionId: number;
  eligibleYear: number[];
  eligibilityCriteria: EligibilityCriteria;
  aptitudeTestId?: number;
  aiInterviewConfig: AiInterviewConfig;
  registrationStartDate: string;
  registrationEndDate: string;
  driveStartDate: string;
  driveEndDate: string;
  duration: number;
  isPublished: boolean;
  rankingsPublished: boolean;
  status: MockDriveStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  
  // Relations
  institution?: Institution;
  
  // Counts
  _count?: {
    registrations: number;
    attempts: number;
    results?: number;
  };
}

// ============================================================================
// REGISTRATION
// ============================================================================

export interface MockDriveRegistration {
  id: string;
  mockDriveId: string;
  userId: string;
  registeredAt: string;
  status: MockDriveRegistrationStatus;
  batchStudent?: MockDriveBatchStudent;
  mockDrive?: {
    id: string;
    title: string;
    driveStartDate: string;
    driveEndDate: string;
  };
}

export interface RegisterForMockDriveDto {
  mockDriveId: string;
}

export interface RegistrationResponse extends MockDriveRegistration {
  mockDrive: {
    id: string;
    title: string;
    driveStartDate: string;
    driveEndDate: string;
  };
}

export interface CancelRegistrationResponse {
  message: string;
}

export interface EligibilityCheckResponse {
  eligible: boolean;
  reasons: string[];
}

export interface MyMockDriveRegistration extends MockDriveRegistration {
  mockDrive: {
    id: string;
    title: string;
    description?: string;
    registrationStartDate: string;
    registrationEndDate: string;
    driveStartDate: string;
    driveEndDate: string;
    duration: number;
    status: MockDriveStatus;
    isPublished: boolean;
  };
  batchStudent?: {
    id: string;
    batchId: string;
    registrationId: string;
    addedAt: string;
    batch: MockDriveBatch;
  };
}

// ============================================================================
// BATCH MANAGEMENT
// ============================================================================

export interface MockDriveBatch {
  id: string;
  mockDriveId: string;
  batchName: string;
  startTime: string;
  endTime: string;
  maxStudents?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    students: number;
  };
  students?: MockDriveBatchStudent[];
}

export interface MockDriveBatchStudent {
  id: string;
  batchId: string;
  registrationId: string;
  addedAt: string;
  batch?: MockDriveBatch;
  registration?: {
    user: UserBasicInfo;
  };
}

export interface MockDriveBatchWithStudents extends MockDriveBatch {
  students: Array<{
    id: string;
    batchId: string;
    registrationId: string;
    addedAt: string;
    registration: {
      id: string;
      status: MockDriveRegistrationStatus;
      registeredAt: string;
      user: UserBasicInfo;
    };
  }>;
}

export interface UnassignedStudent {
  id: string;
  mockDriveId: string;
  userId: string;
  registeredAt: string;
  status: MockDriveRegistrationStatus;
  user: UserBasicInfo;
}

export interface CreateBatchDto {
  batchName: string;
  startTime: string;
  endTime: string;
  maxStudents?: number;
}

export interface UpdateBatchDto extends Partial<CreateBatchDto> {
  isActive?: boolean;
}

export interface AssignStudentsToBatchDto {
  studentIds: string[];
}

export interface AssignStudentsResponse {
  message: string;
  assignedCount: number;
}

export interface RemoveStudentResponse {
  message: string;
}

// ============================================================================
// SEQUENTIAL FLOW - Component Status
// ============================================================================

export interface ComponentStatus {
  currentComponent: TestComponent;
  nextComponent: TestComponent | null;
  canProceed: boolean;
  message: string;
}

export interface MoveToNextComponentResponse {
  message: string;
  componentStatus: ComponentStatus;
}

// ============================================================================
// ATTEMPT MANAGEMENT
// ============================================================================

export interface MockDriveAttempt {
  id: string;
  mockDriveId: string;
  userId: string;
  batchId?: string;
  startedAt: string;
  completedAt?: string;
  status: MockDriveAttemptStatus;
  aptitudeResponseId?: number;
  machineTestId?: number;
  aiInterviewSessionId?: string;
  mockDrive?: {
    id: string;
    title: string;
  };
  user?: UserBasicInfo;
  result?: MockDriveResult;
  componentStatus?: ComponentStatus; // NEW: Current component to show
}

export interface StartMockDriveAttemptResponse {
  message: string;
  attempt: MockDriveAttempt;
  componentStatus: ComponentStatus; // NEW: Which component to show first
  autoStart: boolean; // NEW: UI should auto-start the first test
}

export interface CompleteAttemptDto {
  notes?: string;
}

export interface CompleteAttemptResponse {
  message: string;
  attempt: MockDriveAttempt;
  result: MockDriveResult;
  componentStatus?: ComponentStatus;
}

export interface AttemptProgressResponse {
  attemptId: string;
  status: MockDriveAttemptStatus;
  currentComponent: TestComponent; // NEW
  nextComponent: TestComponent | null; // NEW
  progress: {
    aptitude: {
      required: boolean;
      completed: boolean;
      score?: {
        score: number;
        total: number;
        percentage: number;
      };
    };
    machineTest: {
      required: boolean;
      completed: boolean;
      problemsCount: number;
      submissionsCount: number;
    };
    aiInterview: {
      required: boolean;
      completed: boolean;
      questionsAnswered: number;
      totalQuestions: number;
      currentQuestionIndex: number;
    };
  };
  timing: {
    startedAt: string;
    durationMinutes: number;
    elapsedMinutes: number;
    remainingMinutes: number;
    expiresAt: string;
    isExpired: boolean;
  };
  message: string; // NEW: Instruction message
}

// ============================================================================
// APTITUDE TEST (AI-Generated, Mock Drive Specific)
// ============================================================================

export interface AptitudeAnswer {
  questionId: string; // CHANGED: Now string (cuid) instead of number
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface SubmitAptitudeDto {
  answers: AptitudeAnswer[];
  timeTakenSeconds?: number;
}

export interface AptitudeQuestion {
  questionNumber: number;
  questionId: string; // CHANGED: Now string (cuid)
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  difficulty: QuestionDifficulty;
  topic: string; // NEW: Topic field
}

export interface StartAptitudeTestResponse {
  message: string;
  attemptId: string;
  mockDriveId: string;
  totalQuestions: number;
  questions: AptitudeQuestion[];
}

export interface SubmitAptitudeTestResponse {
  message: string;
  attemptId: string;
  responseId: number;
  score: number;
  total: number;
  percentage: number;
  correctAnswers: number;
  incorrectAnswers: number;
  breakdown: {
    EASY: { correct: number; total: number };
    MEDIUM: { correct: number; total: number };
    HARD: { correct: number; total: number };
  };
  topicBreakdown?: Record<string, { correct: number; total: number }>; // NEW
  nextComponent?: ComponentStatus; // NEW: Auto-progression
}

export interface AptitudeResultDetail {
  questionId: string; // CHANGED: Now string
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  difficulty: QuestionDifficulty;
  topic: string; // NEW
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string; // NEW
  successRate?: number; // NEW: Quality metric
  attemptCount?: number; // NEW: Quality metric
  correctCount?: number; // NEW: Quality metric
}

export interface AptitudeResultsResponse {
  attemptId: string;
  responseId: number;
  score: number;
  total: number;
  percentage: number;
  submittedAt: string;
  breakdown: {
    byDifficulty: {
      EASY: { correct: number; total: number; percentage: number; avgSuccessRate?: number };
      MEDIUM: { correct: number; total: number; percentage: number; avgSuccessRate?: number };
      HARD: { correct: number; total: number; percentage: number; avgSuccessRate?: number };
    };
    byTopic?: Record<string, { correct: number; total: number; percentage: number }>; // NEW
    byQuestion: AptitudeResultDetail[];
  };
  qualityMetrics?: {
    overallSuccessRate: number;
    totalAttempts: number;
    totalCorrect: number;
    byDifficulty: Record<string, { avgSuccessRate: number; count: number }>;
    byTopic?: Record<string, { avgSuccessRate: number; count: number }>;
  }; // NEW
}

export interface AptitudeStatsResponse {
  attemptId: string;
  completed: boolean;
  score: number;
  total: number;
  percentage: number;
  submittedAt?: string;
  statsByDifficulty: {
    EASY: { correct: number; total: number; percentage: number };
    MEDIUM: { correct: number; total: number; percentage: number };
    HARD: { correct: number; total: number; percentage: number };
  };
  statsByTopic?: Record<string, { correct: number; total: number; percentage: number }>; // NEW
  strengths: string[];
  weaknesses: string[];
  qualityMetrics?: any; // NEW
}

export interface AptitudeLeaderboardResponse {
  mockDriveId: string;
  totalParticipants: number;
  leaderboard: Array<{
    rank: number;
    userId: string;
    userName: string;
    score: number;
    total: number;
    percentage: number;
    submittedAt: string;
  }>;
  questionMetrics?: {
    mostDifficult: Array<{
      id: string;
      question: string;
      difficulty: QuestionDifficulty;
      topic: string;
      successRate: number;
      attemptCount: number;
      correctCount: number;
    }>;
    easiest: Array<{
      id: string;
      question: string;
      difficulty: QuestionDifficulty;
      topic: string;
      successRate: number;
      attemptCount: number;
      correctCount: number;
    }>;
    averageSuccessRate: number;
  }; // NEW
}

// ============================================================================
// MACHINE TEST (AI-Generated Problems)
// ============================================================================

export interface SubmitCodeDto {
  source_code: string; // base64 encoded
  language_id: number;
  stdin?: string; // base64 encoded
}

export interface GeneratedProblem {
  id: string; // CHANGED: Now cuid string
  title: string;
  description: any;
  difficulty: QuestionDifficulty;
  topic: string;
  points: number;
  orderIndex: number;
  hints?: string[];
}

export interface StartMachineTestResponse {
  message: string;
  attemptId: string;
  mockDriveId: string;
  totalProblems: number;
  problems: GeneratedProblem[];
}

export interface MachineTestSubmissionResult {
  testCase: number;
  isHidden: boolean;
  status: string;
  input: string;
  output?: string;
  expected?: string;
  error?: string;
}

export interface SubmitCodeResponse {
  submissionId: string; // CHANGED: Now cuid
  problemType: 'GENERATED'; // NEW
  finalStatus: string;
  score: number;
  passedCount: number;
  totalCases: number;
  maxPoints: number;
  earnedPoints: number;
  timeTakenSeconds?: number;
  results: MachineTestSubmissionResult[];
  componentStatus?: ComponentStatus; // NEW: For auto-progression check
}

export interface MachineTestDetailsResponse {
  attemptId: string;
  mockDriveId: string;
  totalProblems: number;
  problems: Array<{
    id: string; // CHANGED: Now cuid
    type: 'GENERATED';
    title: string;
    description: any;
    difficulty: QuestionDifficulty;
    topic: string;
    points: number;
    orderIndex: number;
    hints?: string[];
    submissions: Array<{
      id: string;
      status: string;
      createdAt: string;
      timeTakenSeconds?: number;
    }>;
    totalSubmissions: number;
  }>;
  totalSubmissions: number;
}

export interface MachineTestStatsResponse {
  attemptId: string;
  totalProblems: number;
  solvedProblems: number;
  attemptedProblems: number;
  totalSubmissions: number;
  totalMaxPoints: number;
  totalEarnedPoints: number;
  percentage: number;
  statsByDifficulty: {
    EASY: { solved: number; attempted: number; total: number; maxPoints: number; earnedPoints: number };
    MEDIUM: { solved: number; attempted: number; total: number; maxPoints: number; earnedPoints: number };
    HARD: { solved: number; attempted: number; total: number; maxPoints: number; earnedPoints: number };
  };
  problemScores: Array<{
    problemId: string; // CHANGED: Now cuid
    title: string;
    difficulty: QuestionDifficulty;
    topic: string;
    maxPoints: number;
    earnedPoints: number;
    score: number;
    status: string;
    submissions: number;
    bestTime?: number | null;
  }>;
  strengths: string[];
  weaknesses: string[];
  qualityMetrics?: {
    overallSolveRate: number;
    totalAttempts: number;
    totalSolved: number;
    byDifficulty: Record<string, { avgSolveRate: number; count: number }>;
  }; // NEW
}

export interface ProblemLeaderboardResponse {
  problemId: string; // CHANGED: Now cuid
  problemType: 'GENERATED';
  totalParticipants: number;
  leaderboard: Array<{
    rank: number;
    userId: string;
    userName: string;
    score: number;
    submissions: number;
    timeTaken?: number;
    submittedAt: string;
  }>;
}

export interface MachineTestLeaderboardResponse {
  mockDriveId: string;
  totalParticipants: number;
  leaderboard: Array<{
    rank: number;
    userId: string;
    userName: string;
    totalScore: number;
    totalMaxScore: number;
    percentage: number;
    solvedProblems: number;
    totalProblems: number;
    submissionsCount: number;
  }>;
}

// ============================================================================
// AI INTERVIEW (On-Demand Generated)
// ============================================================================

export interface StartMockDriveInterviewDto {
  resumeId: number;
}

export interface SubmitMockDriveAnswerDto {
  category: string;
  question: string;
  answer: string;
  timeTakenSeconds?: number;
  isTranscribed?: boolean;
}

export interface QuestionItemDto {
  category: AiInterviewQuestionCategory;
  text: string;
}

export interface InterviewSessionResponseDto {
  id: string;
  userId: string;
  questions: QuestionItemDto[];
  createdAt: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  status: string;
}

export interface StartMockDriveInterviewResponse extends InterviewSessionResponseDto {
  attemptId: string;
  mockDriveTitle: string;
  configuredQuestions: number;
  duration: number;
}

export interface SubmitAnswerResponse {
  message: string;
  hasFollowUp: boolean;
  followUpQuestion?: QuestionItemDto;
  progress: {
    currentQuestionIndex: number;
    totalQuestions: number;
    isComplete: boolean;
  };
}

export interface ResponseScoreDto {
  contentScore: number;
  fluencyScore: number;
  relevanceScore: number;
  feedback: string;
}

export interface InterviewFeedbackResponseDto {
  overallScore: number;
  overallSummary: string;
  keyStrengths: string[];
  areasForImprovement: string[];
  weakSections?: string[];
  perResponseScores?: ResponseScoreDto[];
}

export interface MockDriveInterviewFeedbackResponse extends InterviewFeedbackResponseDto {
  attemptId: string;
  mockDriveTitle: string;
}

export interface CompleteInterviewResponse {
  message: string;
  feedback: InterviewFeedbackResponseDto;
  mockDrive?: CompleteAttemptResponse; // NEW: Auto-completes mock drive
}

// ============================================================================
// RESULTS & RANKINGS
// ============================================================================

export interface MockDriveResult {
  id: string;
  attemptId: string;
  mockDriveId: string;
  userId: string;
  aptitudeScore?: number;
  aptitudeMaxScore?: number;
  machineTestScore?: number;
  machineTestMaxScore?: number;
  aiInterviewScore?: number;
  aiInterviewMaxScore?: number;
  totalScore: number;
  totalMaxScore: number;
  percentage: number;
  detailedReport?: {
    aptitude?: {
      score: number;
      maxScore: number;
      percentage: number;
    };
    machineTest?: {
      score: number;
      maxScore: number;
      percentage: number;
      submissionsCount: number;
    };
    aiInterview?: {
      score: number;
      maxScore: number;
      percentage: number;
      feedback?: any;
    };
  };
  strengths?: string[];
  areasForImprovement?: string[];
  createdAt: string;
  updatedAt: string;
  ranking?: MockDriveRanking;
}

export interface MockDriveRanking {
  id: string;
  mockDriveId: string;
  resultId: string;
  userId: string;
  rank: number;
  percentile: number;
  publishedAt: string;
}

export interface MockDriveLeaderboard {
  mockDriveId: string;
  mockDriveTitle: string;
  rankings: Array<{
    rank: number;
    userId: string;
    userName: string;
    profileImageUrl?: string;
    totalScore: number;
    percentage: number;
    percentile: number;
    aptitudeScore?: number;
    machineTestScore?: number;
    aiInterviewScore?: number;
  }>;
  userRanking?: {
    rank: number;
    percentile: number;
  };
  totalParticipants: number;
}

// ============================================================================
// QUESTION GENERATION
// ============================================================================

export interface GenerateQuestionsResponse {
  message: string;
  results: {
    aptitudeQuestions: {
      status: 'GENERATED' | 'ALREADY_EXISTS';
      questionsCount: number;
      breakdown?: {
        EASY: number;
        MEDIUM: number;
        HARD: number;
      };
    } | null;
    machineTestProblems: {
      status: 'GENERATED' | 'LINKED' | 'ALREADY_EXISTS';
      problemsCount: number;
      breakdown?: {
        EASY: number;
        MEDIUM: number;
        HARD: number;
      };
      totalPoints?: number;
      note?: string;
    } | null;
    totalGenerated: number;
  };
  note?: string;
}

export interface QuestionPreviewResponse {
  aptitude: {
    totalQuestions: number;
    hasQuestions: boolean;
    breakdown: {
      EASY: number;
      MEDIUM: number;
      HARD: number;
    };
    questions: Array<{
      id: string; // CHANGED: Now cuid
      questionPreview: string;
      topic: string;
      difficulty: QuestionDifficulty;
      hasExplanation: boolean;
    }>;
    qualityMetrics: {
      totalAttempts: number;
      averageSuccessRate: number;
    };
  };
  machineTest: {
    generatedProblems: {
      totalProblems: number;
      hasProblems: boolean;
      breakdown: {
        EASY: number;
        MEDIUM: number;
        HARD: number;
      };
      totalPoints: number;
      problems: Array<{
        id: string; // CHANGED: Now cuid
        title: string;
        difficulty: QuestionDifficulty;
        topic: string;
        points: number;
        orderIndex: number;
        testCasesCount: number;
        hasHints: boolean;
        isValidated: boolean;
      }>;
      qualityMetrics: {
        totalAttempts: number;
        totalSolved: number;
      };
    };
    linkedProblems: {
      totalProblems: number;
      hasProblems: boolean;
      breakdown: {
        EASY: number;
        MEDIUM: number;
        HARD: number;
      };
      totalPoints: number;
      problems: Array<{
        id: number;
        title: string;
        difficulty: QuestionDifficulty;
        points: number;
        orderIndex: number;
        isPublic: boolean;
        testCasesCount: number;
      }>;
    };
    totalProblems: number;
    totalPoints: number;
  };
  aiInterview: {
    isConfigured: boolean;
    config: AiInterviewConfig | null;
    note: string;
  };
  summary: {
    totalAptitudeQuestions: number;
    totalCodingProblems: number;
    aiInterviewEnabled: boolean;
    readyToPublish: boolean;
  };
}

// ============================================================================
// ADMIN RESPONSES
// ============================================================================

export interface AdminRegistrationListItem {
  id: string;
  mockDriveId: string;
  userId: string;
  registeredAt: string;
  status: MockDriveRegistrationStatus;
  user: UserBasicInfo;
  batchStudent?: {
    id: string;
    batchId: string;
    addedAt: string;
    batch: {
      id: string;
      batchName: string;
    };
  };
}

export interface AdminRegistrationsPaginatedResponse {
  data: AdminRegistrationListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminAttemptListItem {
  id: string;
  mockDriveId: string;
  userId: string;
  status: MockDriveAttemptStatus;
  startedAt: string;
  completedAt?: string;
  user: UserBasicInfo;
  result?: {
    aptitudeScore?: number;
    aptitudeMaxScore?: number;
    machineTestScore?: number;
    machineTestMaxScore?: number;
    aiInterviewScore?: number;
    aiInterviewMaxScore?: number;
    totalScore: number;
    totalMaxScore: number;
    percentage: number;
  };
}

export interface AdminAttemptsPaginatedResponse {
  data: AdminAttemptListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================================================
// STATISTICS
// ============================================================================

export interface MockDriveStats {
  totalDrives: number;
  activeDrives: number;
  completedDrives: number;
  totalRegistrations: number;
  totalAttempts: number;
  averageScore?: number;
}

export interface MockDriveAttemptStats {
  mockDriveId: string;
  totalAttempts: number;
  completedAttempts: number;
  inProgressAttempts: number;
  averageScore?: number;
  highestScore?: number;
  lowestScore?: number;
}

// ============================================================================
// LIST/PAGINATED RESPONSES
// ============================================================================

export interface MockDriveListItem {
  id: string;
  title: string;
  description?: string;
  status: MockDriveStatus;
  isPublished: boolean;
  registrationStartDate: string;
  registrationEndDate: string;
  driveStartDate: string;
  driveEndDate: string;
  duration: number;
  eligibleYear: number[];
  institution?: {
    id: number;
    name: string;
  };
  _count: {
    registrations: number;
    attempts: number;
  };
}

export interface MockDriveListItemWithRegistration extends MockDriveListItem {
  userRegistration: MockDriveRegistration | null;
  isRegistered: boolean;
}

export interface MockDriveWithRegistration extends MockDrive {
  userRegistration: MockDriveRegistration | null;
  isRegistered: boolean;
}

export interface MockDrivePaginatedResponse {
  data: MockDriveListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MockDriveWithRegistrationPaginatedResponse {
  data: MockDriveListItemWithRegistration[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================================================
// UI HELPERS & STATE TYPES
// ============================================================================

export interface MockDriveFormData extends Omit<CreateMockDriveDto, 'duration'> {
  hasAptitude: boolean;
  hasMachineTest: boolean;
  hasAiInterview: boolean;
}

export interface MockDriveValidationError {
  field: string;
  message: string;
}

export interface MockDriveFilters {
  status?: MockDriveStatus[];
  isPublished?: boolean;
  eligibleYear?: number;
  search?: string;
  institutionId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface MockDriveUIState {
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isPublishing: boolean;
  selectedDrive?: MockDrive;
  filters: MockDriveFilters;
  currentPage: number;
  pageSize: number;
}

// UPDATED: New progress tracking with sequential flow
export interface MockDriveProgress {
  attemptId: string;
  currentComponent: TestComponent;
  nextComponent: TestComponent | null;
  message: string;
  components: {
    aptitude?: {
      completed: boolean;
      score?: number;
      responseId?: number;
    };
    machineTest?: {
      completed: boolean;
      score?: number;
      submissionsCount?: number;
    };
    aiInterview?: {
      completed: boolean;
      score?: number;
      sessionId?: string;
    };
  };
  overallProgress: number; // 0-100
  canProceed: boolean;
}

export interface BatchTimeValidation {
  isWithinBatchTime: boolean;
  batchStartTime?: string;
  batchEndTime?: string;
  currentTime: string;
  message?: string;
}

// ============================================================================
// NOTIFICATION TYPES (Future Use)
// ============================================================================

export interface MockDriveNotification {
  type: 
    | 'registration_opened' 
    | 'registration_closing' 
    | 'drive_starting' 
    | 'batch_assigned' 
    | 'results_published';
  mockDriveId: string;
  mockDriveTitle: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// ============================================================================
// QUERY DTOs
// ============================================================================

export interface QueryAttemptsDto {
  page?: number;
  limit?: number;
  status?: MockDriveAttemptStatus;
  search?: string;
}

// ============================================================================
// MIGRATION TYPES (For Admin)
// ============================================================================

export interface MigrationStatusResponse {
  mockDriveId: string;
  aptitude: {
    total: number;
    migrated: number;
    pending: number;
  };
  coding: {
    total: number;
    migrated: number;
    pending: number;
  };
}

export interface MigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  failed: number;
  details: Array<{
    questionId?: string;
    problemId?: string;
    migratedToId?: number;
    qualityScore?: number;
    reason?: string;
    status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
  }>;
}

export interface MigrateQuestionsResponse {
  mockDriveId: string;
  aptitudeQuestions: MigrationResult;
  codingProblems: MigrationResult;
  totalMigrated: number;
}

// ============================================================================
// HELPER FUNCTIONS (Type Guards)
// ============================================================================

export function isComponentCompleted(
  component: TestComponent,
  progress: MockDriveProgress
): boolean {
  switch (component) {
    case TestComponent.APTITUDE:
      return progress.components.aptitude?.completed ?? false;
    case TestComponent.MACHINE_TEST:
      return progress.components.machineTest?.completed ?? false;
    case TestComponent.AI_INTERVIEW:
      return progress.components.aiInterview?.completed ?? false;
    case TestComponent.COMPLETED:
      return true;
    default:
      return false;
  }
}

export function getComponentDisplayName(component: TestComponent): string {
  const names: Record<TestComponent, string> = {
    [TestComponent.APTITUDE]: 'Aptitude Test',
    [TestComponent.MACHINE_TEST]: 'Coding Test',
    [TestComponent.AI_INTERVIEW]: 'AI Interview',
    [TestComponent.COMPLETED]: 'Completed',
  };
  return names[component];
}

export function calculateOverallProgress(progress: MockDriveProgress): number {
  let completed = 0;
  let total = 0;

  if (progress.components.aptitude) {
    total++;
    if (progress.components.aptitude.completed) completed++;
  }
  if (progress.components.machineTest) {
    total++;
    if (progress.components.machineTest.completed) completed++;
  }
  if (progress.components.aiInterview) {
    total++;
    if (progress.components.aiInterview.completed) completed++;
  }

  return total > 0 ? Math.round((completed / total) * 100) : 0;
}