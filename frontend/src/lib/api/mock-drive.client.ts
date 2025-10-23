'use client';

import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  apiGetPaginated,
  type FetchOptions,
} from './client';
import type {
  MockDrive,
  MockDriveListItem,
  MockDriveListItemWithRegistration,
  MockDriveWithRegistration,
  CreateMockDriveDto,
  UpdateMockDriveDto,
  QueryMockDriveDto,
  MockDrivePaginatedResponse,
  MockDriveWithRegistrationPaginatedResponse,
  MockDriveRegistration,
  MyMockDriveRegistration,
  MockDriveBatch,
  MockDriveBatchWithStudents,
  UnassignedStudent,
  CreateBatchDto,
  UpdateBatchDto,
  AssignStudentsToBatchDto,
  AssignStudentsResponse,
  RemoveStudentResponse,
  RegisterForMockDriveDto,
  RegistrationResponse,
  CancelRegistrationResponse,
  EligibilityCheckResponse,
  StartMockDriveAttemptResponse,
  MockDriveAttempt,
  MockDriveResult,
  MockDriveLeaderboard,
  MockDriveStats,
  MockDriveAttemptStats,
  AdminRegistrationsPaginatedResponse,
  AdminAttemptsPaginatedResponse,
  AdminRegistrationListItem,
  AdminAttemptListItem,
  GenerateQuestionsResponse,
  QuestionPreviewResponse,
  StartAptitudeTestResponse,
  SubmitAptitudeDto,
  SubmitAptitudeTestResponse,
  AptitudeResultsResponse,
  AptitudeStatsResponse,
  AptitudeLeaderboardResponse,
  StartMachineTestResponse,
  SubmitCodeDto,
  SubmitCodeResponse,
  MachineTestDetailsResponse,
  MachineTestStatsResponse,
  StartMockDriveInterviewDto,
  StartMockDriveInterviewResponse,
  SubmitMockDriveAnswerDto,
  InterviewSessionResponseDto,
  MockDriveInterviewFeedbackResponse,
  AttemptProgressResponse,
  CompleteAttemptDto,
  CompleteAttemptResponse,
  // Add typed response for problem leaderboard from types (string IDs)
  ProblemLeaderboardResponse,
} from '@/types/mock-drive.types';
import type { ApiMessage, PaginatedResponse } from '@/types';

// ============================================================================
// TYPE DEFINITIONS FOR MISSING TYPES (aligned to string IDs for problems)
// ============================================================================

export interface ProblemSubmission {
  id: string;
  problemId: string; // CHANGED: cuid string
  code: string;
  language: string;
  status: string;
  score: number;
  executionTime?: number;
  memory?: number;
  submittedAt: string;
  testResults?: TestResult[];
}

export interface TestResult {
  testCase: number;
  passed: boolean;
  executionTime?: number;
  memory?: number;
  output?: string;
  expectedOutput?: string;
  error?: string;
}

export interface ProblemSubmissionsResponse {
  submissions: ProblemSubmission[];
  totalSubmissions: number;
  bestSubmission?: ProblemSubmission;
}

export interface AllSubmissionsResponse {
  submissions: Record<string, ProblemSubmission[]>; // CHANGED: keyed by cuid
  totalSubmissions: number;
  problemsSolved: number;
  totalProblems: number;
}

// Keep interview helper types local if not present in shared types
export interface InterviewQuestionResponse {
  question: {
    id: string;
    questionNumber: number;
    questionText: string;
    difficulty: string;
  };
  sessionId: string;
  remainingQuestions: number;
  totalQuestions: number;
}

export interface InterviewAnswerResponse {
  feedback: string;
  score: number;
  nextQuestion?: InterviewQuestionResponse['question'];
  isComplete: boolean;
}

export interface InterviewProgressResponse {
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestions: number;
  remainingTime: number;
  status: string;
}

export interface InterviewStatsResponse {
  totalQuestions: number;
  answeredQuestions: number;
  averageScore: number;
  technicalScore: number;
  behavioralScore: number;
  communicationScore: number;
  overallRating: string;
}

// Old problem leaderboard (number) removed in favor of typed import above

// ============================================================================
// INTERNAL GUARDS (fail-fast for invalid params)
// ============================================================================

