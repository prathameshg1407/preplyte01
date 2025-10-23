'use client';

import { apiFetch } from './client';
import { 
  GenerateTestRequest, 
  SubmitMachineTestCodeRequest, 
  MachineTestHistory
} from '@/types';

export const generateMachineTest = async (
  request: GenerateTestRequest,
): Promise<any> => {
  return apiFetch<any>('/machine-test/generate', {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

export const submitMachineTestCode = async (
  problemId: number,
  submission: SubmitMachineTestCodeRequest,
): Promise<any> => {
  return apiFetch<any>(`/machine-test-submission/submit/${problemId}`, {
    method: 'POST',
    body: JSON.stringify(submission),
  });
};

export const getMachineTestHistory = async (): Promise<MachineTestHistory> => {
  try {
    return await apiFetch<MachineTestHistory>('/machine-test/history', { method: 'GET' });
  } catch (error: any) {
    if (error?.status === 404) {
      return { totalTestsTaken: 0, history: [] };
    }
    throw error;
  }
};