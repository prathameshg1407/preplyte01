'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import {
  startMockDriveAiInterview,
  getMockDriveAiInterviewSession,
  submitMockDriveAiInterviewAnswer,
  getMockDriveAiInterviewNextQuestion,
  completeMockDriveAiInterview,
  getMockDriveAiInterviewFeedback,
} from '@/lib/api/mock-drive.client';
import type {
  InterviewSessionResponseDto,
  MockDriveInterviewFeedbackResponse,
  StartMockDriveInterviewDto,
  SubmitMockDriveAnswerDto,
} from '@/types/mock-drive.types';
import type { InterviewQuestionResponse } from '@/lib/api/mock-drive.client';

import type {
  ISpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
} from '@/types/speech-recognition';

// Voice/flow state types
export type InterviewStatus =
  | 'INITIALIZING'
  | 'AI_SPEAKING'
  | 'USER_LISTENING'
  | 'PROCESSING_ANSWER'
  | 'ENDED'
  | 'ERROR';

export type Phase = 'start' | 'interview' | 'results';

interface TranscriptMessage {
  speaker: 'AI' | 'USER';
  text: string;
  audioUrl?: string;
}

interface UseAiInterviewOptions {
  onError?: (error: Error) => void;
  autoLoadSession?: boolean;
  answerBuilder?: (input: {
    question: InterviewQuestionResponse | null;
    session: InterviewSessionResponseDto | null;
    transcript: string;
  }) => SubmitMockDriveAnswerDto;
  sttLang?: string;
  tts?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    lang?: string;
  };
}

