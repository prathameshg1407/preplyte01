import type {
    UserProfile,
    GenerateResumeOptions,
    GeneratePreviewResponse,
    SavedResume,
    ATSAnalysis,
  } from '@/types/resume-builder.types';
  import { serverGet, serverPost, serverPut, serverDelete } from './server';
  
  // ===================================================================================
  // ## Resume Data Management - Server-Side
  // ===================================================================================
  
  /**
   * Save new resume with profile data (server-side)
   */
  export const saveResumeDataServer = async (
    title: string,
    profileData: UserProfile,
    template?: string,
    customSettings?: any
  ): Promise<SavedResume> => {
    return serverPost<SavedResume>('/resume-builder/save', {
      title,
      profileData,
      template: template || 'modern',
      customSettings,
    });
  };
  
  /**
   * Get all saved resumes (server-side)
   */
  export const getSavedResumesServer = async (): Promise<SavedResume[]> => {
    return serverGet<SavedResume[]>('/resume-builder/saved');
  };
  
  /**
   * Get saved resume details (server-side)
   */
  export const getSavedResumeDetailsServer = async (
    resumeId: number
  ): Promise<SavedResume> => {
    return serverGet<SavedResume>(`/resume-builder/saved/${resumeId}`);
  };
  
  /**
   * Update saved resume (server-side)
   */
  export const updateSavedResumeServer = async (
    resumeId: number,
    data: {
      title?: string;
      profileData?: UserProfile;
      template?: string;
      customSettings?: any;
    }
  ): Promise<SavedResume> => {
    return serverPut<SavedResume>(`/resume-builder/saved/${resumeId}`, data);
  };
  
  /**
   * Delete saved resume (server-side)
   */
  export const deleteSavedResumeServer = async (
    resumeId: number
  ): Promise<{ message: string }> => {
    return serverDelete<{ message: string }>(`/resume-builder/saved/${resumeId}`);
  };
  
  /**
   * Duplicate saved resume (server-side)
   */
  export const duplicateSavedResumeServer = async (
    resumeId: number,
    newTitle: string
  ): Promise<SavedResume> => {
    return serverPost<SavedResume>(`/resume-builder/saved/${resumeId}/duplicate`, {
      title: newTitle,
    });
  };
  
  // ===================================================================================
  // ## Resume Generation - Server-Side
  // ===================================================================================
  
  /**
   * Generate resume preview (server-side)
   */
  export const generateResumePreviewServer = async (
    profileData: UserProfile,
    options: Omit<GenerateResumeOptions, 'profileData'>
  ): Promise<GeneratePreviewResponse> => {
    return serverPost<GeneratePreviewResponse>('/resume-builder/generate-preview', {
      ...options,
      profileData,
    });
  };
  
  // ===================================================================================
  // ## ATS Analysis - Server-Side
  // ===================================================================================
  
  /**
   * Check ATS score for saved resume (server-side)
   */
  export const checkSavedResumeATSScoreServer = async (
    resumeId: number,
    jobRole: string
  ): Promise<ATSAnalysis> => {
    return serverPost<ATSAnalysis>(`/resume-builder/saved/${resumeId}/ats-check`, {
      jobRole,
    });
  };
  
  /**
   * Get ATS optimization suggestions (server-side)
   */
  export const getATSOptimizationSuggestionsServer = async (
    jobRole: string,
    keywords?: string[]
  ): Promise<{ suggestions: string[]; recommendedKeywords: string[] }> => {
    return serverPost('/resume-builder/ats-suggestions', {
      jobRole,
      keywords,
    });
  };
  
  // ===================================================================================
  // ## Utility Functions - Server-Side
  // ===================================================================================
  
  /**
   * Get resume builder statistics (server-side)
   */
  export const getResumeBuilderStatsServer = async (): Promise<{
    totalResumes: number;
    templatesUsed: Record<string, number>;
    lastGenerated?: string;
  }> => {
    return serverGet('/resume-builder/stats');
  };
  
  /**
   * Get resume generation history (server-side)
   */
  export const getResumeHistoryServer = async (
    limit?: number
  ): Promise<Array<{
    id: number;
    title: string;
    template: string;
    createdAt: string;
    updatedAt: string;
  }>> => {
    const params = limit ? `?limit=${limit}` : '';
    return serverGet(`/resume-builder/history${params}`);
  };