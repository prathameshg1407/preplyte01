'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import MonacoCodeEditor from '@/components/editor/MonacoCodeEditor';
import { useMachineTest } from '@/hooks/useMachineTest';
import { useCodeRunner } from '@/hooks/useCodeRunner';
import { useToast } from '@/hooks/use-toast';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  STARTER_TEMPLATES,
  getLanguageByKey,
  type MonacoLanguageKey,
} from '@/lib/utils/monaco-languages';
import { toBase64 } from '@/lib/utils/base64';
import type {
  SubmitCodeDto,
  SubmitCodeResponse,
  MachineTestDetailsResponse,
} from '@/types/mock-drive.types';
import {
  Code,
  Play,
  Send,
  RotateCcw,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileCode,
  Terminal,
  History,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import TipTapRenderer from '@/components/editor/TipTapRenderer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function StatusBadge({ status }: { status: string }) {
  const statusLower = status.toLowerCase();

  const getStatusConfig = () => {
    if (statusLower.includes('accepted') || statusLower.includes('pass')) {
      return {
        icon: CheckCircle2,
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      };
    }
    if (statusLower.includes('wrong') || statusLower.includes('fail')) {
      return {
        icon: XCircle,
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      };
    }
    if (statusLower.includes('compil') || statusLower.includes('error')) {
      return {
        icon: AlertCircle,
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      };
    }
    if (statusLower.includes('time') || statusLower.includes('limit')) {
      return {
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      };
    }
    return {
      icon: AlertCircle,
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    };
  };

  const { icon: Icon, className } = getStatusConfig();

  return (
    <Badge className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {status}
    </Badge>
  );
}

type MachineProblem = MachineTestDetailsResponse['problems'][number];

