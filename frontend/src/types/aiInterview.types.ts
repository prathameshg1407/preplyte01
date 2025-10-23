// ============= Enums =============
export enum AiInterviewSessionStatus {
    STARTED = 'STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
  }
  
  export enum AiInterviewQuestionCategory {
    INTRODUCTORY = 'INTRODUCTORY',
    TECHNICAL = 'TECHNICAL',
    PROJECT_BASED = 'PROJECT_BASED',
    BEHAVIORAL = 'BEHAVIORAL',
    SITUATIONAL = 'SITUATIONAL',
    CLOSING = 'CLOSING',
  }
  
  // ============= Request Types =============
  export interface StartInterviewSessionRequest {
    resumeId?: number;
    jobTitle?: string;
    companyName?: string;
  }
  
  export interface SubmitAnswerRequest {
    category: AiInterviewQuestionCategory;
    question: string;
    answer: string;
    timeTakenSeconds?: number;
    isTranscribed?: boolean;
  }
  
  // ============= Common Types =============
  export interface Question {
    category: AiInterviewQuestionCategory;
    text: string;
  }
  
  export interface QuestionItem {
    category: string;
    text: string;
  }
  
  export interface ResponseScore {
    contentScore: number;
    fluencyScore: number;
    relevanceScore: number;
    feedback: string;
  }
  
  // ============= Response Types =============
  export interface InterviewSessionResponse {
    id: string;
    userId: string;
    questions: QuestionItem[];
    currentQuestionIndex: number;
    currentQuestion: QuestionItem;
    audioUrl: string;
    createdAt: string | Date;
  }
  
  export interface SessionStateResponse {
    id: string;
    userId: string;
    questions: QuestionItem[];
    currentQuestion: QuestionItem;
    audioUrl: string;
    currentQuestionIndex: number;
    responses?: InterviewResponse[];
    resume?: {
      id: number;
      fileName: string;
    } | null;
  }
  
  export interface NextQuestionResponse {
    question: string;
    category: string;
    index: number;
    audioUrl: string;
    totalQuestions: number;
  }
  
  export interface QuestionCompletionResponse {
    isComplete: boolean;
    message: string;
    audioUrl?: string;
  }
  
  export interface SubmitAnswerResponse {
    nextQuestion?: {
      category: string;
      text: string;
    };
    isComplete: boolean;
    message?: string;
    audioUrl: string;
  }
  
  export interface InterviewFeedbackResponse {
    overallSummary: string;
    overallScore: number;
    keyStrengths: string[];
    areasForImprovement: string[];
    weakSections: string[];
    perResponseScores: ResponseScore[];
  }
  
  export interface UserSessionSummary {
    id: string;
    jobTitle: string;
    companyName: string | null;
    resumeId: number | null;
    status: AiInterviewSessionStatus;
    totalQuestions: number;
    answeredQuestions: number;
    currentQuestionIndex: number;
    overallScore: number | null;
    createdAt: string | Date;
    completedAt: string | Date | null;
    hasFeedback: boolean;
  }
  
  export interface SessionStatsResponse {
    totalSessions: number;
    completedSessions: number;
    inProgressSessions: number;
    averageScore: number;
    totalQuestionsAnswered: number;
  }
  
  // ============= Internal Types (for responses stored in DB) =============
  export interface InterviewResponse {
    id: string;
    sessionId: string;
    category: AiInterviewQuestionCategory;
    question: string;
    answer: string;
    isFollowup: boolean;
    scoresJson: ResponseScore;
    feedbackText: string;
    timeTakenSeconds: number | null;
    createdAt: string | Date;
  }
  
  export interface InterviewSession {
    id: string;
    userId: string;
    resumeId: number | null;
    jobTitle: string;
    companyName: string | null;
    questions: {
      questions: Question[];
    };
    totalQuestions: number;
    currentQuestionIndex: number;
    status: AiInterviewSessionStatus;
    createdAt: string | Date;
    completedAt: string | Date | null;
  }
  
  export interface InterviewFeedback {
    id: string;
    sessionId: string;
    userId: string;
    overallScore: number;
    overallSummary: string;
    keyStrengths: string[];
    areasForImprovement: string[];
    feedbackJson: {
      weakSections: string[];
      perResponseScores: ResponseScore[];
      [key: string]: any;
    };
    createdAt: string | Date;
    updatedAt: string | Date;
  }
  
  // ============= UI State Types =============
  export interface InterviewState {
    session: InterviewSession | null;
    currentQuestion: Question | null;
    currentQuestionIndex: number;
    answers: Map<number, SubmitAnswerRequest>;
    isLoading: boolean;
    error: string | null;
    audioUrl: string | null;
  }
  
  export interface FeedbackState {
    feedback: InterviewFeedbackResponse | null;
    isLoading: boolean;
    error: string | null;
  }
  
  export interface SessionsState {
    sessions: UserSessionSummary[];
    stats: SessionStatsResponse | null;
    isLoading: boolean;
    error: string | null;
    currentPage: number;
    totalPages: number;
  }
  
  // ============= Error Types =============
  export interface ApiError {
    statusCode: number;
    message: string;
    error?: string;
    timestamp?: string;
    path?: string;
  }
  
  // ============= Utility Types =============
  export type QuestionCategoryLabel = {
    [key in AiInterviewQuestionCategory]: string;
  };
  
  export type QuestionCategoryColor = {
    [key in AiInterviewQuestionCategory]: string;
  };
  
  export type QuestionCategoryIcon = {
    [key in AiInterviewQuestionCategory]: string;
  };
  
  // ============= Constants =============
  export const QUESTION_CATEGORY_LABELS: QuestionCategoryLabel = {
    [AiInterviewQuestionCategory.INTRODUCTORY]: 'Introduction',
    [AiInterviewQuestionCategory.TECHNICAL]: 'Technical',
    [AiInterviewQuestionCategory.PROJECT_BASED]: 'Project Based',
    [AiInterviewQuestionCategory.BEHAVIORAL]: 'Behavioral',
    [AiInterviewQuestionCategory.SITUATIONAL]: 'Situational',
    [AiInterviewQuestionCategory.CLOSING]: 'Closing',
  };
  
  export const QUESTION_CATEGORY_COLORS: QuestionCategoryColor = {
    [AiInterviewQuestionCategory.INTRODUCTORY]: '#3B82F6', // blue
    [AiInterviewQuestionCategory.TECHNICAL]: '#8B5CF6', // purple
    [AiInterviewQuestionCategory.PROJECT_BASED]: '#10B981', // green
    [AiInterviewQuestionCategory.BEHAVIORAL]: '#F59E0B', // amber
    [AiInterviewQuestionCategory.SITUATIONAL]: '#EF4444', // red
    [AiInterviewQuestionCategory.CLOSING]: '#6366F1', // indigo
  };
  
  export const SESSION_STATUS_LABELS: Record<AiInterviewSessionStatus, string> = {
    [AiInterviewSessionStatus.STARTED]: 'Started',
    [AiInterviewSessionStatus.IN_PROGRESS]: 'In Progress',
    [AiInterviewSessionStatus.COMPLETED]: 'Completed',
  };
  
  export const SESSION_STATUS_COLORS: Record<AiInterviewSessionStatus, string> = {
    [AiInterviewSessionStatus.STARTED]: '#3B82F6', // blue
    [AiInterviewSessionStatus.IN_PROGRESS]: '#F59E0B', // amber
    [AiInterviewSessionStatus.COMPLETED]: '#10B981', // green
  };
  
  // ============= Type Guards =============
  export const isQuestionCompletionResponse = (
    response: NextQuestionResponse | QuestionCompletionResponse
  ): response is QuestionCompletionResponse => {
    return 'isComplete' in response && response.isComplete === true;
  };
  
  export const isNextQuestionResponse = (
    response: NextQuestionResponse | QuestionCompletionResponse
  ): response is NextQuestionResponse => {
    return 'question' in response;
  };
  
  export const isApiError = (error: any): error is ApiError => {
    return error && typeof error.statusCode === 'number' && typeof error.message === 'string';
  };
  
  // ============= Helper Types =============
  export interface PaginationParams {
    page: number;
    limit: number;
  }
  
  export interface SortParams {
    sortBy: 'createdAt' | 'completedAt' | 'overallScore';
    sortOrder: 'asc' | 'desc';
  }
  
  export interface FilterParams {
    status?: AiInterviewSessionStatus;
    jobTitle?: string;
    dateFrom?: string;
    dateTo?: string;
  }
  
  export interface SessionFilters extends PaginationParams, Partial<SortParams>, FilterParams {}
  
  // ============= Form Types =============
  export interface StartInterviewFormData {
    resumeId?: number;
    jobTitle: string;
    companyName: string;
  }
  
  export interface AnswerFormData {
    answer: string;
    isVoiceRecorded: boolean;
  }
  
  // ============= Audio Types =============
  export interface AudioPlayerState {
    isPlaying: boolean;
    isPaused: boolean;
    duration: number;
    currentTime: number;
    volume: number;
  }
  
  export interface VoiceRecordingState {
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    audioBlob: Blob | null;
    transcription: string | null;
  }
  
  // ============= Score Types =============
  export interface ScoreBreakdown {
    content: {
      score: number;
      label: string;
      color: string;
    };
    fluency: {
      score: number;
      label: string;
      color: string;
    };
    relevance: {
      score: number;
      label: string;
      color: string;
    };
    overall: {
      score: number;
      label: string;
      color: string;
    };
  }
  
  export interface ScoreLevel {
    min: number;
    max: number;
    label: string;
    color: string;
    description: string;
  }
  
  // ============= Chart Data Types =============
  export interface PerformanceChartData {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
    }[];
  }
  
  export interface CategoryPerformanceData {
    category: AiInterviewQuestionCategory;
    averageScore: number;
    questionCount: number;
  }
  
  export interface SessionProgressData {
    questionIndex: number;
    contentScore: number;
    fluencyScore: number;
    relevanceScore: number;
  }
  
  // ============= Notification Types =============
  export interface InterviewNotification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
    timestamp: Date;
  }
  
 