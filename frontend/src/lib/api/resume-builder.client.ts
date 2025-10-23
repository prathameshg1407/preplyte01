'use client';

import type {
  UserProfile,
  GenerateResumeOptions,
  GeneratePreviewResponse,
  SaveResumeRequest,
  SavedResume,
  ATSAnalysis,
} from '@/types/resume-builder.types';
import { apiGet, apiPost, apiPut, apiDelete, uploadFile, downloadFile } from './client';
import Cookies from 'js-cookie';

// ===================================================================================
// ## Resume Data Management - Client-Side
// ===================================================================================

/**
 * Save new resume with profile data
 */
export const saveResumeData = async (
  title: string,
  profileData: UserProfile,
  template?: string,
  customSettings?: any
): Promise<SavedResume> => {
  return apiPost<SavedResume>('/resume-builder/save', {
    title,
    profileData,
    template: template || 'modern',
    customSettings,
  });
};

/**
 * Get all saved resumes
 */
export const getSavedResumes = async (): Promise<SavedResume[]> => {
  return apiGet<SavedResume[]>('/resume-builder/resumes'); // Changed from /saved
};

/**
 * Get saved resume details
 */
export const getSavedResumeDetails = async (
  resumeId: number
): Promise<SavedResume> => {
  return apiGet<SavedResume>(`/resume-builder/resume/${resumeId}`); // Changed from /saved/:id
};

/**
 * Update saved resume
 */
export const updateSavedResume = async (
  resumeId: number,
  data: {
    title?: string;
    profileData?: UserProfile;
    template?: string;
    customSettings?: any;
  }
): Promise<SavedResume> => {
  return apiPut<SavedResume>(`/resume-builder/resume/${resumeId}`, data); // Changed from /saved/:id
};

/**
 * Delete saved resume
 */
export const deleteSavedResume = async (
  resumeId: number
): Promise<{ message: string }> => {
  return apiDelete<{ message: string }>(`/resume-builder/resume/${resumeId}`); // Changed from /saved/:id
};

/**
 * Duplicate saved resume
 */
export const duplicateSavedResume = async (
  resumeId: number,
  newTitle: string
): Promise<SavedResume> => {
  return apiPost<SavedResume>(`/resume-builder/resume/${resumeId}/duplicate`, { // Changed from /saved/:id
    title: newTitle,
  });
};

// ===================================================================================
// ## Resume Generation - Client-Side
// ===================================================================================

/**
 * Generate resume PDF with profile data
 */
export const generateResume = async (
  profileData: UserProfile,
  options: Omit<GenerateResumeOptions, 'profileData'>
): Promise<Blob> => {
  const token = Cookies.get('jwt-token') || localStorage.getItem('token');
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resume-builder/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...options,
      profileData,
      format: 'pdf', // Added format field
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate resume');
  }

  return response.blob();
};

/**
 * Generate resume preview (Base64 PDF)
 */
export const generateResumePreview = async (
  profileData: UserProfile,
  options: Omit<GenerateResumeOptions, 'profileData'>
): Promise<GeneratePreviewResponse> => {
  return apiPost<GeneratePreviewResponse>('/resume-builder/generate', { // Can use same endpoint
    ...options,
    profileData,
    format: 'preview', // Added format field
  });
};

/**
 * Download generated resume
 */
export const downloadGeneratedResume = async (
  profileData: UserProfile,
  options: Omit<GenerateResumeOptions, 'profileData'>,
  filename?: string
): Promise<void> => {
  const blob = await generateResume(profileData, options);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `resume-${options.template}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Download saved resume by ID
 */
export const downloadSavedResume = async (
  resumeId: number,
  filename?: string
): Promise<void> => {
  const token = Cookies.get('jwt-token') || localStorage.getItem('token');
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/resume-builder/resume/${resumeId}/download`, // Changed from /saved/:id/download
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to download resume');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `resume-${resumeId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// ===================================================================================
// ## ATS Analysis - Client-Side
// ===================================================================================

/**
 * Check ATS score for uploaded resume
 */
export const checkATSScore = async (
  file: File,
  jobRole: string,
  onProgress?: (progress: number) => void
): Promise<ATSAnalysis> => {
  return uploadFile<ATSAnalysis>(
    '/resume-builder/ats-check',
    file,
    'resume',
    { jobRole },
    onProgress
  );
};

/**
 * Check ATS score for saved resume
 */
export const checkSavedResumeATSScore = async (
  resumeId: number,
  jobRole: string
): Promise<ATSAnalysis> => {
  return apiPost<ATSAnalysis>(`/resume-builder/resume/${resumeId}/ats-check`, { // Changed from /saved/:id
    jobRole,
  });
};

/**
 * Get ATS optimization suggestions
 */
export const getATSOptimizationSuggestions = async (
  jobRole: string,
  keywords?: string[]
): Promise<{ suggestions: string[]; recommendedKeywords: string[] }> => {
  return apiPost('/resume-builder/ats-suggestions', {
    jobRole,
    keywords,
  });
};

// ===================================================================================
// ## Utility Functions - Client-Side
// ===================================================================================

/**
 * Export resume as different format
 */
export const exportResume = async (
  resumeId: number,
  format: 'pdf' | 'docx' | 'txt' = 'pdf'
): Promise<Blob> => {
  const token = Cookies.get('jwt-token') || localStorage.getItem('token');
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/resume-builder/resume/${resumeId}/export?format=${format}`, // Changed from /saved/:id
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to export resume');
  }

  return response.blob();
};

/**
 * Get resume statistics
 */
export const getResumeStats = async (): Promise<{
  totalResumes: number;
  templatesUsed: Record<string, number>;
  lastGenerated?: string;
}> => {
  return apiGet('/resume-builder/stats');
};

/**
 * Import resume from file
 */
export const importResumeData = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ 
  success: boolean; 
  resume?: SavedResume; 
  error?: string 
}> => {
  return uploadFile(
    '/resume-builder/import',
    file,
    'file',
    undefined,
    onProgress
  );
};