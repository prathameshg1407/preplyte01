'use client';


import type { 
  ProfileWithSkills, 
  UpdateProfileDto, 
  ProfileCompletionStatus,
  Resume,
  UploadResumeDto,
} from '@/types';
import { serverDelete, serverGet, serverPut } from './server';
import { apiGet, apiPut, uploadFile, downloadFile, apiDelete } from './client';

// ===================================================================================
// ## Client-Side APIs
// ===================================================================================

/**
 * Get current user's profile
 */
export const getMyProfile = async (): Promise<ProfileWithSkills | null> => {
  return apiGet<ProfileWithSkills | null>('/profile/me');
};

/**
 * Update current user's profile
 */
export const updateMyProfile = async (dto: UpdateProfileDto): Promise<ProfileWithSkills> => {
  return apiPut<ProfileWithSkills>('/profile/me', dto);
};

/**
 * Bulk update profile fields
 */
export const bulkUpdateProfile = async (
  updates: Partial<UpdateProfileDto>
): Promise<ProfileWithSkills> => {
  return apiPut<ProfileWithSkills>('/profile/me/bulk-update', updates);
};

/**
 * Update profile picture
 */
export const updateMyProfilePicture = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ imageUrl: string }> => {
  return uploadFile<{ imageUrl: string }>(
    '/profile/me/avatar',
    file,
    undefined,
    onProgress
  );
};

/**
 * Get profile completion status
 */
export const getProfileCompletionStatus = async (): Promise<ProfileCompletionStatus> => {
  return apiGet<ProfileCompletionStatus>('/profile/me/completion-status');
};

// ===================================================================================
// ## Resume Management - Client-Side
// ===================================================================================

/**
 * Get all resumes for current user
 */
export const getMyResumes = async (includeAnalysis?: boolean): Promise<Resume[]> => {
  const params = includeAnalysis ? '?includeAnalysis=true' : '';
  return apiGet<Resume[]>(`/profile/me/resumes${params}`);
};

/**
 * Upload a new resume
 */
export const uploadResume = async (
  file: File,
  dto?: UploadResumeDto,
  onProgress?: (progress: number) => void
): Promise<Resume> => {
  return uploadFile<Resume>(
    '/profile/me/resumes',
    file,
    'resume', // fieldName for the file
    dto,      // additionalData
    onProgress
  );
}

/**
 * Download resume file
 */
export const downloadResume = async (
  resumeId: number,
  filename?: string
): Promise<void> => {
  return downloadFile(`/profile/me/resumes/${resumeId}/download`, filename);
};

/**
 * View resume file (opens in new tab)
 */
export const viewResume = async (resumeId: number): Promise<Blob> => {
  return apiGet<Blob>(`/profile/me/resumes/${resumeId}/view`);
};

/**
 * Set resume as primary
 */
export const setPrimaryResume = async (resumeId: number): Promise<Resume> => {
  return apiPut<Resume>(`/profile/me/resumes/${resumeId}/primary`);
};

/**
 * Delete resume
 */
export const deleteResume = async (resumeId: number): Promise<Resume> => {
  return apiDelete<Resume>(`/profile/me/resumes/${resumeId}`);
};

// ===================================================================================
// ## Server-Side APIs
// ===================================================================================

/**
 * Get current user's profile (server-side)
 */
export const getMyProfileServer = async (): Promise<ProfileWithSkills | null> => {
  return serverGet<ProfileWithSkills | null>('/profile/me');
};

/**
 * Update current user's profile (server-side)
 */
export const updateMyProfileServer = async (
  dto: UpdateProfileDto
): Promise<ProfileWithSkills> => {
  return serverPut<ProfileWithSkills>('/profile/me', dto);
};

/**
 * Bulk update profile fields (server-side)
 */
export const bulkUpdateProfileServer = async (
  updates: Partial<UpdateProfileDto>
): Promise<ProfileWithSkills> => {
  return serverPut<ProfileWithSkills>('/profile/me/bulk-update', updates);
};

/**
 * Get profile completion status (server-side)
 */
export const getProfileCompletionStatusServer = async (): Promise<ProfileCompletionStatus> => {
  return serverGet<ProfileCompletionStatus>('/profile/me/completion-status');
};

/**
 * Get all resumes (server-side)
 */
export const getMyResumesServer = async (includeAnalysis?: boolean): Promise<Resume[]> => {
  const params = includeAnalysis ? '?includeAnalysis=true' : '';
  return serverGet<Resume[]>(`/profile/me/resumes${params}`);
};

/**
 * Set resume as primary (server-side)
 */
export const setPrimaryResumeServer = async (resumeId: number): Promise<Resume> => {
  return serverPut<Resume>(`/profile/me/resumes/${resumeId}/primary`);
};

/**
 * Delete resume (server-side)
 */
export const deleteResumeServer = async (resumeId: number): Promise<Resume> => {
  return serverDelete<Resume>(`/profile/me/resumes/${resumeId}`);
};