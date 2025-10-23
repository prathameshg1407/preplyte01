'use client';

import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import {
  startMockDriveMachineTest,
  getMockDriveMachineTest,
  submitMockDriveMachineTestCode,
  completeMockDriveMachineTest,
  getMockDriveMachineTestStats,
  getCurrentMockDriveAttempt,
} from '@/lib/api/mock-drive.client';
import type {
  MachineTestDetailsResponse,
  MachineTestStatsResponse,
  SubmitCodeDto,
  SubmitCodeResponse,
} from '@/types/mock-drive.types';

interface UseMachineTestOptions {
  onError?: (error: Error) => void;
  onSubmitSuccess?: (result: SubmitCodeResponse) => void;
  autoLoad?: boolean;

  // Attempt resolver
  mockDriveId?: string;
  autoResolveAttemptId?: boolean;
  onAttemptIdResolved?: (attemptId: string) => void;
}

export function useMachineTest(
  attemptId?: string,
  options?: UseMachineTestOptions
) {
  const [overview, setOverview] = useState<MachineTestDetailsResponse | null>(null);
  const [stats, setStats] = useState<MachineTestStatsResponse | null>(null);

  const [starting, setStarting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resolvedAttemptId, setResolvedAttemptId] = useState<string | undefined>(attemptId);
  const [resolvingAttemptId, setResolvingAttemptId] = useState(false);

  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    setResolvedAttemptId(attemptId);
  }, [attemptId]);

  const handleError = useCallback((err: any, defaultMessage: string) => {
    const msg = typeof err?.message === 'string' && err.message.length
      ? err.message
      : defaultMessage;
    setError(msg);
    options?.onError?.(err instanceof Error ? err : new Error(msg));
  }, [options]);

  const ensureAttemptId = useCallback(async (): Promise<string> => {
    if (resolvedAttemptId) return resolvedAttemptId;

    const shouldAutoResolve = options?.autoResolveAttemptId !== false && !!options?.mockDriveId;
    if (!shouldAutoResolve) throw new Error('Attempt ID is required');

    try {
      setResolvingAttemptId(true);
      const current = await getCurrentMockDriveAttempt(options!.mockDriveId!);
      if (!isMountedRef.current) return Promise.reject(new Error('Unmounted'));
      if (!current?.id) throw new Error('Mock drive attempt not found');

      setResolvedAttemptId(current.id);
      options?.onAttemptIdResolved?.(current.id);
      return current.id;
    } catch (err) {
      if (!isMountedRef.current) return Promise.reject(new Error('Unmounted'));
      handleError(err, 'Failed to resolve attempt ID');
      throw err;
    } finally {
      if (isMountedRef.current) setResolvingAttemptId(false);
    }
  }, [resolvedAttemptId, options, handleError]);

  const loadById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const details = await getMockDriveMachineTest(id);
      if (!isMountedRef.current) return;
      setOverview(details);
      return details;
    } catch (err: any) {
      if (!isMountedRef.current) return;
      handleError(err, 'Failed to load machine test');
      throw err;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [handleError]);

  const start = useCallback(async () => {
    const id = await ensureAttemptId();
    setStarting(true);
    setError(null);
    try {
      await startMockDriveMachineTest(id);
      if (!isMountedRef.current) return;
      const details = await loadById(id);
      return details;
    } catch (err: any) {
      if (!isMountedRef.current) return;
      handleError(err, 'Failed to start machine test');
      throw err;
    } finally {
      if (isMountedRef.current) setStarting(false);
    }
  }, [ensureAttemptId, loadById, handleError]);

  const load = useCallback(async () => {
    const id = await ensureAttemptId();
    return loadById(id);
  }, [ensureAttemptId, loadById]);

  // UPDATED: problemId is string (cuid)
  const submit = useCallback(async (problemId: string, dto: SubmitCodeDto) => {
    const id = await ensureAttemptId();
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitMockDriveMachineTestCode(id, problemId, dto);
      if (!isMountedRef.current) return;
      await loadById(id);
      options?.onSubmitSuccess?.(res);
      return res;
    } catch (err: any) {
      if (!isMountedRef.current) return;
      handleError(err, 'Failed to submit code');
      throw err;
    } finally {
      if (isMountedRef.current) setSubmitting(false);
    }
  }, [ensureAttemptId, loadById, handleError, options]);

  const complete = useCallback(async () => {
    const id = await ensureAttemptId();
    setLoading(true);
    setError(null);
    try {
      await completeMockDriveMachineTest(id);
      if (!isMountedRef.current) return;
      const statsData = await getMockDriveMachineTestStats(id);
      if (!isMountedRef.current) return;
      setStats(statsData);
      return statsData;
    } catch (err: any) {
      if (!isMountedRef.current) return;
      handleError(err, 'Failed to complete machine test');
      throw err;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [ensureAttemptId, handleError]);

  const loadStats = useCallback(async () => {
    const id = await ensureAttemptId();
    try {
      const statsData = await getMockDriveMachineTestStats(id);
      if (!isMountedRef.current) return;
      setStats(statsData);
      return statsData;
    } catch (err: any) {
      if (!isMountedRef.current) return;
      handleError(err, 'Failed to load statistics');
      throw err;
    }
  }, [ensureAttemptId, handleError]);

  const clearError = useCallback(() => setError(null), []);
  const reset = useCallback(() => {
    setOverview(null);
    setStats(null);
    setError(null);
    setLoading(false);
    setStarting(false);
    setSubmitting(false);
  }, []);

  const autoLoadedRef = useRef(false);
  useEffect(() => {
    if (!options?.autoLoad || autoLoadedRef.current) return;

    (async () => {
      try {
        const id = await ensureAttemptId();
        if (!isMountedRef.current) return;
        autoLoadedRef.current = true;
        await loadById(id);
      } catch {
        // handled upstream
      }
    })();
  }, [options?.autoLoad, ensureAttemptId, loadById]);

  const ready = useMemo(() => !!resolvedAttemptId, [resolvedAttemptId]);

  return {
    overview,
    stats,
    starting,
    loading,
    submitting,
    error,
    resolvingAttemptId,
    ready,
    start,
    load,
    submit, // accepts problemId: string
    complete,
    loadStats,
    clearError,
    reset,
    resolvedAttemptId,
    hasOverview: !!overview,
    problemCount: overview?.problems?.length || 0,
  };
}