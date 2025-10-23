'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

import {
  getStudentMockDrive,
  getCurrentMockDriveAttempt,
  getMyBatch,
} from '@/lib/api/mock-drive.client';

import MockDriveAttemptInterface from '@/components/mock-drives/student/MockDriveAttemptInterface';

import type {
  MockDriveWithRegistration,
  MockDriveAttempt,
  MockDriveBatch,
} from '@/types/mock-drive.types';
import {
  canAttemptBasedOnBatch,
  formatDateRange,
  formatDuration,
} from '@/lib/utils/mock-drive.helpers';
import { AlertCircle, ArrowLeft } from 'lucide-react';

interface AttemptPageState {
  mockDrive: MockDriveWithRegistration | null;
  attempt: MockDriveAttempt | null;
  myBatch: MockDriveBatch | null;
  loading: boolean;
  error: string | null;
}

export default function AttemptPage() {
  const params = useParams<{ id: string }>();
  const mockDriveId = params?.id;

  const [state, setState] = useState<AttemptPageState>({
    mockDrive: null,
    attempt: null,
    myBatch: null,
    loading: true,
    error: null,
  });

  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    async function loadAttemptData() {
      if (!mockDriveId) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Mock Drive ID is missing',
        }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const [drive, currentAttempt, batch] = await Promise.allSettled([
          getStudentMockDrive(mockDriveId),
          getCurrentMockDriveAttempt(mockDriveId),
          getMyBatch(mockDriveId),
        ]);

        if (!isMountedRef.current) return;

        const mockDrive = drive.status === 'fulfilled' ? drive.value : null;
        const attempt = currentAttempt.status === 'fulfilled' ? currentAttempt.value : null;
        const myBatch = batch.status === 'fulfilled' ? batch.value : null;

        if (!mockDrive) {
          throw new Error('Mock drive not found or inaccessible');
        }

        setState({
          mockDrive,
          attempt,
          myBatch,
          loading: false,
          error: null,
        });
      } catch (error: any) {
        if (!isMountedRef.current) return;

        console.error('[AttemptPage] Load error:', error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error?.message || 'Failed to load mock drive data',
        }));
      }
    }

    loadAttemptData();
  }, [mockDriveId]);

  // Memoized derivations to reduce recalculations
  const isRegistered = useMemo(() => {
    if (!state.mockDrive) return false;
    return !!state.mockDrive.isRegistered && !!state.mockDrive.userRegistration;
  }, [state.mockDrive]);

  const registrationWindow = useMemo(() => {
    if (!state.mockDrive) return '';
    return formatDateRange(
      state.mockDrive.registrationStartDate,
      state.mockDrive.registrationEndDate
    );
  }, [state.mockDrive]);

  const batchCheck = useMemo(() => canAttemptBasedOnBatch(state.myBatch), [state.myBatch]);

  // Stable attempt update callback to avoid re-renders/loops in child
  const handleAttemptUpdate = useCallback((updatedAttempt: MockDriveAttempt) => {
    setState((prev) => {
      const prevAttempt = prev.attempt;
      if (
        prevAttempt &&
        prevAttempt.id === updatedAttempt.id &&
        // Basic change guard; adjust fields if your type differs
        prevAttempt.status === updatedAttempt.status
      ) {
        return prev; // no-op if nothing meaningful changed
      }
      return { ...prev, attempt: updatedAttempt };
    });
  }, []);

  // Loading State
  if (state.loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <Card className="p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96" />
        </Card>
        <Card className="p-6">
          <Skeleton className="h-6 w-48 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
      </div>
    );
  }

  // Error State
  if (state.error || !state.mockDrive) {
    return (
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Mock Drive</AlertTitle>
          <AlertDescription>
            {state.error || 'Mock drive not found or you do not have access to it.'}
          </AlertDescription>
        </Alert>
        <Link href="/mock-drives">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Mock Drives
          </Button>
        </Link>
      </div>
    );
  }

  const { mockDrive, attempt, myBatch } = state;

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{mockDrive.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Duration: {formatDuration(mockDrive.duration)}</span>
              <span>•</span>
              <span>Registration: {registrationWindow}</span>
            </div>
          </div>
          <Link href={`/mock-drives/${mockDriveId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Details
            </Button>
          </Link>
        </div>
      </Card>

      {/* Registration Check */}
      {!isRegistered && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Registered</AlertTitle>
          <AlertDescription>
            You are not registered for this mock drive. Please register on the details page to proceed.
          </AlertDescription>
        </Alert>
      )}

      {/* Batch Gating */}
      {isRegistered && !batchCheck.canAttempt && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cannot Start Attempt</AlertTitle>
          <AlertDescription>
            {batchCheck.message || 'Please check your batch schedule to begin the attempt.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Attempt Interface */}
      {isRegistered && batchCheck.canAttempt && (
        <MockDriveAttemptInterface
          mockDrive={mockDrive}
          attempt={attempt}
          onAttemptUpdate={handleAttemptUpdate}
        />
      )}
    </div>
  );
}