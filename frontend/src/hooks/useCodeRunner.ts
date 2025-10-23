'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { runCodeOnce } from '@/lib/api/code-run.client';

export interface CodeRunResult {
  status: string;
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  time?: string;
  memory?: number;
}

export interface CodeRunPayload {
  language_id: number;
  source_code: string; // base64
  stdin?: string;      // base64
}

interface UseCodeRunnerOptions {
  onSuccess?: (result: CodeRunResult) => void;
  onError?: (error: Error) => void;
}

export function useCodeRunner(options?: UseCodeRunnerOptions) {
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<CodeRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CodeRunResult[]>([]);
  
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const run = useCallback(async (payload: CodeRunPayload) => {
    // Abort any existing request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setRunning(true);
    setError(null);
    
    try {
      const res = await runCodeOnce(payload);
      
      if (!isMountedRef.current) return;
      
      setOutput(res);
      setHistory(prev => [res, ...prev].slice(0, 10)); // Keep last 10 runs
      options?.onSuccess?.(res);
      return res;
    } catch (err: any) {
      if (!isMountedRef.current) return;
      
      const errorMessage = err?.message || 'Failed to run code';
      setError(errorMessage);
      options?.onError?.(err instanceof Error ? err : new Error(errorMessage));
      throw err;
    } finally {
      if (isMountedRef.current) {
        setRunning(false);
      }
      abortControllerRef.current = null;
    }
  }, [options]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setRunning(false);
  }, []);

  const clear = useCallback(() => {
    setOutput(null);
    setError(null);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const reset = useCallback(() => {
    cancel();
    clear();
    clearHistory();
  }, [cancel, clear, clearHistory]);

  return {
    running,
    output,
    error,
    history,
    run,
    cancel,
    clear,
    clearHistory,
    reset,
    // Computed values
    hasOutput: !!output,
    hasError: !!error,
    isSuccess: output?.status === 'Accepted' || output?.status?.includes('Success'),
  };
}