'use client';

import { apiFetch } from './client';
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
  AiInterviewQuestionCategory,
} from '@/types/aiInterview.types';

// ============= Session Management =============

/**
 * Start a new AI interview session
 */
export const startInterviewSession = async (
  data: StartInterviewSessionRequest,
): Promise<InterviewSessionResponse> => {
  console.log('[startInterviewSession] Sending request:', data);
  const response = await apiFetch<InterviewSessionResponse>(
    '/practice/ai-interview/start',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
  console.log('[startInterviewSession] Response:', response);
  return response;
};

/**
 * Get interview session details
 */
export const getInterviewSession = async (
  sessionId: string,
): Promise<SessionStateResponse> => {
  console.log('[getInterviewSession] Fetching session:', sessionId);
  const response = await apiFetch<SessionStateResponse>(
    `/practice/ai-interview/${sessionId}`,
    {
      method: 'GET',
    },
  );
  console.log('[getInterviewSession] Response:', response);
  return response;
};

/**
 * Get all interview sessions for the current user
 */
export const getUserSessions = async (): Promise<UserSessionSummary[]> => {
  console.log('[getUserSessions] Fetching all user sessions');
  const response = await apiFetch<UserSessionSummary[]>(
    '/practice/ai-interview',
    {
      method: 'GET',
    },
  );
  console.log('[getUserSessions] Response:', response);
  return response;
};

/**
 * Get user session statistics
 */
export const getUserSessionStats = async (): Promise<SessionStatsResponse> => {
  console.log('[getUserSessionStats] Fetching user stats');
  const response = await apiFetch<SessionStatsResponse>(
    '/practice/ai-interview/stats',
    {
      method: 'GET',
    },
  );
  console.log('[getUserSessionStats] Response:', response);
  return response;
};

/**
 * Cancel an active interview session
 */
export const cancelInterviewSession = async (
  sessionId: string,
): Promise<void> => {
  console.log('[cancelInterviewSession] Cancelling session:', sessionId);
  await apiFetch<void>(`/practice/ai-interview/${sessionId}/cancel`, {
    method: 'POST',
  });
  console.log('[cancelInterviewSession] Session cancelled successfully');
};

/**
 * Delete an interview session
 */
export const deleteInterviewSession = async (
  sessionId: string,
): Promise<void> => {
  console.log('[deleteInterviewSession] Deleting session:', sessionId);
  await apiFetch<void>(`/practice/ai-interview/${sessionId}`, {
    method: 'DELETE',
  });
  console.log('[deleteInterviewSession] Session deleted successfully');
};

// ============= Question Management =============

/**
 * Get the next interview question
 */
export const getNextQuestion = async (
  sessionId: string,
): Promise<NextQuestionResponse | QuestionCompletionResponse> => {
  console.log('[getNextQuestion] Fetching next question for session:', sessionId);
  const response = await apiFetch<NextQuestionResponse | QuestionCompletionResponse>(
    `/practice/ai-interview/${sessionId}/next`,
    {
      method: 'GET',
    },
  );
  console.log('[getNextQuestion] Response:', response);
  return response;
};

// ============= Answer Submission =============

/**
 * Submit an answer for the current interview question
 */
export const submitInterviewAnswer = async (
  sessionId: string,
  answerData: SubmitAnswerRequest,
): Promise<SubmitAnswerResponse> => {
  console.log('[submitInterviewAnswer] Submitting answer for session:', sessionId, answerData);
  
  const response = await apiFetch<SubmitAnswerResponse>(
    `/practice/ai-interview/${sessionId}/answer`,
    {
      method: 'POST',
      body: JSON.stringify(answerData),
    },
  );
  
  console.log('[submitInterviewAnswer] Response:', response);
  return response;
};

// ============= Feedback =============

/**
 * Get feedback for a completed interview session
 */
export const getInterviewFeedback = async (
  sessionId: string,
): Promise<InterviewFeedbackResponse> => {
  console.log('[getInterviewFeedback] Fetching feedback for session:', sessionId);
  const response = await apiFetch<InterviewFeedbackResponse>(
    `/practice/ai-interview/${sessionId}/feedback`,
    {
      method: 'GET',
    },
  );
  console.log('[getInterviewFeedback] Response:', response);
  return response;
};

// ============= Helper Functions =============

/**
 * Check if a session is complete
 */
export const isSessionComplete = (
  response: NextQuestionResponse | QuestionCompletionResponse,
): response is QuestionCompletionResponse => {
  return 'isComplete' in response && response.isComplete === true;
};

/**
 * Create answer request with proper typing
 */
export const createAnswerRequest = (
  question: string,
  category: AiInterviewQuestionCategory,
  answer: string,
  timeTakenSeconds?: number,
  isTranscribed?: boolean,
): SubmitAnswerRequest => {
  return {
    category,
    question,
    answer,
    timeTakenSeconds,
    isTranscribed: isTranscribed || false,
  };
};

/**
 * Validate answer before submission
 */
export const validateAnswer = (answer: string): { valid: boolean; error?: string } => {
  if (!answer || answer.trim().length === 0) {
    return { valid: false, error: 'Answer cannot be empty' };
  }
  
  if (answer.trim().length < 10) {
    return { valid: false, error: 'Answer must be at least 10 characters' };
  }
  
  if (answer.trim().length > 5000) {
    return { valid: false, error: 'Answer must be less than 5000 characters' };
  }
  
  return { valid: true };
};
export const getInterviewFeedbackById = async (
  feedbackId: string
): Promise<InterviewFeedbackResponse> => {
  console.log('[getInterviewFeedbackById] Fetching feedback:', feedbackId);
  const response = await apiFetch<InterviewFeedbackResponse>(
    `/practice/ai-interview/feedback/${feedbackId}`,
    {
      method: 'GET',
    }
  );
  console.log('[getInterviewFeedbackById] Response:', response);
  return response;
};
// ============= Export all functions =============
export default {
  startInterviewSession,
  getInterviewSession,
  getUserSessions,
  getUserSessionStats,
  cancelInterviewSession,
  deleteInterviewSession,
  getNextQuestion,
  submitInterviewAnswer,
  getInterviewFeedback,
  isSessionComplete,
  createAnswerRequest,
  validateAnswer,
};