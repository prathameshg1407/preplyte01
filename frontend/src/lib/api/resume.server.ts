import { fetchWithAuthServer, ApiError } from './server';
import { Resume } from '@/types';

export const getMyResumesServer = async (): Promise<Resume[]> => {
  try {
    const resumes = await fetchWithAuthServer<Resume[]>('/profile/me/resumes');
    return resumes;
  } catch (err: any) {
    if (err instanceof ApiError && err.status === 404) {
      return [];
    }
    throw err;
  }
};

export const setPrimaryResumeServer = async (resumeId: number): Promise<Resume> => {
  return fetchWithAuthServer<Resume>(`/profile/me/resumes/${resumeId}/primary`, {
    method: 'PUT',
  });
};

export const deleteResumeServer = (resumeId: number): Promise<Resume> => {
  return fetchWithAuthServer<Resume>(`/profile/me/resumes/${resumeId}`, {
    method: 'DELETE',
  });
};