'use client';

import { useEffect } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { useMachineTest } from '@/hooks/useMachineTest';
import {
  Code,
  CheckCircle,
  Circle,
  AlertCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import type { MachineTestDetailsResponse } from '@/types/mock-drive.types';

type MachineProblem = MachineTestDetailsResponse['problems'][number];

interface ProblemCardProps {
  problem: MachineProblem;
  mockDriveId: string;
  attemptId: string;
}

function ProblemCard({ problem, mockDriveId, attemptId }: ProblemCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'HARD':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const submissionCount = problem.submissions?.length ?? 0;
  const isSolved =
    problem.submissions?.some((s) => {
      const status = (s.status || '').toUpperCase();
      return status === 'ACCEPTED' || status === 'PASS';
    }) ?? false;

  const latestSubmission =
    problem.submissions && problem.submissions.length
      ? problem.submissions.reduce((latest, s) =>
          new Date(s.createdAt) > new Date(latest.createdAt) ? s : latest
        )
      : undefined;

  return (
    <Card className={`p-4 transition-all hover:shadow-md ${isSolved ? 'border-green-500/50' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isSolved ? (
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
            <h3 className="font-semibold text-lg">{problem.title}</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className={getDifficultyColor(String(problem.difficulty))}>
              {problem.difficulty}
            </Badge>
            <Badge variant="outline">{problem.points} points</Badge>
            {submissionCount > 0 && (
              <Badge variant="secondary">
                {submissionCount} submission{submissionCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {problem.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {typeof problem.description === 'string'
                ? problem.description
                : JSON.stringify(problem.description).substring(0, 150)}
            </p>
          )}

          {latestSubmission && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">Last submission: {latestSubmission.status}</span>
              <span>on {new Date(latestSubmission.createdAt).toLocaleString()}</span>
            </div>
          )}
        </div>

        <Link href={`/mock-drives/${mockDriveId}/attempt/machine-test/${problem.id}?attemptId=${attemptId}`}>
          <Button size="sm">
            {isSolved ? 'Improve' : 'Solve'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default function MachineTestPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();

  const attemptParam = search.get('attemptId') || undefined;

  const {
    overview,
    start,
    load,
    starting,
    loading,
    error,
    resolvedAttemptId,
    resolvingAttemptId,
    ready,
  } = useMachineTest(attemptParam, {
    mockDriveId: params.id,
    autoResolveAttemptId: true,
    autoLoad: false,
    onAttemptIdResolved: (id) => {
      const url = new URL(window.location.href);
      url.searchParams.set('attemptId', id);
      router.replace(url.pathname + '?' + url.searchParams.toString());
    },
  });

  // Sync URL with resolved attempt ID
  useEffect(() => {
    if (resolvedAttemptId && attemptParam !== resolvedAttemptId) {
      const url = new URL(window.location.href);
      url.searchParams.set('attemptId', resolvedAttemptId);
      router.replace(url.pathname + '?' + url.searchParams.toString());
    }
  }, [resolvedAttemptId, attemptParam, router]);

  // Auto-load machine test when ready
  useEffect(() => {
    if (ready && resolvedAttemptId && !overview && !loading && !error) {
      load().catch(() => {});
    }
  }, [ready, resolvedAttemptId, overview, loading, error, load]);

  const handleStart = async () => {
    try {
      await start();
    } catch {
      // handled by hook
    }
  };

  if ((loading || resolvingAttemptId) && !overview && !error) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <Card className="p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-64" />
        </Card>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-24 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const isMachineTestNotStarted = error && /not started/i.test(error);

  if (error && !overview && !isMachineTestNotStarted) {
    const attemptStartHref = `/mock-drives/${params.id}/attempt`;
    const isAttemptMissing = /attempt not found/i.test(error);

    return (
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Machine Test</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="flex items-center gap-3">
          <Button onClick={() => load()} variant="outline">
            Retry
          </Button>
          {isAttemptMissing && (
            <Link href={attemptStartHref}>
              <Button>Go to Attempt</Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!overview || isMachineTestNotStarted) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Code className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Machine Test</h1>
              <p className="text-muted-foreground">
                Solve coding problems to demonstrate your programming skills
              </p>
              {isMachineTestNotStarted && (
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                  Click below to start the machine test component
                </p>
              )}
            </div>
          </div>

          <Button onClick={handleStart} size="lg" disabled={starting || !ready}>
            {starting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Starting Machine Test...
              </>
            ) : (
              <>
                <Code className="mr-2 h-5 w-5" />
                Start Machine Test
              </>
            )}
          </Button>
        </Card>
      </div>
    );
  }

  const solvedCount = overview.problems.filter((p) =>
    p.submissions?.some((s) => (s.status || '').toUpperCase() === 'PASS' || (s.status || '').toUpperCase() === 'ACCEPTED')
  ).length;

  const totalProblems = overview.totalProblems;
  const progressPercentage = totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Coding Problems</h1>
            <p className="text-muted-foreground">
              Solve {totalProblems} problem{totalProblems !== 1 ? 's' : ''} to complete this section
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-primary mb-1">
              {solvedCount}/{totalProblems}
            </div>
            <p className="text-sm text-muted-foreground">Problems Solved</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {overview.problems.map((problem) => (
          <ProblemCard
            key={problem.id}
            problem={problem}
            mockDriveId={params.id}
            attemptId={resolvedAttemptId!}
          />
        ))}
      </div>

      {solvedCount === totalProblems && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
          <div className="flex items-center gap-4">
            <CheckCircle className="h-12 w-12 text-green-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">All Problems Completed!</h3>
              <p className="text-muted-foreground">
                Great job! You&apos;ve solved all {totalProblems} problems. You can still improve your
                solutions or proceed to the next section.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}