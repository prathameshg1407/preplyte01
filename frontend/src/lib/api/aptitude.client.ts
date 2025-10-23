'use client';

import { apiFetch } from './client';
import { 
  AptitudeHistory, 
  AptitudeResults, 
  GetRandomQuestionsParams, 
  AptitudeQuestion,
  SubmitAptitudeRequest 
} from '@/types';

export const getRandomAptitudeQuestions = async (
  count: number,
  params: GetRandomQuestionsParams,
): Promise<AptitudeQuestion[]> => {
  const query = new URLSearchParams();
  params.tags?.forEach((tag) => query.append('tags', tag));
  if (params.difficulty) {
    query.append('difficulty', params.difficulty);
  }
  const endpoint = `/aptitude/random/${count}?${query.toString()}`;
  return apiFetch<AptitudeQuestion[]>(endpoint, { method: 'GET' });
};

export const submitAptitudeTest = async (
  submission: SubmitAptitudeRequest,
): Promise<AptitudeResults> => {
  return apiFetch<AptitudeResults>('/aptitude/submit', {
    method: 'POST',
    body: JSON.stringify(submission),
  });
};

export const getUserAptitudeHistory = async (): Promise<AptitudeHistory> => {
  try {
    return await apiFetch<AptitudeHistory>('/aptitude/history', { method: 'GET' });
  } catch (error: any) {
    if (error?.status === 404) {
      return { totalTestsTaken: 0, responses: [] };
    }
    throw error;
  }
};