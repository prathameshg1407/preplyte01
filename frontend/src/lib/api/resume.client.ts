'use client';

import { apiFetch } from './client';
import { Resume, UploadResumeDto } from '@/types';

export const getMyResumes = async (): Promise<Resume[]> => {
  return apiFetch<Resume[]>('/profile/me/resumes', { method: 'GET' });
};

export const getResumeFile = async (resumeId: number): Promise<Blob> => {
  return apiFetch<Blob>(`/profile/me/resumes/${resumeId}/file`, { method: 'GET' });
};

export const uploadResume = async (
  file: File,
  dto?: UploadResumeDto
): Promise<Resume> => {
  const formData = new FormData();
  formData.append('resumeFile', file);
  
  if (dto?.title) {
    formData.append('title', dto.title);
  }
  if (dto?.isPrimary !== undefined) {
    formData.append('isPrimary', dto.isPrimary.toString());
  }
  
  return await apiFetch<Resume>('/profile/me/resumes', {
    method: 'POST',
    body: formData,
  });
};

export const setPrimaryResume = async (resumeId: number): Promise<Resume> => {
  return await apiFetch<Resume>(`/profile/me/resumes/${resumeId}/primary`, {
    method: 'PUT',
  });
};

export const deleteResume = async (resumeId: number): Promise<void> => {
  return apiFetch<void>(`/profile/me/resumes/${resumeId}`, {
    method: 'DELETE',
  });
};