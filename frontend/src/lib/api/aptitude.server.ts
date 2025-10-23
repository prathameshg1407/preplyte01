import { fetchWithAuthServer } from './server';
import { 
  GetRandomQuestionsParams, 
  AptitudeQuestion
} from '@/types';

export const getRandomAptitudeQuestionsServer = async (
  count: number,
  params: GetRandomQuestionsParams,
): Promise<AptitudeQuestion[]> => {
  const query = new URLSearchParams();
  params.tags?.forEach((tag) => query.append('tags', tag));
  if (params.difficulty) {
    query.append('difficulty', params.difficulty);
  }
  const endpoint = `/aptitude/random/${count}?${query.toString()}`;
  return fetchWithAuthServer<AptitudeQuestion[]>(endpoint, { method: 'GET' });
};