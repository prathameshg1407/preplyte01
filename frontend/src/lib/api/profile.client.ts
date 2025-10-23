import type { 
    ProfileWithSkills, 
    UpdateProfileDto, 
    ProfileCompletionStatus,
    Resume,
  } from '@/types';
  import { serverDelete, serverGet, serverPut } from './server';
  
  // ===================================================================================
  // ## Profile Management - Server-Side
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
  
  // ===================================================================================
  // ## Resume Management - Server-Side
  // ===================================================================================
  
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