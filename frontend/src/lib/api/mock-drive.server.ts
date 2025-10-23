// Server-only API wrappers

import { serverGet, type ServerFetchOptions } from './server';
import type {
  MockDrive,
  MockDriveWithRegistration,
  QueryMockDriveDto,
  MockDrivePaginatedResponse,
  MockDriveWithRegistrationPaginatedResponse,
  MyMockDriveRegistration,
  MockDriveBatch,
  MockDriveBatchWithStudents,
  UnassignedStudent,
  MockDriveAttempt,
  MockDriveResult,
  MockDriveLeaderboard,
  MockDriveStats,
  MockDriveAttemptStats,
  EligibilityCheckResponse,
  AdminRegistrationsPaginatedResponse,
  AdminAttemptsPaginatedResponse,
  QuestionPreviewResponse,
  StartAptitudeTestResponse,
  AptitudeResultsResponse,
  AptitudeStatsResponse,
  AptitudeLeaderboardResponse,
  MachineTestDetailsResponse,
  MachineTestStatsResponse,
  InterviewSessionResponseDto,
  MockDriveInterviewFeedbackResponse,
  AttemptProgressResponse,
  ProblemLeaderboardResponse, // NEW: import from shared types (string problemId)
} from '@/types/mock-drive.types';

// ============================================================================
// TYPE DEFINITIONS FOR SERVER RESPONSES (aligned to backend)
// ============================================================================

export interface ProblemSubmission {
  id: string;
  problemId: string; // CHANGED: cuid (string)
  code: string;
  language: string;
  status:
    | 'PENDING'
    | 'PASS'
    | 'FAIL'
    | 'PARTIAL'
    | 'COMPILE_ERROR'
    | 'RUNTIME_ERROR'
    | 'TIMEOUT'
    | 'QUEUED';
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
  submissions: Record<string, ProblemSubmission[]>; // CHANGED: key is cuid
  totalSubmissions: number;
  problemsSolved: number;
  totalProblems: number;
}

export interface InterviewProgressResponse {
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestions: number;
  remainingTime: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface InterviewStatsResponse {
  totalQuestions: number;
  answeredQuestions: number;
  averageScore: number;
  technicalScore: number;
  behavioralScore: number;
  communicationScore: number;
  overallRating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'BELOW_AVERAGE' | 'POOR';
}

// ============================================================================
// HELPERS
// ============================================================================

function ensureStringId(id: string | null | undefined, label: string): string {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new Error(`${label} is required`);
  }
  return id;
}

/**
 * Build query string from parameters (supports arrays and Date)
 */
function buildQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((v) => queryParams.append(key, v instanceof Date ? v.toISOString() : String(v)));
    } else if (value instanceof Date) {
      queryParams.append(key, value.toISOString());
    } else {
      queryParams.append(key, String(value));
    }
  });

  const query = queryParams.toString();
  return query ? `?${query}` : '';
}

/**
 * Build endpoint with query string
 */
function buildEndpoint(basePath: string, params?: Record<string, any>): string {
  return `${basePath}${buildQueryString(params)}`;
}

// ============================================================================
// ADMIN APIs - Mock Drive CRUD (Server)
// ============================================================================

export async function getAdminMockDrivesServer(
  params?: QueryMockDriveDto,
  options?: ServerFetchOptions
): Promise<MockDrivePaginatedResponse> {
  const endpoint = buildEndpoint('/admin/mock-drives', params);
  return serverGet<MockDrivePaginatedResponse>(endpoint, options);
}

export async function getAdminMockDriveServer(
  id: string,
  options?: ServerFetchOptions
): Promise<MockDrive> {
  return serverGet<MockDrive>(`/admin/mock-drives/${ensureStringId(id, 'Mock Drive ID')}`, options);
}

// ============================================================================
// ADMIN APIs - Question Generation (Server-side)
// ============================================================================

export async function getMockDriveQuestionsPreviewServer(
  mockDriveId: string,
  options?: ServerFetchOptions
): Promise<QuestionPreviewResponse> {
  return serverGet<QuestionPreviewResponse>(
    `/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/questions-preview`,
    options
  );
}

// ============================================================================
// STUDENT APIs - Mock Drive Access (Server-side)
// ============================================================================

export async function getStudentMockDrivesServer(
  params?: QueryMockDriveDto,
  options?: ServerFetchOptions
): Promise<MockDriveWithRegistrationPaginatedResponse> {
  const endpoint = buildEndpoint('/mock-drives', params);
  return serverGet<MockDriveWithRegistrationPaginatedResponse>(endpoint, options);
}

export async function getStudentMockDriveServer(
  id: string,
  options?: ServerFetchOptions
): Promise<MockDriveWithRegistration> {
  return serverGet<MockDriveWithRegistration>(
    `/mock-drives/${ensureStringId(id, 'Mock Drive ID')}`,
    options
  );
}