function ensureStringId(id: string | null | undefined, label: string): string {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new Error(`${label} is required`);
  }
  return id;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transform paginated response to expected format
 */
function transformPaginatedResponse<T>(
  response: PaginatedResponse<T>,
  params?: { page?: number; limit?: number }
): {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
} {
  return {
    data: response.data,
    meta: {
      total: response.pagination?.total || response.data.length,
      page: response.pagination?.page || params?.page || 1,
      limit: response.pagination?.limit || params?.limit || 10,
      totalPages:
        response.pagination?.totalPages ||
        Math.ceil((response.pagination?.total || response.data.length) / (params?.limit || 10)),
    },
  };
}

// ============================================================================
// ADMIN APIs - Mock Drive CRUD
// ============================================================================

export async function createMockDrive(
  data: CreateMockDriveDto,
  options?: FetchOptions
): Promise<MockDrive> {
  return apiPost<MockDrive>('/admin/mock-drives', data, options);
}

export async function getAdminMockDrives(
  params?: QueryMockDriveDto,
  options?: FetchOptions
): Promise<MockDrivePaginatedResponse> {
  const response = await apiGetPaginated<MockDriveListItem>('/admin/mock-drives', params, options);
  return transformPaginatedResponse(response, params);
}

export async function getAdminMockDrive(id: string, options?: FetchOptions): Promise<MockDrive> {
  return apiGet<MockDrive>(`/admin/mock-drives/${ensureStringId(id, 'Mock Drive ID')}`, options);
}

export async function updateMockDrive(
  id: string,
  data: UpdateMockDriveDto,
  options?: FetchOptions
): Promise<MockDrive> {
  return apiPatch<MockDrive>(`/admin/mock-drives/${ensureStringId(id, 'Mock Drive ID')}`, data, options);
}

export async function deleteMockDrive(id: string, options?: FetchOptions): Promise<ApiMessage> {
  return apiDelete<ApiMessage>(`/admin/mock-drives/${ensureStringId(id, 'Mock Drive ID')}`, options);
}

export async function publishMockDrive(id: string, options?: FetchOptions): Promise<MockDrive> {
  return apiPost<MockDrive>(`/admin/mock-drives/${ensureStringId(id, 'Mock Drive ID')}/publish`, undefined, options);
}

export async function unpublishMockDrive(id: string, options?: FetchOptions): Promise<MockDrive> {
  return apiPost<MockDrive>(`/admin/mock-drives/${ensureStringId(id, 'Mock Drive ID')}/unpublish`, undefined, options);
}

// ============================================================================
// ADMIN APIs - Question Generation
// ============================================================================

export async function generateMockDriveQuestions(
  mockDriveId: string,
  options?: FetchOptions
): Promise<GenerateQuestionsResponse> {
  return apiPost<GenerateQuestionsResponse>(
    `/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/generate-questions`,
    undefined,
    { ...options, timeout: 120000 }
  );
}

export async function regenerateMockDriveQuestions(
  mockDriveId: string,
  component: 'aptitude' | 'machine' | 'all',
  options?: FetchOptions
): Promise<ApiMessage> {
  return apiPost<ApiMessage>(
    `/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/regenerate-questions`,
    { component },
    { ...options, timeout: 120000 }
  );
}

export async function getMockDriveQuestionsPreview(
  mockDriveId: string,
  options?: FetchOptions
): Promise<QuestionPreviewResponse> {
  return apiGet<QuestionPreviewResponse>(
    `/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/questions-preview`,
    options
  );
}

// ============================================================================
// STUDENT APIs - Mock Drive Access
// ============================================================================

export async function getStudentMockDrives(
  params?: QueryMockDriveDto,
  options?: FetchOptions
): Promise<MockDriveWithRegistrationPaginatedResponse> {
  const response = await apiGetPaginated<MockDriveListItemWithRegistration>('/mock-drives', params, options);
  return transformPaginatedResponse(response, params);
}

export async function getStudentMockDrive(id: string, options?: FetchOptions): Promise<MockDriveWithRegistration> {
  return apiGet<MockDriveWithRegistration>(`/mock-drives/${ensureStringId(id, 'Mock Drive ID')}`, options);
}

// ============================================================================
// REGISTRATION APIs (Student)
// ============================================================================