export default function MachineProblemEditorPage() {
  const params = useParams<{ id: string; problemId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const attemptParam = search.get('attemptId') || undefined;
  const problemId = params.problemId; // CHANGED: string cuid
  const { toast } = useToast();

  const {
    overview,
    load,
    submit,
    loading,
    submitting,
    error,
    resolvedAttemptId,
    resolvingAttemptId,
    ready,
  } = useMachineTest(attemptParam, {
    mockDriveId: params.id,
    autoResolveAttemptId: true,
    autoLoad: true,
    onAttemptIdResolved: (id) => {
      const url = new URL(window.location.href);
      url.searchParams.set('attemptId', id);
      router.replace(url.pathname + '?' + url.searchParams.toString());
    },
  });

  // Keep URL in sync once attemptId is resolved
  useEffect(() => {
    if (resolvedAttemptId && attemptParam !== resolvedAttemptId) {
      const url = new URL(window.location.href);
      url.searchParams.set('attemptId', resolvedAttemptId);
      router.replace(url.pathname + '?' + url.searchParams.toString());
    }
  }, [resolvedAttemptId, attemptParam, router]);

  // Editor state
  const [langKey, setLangKey] = useState<MonacoLanguageKey>(DEFAULT_LANGUAGE.monaco);
  const [source, setSource] = useState(STARTER_TEMPLATES[DEFAULT_LANGUAGE.monaco]);
  const [stdin, setStdin] = useState('');
  const [result, setResult] = useState<SubmitCodeResponse | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'submissions' | 'output'>('description');

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update template when language changes
  useEffect(() => {
    if (langKey) {
      setSource(STARTER_TEMPLATES[langKey]);
    }
  }, [langKey]);

  const problem: MachineProblem | undefined = useMemo(
    () => overview?.problems.find((p) => String(p.id) === String(problemId)),
    [overview, problemId]
  );

  const selectedLang = useMemo(
    () => getLanguageByKey(langKey) || DEFAULT_LANGUAGE,
    [langKey]
  );

  const { running, output, run, clear: clearRun } = useCodeRunner({
    onError: (err) => {
      toast({
        title: 'Execution Error',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const handleRun = useCallback(async () => {
    clearRun();
    setResult(null);
    setActiveTab('output');

    try {
      await run({
        language_id: selectedLang.judge0Id,
        source_code: toBase64(source),
        stdin: stdin ? toBase64(stdin) : undefined,
      });
    } catch {
      // handled by hook
    }
  }, [selectedLang, source, stdin, run, clearRun]);

  const handleSubmitConfirm = useCallback(() => {
    if (!source.trim()) {
      toast({
        title: 'Code Required',
        description: 'Please write some code before submitting',
        variant: 'destructive',
      });
      return;
    }
    setShowSubmitDialog(true);
  }, [source, toast]);

  const handleSubmit = useCallback(async () => {
    if (!problemId) return;

    setShowSubmitDialog(false);
    clearRun();
    setResult(null);
    setActiveTab('output');

    const payload: SubmitCodeDto = {
      // CHANGED: no machineTestId in AI-generated flow
      source_code: toBase64(source),
      language_id: selectedLang.judge0Id,
      stdin: stdin ? toBase64(stdin) : undefined,
    };

    try {
      const res = await submit(problemId, payload); // CHANGED: problemId is string
      if (!isMountedRef.current) return;
      if (res) {
        setResult(res);
        toast({
          title: 'Submission Complete',
          description: `Status: ${res.finalStatus}. Score: ${res.score.toFixed(1)}%`,
          variant: res.score >= 100 ? 'default' : 'destructive',
        });
      }
    } catch {
      // handled by hook
    }
  }, [problemId, source, stdin, selectedLang, submit, clearRun, toast]);

  const handleLoadTemplate = useCallback(() => {
    setSource(STARTER_TEMPLATES[langKey]);
  }, [langKey]);

  const handleReset = useCallback(() => {
    setSource('');
    setStdin('');
    clearRun();
    setResult(null);
  }, [clearRun]);

  const problemsHref = useMemo(() => {
    return resolvedAttemptId
      ? `/mock-drives/${params.id}/attempt/machine-test?attemptId=${resolvedAttemptId}`
      : `/mock-drives/${params.id}/attempt`;
  }, [params.id, resolvedAttemptId]);

  // Loading state
  if ((loading || resolvingAttemptId) && !overview) {
    return (
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <Card className="p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96" />
        </Card>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !overview) {
    return (
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Problem</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex items-center gap-2">
          <Button onClick={() => load()} variant="outline">
            Retry
          </Button>
          <Link href={problemsHref}>
            <Button>Back to Problems</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!overview || !problem) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Problem Not Found</AlertTitle>
          <AlertDescription>The requested problem could not be found.</AlertDescription>
        </Alert>
        <Link href={problemsHref}>
          <Button variant="outline" className="mt-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Problems
          </Button>
        </Link>
      </div>
    );
  }

  // Derive values from submissions safely
  const submissionCount = problem.submissions?.length ?? 0;
  const isSolved =
    problem.submissions?.some((s) => {
      const status = (s.status || '').toUpperCase();
      return status === 'ACCEPTED' || status === 'PASS';
    }) ?? false;

  // Optional: sort submissions by createdAt desc for display
  const sortedSubmissions = [...(problem.submissions || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isSolved && <CheckCircle2 className="h-6 w-6 text-green-500" />}
              <h1 className="text-2xl font-bold">{problem.title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {problem.difficulty}
              </Badge>
              <Badge variant="secondary">{problem.points} points</Badge>
              <Badge variant="outline">
                {submissionCount} submission{submissionCount !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
          <Link href={problemsHref}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Problems
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Panel - Problem Info */}
        <div className="space-y-6">
          <Card className="p-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">
                  <FileCode className="mr-2 h-4 w-4" />
                  Description
                </TabsTrigger>
                <TabsTrigger value="submissions">
                  <History className="mr-2 h-4 w-4" />
                  Submissions
                </TabsTrigger>
                <TabsTrigger value="output">
                  <Terminal className="mr-2 h-4 w-4" />
                  Output
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="space-y-4 mt-4">
                <div>
                  <h3 className="font-semibold mb-4 text-lg">Problem Description</h3>
                  <TipTapRenderer content={problem.description} />
                </div>
              </TabsContent>

              <TabsContent value="submissions" className="mt-4">
                {submissionCount === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Total Submissions: {submissionCount}
                    </p>

                    {sortedSubmissions.map((s) => (
                      <Card key={s.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={s.status} />
                            <span className="text-sm text-muted-foreground">
                              {new Date(s.createdAt).toLocaleString()}
                            </span>
                          </div>

                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="output" className="mt-4">
                <div className="space-y-4">
                  {/* Run Output */}
                  {output && (
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Terminal className="h-4 w-4" />
                        <h4 className="font-semibold">Run Output</h4>
                        <StatusBadge status={output.status} />
                      </div>

                      {output.compile_output && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                            Compilation Output
                          </p>
                          <pre className="text-xs bg-background rounded p-2 overflow-x-auto">
                            {output.compile_output}
                          </pre>
                        </div>
                      )}

                      {output.stderr && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                            Error Output
                          </p>
                          <pre className="text-xs bg-background rounded p-2 overflow-x-auto">
                            {output.stderr}
                          </pre>
                        </div>
                      )}

                      {output.stdout && (
                        <div>
                          <p className="text-xs font-semibold mb-1">Standard Output</p>
                          <pre className="text-xs bg-background rounded p-2 overflow-x-auto">
                            {output.stdout}
                          </pre>
                        </div>
                      )}

                      {output.time && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Execution time: {output.time}s
                        </p>
                      )}
                    </div>
                  )}

                  {/* Submission Results */}
                  {result && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Final Status:</span>
                          <StatusBadge status={result.finalStatus} />
                        </div>
                        <div className="text-sm">
                          Score: <b>{result.score.toFixed(1)}%</b> ({result.passedCount}/
                          {result.totalCases})
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Test Cases</h4>
                        {result.results?.map((r, idx) => {
                          const passed = r.status.toLowerCase().includes('accepted');
                          return (
                            <Card
                              key={idx}
                              className={`p-3 ${
                                passed
                                  ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                                  : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <StatusBadge status={r.status} />
                                <span className="text-xs text-muted-foreground">
                                  Test #{idx + 1}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="border rounded p-2 bg-background">
                                  <p className="font-semibold mb-1">Input</p>
                                  <pre className="whitespace-pre-wrap">{r.input || 'N/A'}</pre>
                                </div>
                                <div className="border rounded p-2 bg-background">
                                  <p className="font-semibold mb-1">Expected</p>
                                  <pre className="whitespace-pre-wrap">{r.expected || 'N/A'}</pre>
                                </div>
                                <div className="border rounded p-2 bg-background">
                                  <p className="font-semibold mb-1">Output</p>
                                  <pre className="whitespace-pre-wrap">{r.output || 'N/A'}</pre>
                                </div>
                              </div>

                              {r.error && (
                                <div className="mt-2 border rounded p-2 bg-background text-xs">
                                  <p className="font-semibold text-red-600 dark:text-red-400 mb-1">
                                    Error
                                  </p>
                                  <pre className="whitespace-pre-wrap text-red-600 dark:text-red-400">
                                    {r.error}
                                  </pre>
                                </div>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!output && !result && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Terminal className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Run or submit your code to see output here</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Custom Input */}
          <Card className="p-4">
            <Label className="text-sm font-medium mb-2 block">Custom Input (stdin)</Label>
            <Textarea
              rows={4}
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter custom input for testing..."
              className="font-mono text-sm"
            />
          </Card>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Language:</span>
                <Select value={langKey} onValueChange={(v) => setLangKey(v as MonacoLanguageKey)}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <SelectItem value={l.monaco} key={l.monaco}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadTemplate}
                  title="Load starter template"
                >
                  <FileCode className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset} title="Reset code">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <MonacoCodeEditor language={langKey} value={source} onChange={setSource} height={500} />

            <div className="flex gap-2 mt-4">
              <Button
                variant="secondary"
                onClick={handleRun}
                disabled={running || submitting}
                className="flex-1"
              >
                {running ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Code
                  </>
                )}
              </Button>
              <Button
                onClick={handleSubmitConfirm}
                disabled={running || submitting || !ready}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Solution
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Run: Test with custom input • Submit: Evaluate against all test cases
            </p>
          </Card>
        </div>
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Solution?</AlertDialogTitle>
            <AlertDialogDescription>
              Your solution will be evaluated against all test cases. This will count as an official
              submission.
              {isSolved && (
                <span className="block mt-2 text-green-600 dark:text-green-400">
                  Note: You've already solved this problem. This submission will only count if it
                  improves your score.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}