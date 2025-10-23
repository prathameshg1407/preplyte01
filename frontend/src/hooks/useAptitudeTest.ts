'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import {
  startMockDriveAptitude,
  getMockDriveAptitude,
  submitMockDriveAptitude,
  getMockDriveAptitudeResults,
  getMockDriveAptitudeStats,
} from '@/lib/api/mock-drive.client';
import type {
  StartAptitudeTestResponse,
  AptitudeResultsResponse,
  AptitudeStatsResponse,
  SubmitAptitudeDto,
} from '@/types/mock-drive.types';

interface UseAptitudeTestOptions {
  onError?: (error: Error) => void;
  autoLoad?: boolean;
}

export function useAptitudeTest(
  attemptId: string | undefined,
  options?: UseAptitudeTestOptions
) {
  const [test, setTest] = useState<StartAptitudeTestResponse | null>(null);
  const [results, setResults] = useState<AptitudeResultsResponse | null>(null);
  const [stats, setStats] = useState<AptitudeStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (options?.autoLoad && attemptId && !test && !results && !loading) {
      load().catch(console.error);
    }
  }, [attemptId, options?.autoLoad]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleError = useCallback((err: any, defaultMessage: string) => {
    const errorMessage = err?.message || defaultMessage;
    setError(errorMessage);
    options?.onError?.(err instanceof Error ? err : new Error(errorMessage));
  }, [options]);

  const load = useCallback(async () => {
    if (!attemptId) throw new Error('Attempt ID is required');
    setLoading(true);
    setError(null);
    try {
      const res = await getMockDriveAptitude(attemptId);
      if (!isMountedRef.current) return;

      if ('questions' in res) {
        setTest(res as StartAptitudeTestResponse);
        setResults(null);
      } else {
        setResults(res as AptitudeResultsResponse);
        setTest(null);
      }
      return res;
    } catch (err: any) {
      if (!isMountedRef.current) return;
      handleError(err, 'Failed to load aptitude test');
      throw err;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [attemptId, handleError]);

  const start = useCallback(async () => {
    if (!attemptId) throw new Error('Attempt ID is required');
    setLoading(true);
    setError(null);
    try {
      const res = await startMockDriveAptitude(attemptId);
      if (!isMountedRef.current) return;
      setTest(res);
      setResults(null);
      return res;
    } catch (err: any) {
      if (!isMountedRef.current) return;
      handleError(err, 'Failed to start aptitude test');
      throw err;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [attemptId, handleError]);

  const submit = useCallback(async (dto: SubmitAptitudeDto) => {
    if (!attemptId) throw new Error('Attempt ID is required');
    setSubmitting(true);
    setError(null);
    try {
      await submitMockDriveAptitude(attemptId, dto);
      if (!isMountedRef.current) return;
      const finalResults = await getMockDriveAptitudeResults(attemptId);
      if (!isMountedRef.current) return;
      setResults(finalResults);
      setTest(null);
      return finalResults;
    } catch (err: any) {
      if (!isMountedRef.current) return;
      handleError(err, 'Failed to submit aptitude test');
      throw err;
    } finally {
      if (isMountedRef.current) setSubmitting(false);
    }
  }, [attemptId, handleError]);

  const loadStats = useCallback(async () => {
    if (!attemptId) throw new Error('Attempt ID is required');
    try {
      const statsData = await getMockDriveAptitudeStats(attemptId);
      if (!isMountedRef.current) return;
      setStats(statsData);
      return statsData;
    } catch (err: any) {
      if (!isMountedRef.current) return;
      handleError(err, 'Failed to load statistics');
      throw err;
    }
  }, [attemptId, handleError]);

  const clearError = useCallback(() => setError(null), []);
  const reset = useCallback(() => {
    setTest(null);
    setResults(null);
    setStats(null);
    setError(null);
    setLoading(false);
    setSubmitting(false);
  }, []);

  return {
    test,
    results,
    stats,
    loading,
    submitting,
    error,
    load,
    start,
    submit,
    loadStats,
    clearError,
    reset,
    isCompleted: !!results,
    hasTest: !!test,
  };
}