export async function registerForMockDrive(
  mockDriveId: string,
  options?: FetchOptions
): Promise<RegistrationResponse> {
  return apiPost<RegistrationResponse>('/mock-drives/register', { mockDriveId: ensureStringId(mockDriveId, 'Mock Drive ID') }, options);
}

export async function cancelMockDriveRegistration(
  registrationId: string,
  options?: FetchOptions
): Promise<CancelRegistrationResponse> {
  return apiDelete<CancelRegistrationResponse>(`/mock-drives/registrations/${ensureStringId(registrationId, 'Registration ID')}`, options);
}

export async function getMyMockDriveRegistrations(options?: FetchOptions): Promise<MyMockDriveRegistration[]> {
  return apiGet<MyMockDriveRegistration[]>('/mock-drives/my-registrations', options);
}

export async function checkMockDriveEligibility(
  mockDriveId: string,
  options?: FetchOptions
): Promise<EligibilityCheckResponse> {
  return apiGet<EligibilityCheckResponse>(`/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/eligibility`, options);
}

export async function getMyBatch(mockDriveId: string, options?: FetchOptions): Promise<MockDriveBatch | null> {
  return apiGet<MockDriveBatch | null>(`/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/my-batch`, options);
}

// ============================================================================
// BATCH MANAGEMENT APIs (Admin)
// ============================================================================

export async function createMockDriveBatch(
  mockDriveId: string,
  data: CreateBatchDto,
  options?: FetchOptions
): Promise<MockDriveBatch> {
  return apiPost<MockDriveBatch>(`/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/batches`, data, options);
}

export async function getMockDriveBatches(mockDriveId: string, options?: FetchOptions): Promise<MockDriveBatchWithStudents[]> {
  return apiGet<MockDriveBatchWithStudents[]>(`/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/batches`, options);
}

export async function getUnassignedStudents(mockDriveId: string, options?: FetchOptions): Promise<UnassignedStudent[]> {
  return apiGet<UnassignedStudent[]>(`/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/batches/unassigned-students`, options);
}

export async function getMockDriveBatch(
  mockDriveId: string,
  batchId: string,
  options?: FetchOptions
): Promise<MockDriveBatchWithStudents> {
  return apiGet<MockDriveBatchWithStudents>(`/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/batches/${ensureStringId(batchId, 'Batch ID')}`, options);
}

export async function updateMockDriveBatch(
  mockDriveId: string,
  batchId: string,
  data: UpdateBatchDto,
  options?: FetchOptions
): Promise<MockDriveBatch> {
  return apiPatch<MockDriveBatch>(`/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/batches/${ensureStringId(batchId, 'Batch ID')}`, data, options);
}

export async function deleteMockDriveBatch(
  mockDriveId: string,
  batchId: string,
  options?: FetchOptions
): Promise<ApiMessage> {
  return apiDelete<ApiMessage>(`/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/batches/${ensureStringId(batchId, 'Batch ID')}`, options);
}

export async function assignStudentsToBatch(
  mockDriveId: string,
  batchId: string,
  data: AssignStudentsToBatchDto,
  options?: FetchOptions
): Promise<AssignStudentsResponse> {
  return apiPost<AssignStudentsResponse>(`/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/batches/${ensureStringId(batchId, 'Batch ID')}/assign-students`, data, options);
}

export async function removeStudentFromBatch(
  mockDriveId: string,
  batchId: string,
  studentId: string,
  options?: FetchOptions
): Promise<RemoveStudentResponse> {
  return apiDelete<RemoveStudentResponse>(`/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/batches/${ensureStringId(batchId, 'Batch ID')}/students/${ensureStringId(studentId, 'Student ID')}`, options);
}

// ============================================================================
// ATTEMPT APIs
// ============================================================================

export async function startMockDriveAttempt(mockDriveId: string, options?: FetchOptions): Promise<StartMockDriveAttemptResponse> {
  return apiPost<StartMockDriveAttemptResponse>(`/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/start`, undefined, options);
}

export async function getCurrentMockDriveAttempt(mockDriveId: string, options?: FetchOptions): Promise<MockDriveAttempt | null> {
  return apiGet<MockDriveAttempt | null>(`/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/attempt/current`, options);
}

