import { serverGet } from './server'; // <-- Updated import from fetchWithAuthServer to serverGet
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
  
  // Changed the call to use serverGet, which handles GET requests 
  // and automatically includes server-side authentication (cookies).
  return serverGet<AptitudeQuestion[]>(endpoint); 
};
