import { serverGet, serverPost, serverDelete } from './server';
import {
  StartInterviewSessionRequest,
  SubmitAnswerRequest,
  InterviewSessionResponse,
  SubmitAnswerResponse,
  InterviewFeedbackResponse,
  SessionStateResponse,
  NextQuestionResponse,
  QuestionCompletionResponse,
  UserSessionSummary,
  SessionStatsResponse,
} from '@/types/aiInterview.types';

// ============= Session Management =============

/**
 * Start a new AI interview session (server-side)
 */
export const startInterviewSessionServer = async (
  data: StartInterviewSessionRequest,
): Promise<InterviewSessionResponse> => {
  console.log('[Server] startInterviewSession:', data);
  return serverPost<InterviewSessionResponse>('/practice/ai-interview/start', data);
};

/**
 * Get interview session details (server-side)
 */
export const getInterviewSessionServer = async (
  sessionId: string,
): Promise<SessionStateResponse> => {
  console.log('[Server] getInterviewSession:', sessionId);
  return serverGet<SessionStateResponse>(`/practice/ai-interview/${sessionId}`);
};

/**
 * Get all interview sessions for the current user (server-side)
 */
export const getUserSessionsServer = async (): Promise<UserSessionSummary[]> => {
  console.log('[Server] getUserSessions');
  return serverGet<UserSessionSummary[]>('/practice/ai-interview');
};

/**
 * Get user session statistics (server-side)
 */
export const getUserSessionStatsServer = async (): Promise<SessionStatsResponse> => {
  console.log('[Server] getUserSessionStats');
  return serverGet<SessionStatsResponse>('/practice/ai-interview/stats');
};

/**
 * Cancel an active interview session (server-side)
 */
export const cancelInterviewSessionServer = async (
  sessionId: string,
): Promise<void> => {
  console.log('[Server] cancelInterviewSession:', sessionId);
  return serverPost<void>(`/practice/ai-interview/${sessionId}/cancel`, {});
};

/**
 * Delete an interview session (server-side)
 */
export const deleteInterviewSessionServer = async (
  sessionId: string,
): Promise<void> => {
  console.log('[Server] deleteInterviewSession:', sessionId);
  return serverDelete<void>(`/practice/ai-interview/${sessionId}`);
};

// ============= Question Management =============

/**
 * Get the next interview question (server-side)
 */
export const getNextQuestionServer = async (
  sessionId: string,
): Promise<NextQuestionResponse | QuestionCompletionResponse> => {
  console.log('[Server] getNextQuestion:', sessionId);
  return serverGet<NextQuestionResponse | QuestionCompletionResponse>(
    `/practice/ai-interview/${sessionId}/next`,
  );
};

// ============= Answer Submission =============

/**
 * Submit an answer for the current interview question (server-side)
 */
export const submitInterviewAnswerServer = async (
  sessionId: string,
  answerData: SubmitAnswerRequest,
): Promise<SubmitAnswerResponse> => {
  console.log('[Server] submitInterviewAnswer:', sessionId, answerData);
  return serverPost<SubmitAnswerResponse>(
    `/practice/ai-interview/${sessionId}/answer`,
    answerData,
  );
};

// ============= Feedback =============

/**
 * Get feedback for a completed interview session (server-side)
 */
export const getInterviewFeedbackServer = async (
  sessionId: string,
): Promise<InterviewFeedbackResponse> => {
  console.log('[Server] getInterviewFeedback:', sessionId);
  return serverGet<InterviewFeedbackResponse>(
    `/practice/ai-interview/${sessionId}/feedback`,
  );
};

// ============= Batch Operations =============

/**
 * Get session with feedback (if available) - server-side
 */
export const getSessionWithFeedbackServer = async (
  sessionId: string,
): Promise<{
  session: SessionStateResponse;
  feedback?: InterviewFeedbackResponse;
}> => {
  console.log('[Server] getSessionWithFeedback:', sessionId);
  
  const session = await getInterviewSessionServer(sessionId);
  
  // Only fetch feedback if session is completed
  let feedback: InterviewFeedbackResponse | undefined;
  try {
    feedback = await getInterviewFeedbackServer(sessionId);
  } catch (error) {
    console.log('[Server] No feedback available yet');
  }
  
  return { session, feedback };
};

/**
 * Get user dashboard data (sessions + stats) - server-side
 */
export const getUserDashboardDataServer = async (): Promise<{
  sessions: UserSessionSummary[];
  stats: SessionStatsResponse;
}> => {
  console.log('[Server] getUserDashboardData');
  
  const [sessions, stats] = await Promise.all([
    getUserSessionsServer(),
    getUserSessionStatsServer(),
  ]);
  
  return { sessions, stats };
};
export const getInterviewFeedbackByIdServer = async (
    feedbackId: string
  ): Promise<InterviewFeedbackResponse> => {
    console.log('[Server] getInterviewFeedbackById:', feedbackId);
    return serverGet<InterviewFeedbackResponse>(
      `/practice/ai-interview/feedback/${feedbackId}`
    );
  };
// ============= Export all functions =============
export default {
  startInterviewSessionServer,
  getInterviewSessionServer,
  getUserSessionsServer,
  getUserSessionStatsServer,
  cancelInterviewSessionServer,
  deleteInterviewSessionServer,
  getNextQuestionServer,
  submitInterviewAnswerServer,
  getInterviewFeedbackServer,
  getSessionWithFeedbackServer,
  getUserDashboardDataServer,
};