export async function getMockDriveAttempt(attemptId: string, options?: FetchOptions): Promise<MockDriveAttempt> {
  return apiGet<MockDriveAttempt>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}`, options);
}

export async function getMyMockDriveAttempts(options?: FetchOptions): Promise<MockDriveAttempt[]> {
  return apiGet<MockDriveAttempt[]>('/mock-drives/my-attempts', options);
}

export async function getMockDriveAttemptProgress(attemptId: string, options?: FetchOptions): Promise<AttemptProgressResponse> {
  return apiGet<AttemptProgressResponse>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/progress`, options);
}

export async function completeMockDriveAttempt(
  attemptId: string,
  data?: CompleteAttemptDto,
  options?: FetchOptions
): Promise<CompleteAttemptResponse> {
  return apiPost<CompleteAttemptResponse>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/complete`, data || {}, options);
}

export async function abandonMockDriveAttempt(attemptId: string, options?: FetchOptions): Promise<ApiMessage> {
  return apiPost<ApiMessage>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/abandon`, undefined, options);
}

// ============================================================================
// APTITUDE TEST APIs
// ============================================================================

export async function startMockDriveAptitude(attemptId: string, options?: FetchOptions): Promise<StartAptitudeTestResponse> {
  return apiPost<StartAptitudeTestResponse>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/aptitude/start`, undefined, options);
}

export async function getMockDriveAptitude(
  attemptId: string,
  options?: FetchOptions
): Promise<StartAptitudeTestResponse | AptitudeResultsResponse> {
  return apiGet<StartAptitudeTestResponse | AptitudeResultsResponse>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/aptitude`, options);
}

export async function submitMockDriveAptitude(
  attemptId: string,
  data: SubmitAptitudeDto,
  options?: FetchOptions
): Promise<SubmitAptitudeTestResponse> {
  return apiPost<SubmitAptitudeTestResponse>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/aptitude/submit`, data, { ...options, timeout: 60000 });
}

export async function getMockDriveAptitudeResults(attemptId: string, options?: FetchOptions): Promise<AptitudeResultsResponse> {
  return apiGet<AptitudeResultsResponse>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/aptitude/results`, options);
}

export async function getMockDriveAptitudeStats(attemptId: string, options?: FetchOptions): Promise<AptitudeStatsResponse> {
  return apiGet<AptitudeStatsResponse>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/aptitude/stats`, options);
}

export async function getMockDriveAptitudeLeaderboard(attemptId: string, options?: FetchOptions): Promise<AptitudeLeaderboardResponse> {
  return apiGet<AptitudeLeaderboardResponse>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/aptitude/leaderboard`, options);
}

// ============================================================================
// MACHINE TEST APIs (AI-generated, string problemId)
// ============================================================================

export async function startMockDriveMachineTest(attemptId: string, options?: FetchOptions): Promise<StartMachineTestResponse> {
  return apiPost<StartMachineTestResponse>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/machine-test/start`, undefined, options);
}

export async function getMockDriveMachineTest(attemptId: string, options?: FetchOptions): Promise<MachineTestDetailsResponse> {
  return apiGet<MachineTestDetailsResponse>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/machine-test`, options);
}

export async function submitMockDriveMachineTestCode(
  attemptId: string,
  problemId: string, // CHANGED: cuid string
  data: SubmitCodeDto,
  options?: FetchOptions
): Promise<SubmitCodeResponse> {
  return apiPost<SubmitCodeResponse>(
    `/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/machine-test/submit/${ensureStringId(problemId, 'Problem ID')}`,
    data,
    { ...options, timeout: 60000 }
  );
}

export async function getMockDriveProblemSubmissions(
  attemptId: string,
  problemId: string, // CHANGED
  options?: FetchOptions
): Promise<ProblemSubmissionsResponse> {
  return apiGet<ProblemSubmissionsResponse>(
    `/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/machine-test/problem/${ensureStringId(problemId, 'Problem ID')}/submissions`,
    options
  );
}

export async function getMockDriveMachineTestSubmissions(attemptId: string, options?: FetchOptions): Promise<AllSubmissionsResponse> {
  return apiGet<AllSubmissionsResponse>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/machine-test/submissions`, options);
}

export async function completeMockDriveMachineTest(attemptId: string, options?: FetchOptions): Promise<ApiMessage> {
  return apiPost<ApiMessage>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/machine-test/complete`, undefined, options);
}