// ============================================================================
// REGISTRATION APIs (Server)
// ============================================================================

export async function getMyMockDriveRegistrationsServer(
  options?: ServerFetchOptions
): Promise<MyMockDriveRegistration[]> {
  return serverGet<MyMockDriveRegistration[]>('/mock-drives/my-registrations', options);
}

export async function checkMockDriveEligibilityServer(
  mockDriveId: string,
  options?: ServerFetchOptions
): Promise<EligibilityCheckResponse> {
  return serverGet<EligibilityCheckResponse>(
    `/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/eligibility`,
    options
  );
}

export async function getMyBatchServer(
  mockDriveId: string,
  options?: ServerFetchOptions
): Promise<MockDriveBatch | null> {
  return serverGet<MockDriveBatch | null>(
    `/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/my-batch`,
    options
  );
}

export async function getMockDriveRegistrationsServer(
  mockDriveId: string,
  params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  },
  options?: ServerFetchOptions
): Promise<AdminRegistrationsPaginatedResponse> {
  const endpoint = buildEndpoint(
    `/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/registrations`,
    params
  );
  return serverGet<AdminRegistrationsPaginatedResponse>(endpoint, options);
}

// ============================================================================
// BATCH MANAGEMENT APIs (Server)
// ============================================================================

export async function getMockDriveBatchesServer(
  mockDriveId: string,
  options?: ServerFetchOptions
): Promise<MockDriveBatchWithStudents[]> {
  return serverGet<MockDriveBatchWithStudents[]>(
    `/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/batches`,
    options
  );
}

export async function getUnassignedStudentsServer(
  mockDriveId: string,
  options?: ServerFetchOptions
): Promise<UnassignedStudent[]> {
  return serverGet<UnassignedStudent[]>(
    `/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/batches/unassigned-students`,
    options
  );
}

export async function getMockDriveBatchServer(
  mockDriveId: string,
  batchId: string,
  options?: ServerFetchOptions
): Promise<MockDriveBatchWithStudents> {
  return serverGet<MockDriveBatchWithStudents>(
    `/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/batches/${ensureStringId(batchId, 'Batch ID')}`,
    options
  );
}

// ============================================================================
// ATTEMPT APIs (Server)
// ============================================================================

export async function getCurrentMockDriveAttemptServer(
  mockDriveId: string,
  options?: ServerFetchOptions
): Promise<MockDriveAttempt | null> {
  return serverGet<MockDriveAttempt | null>(
    `/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/attempt/current`,
    options
  );
}

export async function getMockDriveAttemptServer(
  attemptId: string,
  options?: ServerFetchOptions
): Promise<MockDriveAttempt> {
  return serverGet<MockDriveAttempt>(
    `/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}`,
    options
  );
}

export async function getMyMockDriveAttemptsServer(
  options?: ServerFetchOptions
): Promise<MockDriveAttempt[]> {
  return serverGet<MockDriveAttempt[]>('/mock-drives/my-attempts', options);
}

export async function getMockDriveAttemptProgressServer(
  attemptId: string,
  options?: ServerFetchOptions
): Promise<AttemptProgressResponse> {
  return serverGet<AttemptProgressResponse>(
    `/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/progress`,
    options
  );
}

export async function getMockDriveAttemptsServer(
  mockDriveId: string,
  params?: {
    page?: number;
    limit?: number;
    status?: string;
  },
  options?: ServerFetchOptions
): Promise<AdminAttemptsPaginatedResponse> {
  const endpoint = buildEndpoint(
    `/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/attempts`,
    params
  );
  return serverGet<AdminAttemptsPaginatedResponse>(endpoint, options);
}

// ============================================================================
// APTITUDE TEST APIs (Server)
// ============================================================================

export async function getMockDriveAptitudeServer(
  attemptId: string,
  options?: ServerFetchOptions
): Promise<StartAptitudeTestResponse | AptitudeResultsResponse> {
  return serverGet<StartAptitudeTestResponse | AptitudeResultsResponse>(
    `/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/aptitude`,
    options
  );
}

export async function getMockDriveAptitudeResultsServer(
  attemptId: string,
  options?: ServerFetchOptions
): Promise<AptitudeResultsResponse> {
  return serverGet<AptitudeResultsResponse>(
    `/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/aptitude/results`,
    options
  );
}

export async function getMockDriveAptitudeStatsServer(
  attemptId: string,
  options?: ServerFetchOptions
): Promise<AptitudeStatsResponse> {
  return serverGet<AptitudeStatsResponse>(
    `/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/aptitude/stats`,
    options
  );
}

