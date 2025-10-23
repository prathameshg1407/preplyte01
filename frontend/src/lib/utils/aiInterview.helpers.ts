import {
    AiInterviewQuestionCategory,
    AiInterviewSessionStatus,
    QUESTION_CATEGORY_COLORS,
    QUESTION_CATEGORY_LABELS,
    ScoreBreakdown,
    ScoreLevel,
    ResponseScore,
    UserSessionSummary,
  } from '@/types/aiInterview.types';
  
  // ============= Score Helpers =============
  export const SCORE_LEVELS: ScoreLevel[] = [
    {
      min: 0,
      max: 3,
      label: 'Needs Improvement',
      color: '#EF4444',
      description: 'Significant improvement needed',
    },
    {
      min: 4,
      max: 5,
      label: 'Below Average',
      color: '#F59E0B',
      description: 'Below expected level',
    },
    {
      min: 6,
      max: 7,
      label: 'Average',
      color: '#3B82F6',
      description: 'Meets basic expectations',
    },
    {
      min: 8,
      max: 9,
      label: 'Good',
      color: '#10B981',
      description: 'Above average performance',
    },
    {
      min: 10,
      max: 10,
      label: 'Excellent',
      color: '#8B5CF6',
      description: 'Outstanding performance',
    },
  ];
  
  export const getScoreLevel = (score: number): ScoreLevel => {
    return (
      SCORE_LEVELS.find((level) => score >= level.min && score <= level.max) ||
      SCORE_LEVELS[0]
    );
  };
  
  export const getScoreColor = (score: number): string => {
    return getScoreLevel(score).color;
  };
  
  export const getScoreLabel = (score: number): string => {
    return getScoreLevel(score).label;
  };
  
  export const normalizeScore = (score: number, outOf: number = 10): number => {
    return Math.round((score / outOf) * 100);
  };
  
  export const getScoreBreakdown = (score: ResponseScore): ScoreBreakdown => {
    const overallScore = Math.round(
      (score.contentScore + score.fluencyScore + score.relevanceScore) / 3
    );
  
    return {
      content: {
        score: score.contentScore,
        label: getScoreLabel(score.contentScore),
        color: getScoreColor(score.contentScore),
      },
      fluency: {
        score: score.fluencyScore,
        label: getScoreLabel(score.fluencyScore),
        color: getScoreColor(score.fluencyScore),
      },
      relevance: {
        score: score.relevanceScore,
        label: getScoreLabel(score.relevanceScore),
        color: getScoreColor(score.relevanceScore),
      },
      overall: {
        score: overallScore,
        label: getScoreLabel(overallScore),
        color: getScoreColor(overallScore),
      },
    };
  };
  
  // ============= Category Helpers =============
  export const getCategoryLabel = (category: AiInterviewQuestionCategory): string => {
    return QUESTION_CATEGORY_LABELS[category] || category;
  };
  
  export const getCategoryColor = (category: AiInterviewQuestionCategory): string => {
    return QUESTION_CATEGORY_COLORS[category] || '#6B7280';
  };
  
  export const getCategoryIcon = (category: AiInterviewQuestionCategory): string => {
    const icons = {
      [AiInterviewQuestionCategory.INTRODUCTORY]: '👋',
      [AiInterviewQuestionCategory.TECHNICAL]: '💻',
      [AiInterviewQuestionCategory.PROJECT_BASED]: '🚀',
      [AiInterviewQuestionCategory.BEHAVIORAL]: '🧠',
      [AiInterviewQuestionCategory.SITUATIONAL]: '🎯',
      [AiInterviewQuestionCategory.CLOSING]: '✅',
    };
    return icons[category] || '❓';
  };
  
  // ============= Session Helpers =============
  export const getSessionProgress = (session: UserSessionSummary): number => {
    if (session.totalQuestions === 0) return 0;
    return Math.round((session.answeredQuestions / session.totalQuestions) * 100);
  };
  
  export const getSessionDuration = (session: UserSessionSummary): string => {
    if (!session.completedAt) return 'In Progress';
    
    const start = new Date(session.createdAt);
    const end = new Date(session.completedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };
  
  export const getSessionStatusBadge = (status: AiInterviewSessionStatus) => {
    const badges = {
      [AiInterviewSessionStatus.STARTED]: {
        label: 'Started',
        color: 'bg-blue-100 text-blue-800',
      },
      [AiInterviewSessionStatus.IN_PROGRESS]: {
        label: 'In Progress',
        color: 'bg-amber-100 text-amber-800',
      },
      [AiInterviewSessionStatus.COMPLETED]: {
        label: 'Completed',
        color: 'bg-green-100 text-green-800',
      },
    };
    return badges[status];
  };
  
  // ============= Time Helpers =============
  export const formatTimeTaken = (seconds: number | null): string => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  export const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  export const formatDateTime = (date: string | Date): string => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  export const getRelativeTime = (date: string | Date): string => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return formatDate(date);
  };
  
  // ============= Validation Helpers =============
  export const isValidAnswer = (answer: string): boolean => {
    return answer.trim().length >= 10;
  };
  
  export const getAnswerValidationMessage = (answer: string): string | null => {
    if (!answer.trim()) return 'Answer is required';
    if (answer.trim().length < 10) return 'Answer must be at least 10 characters';
    if (answer.trim().length > 5000) return 'Answer must be less than 5000 characters';
    return null;
  };
  
  // ============= Audio Helpers =============
  export const formatAudioTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  

 