export async function getMockDriveMachineTestStats(attemptId: string, options?: FetchOptions): Promise<MachineTestStatsResponse> {
  return apiGet<MachineTestStatsResponse>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/machine-test/stats`, options);
}

export async function getMockDriveProblemLeaderboard(
  attemptId: string,
  problemId: string, // CHANGED
  options?: FetchOptions
): Promise<ProblemLeaderboardResponse> {
  return apiGet<ProblemLeaderboardResponse>(
    `/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/machine-test/problem/${ensureStringId(problemId, 'Problem ID')}/leaderboard`,
    options
  );
}

// ============================================================================
// AI INTERVIEW APIs
// ============================================================================

export async function startMockDriveAiInterview(
  attemptId: string,
  data: StartMockDriveInterviewDto,
  options?: FetchOptions
): Promise<StartMockDriveInterviewResponse> {
  return apiPost<StartMockDriveInterviewResponse>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/ai-interview/start`, data, options);
}

export async function getMockDriveAiInterviewSession(attemptId: string, options?: FetchOptions): Promise<InterviewSessionResponseDto> {
  return apiGet<InterviewSessionResponseDto>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/ai-interview/session`, options);
}

export async function submitMockDriveAiInterviewAnswer(
  attemptId: string,
  data: SubmitMockDriveAnswerDto,
  options?: FetchOptions
): Promise<InterviewAnswerResponse> {
  return apiPost<InterviewAnswerResponse>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/ai-interview/answer`, data, { ...options, timeout: 60000 });
}

export async function getMockDriveAiInterviewNextQuestion(attemptId: string, options?: FetchOptions): Promise<InterviewQuestionResponse> {
  return apiGet<InterviewQuestionResponse>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/ai-interview/next-question`, options);
}

export async function completeMockDriveAiInterview(attemptId: string, options?: FetchOptions): Promise<MockDriveInterviewFeedbackResponse> {
  return apiPost<MockDriveInterviewFeedbackResponse>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/ai-interview/complete`, undefined, { ...options, timeout: 60000 });
}

export async function getMockDriveAiInterviewFeedback(attemptId: string, options?: FetchOptions): Promise<MockDriveInterviewFeedbackResponse> {
  return apiGet<MockDriveInterviewFeedbackResponse>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/ai-interview/feedback`, options);
}

export async function getMockDriveAiInterviewProgress(attemptId: string, options?: FetchOptions): Promise<InterviewProgressResponse> {
  return apiGet<InterviewProgressResponse>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/ai-interview/progress`, options);
}

export async function getMockDriveAiInterviewStats(attemptId: string, options?: FetchOptions): Promise<InterviewStatsResponse> {
  return apiGet<InterviewStatsResponse>(`/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/ai-interview/stats`, options);
}

// ============================================================================
// RESULTS & RANKINGS APIs
// ============================================================================

export async function getMockDriveResult(attemptId: string, options?: FetchOptions): Promise<MockDriveResult> {
  return apiGet<MockDriveResult>(`/mock-drives/results/${ensureStringId(attemptId, 'Attempt ID')}`, options);
}

export async function getMyMockDriveResults(options?: FetchOptions): Promise<MockDriveResult[]> {
  return apiGet<MockDriveResult[]>('/mock-drives/my-results', options);
}

export async function getMockDriveLeaderboard(mockDriveId: string, options?: FetchOptions): Promise<MockDriveLeaderboard> {
  return apiGet<MockDriveLeaderboard>(`/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/leaderboard`, options);
}

export async function publishMockDriveRankings(mockDriveId: string, options?: FetchOptions): Promise<ApiMessage> {
  return apiPost<ApiMessage>(`/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/publish-rankings`, undefined, options);
}

// ============================================================================
// STATISTICS APIs
// ============================================================================

export async function getMockDriveStats(options?: FetchOptions): Promise<MockDriveStats> {
  return apiGet<MockDriveStats>('/admin/mock-drives/stats', options);
}