export function useAiInterview(
  attemptId?: string,
  options?: UseAiInterviewOptions
) {
  const [session, setSession] = useState<InterviewSessionResponseDto | null>(null);
  const [feedback, setFeedback] = useState<MockDriveInterviewFeedbackResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestionResponse | null>(null);

  const [phase, setPhase] = useState<Phase>('start');
  const [status, setStatus] = useState<InterviewStatus>('INITIALIZING');
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [fullTranscript, setFullTranscript] = useState<TranscriptMessage[]>([]);
  const [currentQuestionText, setCurrentQuestionText] = useState<string>('Please wait...');
  const [silenceTimer, setSilenceTimer] = useState<number>(7);
  const [submitAttempts, setSubmitAttempts] = useState<number>(0);

  const isRecording = status === 'USER_LISTENING';
  const isAiSpeaking = status === 'AI_SPEAKING';
  const isProcessing = status === 'PROCESSING_ANSWER';

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const speechRecognitionRef = useRef<ISpeechRecognition | null>(null);
  const intentionalStopRef = useRef<boolean>(false);
  const recognitionActiveRef = useRef<boolean>(false);
  const committedTranscriptRef = useRef<string>('');
  const noSpeechCountRef = useRef<number>(0);
  const silenceTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSpeakingRef = useRef<boolean>(false);

  const statusRef = useRef<InterviewStatus>('INITIALIZING');
  const startRecordingRef = useRef<() => void>(() => {});
  const stopRecordingAndSubmitRef = useRef<(attempt?: number) => void>(() => {});
  const autoLoadGuardRef = useRef<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
      speechRecognitionRef.current?.abort();
      speechRecognitionRef.current = null;
      if (silenceTimeoutRef.current) clearInterval(silenceTimeoutRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const handleError = useCallback(
    (err: any, defaultMessage: string) => {
      const errorMessage = err?.message || defaultMessage;
      setError(errorMessage);
      setStatus('ERROR');
      options?.onError?.(err instanceof Error ? err : new Error(errorMessage));
    },
    [options]
  );

  const safeGetQuestionText = (q: InterviewQuestionResponse | null | undefined): string => {
    if (!q) return '';
    // Fallback across shapes
    // @ts-expect-error flexible shape
    return q.text || q.questionText || q.content || '';
  };

  const speak = useCallback(
    async (text: string, audioUrl?: string) => {
      if (!isMountedRef.current) return;
      if (isSpeakingRef.current) return;

      isSpeakingRef.current = true;
      setStatus('AI_SPEAKING');
      setCurrentQuestionText(text);

      setFullTranscript((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.speaker === 'AI' && last.text === text) return prev;
        return [...prev, { speaker: 'AI', text, audioUrl }];
      });

      const finishSpeaking = () => {
        isSpeakingRef.current = false;
        if (isMountedRef.current) {
          setStatus('USER_LISTENING');
          setError(null);
          setTimeout(() => startRecordingRef.current?.(), 500);
        }
      };

      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = options?.tts?.rate ?? 0.9;
          utterance.pitch = options?.tts?.pitch ?? 1;
          utterance.volume = options?.tts?.volume ?? 1;
          if (options?.tts?.lang) utterance.lang = options.tts.lang;
          utterance.onend = finishSpeaking;
          utterance.onerror = () => finishSpeaking();
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        } else {
          finishSpeaking();
        }
      } catch {
        finishSpeaking();
      }
    },
    [options?.tts]
  );

  const startRecording = useCallback(() => {
    if (!speechRecognitionRef.current) {
      setError('Speech recognition not available');
      setStatus('ERROR');
      return;
    }
    if (recognitionActiveRef.current) return;

    setCurrentTranscript('');
    committedTranscriptRef.current = '';
    intentionalStopRef.current = false;
    setStatus('USER_LISTENING');
    setSilenceTimer(7);

    try {
      speechRecognitionRef.current.start();
      recognitionActiveRef.current = true;

      const tick = () => {
        if (!recognitionActiveRef.current) return;
        setSilenceTimer((prev) => {
          if (!recognitionActiveRef.current) return prev;
          if (prev <= 1) {
            const hasTranscript = committedTranscriptRef.current.trim().length > 0;
            if (hasTranscript) {
              stopRecordingAndSubmitRef.current();
              return 0;
            } else if (noSpeechCountRef.current >= 3) {
              stopRecordingAndSubmitRef.current();
              return 0;
            } else {
              noSpeechCountRef.current++;
              stopRecording();
              setTimeout(() => startRecordingRef.current?.(), 1000);
              return 7;
            }
          }
          return prev - 1;
        });
      };

      silenceTimeoutRef.current = setInterval(tick, 1000);
    } catch {
      setError('Failed to start recording. Check microphone permissions.');
      setStatus('ERROR');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (speechRecognitionRef.current && recognitionActiveRef.current) {
      intentionalStopRef.current = true;
      if (silenceTimeoutRef.current) {
        clearInterval(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      speechRecognitionRef.current.stop();
      recognitionActiveRef.current = false;
    }
  }, []);

  const start = useCallback(
    async (payload: StartMockDriveInterviewDto) => {
      if (!attemptId) throw new Error('Attempt ID is required');
      setLoading(true);
      setError(null);

      try {
        await startMockDriveAiInterview(attemptId, payload);
        if (!isMountedRef.current) return;

        const sessionData = await getMockDriveAiInterviewSession(attemptId);
        if (!isMountedRef.current) return;
        setSession(sessionData);

        try {
          const q = await getMockDriveAiInterviewNextQuestion(attemptId);
          if (!isMountedRef.current) return;
          setCurrentQuestion(q);

          const text = safeGetQuestionText(q) || "Hello, let's begin the interview.";
          setPhase('interview');
          await speak(text);
        } catch {
          setPhase('results');
          setStatus('ENDED');
        }

        return sessionData;
      } catch (err: any) {
        if (!isMountedRef.current) return;
        handleError(err, 'Failed to start AI interview');
        throw err;
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    },
    [attemptId, handleError, speak]
  );

  const loadSession = useCallback(async () => {
    if (!attemptId) throw new Error('Attempt ID is required');
    setLoading(true);
    setError(null);

    try {
      const sessionData = await getMockDriveAiInterviewSession(attemptId);
      if (!isMountedRef.current) return null;

      setSession(sessionData);

      try {
        const q = await getMockDriveAiInterviewNextQuestion(attemptId);
        if (!isMountedRef.current) return sessionData;
        setCurrentQuestion(q);

        const text = safeGetQuestionText(q) || "Let's continue the interview.";
        setPhase('interview');
        await speak(text);
      } catch {
        setPhase('results');
        setStatus('ENDED');
      }

      return sessionData;
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status;
      const msg = err?.message ?? '';
      if (status === 404 || /No AI interview session/i.test(msg)) {
        if (isMountedRef.current) {
          setPhase('start');
          setStatus('INITIALIZING');
        }
        return null;
      }

      if (!isMountedRef.current) return null;
      handleError(err, 'Failed to load interview session');
      throw err;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [attemptId, handleError, speak]);

  const submitAnswer = useCallback(
    async (payload: SubmitMockDriveAnswerDto) => {
      if (!attemptId) throw new Error('Attempt ID is required');

      setSubmitting(true);
      setError(null);

      try {
        const answerResponse = await submitMockDriveAiInterviewAnswer(attemptId, payload);
        if (!isMountedRef.current) return answerResponse;

        try {
          const sessionData = await getMockDriveAiInterviewSession(attemptId);
          if (isMountedRef.current) setSession(sessionData);
        } catch {
          // ignore
        }

        try {
          const nextQuestion = await getMockDriveAiInterviewNextQuestion(attemptId);
          if (isMountedRef.current) setCurrentQuestion(nextQuestion);
        } catch {
          // completed
        }

        return answerResponse;
      } catch (err: any) {
        if (!isMountedRef.current) return;
        handleError(err, 'Failed to submit answer');
        throw err;
      } finally {
        if (isMountedRef.current) setSubmitting(false);
      }
    },
    [attemptId, handleError]
  );

  const complete = useCallback(async () => {
    if (!attemptId) throw new Error('Attempt ID is required');

    setLoading(true);
    setError(null);

    try {
      const feedbackData = await completeMockDriveAiInterview(attemptId);
      if (!isMountedRef.current) return feedbackData;

      setFeedback(feedbackData);
      return feedbackData;
    } catch (err: any) {
      if (!isMountedRef.current) return;
      handleError(err, 'Failed to complete AI interview');
      throw err;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [attemptId, handleError]);

  const loadFeedback = useCallback(async () => {
    if (!attemptId) throw new Error('Attempt ID is required');

    setLoading(true);
    setError(null);

    try {
      const feedbackData = await getMockDriveAiInterviewFeedback(attemptId);
      if (!isMountedRef.current) return feedbackData;

      setFeedback(feedbackData);
      return feedbackData;
    } catch (err: any) {
      if (!isMountedRef.current) return;
      handleError(err, 'Failed to load feedback');
      throw err;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [attemptId, handleError]);

  // UPDATED: Fallback payload now matches SubmitMockDriveAnswerDto
  const stopRecordingAndSubmit = useCallback(
    async (attempt: number = 1) => {
      if (status !== 'USER_LISTENING') return;

      stopRecording();
      setStatus('PROCESSING_ANSWER');
      setSilenceTimer(7);
      noSpeechCountRef.current = 0;
      setSubmitAttempts(attempt);

      const finalAnswer = committedTranscriptRef.current.trim() || '(No answer provided)';

      setFullTranscript((prev) => {
        const already = prev.some((m) => m.speaker === 'USER' && m.text === finalAnswer);
        if (already) return prev;
        return [...prev, { speaker: 'USER', text: finalAnswer }];
      });

      try {
        const questionText = safeGetQuestionText(currentQuestion) || 'General question';
        // fallback category if missing
        const category =
          // @ts-expect-error optional shape
          currentQuestion?.category ||
          // @ts-expect-error nested shape
          currentQuestion?.question?.category ||
          'TECHNICAL';

        const payload: SubmitMockDriveAnswerDto =
          options?.answerBuilder
            ? options.answerBuilder({
                question: currentQuestion,
                session,
                transcript: finalAnswer,
              })
            : {
                category,
                question: questionText,
                answer: finalAnswer,
                timeTakenSeconds: undefined,
                isTranscribed: true,
              };

        await submitAnswer(payload);

        try {
          if (!attemptId) throw new Error('Attempt ID is required');
          const nextQ = await getMockDriveAiInterviewNextQuestion(attemptId);
          if (!isMountedRef.current) return;
          setCurrentQuestion(nextQ);

          const nextText = safeGetQuestionText(nextQ) || "Let's continue.";
          await speak(nextText);
        } catch {
          if (!isMountedRef.current) return;
          setPhase('results');
          setStatus('ENDED');
          try {
            await complete();
          } catch {
            await loadFeedback().catch(() => {});
          }
        }
      } catch (err: any) {
        if (!isMountedRef.current) return;
        if (attempt >= 3) {
          handleError(err, 'Failed to submit answer');
          setStatus('ERROR');
        } else {
          setTimeout(() => stopRecordingAndSubmit(attempt + 1), 1000 * attempt);
        }
      } finally {
        if (isMountedRef.current) {
          setCurrentTranscript('');
          committedTranscriptRef.current = '';
        }
      }
    },
    [
      status,
      stopRecording,
      submitAnswer,
      attemptId,
      speak,
      currentQuestion,
      session,
      options?.answerBuilder,
      complete,
      loadFeedback,
      handleError,
    ]
  );

  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);

  useEffect(() => {
    stopRecordingAndSubmitRef.current = stopRecordingAndSubmit;
  }, [stopRecordingAndSubmit]);

  useEffect(() => {
    // @ts-ignore
    const SpeechRecognitionAPI =
      (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) ||
      null;

    if (!SpeechRecognitionAPI) {
      setError('Speech recognition not supported in this browser');
      setStatus('ERROR');
      return;
    }

    if (!speechRecognitionRef.current) {
      const recognition: ISpeechRecognition = new (SpeechRecognitionAPI as any)();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let hasSpeech = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript.trim();
          const confidence = result[0].confidence || 0;

          if (transcript.length > 0 && confidence > 0.6) {
            hasSpeech = true;
          }

          if (result.isFinal) {
            committedTranscriptRef.current += transcript + ' ';
          } else {
            interimTranscript += transcript + ' ';
          }
        }

        if (hasSpeech) {
          noSpeechCountRef.current = 0;
          setSilenceTimer(7);

          if (silenceTimeoutRef.current) clearInterval(silenceTimeoutRef.current);
          silenceTimeoutRef.current = setInterval(() => {
            setSilenceTimer((prev) => {
              if (!recognitionActiveRef.current) return prev;
              if (prev <= 1) {
                const hasFinal = committedTranscriptRef.current.trim().length > 0;
                if (hasFinal) {
                  stopRecordingAndSubmitRef.current();
                  return 0;
                } else if (noSpeechCountRef.current >= 3) {
                  stopRecordingAndSubmitRef.current();
                  return 0;
                } else {
                  noSpeechCountRef.current++;
                  stopRecording();
                  setTimeout(() => startRecordingRef.current?.(), 1000);
                  return 7;
                }
              }
              return prev - 1;
            });
          }, 1000);
        }

        if (isMountedRef.current) {
          setCurrentTranscript(committedTranscriptRef.current + interimTranscript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        recognitionActiveRef.current = false;
        if (silenceTimeoutRef.current) {
          clearInterval(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }

        if (event.error === 'no-speech') {
          noSpeechCountRef.current++;
          if (noSpeechCountRef.current >= 3 && isMountedRef.current) {
            stopRecordingAndSubmitRef.current();
          } else if (isMountedRef.current) {
            setStatus('USER_LISTENING');
            setTimeout(() => startRecordingRef.current?.(), 1000);
          }
        } else if (isMountedRef.current) {
          setError(`Speech recognition error: ${event.error}`);
          setStatus('ERROR');
        }
      };

      recognition.onend = () => {
        recognitionActiveRef.current = false;
        if (silenceTimeoutRef.current) {
          clearInterval(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }

        if (!intentionalStopRef.current && statusRef.current === 'USER_LISTENING' && isMountedRef.current) {
          if (noSpeechCountRef.current < 3) {
            setTimeout(() => startRecordingRef.current?.(), 1000);
          } else {
            stopRecordingAndSubmitRef.current();
          }
        }
      };

      speechRecognitionRef.current = recognition;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => { if (isMountedRef.current) setMicPermission(true); })
      .catch(() => {
        if (isMountedRef.current) {
          setMicPermission(false);
          setStatus('ERROR');
          setError('Microphone access denied. Please enable permissions.');
        }
      });

    return () => {
      speechRecognitionRef.current?.abort();
      speechRecognitionRef.current = null;
      if (silenceTimeoutRef.current) clearInterval(silenceTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.lang = options?.sttLang || 'en-US';
    }
  }, [options?.sttLang]);

  useEffect(() => {
    if (!options?.autoLoadSession || !attemptId) return;
    if (autoLoadGuardRef.current === attemptId) return;
    autoLoadGuardRef.current = attemptId;

    loadSession().catch(() => {});
  }, [attemptId, options?.autoLoadSession, loadSession]);

  const clearError = useCallback(() => setError(null), []);

  const reset = useCallback(() => {
    speechRecognitionRef.current?.abort();
    speechRecognitionRef.current = null;
    if (silenceTimeoutRef.current) clearInterval(silenceTimeoutRef.current);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setSession(null);
    setFeedback(null);
    setCurrentQuestion(null);
    setError(null);
    setLoading(false);
    setSubmitting(false);

    setPhase('start');
    setStatus('INITIALIZING');
    statusRef.current = 'INITIALIZING';
    setMicPermission(null);
    setCurrentTranscript('');
    setFullTranscript([]);
    setCurrentQuestionText('Please wait...');
    setSilenceTimer(7);
    setSubmitAttempts(0);

    committedTranscriptRef.current = '';
    noSpeechCountRef.current = 0;
    recognitionActiveRef.current = false;
    intentionalStopRef.current = false;
    isSpeakingRef.current = false;
    autoLoadGuardRef.current = null;
  }, []);

  return {
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
    loadFeedback,
    clearError,
    reset,

    phase,
    setPhase,
    status,
    isRecording,
    isAiSpeaking,
    isProcessing,
    micPermission,
    fullTranscript,
    currentTranscript,
    currentQuestionText,
    silenceTimer,
    submitAttempts,

    startRecording,
    stopRecording,
    stopRecordingAndSubmit,
    speak,
    setError,
  };
}