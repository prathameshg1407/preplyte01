'use client';

import { apiFetch } from './client';
import { fetchWithAuthServer } from './server';
import { StudentStats, AdminStats } from '@/types';

/* === Client-side APIs === */

export const getStudentStats = async (): Promise<StudentStats> => {
  return apiFetch<StudentStats>('/users/stats/me', { method: 'GET' });
};

export const getAdminStats = async (): Promise<AdminStats> => {
  return apiFetch<AdminStats>('/admin/stats', { method: 'GET' });
};

/* === Server-side APIs === */

export const getMyStatsServer = (): Promise<StudentStats> => {
  return fetchWithAuthServer<StudentStats>('/users/stats/me');
};