export async function getMockDriveAttemptStats(mockDriveId: string, options?: FetchOptions): Promise<MockDriveAttemptStats> {
  return apiGet<MockDriveAttemptStats>(`/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/stats`, options);
}

export async function getMockDriveRegistrations(
  mockDriveId: string,
  params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  },
  options?: FetchOptions
): Promise<AdminRegistrationsPaginatedResponse> {
  const response = await apiGetPaginated<AdminRegistrationListItem>(`/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/registrations`, params, options);
  return transformPaginatedResponse(response, params);
}

export async function getMockDriveAttempts(
  mockDriveId: string,
  params?: {
    page?: number;
    limit?: number;
    status?: string;
  },
  options?: FetchOptions
): Promise<AdminAttemptsPaginatedResponse> {
  const response = await apiGetPaginated<AdminAttemptListItem>(`/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/attempts`, params, options);
  return transformPaginatedResponse(response, params);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getMockDriveTimeStatus(drive: {
  registrationStartDate: string | Date;
  registrationEndDate: string | Date;
  driveStartDate: string | Date;
  driveEndDate: string | Date;
}): {
  status: 'upcoming' | 'registration_open' | 'registration_closed' | 'ongoing' | 'completed';
  message: string;
  canRegister: boolean;
  canAttempt: boolean;
} {
  const now = new Date();
  const regStart = new Date(drive.registrationStartDate);
  const regEnd = new Date(drive.registrationEndDate);
  const driveStart = new Date(drive.driveStartDate);
  const driveEnd = new Date(drive.driveEndDate);

  if (now < regStart) {
    return {
      status: 'upcoming',
      message: `Registration opens on ${regStart.toLocaleDateString()}`,
      canRegister: false,
      canAttempt: false,
    };
  }

  if (now >= regStart && now <= regEnd) {
    return {
      status: 'registration_open',
      message: `Registration closes on ${regEnd.toLocaleDateString()}`,
      canRegister: true,
      canAttempt: false,
    };
  }

  if (now > regEnd && now < driveStart) {
    return {
      status: 'registration_closed',
      message: `Mock drive starts on ${driveStart.toLocaleDateString()}`,
      canRegister: false,
      canAttempt: false,
    };
  }

  if (now >= driveStart && now <= driveEnd) {
    return {
      status: 'ongoing',
      message: `Mock drive ends on ${driveEnd.toLocaleDateString()}`,
      canRegister: false,
      canAttempt: true,
    };
  }

  return {
    status: 'completed',
    message: 'Mock drive has ended',
    canRegister: false,
    canAttempt: false,
  };
}

export function calculateTotalDuration(
  aptitudeConfig?: { durationMinutes: number } | null,
  machineTestConfig?: { durationMinutes: number } | null,
  aiInterviewConfig?: { durationMinutes: number } | null
): number {
  let total = 0;
  if (aptitudeConfig?.durationMinutes) total += aptitudeConfig.durationMinutes;
  if (machineTestConfig?.durationMinutes) total += machineTestConfig.durationMinutes;
  if (aiInterviewConfig?.durationMinutes) total += aiInterviewConfig.durationMinutes;
  return total;
}

export function formatDuration(minutes: number): string {
  if (minutes === 0) return '0 minutes';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  }

  if (mins === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
}

export function getRegistrationStatusColor(status: string): string {
  const colors: Record<string, string> = {
    REGISTERED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    BATCH_ASSIGNED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    DISQUALIFIED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
}

export function getAttemptStatusColor(status: string): string {
  const colors: Record<string, string> = {
    NOT_STARTED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    ABANDONED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    DISQUALIFIED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
}

export function canAttemptBasedOnBatch(
  batch: MockDriveBatch | null | undefined
): {
  canAttempt: boolean;
  message?: string;
} {
  if (!batch) {
    return {
      canAttempt: false,
      message: 'You have not been assigned to a batch yet',
    };
  }

  if (!batch.isActive) {
    return {
      canAttempt: false,
      message: 'Your batch is currently inactive',
    };
  }

  const now = new Date();
  const batchStart = new Date(batch.startTime);
  const batchEnd = new Date(batch.endTime);

  if (now < batchStart) {
    return {
      canAttempt: false,
      message: `Your batch starts at ${batchStart.toLocaleString()}`,
    };
  }

  if (now > batchEnd) {
    return {
      canAttempt: false,
      message: 'Your batch time has ended',
    };
  }

  return {
    canAttempt: true,
  };
}

export function getTimeUntilBatchStarts(batch: MockDriveBatch): number {
  const now = new Date();
  const batchStart = new Date(batch.startTime);
  return Math.max(0, batchStart.getTime() - now.getTime());
}

export function getRemainingBatchTime(batch: MockDriveBatch): number {
  const now = new Date();
  const batchEnd = new Date(batch.endTime);
  return Math.max(0, batchEnd.getTime() - now.getTime());
}

export function formatBatchTimeSlot(batch: MockDriveBatch): string {
  const startTime = new Date(batch.startTime);
  const endTime = new Date(batch.endTime);

  const dateStr = startTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const startTimeStr = startTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const endTimeStr = endTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${dateStr}, ${startTimeStr} - ${endTimeStr}`;
}

export function getBatchCapacityPercentage(batch: MockDriveBatch | MockDriveBatchWithStudents): number {
  if (!batch.maxStudents) return 0;
  const currentCount = batch._count?.students || 0;
  return Math.round((currentCount / batch.maxStudents) * 100);
}

export function getAvailableBatchSlots(batch: MockDriveBatch | MockDriveBatchWithStudents): number {
  if (!batch.maxStudents) return Infinity;
  const currentCount = batch._count?.students || 0;
  return Math.max(0, batch.maxStudents - currentCount);
}

export function isBatchFull(batch: MockDriveBatch | MockDriveBatchWithStudents): boolean {
  if (!batch.maxStudents) return false;
  return getAvailableBatchSlots(batch) === 0;
}

export function getBatchStatusText(batch: MockDriveBatch): string {
  if (!batch.isActive) return 'Inactive';

  const now = new Date();
  const batchStart = new Date(batch.startTime);
  const batchEnd = new Date(batch.endTime);

  if (now < batchStart) return 'Scheduled';
  if (now >= batchStart && now <= batchEnd) return 'Active';
  return 'Completed';
}

export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return 'Expired';

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes % 60} min`;
  }
  if (minutes > 0) {
    return `${minutes} min ${seconds % 60} sec`;
  }
  return `${seconds} sec`;
}

export function isAttemptWithinTime(attempt: MockDriveAttempt, totalDurationMinutes: number): boolean {
  if (!attempt.startedAt) return true;

  const now = new Date();
  const startedAt = new Date(attempt.startedAt);
  const elapsedMinutes = (now.getTime() - startedAt.getTime()) / (1000 * 60);

  return elapsedMinutes <= totalDurationMinutes;
}

export function getRemainingAttemptTime(attempt: MockDriveAttempt, totalDurationMinutes: number): number {
  if (!attempt.startedAt) return totalDurationMinutes * 60 * 1000;

  const now = new Date();
  const startedAt = new Date(attempt.startedAt);
  const endTime = new Date(startedAt.getTime() + totalDurationMinutes * 60 * 1000);

  return Math.max(0, endTime.getTime() - now.getTime());
}

export function canStartComponent(
  attempt: MockDriveAttempt,
  component: 'aptitude' | 'machineTest' | 'aiInterview'
): { canStart: boolean; reason?: string } {
  if (attempt.status !== 'IN_PROGRESS') {
    return {
      canStart: false,
      reason: 'Attempt is not in progress',
    };
  }

  const hasComponentStatus = (
    a: any
  ): a is MockDriveAttempt & {
    aptitudeStatus?: string;
    machineTestStatus?: string;
    aiInterviewStatus?: string;
  } => a !== null && typeof a === 'object';

  if (!hasComponentStatus(attempt)) {
    return { canStart: true };
  }

  const componentStatus = {
    aptitude: (attempt as any).aptitudeStatus,
    machineTest: (attempt as any).machineTestStatus,
    aiInterview: (attempt as any).aiInterviewStatus,
  }[component];

  if (componentStatus === 'COMPLETED') {
    return {
      canStart: false,
      reason: 'Component already completed',
    };
  }

  if (componentStatus === 'IN_PROGRESS') {
    return {
      canStart: true,
      reason: 'Resume in-progress component',
    };
  }

  return { canStart: true };
}