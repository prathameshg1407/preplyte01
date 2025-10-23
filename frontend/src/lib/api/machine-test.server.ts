import { fetchWithAuthServer } from './server';
import { MachineTest } from '@/types';

export const getMachineTestByIdServer = async (id: number): Promise<MachineTest> => {
  return fetchWithAuthServer<MachineTest>(`/machine-test/${id}`, { method: 'GET' });
};