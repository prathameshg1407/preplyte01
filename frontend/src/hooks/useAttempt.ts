'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import {
  startMockDriveAttempt,
  completeMockDriveAttempt,
  getMockDriveAttemptProgress,
  getCurrentMockDriveAttempt,
} from '@/lib/api/mock-drive.client';
import type {
  AttemptProgressResponse,
  CompleteAttemptResponse,
  MockDriveAttempt,
} from '@/types/mock-drive.types';

interface UseAttemptOptions {
  onError?: (error: Error) => void;
  onComplete?: (result: CompleteAttemptResponse) => void;
}

export function useAttempt(options?: UseAttemptOptions) {
  const [attempt, setAttempt] = useState<MockDriveAttempt | null>(null);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(false);
  const optionsRef = useRef(options);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const handleError = useCallback((err: any, defaultMessage: string) => {
    const errorMessage = err?.message || defaultMessage;
    setError(errorMessage);
    optionsRef.current?.onError?.(err instanceof Error ? err : new Error(errorMessage));
  }, []);

  const start = useCallback(
    async (mockDriveId: string) => {
      if (!mockDriveId) throw new Error('Mock Drive ID is required');

      setLoading(true);
      setError(null);

      try {
        const res = await startMockDriveAttempt(mockDriveId);
        if (!isMountedRef.current) return;
        setAttempt(res.attempt);
        return res.attempt;
      } catch (err: any) {
        if (!isMountedRef.current) return;
        handleError(err, 'Failed to start attempt');
        throw err;
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    },
    [handleError]
  );

  const loadCurrent = useCallback(
    async (mockDriveId: string) => {
      if (!mockDriveId) throw new Error('Mock Drive ID is required');

      setLoading(true);
      setError(null);

      try {
        const currentAttempt = await getCurrentMockDriveAttempt(mockDriveId);
        if (!isMountedRef.current) return;
        setAttempt(currentAttempt);
        return currentAttempt;
      } catch (err: any) {
        if (!isMountedRef.current) return;
        handleError(err, 'Failed to load current attempt');
        throw err;
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    },
    [handleError]
  );

  const complete = useCallback(
    async (attemptId: string, data?: any) => {
      if (!attemptId) throw new Error('Attempt ID is required');

      setCompleting(true);
      setError(null);

      try {
        const res: CompleteAttemptResponse = await completeMockDriveAttempt(attemptId, data || {});
        if (!isMountedRef.current) return;
        setAttempt(res.attempt);
        optionsRef.current?.onComplete?.(res);
        return res;
      } catch (err: any) {
        if (!isMountedRef.current) return;
        handleError(err, 'Failed to complete attempt');
        throw err;
      } finally {
        if (isMountedRef.current) setCompleting(false);
      }
    },
    [handleError]
  );

  const clearError = useCallback(() => setError(null), []);

  const reset = useCallback(() => {
    setAttempt(null);
    setError(null);
    setLoading(false);
    setCompleting(false);
  }, []);

  return {
    attempt,
    setAttempt,
    loading,
    completing,
    error,
    start,
    loadCurrent,
    complete,
    clearError,
    reset,
    // Computed values
    isInProgress: attempt?.status === 'IN_PROGRESS',
    isCompleted: attempt?.status === 'COMPLETED',
  };
}

interface UseAttemptProgressOptions {
  onError?: (error: Error) => void;
  pollingInterval?: number; // ms
  autoRefresh?: boolean;
}

export function useAttemptProgress(attemptId?: string, options?: UseAttemptProgressOptions) {
  const [progress, setProgress] = useState<AttemptProgressResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const optionsRef = useRef(options);
  const lastReqIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const handleError = useCallback((err: any, defaultMessage: string) => {
    const errorMessage = err?.message || defaultMessage;
    setError(errorMessage);
    optionsRef.current?.onError?.(err instanceof Error ? err : new Error(errorMessage));
  }, []);

  const fetchProgress = useCallback(
    async (id?: string, opts?: { silent?: boolean }) => {
      const targetId = id || attemptId;
      if (!targetId) throw new Error('Attempt ID is required');

      const silent = !!opts?.silent;
      const reqId = ++lastReqIdRef.current;

      if (!silent) {
        setLoading(true);
        setError(null);
      } else {
        setRefreshing(true);
      }

      try {
        const res = await getMockDriveAttemptProgress(targetId);
        if (!isMountedRef.current || reqId !== lastReqIdRef.current) return;
        setProgress(res);
        return res;
      } catch (err: any) {
        if (!isMountedRef.current || reqId !== lastReqIdRef.current) return;
        handleError(err, 'Failed to fetch attempt progress');
        throw err;
      } finally {
        if (!isMountedRef.current || reqId !== lastReqIdRef.current) return;
        if (!silent) setLoading(false);
        setRefreshing(false);
      }
    },
    [attemptId, handleError]
  );

  useEffect(() => {
    if (!attemptId) return;

    const auto = !!optionsRef.current?.autoRefresh;
    const interval = optionsRef.current?.pollingInterval ?? 0;
    if (!auto || !interval) return;

    fetchProgress(undefined, { silent: true }).catch(() => {});

    intervalRef.current = setInterval(() => {
      fetchProgress(undefined, { silent: true }).catch(() => {});
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [attemptId, fetchProgress]);

  const clearError = useCallback(() => setError(null), []);

  const reset = useCallback(() => {
    setProgress(null);
    setError(null);
    setLoading(false);
    setRefreshing(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    lastReqIdRef.current = 0;
  }, []);

  return {
    progress,
    loading,
    refreshing,
    error,
    fetchProgress,
    clearError,
    reset,
  };
}