'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { useAiInterview } from '@/hooks/useAiInterview';
import { useToast } from '@/hooks/use-toast';
import type {
  SubmitMockDriveAnswerDto,
  StartMockDriveInterviewDto,
  AiInterviewQuestionCategory,
} from '@/types/mock-drive.types';
import { uploadResume } from '@/lib/api/resume.client';
import {
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  Mic,
  User,
  Bot,
  Trophy,
  ArrowRight,
  TrendingUp,
  Upload,
  FileText,
  X,
  Check,
} from 'lucide-react';

function normalizeQuestionText(source: unknown): string | undefined {
  const q: any = source;
  if (!q) return undefined;
  if (q.question?.questionText) return String(q.question.questionText);
  if (q.question?.text) return String(q.question.text);
  if (q.text) return String(q.text);
  if (q.content) return String(q.content);
  return undefined;
}

function normalizeQuestionCategory(source: unknown): string | undefined {
  const q: any = source;
  if (!q) return undefined;
  if (q.question?.category) return String(q.question.category);
  if (q.category) return String(q.category);
  return undefined;
}

export default function AiInterviewPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const attemptId = search.get('attemptId') || undefined;
  const { toast } = useToast();

  const {
    session,
    feedback,
    currentQuestion,
    loading,
    submitting,
    error,
    start,
    loadSession,
    submitAnswer,
    complete,
  } = useAiInterview(attemptId, {
    onError: (err) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    },
    autoLoadSession: true,
  });

  // Resume state
  const [resumeId, setResumeId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedResume, setUploadedResume] = useState<{
    id: number;
    title: string;
    filename: string;
  } | null>(null);

  // Interview state
  const [answer, setAnswer] = useState('');
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ type: 'question' | 'answer'; content: string; timestamp: Date }>
  >([]);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const answerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const lastQuestionTextRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Scroll to bottom of conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  // Auto-focus answer textarea when new question appears
  useEffect(() => {
    if (session && !feedback && answerTextareaRef.current) {
      answerTextareaRef.current.focus();
    }
  }, [session, feedback]);

  const answeredCount = useMemo(
    () => conversationHistory.filter((c) => c.type === 'answer').length,
    [conversationHistory]
  );

  const totalQuestions = session?.questions?.length || 0;

  const currentQuestionText = useMemo(() => {
    const fromHook = normalizeQuestionText(currentQuestion);
    if (fromHook) return fromHook;
    const text = session?.questions?.[answeredCount]?.text;
    return text ?? '';
  }, [currentQuestion, session?.questions, answeredCount]);

  const currentQuestionCategory = useMemo(() => {
    const fromHook = normalizeQuestionCategory(currentQuestion);
    if (fromHook) return fromHook;
    const cat = session?.questions?.[answeredCount]?.category;
    return cat ? String(cat) : undefined;
  }, [currentQuestion, session?.questions, answeredCount]);

  // Add current question to conversation history
  useEffect(() => {
    if (!currentQuestionText) return;
    if (currentQuestionText === lastQuestionTextRef.current) return;

    setConversationHistory((prev) => [
      ...prev,
      { type: 'question', content: currentQuestionText, timestamp: new Date() },
    ]);
    lastQuestionTextRef.current = currentQuestionText;
  }, [currentQuestionText]);

  // ---------- Resume Upload Handler (matches ResumeSection) ----------
  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: 'Only PDF and Word documents are allowed',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'File size must be less than 10MB',
          variant: 'destructive',
        });
        return;
      }

      setIsUploading(true);

      toast({
        title: 'Uploading Resume',
        description: `Uploading ${file.name}...`,
      });

      try {
        const result = await uploadResume(file, {
          title: file.name.replace(/\.[^/.]+$/, ''),
          isPrimary: false,
        });

        if (!isMountedRef.current) return;

        setUploadedResume({
          id: result.id,
          title: result.title || file.name,
          filename: result.filename || file.name,
        });
        setResumeId(String(result.id));

        toast({
          title: 'Resume Uploaded Successfully',
          description: 'Your resume is ready to use for the interview',
        });
      } catch (error: any) {
        console.error('Resume upload error:', error);
        if (!isMountedRef.current) return;
        
        toast({
          title: 'Upload Failed',
          description: error.message || 'Failed to upload resume',
          variant: 'destructive',
        });
      } finally {
        if (isMountedRef.current) {
          setIsUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      }
    },
    [toast]
  );

  const handleRemoveResume = useCallback(() => {
    setUploadedResume(null);
    setResumeId('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleResumeIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setResumeId(value);
    // If manually entering ID, clear uploaded resume
    if (value) {
      setUploadedResume(null);
    }
  }, []);

  // ---------- Interview Handlers ----------
  const handleStart = useCallback(async () => {
    if (!attemptId) {
      toast({
        title: 'Missing Attempt ID',
        description: 'No attemptId found in URL. Please return to the previous page.',
        variant: 'destructive',
      });
      return;
    }

    const finalResumeId = resumeId?.trim() ? parseInt(resumeId, 10) : undefined;

    if (!finalResumeId) {
      toast({
        title: 'Resume Required',
        description: 'Please upload a resume or enter a valid Resume ID to start the interview',
        variant: 'destructive',
      });
      return;
    }

    const payload: StartMockDriveInterviewDto = {
      resumeId: finalResumeId,
    };

    try {
      await start(payload);
      if (!isMountedRef.current) return;
      toast({
        title: 'Interview Started',
        description: 'Good luck! Answer each question thoughtfully.',
      });
    } catch {
      // Error handled via onError
    }
  }, [attemptId, resumeId, start, toast]);

  const handleSubmitAnswer = useCallback(async () => {
    if (!answer.trim()) {
      toast({
        title: 'Answer Required',
        description: 'Please provide an answer before submitting',
        variant: 'destructive',
      });
      return;
    }

    if (!session) {
      toast({
        title: 'Error',
        description: 'No active session found',
        variant: 'destructive',
      });
      return;
    }

    setConversationHistory((prev) => [
      ...prev,
      {
        type: 'answer',
        content: answer,
        timestamp: new Date(),
      },
    ]);

    const fallbackCategory = 'TECHNICAL' as AiInterviewQuestionCategory;
    const derivedCategory =
      (currentQuestionCategory as AiInterviewQuestionCategory | undefined) ||
      (session.questions?.[answeredCount]?.category as AiInterviewQuestionCategory | undefined) ||
      fallbackCategory;

    const derivedQuestion =
      currentQuestionText ||
      session.questions?.[answeredCount]?.text ||
      'Question';

    const payload: SubmitMockDriveAnswerDto = {
      category: derivedCategory,
      question: derivedQuestion,
      answer: answer.trim(),
      isTranscribed: true,
    };

    try {
      await submitAnswer(payload);
      if (!isMountedRef.current) return;
      setAnswer('');
      toast({
        title: 'Answer Submitted',
        description: 'Moving to next question...',
      });
    } catch {
      // Error handled via onError
    }
  }, [
    answer,
    session,
    submitAnswer,
    currentQuestionCategory,
    currentQuestionText,
    answeredCount,
    toast,
  ]);

  const handleComplete = useCallback(async () => {
    setShowCompleteDialog(false);
    try {
      await complete();
      if (!isMountedRef.current) return;
      toast({
        title: 'Interview Completed',
        description: 'Viewing your feedback and scores...',
      });
    } catch {
      // Error handled via onError
    }
  }, [complete, toast]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitAnswer();
      }
    },
    [handleSubmitAnswer]
  );

  // Loading state
  if (loading && !session && !feedback) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
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
  if (error && !session && !feedback) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Interview</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button onClick={() => loadSession()} variant="outline">
            Retry
          </Button>
          <Button variant="secondary" onClick={() => router.push(`/mock-drives/${params.id}/attempt`)}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  // Feedback/Results view
  if (feedback) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 p-4">
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">Interview Feedback</h1>
              <p className="text-muted-foreground">Here&apos;s how you performed</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Overall Performance</h2>
              <p className="text-muted-foreground">{feedback.overallSummary}</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-1">
                {feedback.overallScore}
              </div>
              <p className="text-sm text-muted-foreground">Overall Score</p>
            </div>
          </div>

          {feedback.perResponseScores && feedback.perResponseScores.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {feedback.perResponseScores.map((s, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Response {idx + 1}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Content:</span>
                      <span className="ml-2 font-semibold">{s.contentScore}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fluency:</span>
                      <span className="ml-2 font-semibold">{s.fluencyScore}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Relevance:</span>
                      <span className="ml-2 font-semibold">{s.relevanceScore}</span>
                    </div>
                  </div>
                  {s.feedback && (
                    <p className="text-xs text-muted-foreground mt-2">{s.feedback}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {feedback.keyStrengths && feedback.keyStrengths.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Key Strengths
            </h2>
            <ul className="space-y-2">
              {feedback.keyStrengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {feedback.areasForImprovement && feedback.areasForImprovement.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Areas for Improvement
            </h2>
            <ul className="space-y-2">
              {feedback.areasForImprovement.map((area, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => router.push(`/mock-drives/${params.id}/attempt`)}>
              Back to Overview
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/mock-drives/${params.id}/results`)}
            >
              View All Results
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Start screen
  if (!session) {
    const canStartInterview = (uploadedResume || resumeId.trim()) && !isUploading;

    return (
      <div className="max-w-3xl mx-auto p-4">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <MessageSquare className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">AI Interview</h1>
              <p className="text-muted-foreground">
                Prepare for an AI-powered interview session. You&apos;ll be asked
                questions based on your resume and experience.
              </p>
            </div>
          </div>

          {!attemptId && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Missing Attempt ID</AlertTitle>
              <AlertDescription>
                This page requires an attemptId in the URL query.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Resume Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Resume Setup</Label>
                {uploadedResume && (
                  <Badge variant="outline" className="gap-1">
                    <Check className="h-3 w-3" />
                    Resume Ready
                  </Badge>
                )}
              </div>

              {/* Show uploaded resume info */}
              {uploadedResume ? (
                <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-4 border-2 border-primary/20">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {uploadedResume.title}
                        </p>
                        {uploadedResume.filename && (
                          <p className="text-xs text-muted-foreground truncate">
                            {uploadedResume.filename}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Resume ID: {uploadedResume.id}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveResume}
                      className="flex-shrink-0 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File Upload - Auto-upload on selection */}
                  <div className="space-y-2">
                    <Label htmlFor="resumeFile" className="text-sm">
                      Upload Resume (PDF/DOC/DOCX)
                    </Label>
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        id="resumeFile"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        disabled={isUploading || loading}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || loading}
                        className="w-full h-24 border-2 border-dashed hover:border-primary/50"
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="text-sm font-medium">Uploading...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              Click to upload resume
                            </span>
                            <span className="text-xs text-muted-foreground">
                              PDF, DOC, or DOCX (max 10MB)
                            </span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  {/* Manual Resume ID */}
                  <div className="space-y-2">
                    <Label htmlFor="resumeId" className="text-sm">
                      Enter Existing Resume ID
                    </Label>
                    <Input
                      id="resumeId"
                      type="number"
                      placeholder="e.g., 123"
                      value={resumeId}
                      onChange={handleResumeIdChange}
                      disabled={isUploading || loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      If you've already uploaded a resume, enter its ID here
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Interview Guidelines */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Interview Guidelines</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Answer each question thoughtfully and completely</li>
                  <li>You cannot go back to previous questions</li>
                  <li>Take your time — quality matters more than speed</li>
                  <li>Use Ctrl/Cmd + Enter to submit your answer</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Start Button */}
            <Button
              onClick={handleStart}
              disabled={!attemptId || loading || !canStartInterview}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Starting Interview...
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-5 w-5" />
                  Start Interview
                </>
              )}
            </Button>

            {!canStartInterview && !isUploading && (
              <p className="text-sm text-center text-muted-foreground">
                {!uploadedResume && !resumeId.trim()
                  ? 'Please upload a resume or enter a Resume ID to continue'
                  : 'Ready to start!'}
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Interview interface (same as before)
  const progressPercentage =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Progress Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <MessageSquare className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Interview Progress</p>
              <p className="font-semibold">
                {answeredCount} / {totalQuestions} questions answered
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-48">
              <Progress value={progressPercentage} className="h-2" />
            </div>
            <span className="text-sm font-medium">{progressPercentage}%</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Conversation</h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {conversationHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Waiting for first question...</p>
                </div>
              ) : (
                <>
                  {conversationHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${
                        item.type === 'answer' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {item.type === 'question' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          item.type === 'question'
                            ? 'bg-muted'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{item.content}</p>
                        <p className="text-xs mt-2 opacity-70">
                          {item.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      {item.type === 'answer' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={conversationEndRef} />
                </>
              )}
            </div>
          </Card>

          {/* Answer Input */}
          <Card className="p-6">
            <Label htmlFor="answer" className="text-lg font-semibold mb-3 block">
              Your Answer
            </Label>
            <Textarea
              ref={answerTextareaRef}
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer here... (Ctrl/Cmd + Enter to submit)"
              rows={6}
              className="resize-none mb-3"
              disabled={submitting}
            />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-muted-foreground">
                {answer.length} characters • Press Ctrl/Cmd + Enter to submit
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCompleteDialog(true)}
                  disabled={submitting}
                >
                  Complete Interview
                </Button>
                <Button onClick={handleSubmitAnswer} disabled={!answer.trim() || submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Answer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Current Question</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Number:</span>
                <Badge variant="outline">
                  {Math.min(answeredCount + 1, totalQuestions)} / {totalQuestions}
                </Badge>
              </div>
              {currentQuestionCategory && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <Badge variant="outline">{currentQuestionCategory}</Badge>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Interview Tips
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Be specific and provide examples from your experience</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Structure your answers clearly (situation, action, result)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Take your time to think before answering</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Be honest and authentic in your responses</span>
              </li>
            </ul>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Session Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Session ID:</span>
                <span className="font-mono text-xs">
                  {session?.id ? session.id.substring(0, 8) + '…' : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Questions:</span>
                <span className="font-semibold">{totalQuestions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Answered:</span>
                <span className="font-semibold">{answeredCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-semibold">
                  {Math.max(0, totalQuestions - answeredCount)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Complete Confirmation Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Interview?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {totalQuestions} questions.
              {answeredCount < totalQuestions && (
                <span className="block mt-2 text-orange-600 dark:text-orange-400">
                  Warning: {totalQuestions - answeredCount} question(s) remain unanswered.
                </span>
              )}
              <span className="block mt-2">
                Once completed, you cannot return to answer more questions.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Interview</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>
              Complete & Get Feedback
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}