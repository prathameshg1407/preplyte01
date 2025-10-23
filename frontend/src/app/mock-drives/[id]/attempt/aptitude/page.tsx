'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAptitudeTest } from '@/hooks/useAptitudeTest';
import type { SubmitAptitudeDto } from '@/types/mock-drive.types';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
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
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowRight,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getMockDriveAttemptProgress } from '@/lib/api/mock-drive.client';

type AnswerOption = 'A' | 'B' | 'C' | 'D';

export default function AptitudePage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const attemptId = search.get('attemptId') || undefined;
  const { toast } = useToast();

  const { test, results, load, start, submit, loading, submitting, error } = 
    useAptitudeTest(attemptId);

  // CHANGED: keyed by string (cuid)
  const [answers, setAnswers] = useState<Record<string, AnswerOption>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load test on mount
  useEffect(() => {
    if (attemptId) {
      load();
    }
  }, [attemptId, load]);

  // Track start time when test loads
  useEffect(() => {
    if (test && !startTime) {
      setStartTime(Date.now());
    }
  }, [test, startTime]);

  const totalQuestions = test?.totalQuestions || 0;
  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers]
  );
  const progressPercentage = totalQuestions 
    ? Math.round((answeredCount / totalQuestions) * 100) 
    : 0;

  const currentQuestion = test?.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === (test?.questions.length || 0) - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleStart = useCallback(async () => {
    try {
      await start();
      setStartTime(Date.now());
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to start aptitude test',
        variant: 'destructive',
      });
    }
  }, [start, toast]);

  // CHANGED: questionId is string
  const handleSelectAnswer = useCallback((questionId: string, option: AnswerOption) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  }, []);

  const handleNextQuestion = useCallback(() => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [isLastQuestion]);

  const handlePreviousQuestion = useCallback(() => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [isFirstQuestion]);

  const handleJumpToQuestion = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
  }, []);

  const handleSubmitConfirm = useCallback(() => {
    if (answeredCount < totalQuestions) {
      setShowSubmitDialog(true);
    } else {
      handleSubmit();
    }
  }, [answeredCount, totalQuestions]);

  // Helper: route to next component based on progress' currentComponent/nextComponent
  const routeToNextComponent = useCallback(async () => {
    if (!attemptId || !params?.id) return;

    try {
      const prog = await getMockDriveAttemptProgress(attemptId);
      const current = prog.currentComponent;
      const next = prog.nextComponent;

      const driveId = params.id;
      const base = `/mock-drives/${driveId}/attempt`;

      // If there’s still a current component (i.e., aptitude) we can stay or route as needed
      // Prefer next if present
      const target = next || current;

      switch (target) {
        case 'MACHINE_TEST':
          toast({ title: 'Moving to Coding Test...', description: 'Good luck!' });
          router.push(`${base}/machine-test?attemptId=${attemptId}`);
          break;
        case 'AI_INTERVIEW':
          toast({ title: 'Moving to AI Interview...' });
          router.push(`${base}/ai-interview?attemptId=${attemptId}`);
          break;
        case 'COMPLETED':
          toast({ title: 'All tests completed', description: 'Generating results...' });
          router.push(`/mock-drives/${driveId}/results`);
          break;
        case 'APTITUDE':
        default:
          // Stay if still Aptitude (edge) or fallback to overview
          router.push(`${base}?attemptId=${attemptId}`);
          break;
      }
    } catch {
      // Fallback to coding test if present
      router.push(`/mock-drives/${params.id}/attempt/machine-test?attemptId=${attemptId}`);
    }
  }, [attemptId, params?.id, router, toast]);

  const handleSubmit = useCallback(async () => {
    if (!test) return;

    const timeTakenSeconds = startTime 
      ? Math.floor((Date.now() - startTime) / 1000)
      : undefined;

    const payload: SubmitAptitudeDto = {
      answers: test.questions.map(q => ({
        questionId: q.questionId, // string cuid
        selectedAnswer: answers[q.questionId] || 'A',
      })),
      timeTakenSeconds,
    };

    try {
      await submit(payload);
      
      if (!isMountedRef.current) return;

      toast({
        title: 'Test Submitted',
        description: 'Redirecting to next component...',
      });

      // Auto-progress to next component
      setTimeout(() => {
        routeToNextComponent().catch(() => {});
      }, 800);
    } catch (error: any) {
      if (!isMountedRef.current) return;

      toast({
        title: 'Submission Failed',
        description: error?.message || 'Failed to submit aptitude test',
        variant: 'destructive',
      });
    } finally {
      setShowSubmitDialog(false);
    }
  }, [test, answers, startTime, submit, toast, routeToNextComponent]);

  const handleClearAnswers = useCallback(() => {
    setAnswers({});
  }, []);

  // Loading state
  if (loading && !test && !results) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <Card className="p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-64" />
        </Card>
        <Card className="p-6">
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !test && !results) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Test</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => load()} variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  // Results view (we still show results briefly, but we’ll auto-progress via handleSubmit)
  if (results) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 p-4">
        {/* Results Header */}
        <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold mb-2">Aptitude Test Results</h1>
              <p className="text-lg text-muted-foreground">
                Score: <span className="font-bold text-foreground">{results.score}</span> / {results.total}
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-1">
                {results.percentage}%
              </div>
              <p className="text-sm text-muted-foreground">Overall Score</p>
            </div>
          </div>
        </Card>

        {/* Breakdown by Difficulty */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['EASY', 'MEDIUM', 'HARD'] as const).map(difficulty => {
              const data = results.breakdown.byDifficulty[difficulty];
              const percentage = data.total > 0 
                ? Math.round((data.correct / data.total) * 100) 
                : 0;
              
              return (
                <div 
                  key={difficulty} 
                  className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-lg capitalize">
                      {difficulty.toLowerCase()}
                    </p>
                    <span className="text-2xl font-bold text-primary">
                      {percentage}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {data.correct} / {data.total} correct
                  </p>
                  <Progress value={percentage} className="mt-2 h-2" />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Next Steps (fallback if auto-nav fails) */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => router.push(`/mock-drives/${params.id}/attempt/machine-test?attemptId=${attemptId}`)}>
              Continue to Machine Test
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/mock-drives/${params.id}/attempt/ai-interview?attemptId=${attemptId}`)}
            >
              Go to AI Interview
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => router.push(`/mock-drives/${params.id}/attempt`)}
            >
              Back to Overview
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Start screen
  if (!test) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-2">Aptitude Test</h1>
          <p className="text-muted-foreground mb-6">
            Test your analytical and reasoning skills
          </p>
          <Button onClick={handleStart} size="lg" disabled={loading}>
            {loading ? 'Starting...' : 'Start Aptitude Test'}
          </Button>
        </Card>
      </div>
    );
  }

  // Test interface
  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      {/* Progress Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="font-semibold">
                {answeredCount} / {totalQuestions} answered
              </p>
            </div>
            <div className="w-48">
              <Progress value={progressPercentage} />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Question Panel */}
        <div className="lg:col-span-3 space-y-4">
          {currentQuestion && (
            <Card className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium px-2 py-1 bg-primary/10 text-primary rounded">
                    {currentQuestion.difficulty}
                  </span>
                </div>
                <h2 className="text-xl font-semibold">
                  {currentQuestionIndex + 1}. {currentQuestion.question}
                </h2>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-3">
                {(['A', 'B', 'C', 'D'] as const).map(option => {
                  const isSelected = answers[currentQuestion.questionId] === option;
                  
                  return (
                    <button
                      key={option}
                      onClick={() => handleSelectAnswer(currentQuestion.questionId, option)}
                      className={`text-left p-4 border-2 rounded-lg transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/50 hover:bg-accent/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'border-primary bg-primary' 
                            : 'border-muted-foreground'
                        }`}>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="font-mono font-semibold mr-2">{option}.</span>
                          <span>{currentQuestion.options[option]}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={isFirstQuestion}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {isLastQuestion ? (
                  <Button onClick={handleSubmitConfirm} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Test'}
                  </Button>
                ) : (
                  <Button onClick={handleNextQuestion}>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Question Navigator Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-4 sticky top-4">
            <h3 className="font-semibold mb-3">Question Navigator</h3>
            <div className="grid grid-cols-5 lg:grid-cols-4 gap-2 mb-4">
              {test.questions.map((q, idx) => {
                const isAnswered = !!answers[q.questionId];
                const isCurrent = idx === currentQuestionIndex;
                
                return (
                  <button
                    key={q.questionId}
                    onClick={() => handleJumpToQuestion(idx)}
                    className={`aspect-square rounded-lg border-2 flex items-center justify-center text-sm font-medium transition-all ${
                      isCurrent
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isAnswered
                        ? 'border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-primary bg-primary" />
                <span className="text-muted-foreground">Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-50 dark:bg-green-950" />
                <span className="text-muted-foreground">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-border" />
                <span className="text-muted-foreground">Not Answered</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleClearAnswers}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear All
              </Button>
              <Button 
                size="sm" 
                className="w-full"
                onClick={handleSubmitConfirm}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Aptitude Test?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {totalQuestions} questions.
              {answeredCount < totalQuestions && (
                <span className="block mt-2 text-orange-600 dark:text-orange-400">
                  Warning: {totalQuestions - answeredCount} question(s) remain unanswered.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Answers</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}