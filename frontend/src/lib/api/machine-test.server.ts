import { serverGet } from './server'; // Changed import from fetchWithAuthServer to serverGet
import { MachineTest } from '@/types';

export const getMachineTestByIdServer = async (id: number): Promise<MachineTest> => {
  // Changed the call to use serverGet for the GET request
  return serverGet<MachineTest>(`/machine-test/${id}`); 
};
