'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAttempt, useAttemptProgress } from '@/hooks/useAttempt';
import type {
  MockDriveWithRegistration,
  MockDriveAttempt,
} from '@/types/mock-drive.types';
import {
  BookOpen,
  Code,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  PlayCircle,
  Loader2,
} from 'lucide-react';
import MockDriveTimer from './MockDriveTimer';
import { formatDuration } from '@/lib/utils/mock-drive.helpers';

type ComponentKey = 'aptitude' | 'machine' | 'interview';

interface MockDriveAttemptInterfaceProps {
  mockDrive: MockDriveWithRegistration;
  attempt: MockDriveAttempt | null;
  onAttemptUpdate?: (attempt: MockDriveAttempt) => void;
}

export default function MockDriveAttemptInterface({
  mockDrive,
  attempt: initialAttempt,
  onAttemptUpdate,
}: MockDriveAttemptInterfaceProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<ComponentKey | null>(null);
  const [autoNavigated, setAutoNavigated] = useState(false);

  // Attempt hooks
  const {
    attempt,
    setAttempt,
    loading: startLoading,
    completing,
    start: startAttemptHook,
    complete: completeAttempt,
    isInProgress,
  } = useAttempt({
    onError: (error) => {
      console.error('[MockDriveAttemptInterface] Attempt error:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
    onComplete: () => {
      toast({ 
        title: 'Mock Drive Completed!', 
        description: 'Redirecting to results...' 
      });
      setTimeout(() => {
        router.push(`/mock-drives/${mockDrive.id}/results`);
      }, 1500);
    },
  });

  const {
    progress,
    fetchProgress,
  } = useAttemptProgress(attempt?.id, {
    autoRefresh: isInProgress,
    pollingInterval: 30000,
  });

  // Initialize with provided attempt
  useEffect(() => {
    if (initialAttempt && !attempt) {
      setAttempt(initialAttempt);
    }
  }, [initialAttempt, attempt, setAttempt]);

  // Notify parent of updates
  useEffect(() => {
    if (attempt) {
      onAttemptUpdate?.(attempt);
    }
  }, [attempt, onAttemptUpdate]);

  // Load progress when attempt is available
  useEffect(() => {
    if (attempt?.id && isInProgress) {
      fetchProgress().catch(() => {});
    }
  }, [attempt?.id, isInProgress, fetchProgress]);

 const hasAptitude =
  progress?.progress?.aptitude?.required ?? !!mockDrive.aptitudeTestId;

const hasMachine =
  progress?.progress?.machineTest?.required ?? false;

const hasInterview =
  progress?.progress?.aiInterview?.required ??
  (Boolean(
    mockDrive.aiInterviewConfig &&
      typeof mockDrive.aiInterviewConfig === 'object' &&
      Object.keys(mockDrive.aiInterviewConfig).length > 0
  ));

  // Derive completion flags
  const completedComponents = useMemo(() => ({
    aptitude: !!progress?.progress?.aptitude?.completed,
    machine: !!progress?.progress?.machineTest?.completed,
    interview: !!progress?.progress?.aiInterview?.completed,
  }), [progress]);

  const totalComponents = useMemo(
    () => [hasAptitude, hasMachine, hasInterview].filter(Boolean).length,
    [hasAptitude, hasMachine, hasInterview]
  );

  const completedCount = useMemo(
    () => Object.values(completedComponents).filter(Boolean).length,
    [completedComponents]
  );

  const progressPercentage = useMemo(
    () => totalComponents > 0 ? Math.round((completedCount / totalComponents) * 100) : 0,
    [totalComponents, completedCount]
  );

  const allCompleted = completedCount === totalComponents && totalComponents > 0;

  // Map API TestComponent to component key
  const mapEnumToKey = useCallback((enumVal?: string): ComponentKey | null => {
    switch (enumVal) {
      case 'APTITUDE': return 'aptitude';
      case 'MACHINE_TEST': return 'machine';
      case 'AI_INTERVIEW': return 'interview';
      case 'COMPLETED': return null;
      default: return null;
    }
  }, []);

  // Auto-navigate to current component when attempt in progress
  useEffect(() => {
    if (!isInProgress || !attempt?.id || !progress || autoNavigated) return;

    const currentKey = mapEnumToKey(progress.currentComponent);
    if (!currentKey) return;

    // Only auto-nav if the component is not already completed
    const isCompleted = completedComponents[currentKey];
    if (isCompleted) return;

    // safe navigate
    (async () => {
      try {
        await navigateToComponent(currentKey, { suppressStart: true });
        setAutoNavigated(true);
      } catch {
        // ignore navigation errors here
      }
    })();
  }, [
    isInProgress,
    attempt?.id,
    progress,
    autoNavigated,
    mapEnumToKey,
    completedComponents,
  ]);

  // Wrapper for startAttempt that returns the attempt
  const startAttempt = useCallback(async (mockDriveId: string) => {
    try {
      const newAttempt = await startAttemptHook(mockDriveId);
      if (!newAttempt?.id) {
        throw new Error('Failed to create attempt - no ID returned');
      }
      return newAttempt;
    } catch (error) {
      console.error('[StartAttempt] Error:', error);
      throw error;
    }
  }, [startAttemptHook]);

  // navigation path builder
  const buildPath = useCallback((key: ComponentKey, driveId: string, attemptId: string) => {
    const base = `/mock-drives/${driveId}/attempt`;
    switch (key) {
      case 'aptitude': return `${base}/aptitude?attemptId=${attemptId}`;
      case 'machine': return `${base}/machine-test?attemptId=${attemptId}`;
      case 'interview': return `${base}/ai-interview?attemptId=${attemptId}`;
      default: return `${base}?attemptId=${attemptId}`;
    }
  }, []);

  // Whether component is allowed now (sequential flow)
  const canAccessComponent = useCallback((key: ComponentKey) => {
    if (!progress) return true; // if we don't have progress yet, allow (we’ll validate in backend)
    const currentKey = mapEnumToKey(progress.currentComponent);

    // Allowed if this is the current component or already completed
    if (completedComponents[key]) return true;
    if (currentKey === key) return true;

    return false;
  }, [progress, completedComponents, mapEnumToKey]);

  // navigation handler (enforces sequential flow)
  const navigateToComponent = useCallback(async (component: ComponentKey, opts?: { suppressStart?: boolean }) => {
    if (navigatingTo) return;
    setNavigatingTo(component);

    try {
      let currentAttemptId = attempt?.id;

      // Start attempt if missing and not suppressed
      if (!currentAttemptId && !opts?.suppressStart) {
        const newAttempt = await startAttempt(mockDrive.id);
        currentAttemptId = newAttempt.id;
        toast({ title: 'Mock Drive Started', description: 'Navigating to test...' });
        // brief delay for state propagation
        await new Promise(r => setTimeout(r, 80));
      }

      if (!currentAttemptId) {
        throw new Error('Attempt ID not available');
      }

      // Sequential guard
      if (!canAccessComponent(component)) {
        toast({
          title: 'Please follow the flow',
          description: 'Complete the current component before proceeding.',
          variant: 'destructive',
        });
        setNavigatingTo(null);
        return;
      }

      // Component availability
      if (component === 'aptitude' && !hasAptitude) {
        toast({ title: 'Aptitude not available', variant: 'destructive' });
        setNavigatingTo(null);
        return;
      }
      if (component === 'machine' && !hasMachine) {
        toast({ title: 'Coding test not available', variant: 'destructive' });
        setNavigatingTo(null);
        return;
      }
      if (component === 'interview' && !hasInterview) {
        toast({ title: 'AI Interview not available', variant: 'destructive' });
        setNavigatingTo(null);
        return;
      }

      const path = buildPath(component, mockDrive.id, currentAttemptId);
      router.push(path);
    } catch (error: any) {
      toast({
        title: 'Navigation failed',
        description: error?.message || 'Failed to navigate to test',
        variant: 'destructive',
      });
    } finally {
      setNavigatingTo(null);
    }
  }, [
    navigatingTo,
    attempt?.id,
    startAttempt,
    mockDrive.id,
    hasAptitude,
    hasMachine,
    hasInterview,
    canAccessComponent,
    buildPath,
    router,
    toast,
  ]);

  const handleStartAndNavigate = useCallback(async () => {
    try {
      const newAttempt = await startAttempt(mockDrive.id);
      if (!newAttempt?.id) throw new Error('Failed to start attempt');

      toast({ title: 'Mock Drive Started', description: 'Good luck!' });

      // Fetch progress to determine current component to show first
      const prog = await fetchProgress(newAttempt.id).catch(() => null);
      const currentKey = mapEnumToKey(prog?.currentComponent) || (
        hasAptitude ? 'aptitude' : hasMachine ? 'machine' : hasInterview ? 'interview' : 'aptitude'
      );

      await navigateToComponent(currentKey);
    } catch (error) {
      // handled via hooks/toast
    }
  }, [startAttempt, mockDrive.id, fetchProgress, mapEnumToKey, hasAptitude, hasMachine, hasInterview, navigateToComponent, toast]);

  const handleCompleteAttempt = useCallback(async () => {
    if (!attempt?.id) return;
    await completeAttempt(attempt.id);
  }, [attempt?.id, completeAttempt]);

  // Start screen - no attempt yet
  if (!attempt) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-6">
          <h1 className="text-3xl font-bold mb-2">{mockDrive.title}</h1>
          <p className="text-muted-foreground">
            Complete all components to finish the mock drive
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-3 mb-6">
            <AlertTriangle className="h-6 w-6 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold mb-3">Important Instructions</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Total Duration: <strong>{formatDuration(mockDrive.duration)}</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Complete all components within the time limit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Timer runs continuously once started</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Your progress is automatically saved</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex justify-center">
            <Button size="lg" onClick={handleStartAndNavigate} disabled={startLoading}>
              {startLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Start Mock Drive
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // All completed screen
  if (allCompleted && isInProgress) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">All Components Completed!</h1>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You've successfully completed all test components. Submit your attempt to view your results.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => setShowExitDialog(true)} disabled={completing}>
              Exit Without Submitting
            </Button>
            <Button size="lg" onClick={handleCompleteAttempt} disabled={completing}>
              {completing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit & View Results
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // In-progress view with clickable cards (sequentially enforced)
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Timer & Progress Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Time Remaining</p>
            <MockDriveTimer
              startTime={attempt.startedAt}
              duration={mockDrive.duration}
              onTimeUp={handleCompleteAttempt}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Progress</p>
              <p className="font-semibold">
                {completedCount} / {totalComponents} Components
              </p>
            </div>
            <div className="w-32">
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
        </div>
      </Card>

      {/* Clickable Component Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hasAptitude && (
          <Card
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              completedComponents.aptitude 
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                : navigatingTo === 'aptitude' 
                ? 'ring-2 ring-primary'
                : ''
            }`}
            onClick={() => navigateToComponent('aptitude')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  completedComponents.aptitude 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-purple-100 dark:bg-purple-900/30'
                }`}>
                  {completedComponents.aptitude ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Aptitude Test</p>
                  <p className="text-xs text-muted-foreground">
                    {navigatingTo === 'aptitude' 
                      ? 'Loading...'
                      : completedComponents.aptitude 
                      ? 'Completed ✓' 
                      : 'Click to start'}
                  </p>
                </div>
              </div>
              {navigatingTo === 'aptitude' ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </Card>
        )}

        {hasMachine && (
          <Card
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              completedComponents.machine 
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                : navigatingTo === 'machine' 
                ? 'ring-2 ring-primary'
                : ''
            }`}
            onClick={() => navigateToComponent('machine')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  completedComponents.machine 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  {completedComponents.machine ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Code className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Machine Test</p>
                  <p className="text-xs text-muted-foreground">
                    {navigatingTo === 'machine' 
                      ? 'Loading...'
                      : completedComponents.machine 
                      ? 'Completed ✓' 
                      : 'Click to start'}
                  </p>
                </div>
              </div>
              {navigatingTo === 'machine' ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </Card>
        )}

        {hasInterview && (
          <Card
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              completedComponents.interview 
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                : navigatingTo === 'interview' 
                ? 'ring-2 ring-primary'
                : ''
            }`}
            onClick={() => navigateToComponent('interview')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  completedComponents.interview 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-green-100 dark:bg-green-900/30'
                }`}>
                  {completedComponents.interview ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium">AI Interview</p>
                  <p className="text-xs text-muted-foreground">
                    {navigatingTo === 'interview' 
                      ? 'Loading...'
                      : completedComponents.interview 
                      ? 'Completed ✓' 
                      : 'Click to start'}
                  </p>
                </div>
              </div>
              {navigatingTo === 'interview' ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Exit Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Mock Drive?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress has been saved. The timer will continue running. You can resume later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Test</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/mock-drives')}>
              Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}