export async function getMockDriveAptitudeLeaderboardServer(
  attemptId: string,
  options?: ServerFetchOptions
): Promise<AptitudeLeaderboardResponse> {
  return serverGet<AptitudeLeaderboardResponse>(
    `/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/aptitude/leaderboard`,
    options
  );
}

// ============================================================================
// MACHINE TEST APIs (Server) - AI generated, string problemId
// ============================================================================

export async function getMockDriveMachineTestServer(
  attemptId: string,
  options?: ServerFetchOptions
): Promise<MachineTestDetailsResponse> {
  return serverGet<MachineTestDetailsResponse>(
    `/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/machine-test`,
    options
  );
}

export async function getMockDriveProblemSubmissionsServer(
  attemptId: string,
  problemId: string, // CHANGED
  options?: ServerFetchOptions
): Promise<ProblemSubmissionsResponse> {
  return serverGet<ProblemSubmissionsResponse>(
    `/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/machine-test/problem/${ensureStringId(
      problemId,
      'Problem ID'
    )}/submissions`,
    options
  );
}

export async function getMockDriveMachineTestSubmissionsServer(
  attemptId: string,
  options?: ServerFetchOptions
): Promise<AllSubmissionsResponse> {
  return serverGet<AllSubmissionsResponse>(
    `/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/machine-test/submissions`,
    options
  );
}

export async function getMockDriveMachineTestStatsServer(
  attemptId: string,
  options?: ServerFetchOptions
): Promise<MachineTestStatsResponse> {
  return serverGet<MachineTestStatsResponse>(
    `/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/machine-test/stats`,
    options
  );
}

export async function getMockDriveProblemLeaderboardServer(
  attemptId: string,
  problemId: string, // CHANGED
  options?: ServerFetchOptions
): Promise<ProblemLeaderboardResponse> {
  return serverGet<ProblemLeaderboardResponse>(
    `/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/machine-test/problem/${ensureStringId(
      problemId,
      'Problem ID'
    )}/leaderboard`,
    options
  );
}

// ============================================================================
// AI INTERVIEW APIs (Server)
// ============================================================================

export async function getMockDriveAiInterviewSessionServer(
  attemptId: string,
  options?: ServerFetchOptions
): Promise<InterviewSessionResponseDto> {
  return serverGet<InterviewSessionResponseDto>(
    `/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/ai-interview/session`,
    options
  );
}

export async function getMockDriveAiInterviewFeedbackServer(
  attemptId: string,
  options?: ServerFetchOptions
): Promise<MockDriveInterviewFeedbackResponse> {
  return serverGet<MockDriveInterviewFeedbackResponse>(
    `/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/ai-interview/feedback`,
    options
  );
}

export async function getMockDriveAiInterviewProgressServer(
  attemptId: string,
  options?: ServerFetchOptions
): Promise<InterviewProgressResponse> {
  return serverGet<InterviewProgressResponse>(
    `/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/ai-interview/progress`,
    options
  );
}

export async function getMockDriveAiInterviewStatsServer(
  attemptId: string,
  options?: ServerFetchOptions
): Promise<InterviewStatsResponse> {
  return serverGet<InterviewStatsResponse>(
    `/mock-drives/attempts/${ensureStringId(attemptId, 'Attempt ID')}/ai-interview/stats`,
    options
  );
}

// ============================================================================
// RESULTS & RANKINGS APIs (Server)
// ============================================================================

export async function getMockDriveResultServer(
  attemptId: string,
  options?: ServerFetchOptions
): Promise<MockDriveResult> {
  return serverGet<MockDriveResult>(
    `/mock-drives/results/${ensureStringId(attemptId, 'Attempt ID')}`,
    options
  );
}

export async function getMyMockDriveResultsServer(
  options?: ServerFetchOptions
): Promise<MockDriveResult[]> {
  return serverGet<MockDriveResult[]>('/mock-drives/my-results', options);
}

export async function getMockDriveLeaderboardServer(
  mockDriveId: string,
  options?: ServerFetchOptions
): Promise<MockDriveLeaderboard> {
  return serverGet<MockDriveLeaderboard>(
    `/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/leaderboard`,
    options
  );
}

// ============================================================================
// STATISTICS APIs (Server)
// ============================================================================

export async function getMockDriveStatsServer(
  options?: ServerFetchOptions
): Promise<MockDriveStats> {
  return serverGet<MockDriveStats>('/admin/mock-drives/stats', options);
}

export async function getMockDriveAttemptStatsServer(
  mockDriveId: string,
  options?: ServerFetchOptions
): Promise<MockDriveAttemptStats> {
  return serverGet<MockDriveAttemptStats>(
    `/admin/mock-drives/${ensureStringId(mockDriveId, 'Mock Drive ID')}/stats`,
    options
  );
}