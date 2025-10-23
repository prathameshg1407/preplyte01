"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  startInterviewSession,
  submitInterviewAnswer,
  getInterviewFeedback,
  getInterviewSession,
  createAnswerRequest,
  validateAnswer,
} from "@/lib/api/interview.client";
import {
  AiInterviewQuestionCategory,
  InterviewFeedbackResponse,
  QuestionItem,
} from "@/types/aiInterview.types";

import type {
  ISpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
} from '@/types/speech-recognition';

// Local UI state types
export type InterviewStatus =
  | "INITIALIZING"
  | "AI_SPEAKING"
  | "USER_LISTENING"
  | "PROCESSING_ANSWER"
  | "ENDED"
  | "ERROR";

export type Phase = "start" | "interview" | "results";




// Transcript message type
interface TranscriptMessage {
  speaker: "AI" | "USER";
  text: string;
  audioUrl?: string;
}

export function useInterview() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  // ============= State =============
  const [phase, setPhase] = useState<Phase>(sessionId ? "interview" : "start");
  const [status, setStatus] = useState<InterviewStatus>("INITIALIZING");
  const [questions, setQuestions] = useState<QuestionItem[] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestionText, setCurrentQuestionText] = useState("Please wait...");
  const [currentCategory, setCurrentCategory] = useState<AiInterviewQuestionCategory>(
    AiInterviewQuestionCategory.INTRODUCTORY
  );
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [fullTranscript, setFullTranscript] = useState<TranscriptMessage[]>([]);
  const [feedback, setFeedback] = useState<InterviewFeedbackResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!sessionId);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  const [silenceTimer, setSilenceTimer] = useState<number>(7);
  const [submitAttempts, setSubmitAttempts] = useState<number>(0);

  // ============= Refs =============
  const speechRecognitionRef = useRef<ISpeechRecognition | null>(null);
  const intentionalStopRef = useRef<boolean>(false);
  const recognitionActiveRef = useRef<boolean>(false);
  const committedTranscriptRef = useRef<string>("");
  const noSpeechCountRef = useRef<number>(0);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isSpeakingRef = useRef<boolean>(false);
  const isSessionLoadedRef = useRef<boolean>(false);

  // ============= Derived State =============
  const isRecording = status === "USER_LISTENING";
  const isAiSpeaking = status === "AI_SPEAKING";
  const isProcessing = status === "PROCESSING_ANSWER";

  // ============= Cleanup =============
  useEffect(() => {
    console.log("[useInterview] Mounting hook");
    isMountedRef.current = true;
    return () => {
      console.log("[useInterview] Unmounting hook");
      isMountedRef.current = false;
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.abort();
        speechRecognitionRef.current = null;
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ============= Start Session =============
  const startSession = async ({
    jobTitle,
    resumeId,
    companyName,
  }: {
    jobTitle: string;
    resumeId?: number;
    companyName?: string;
  }) => {
    if (!jobTitle?.trim()) {
      console.log("[useInterview] startSession: Job title missing");
      setError("Please enter a job title");
      return;
    }

    console.log("[useInterview] startSession: Starting interview", {
      jobTitle,
      resumeId,
      companyName,
    });

    setLoading(true);
    setError(null);

    try {
      const session = await startInterviewSession({
        jobTitle: jobTitle.trim(),
        resumeId,
        companyName: companyName?.trim(),
      });

      console.log("[useInterview] startSession: Session created:", session.id);

      if (!isMountedRef.current) return;

      setPhase("interview");
      setQuestions(session.questions);
      setCurrentQuestionIndex(0);
      setCurrentQuestionText(session.questions[0]?.text || "Loading...");
      setCurrentCategory(
        session.questions[0]?.category as AiInterviewQuestionCategory ||
        AiInterviewQuestionCategory.INTRODUCTORY
      );
      
      setLoading(false);

      // Navigate to interview page
      router.push(`/practice/ai-interview/${session.id}`);

      // Start speaking first question
      await speak(
        session.questions[0]?.text || "Hello, let's begin the interview.",
        session.audioUrl
      );
    } catch (err: any) {
      console.error("[useInterview] startSession: Error:", err);
      if (isMountedRef.current) {
        setError(err.message || "Failed to start interview. Please try again.");
        setLoading(false);
      }
    }
  };

  // ============= Stop Recording =============
  const stopRecording = useCallback(() => {
    if (speechRecognitionRef.current && recognitionActiveRef.current) {
      console.log("[useInterview] stopRecording: Stopping recognition");
      intentionalStopRef.current = true;
      
      if (silenceTimeoutRef.current) {
        clearInterval(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      
      speechRecognitionRef.current.stop();
      recognitionActiveRef.current = false;
    }
  }, []);

  // ============= Submit Answer =============
  const stopRecordingAndSubmit = useCallback(
    async (attempt: number = 1): Promise<void> => {
      if (status !== "USER_LISTENING") {
        console.log("[useInterview] stopRecordingAndSubmit: Not listening, aborting");
        return;
      }

      console.log("[useInterview] stopRecordingAndSubmit: Attempt", attempt);
      
      stopRecording();
      setStatus("PROCESSING_ANSWER");
      setSilenceTimer(7);
      noSpeechCountRef.current = 0;
      setSubmitAttempts(attempt);

      const finalAnswer = committedTranscriptRef.current.trim() || "(No answer provided)";
      
      // Add to transcript
      if (!fullTranscript.some((msg) => msg.text === finalAnswer && msg.speaker === "USER")) {
        setFullTranscript((prev) => [...prev, { speaker: "USER", text: finalAnswer }]);
      }

      // Validate question data
      const currentQuestion = questions?.[currentQuestionIndex];
      if (!currentQuestion) {
        console.error("[useInterview] stopRecordingAndSubmit: No question data");
        setError("Failed to submit: Question data missing");
        setStatus("ERROR");
        return;
      }

      // Validate answer
      const validation = validateAnswer(finalAnswer);
      if (!validation.valid && finalAnswer !== "(No answer provided)") {
        console.warn("[useInterview] stopRecordingAndSubmit: Invalid answer:", validation.error);
        // Still submit but log warning
      }

      try {
        // Create properly typed request
        const answerRequest = createAnswerRequest(
          currentQuestion.text,
          currentCategory,
          finalAnswer,
          Math.round(Date.now() / 1000), // timestamp
          true // isTranscribed
        );

        console.log("[useInterview] stopRecordingAndSubmit: Submitting answer");
        const response = await submitInterviewAnswer(sessionId, answerRequest);
        
        console.log("[useInterview] stopRecordingAndSubmit: Response:", response);

        if (!isMountedRef.current) return;

        if (response.isComplete) {
          // Interview completed
          console.log("[useInterview] stopRecordingAndSubmit: Interview complete");
          setStatus("ENDED");
          setPhase("results");

          // Fetch feedback
          try {
            const feedbackData = await getInterviewFeedback(sessionId);
            console.log("[useInterview] stopRecordingAndSubmit: Feedback:", feedbackData);
            setFeedback(feedbackData);
          } catch (feedbackError) {
            console.error("[useInterview] stopRecordingAndSubmit: Feedback error:", feedbackError);
          }

          // Navigate to results
          router.push(`/practice/ai-interview/results/${sessionId}`);
        } else if (response.nextQuestion) {
          // Validate next question
          const nextQ = response.nextQuestion;
          
          if (!nextQ.text || !nextQ.category) {
            console.error("[useInterview] stopRecordingAndSubmit: Invalid next question:", nextQ);
            
            if (attempt >= 3) {
              setError("Invalid question received. Please restart the interview.");
              setStatus("ERROR");
              return;
            }

            // Retry
            console.log("[useInterview] stopRecordingAndSubmit: Retrying...");
            setTimeout(() => stopRecordingAndSubmit(attempt + 1), 1000 * attempt);
            return;
          }

          // Update questions array
          setQuestions((prev) => {
            if (!prev) return [nextQ as QuestionItem];
            const newQuestions = [...prev];
            newQuestions[currentQuestionIndex + 1] = nextQ as QuestionItem;
            return newQuestions;
          });

          // Move to next question
          setCurrentQuestionIndex((prev) => prev + 1);
          setCurrentQuestionText(nextQ.text);
          setCurrentCategory(nextQ.category as AiInterviewQuestionCategory);
          setError(null);
          setSubmitAttempts(0);

          // Speak next question
          await speak(nextQ.text, response.audioUrl);
        } else {
          console.error("[useInterview] stopRecordingAndSubmit: Unexpected response format");
          setError("Unexpected response from server");
          setStatus("ERROR");
        }
      } catch (error: any) {
        console.error("[useInterview] stopRecordingAndSubmit: Error:", error);

        if (!isMountedRef.current) return;

        if (attempt >= 3) {
          setError(`Failed to submit answer: ${error.message || "Unknown error"}`);
          setStatus("ERROR");
        } else {
          // Retry
          console.log("[useInterview] stopRecordingAndSubmit: Retrying after error...");
          setTimeout(() => stopRecordingAndSubmit(attempt + 1), 1000 * attempt);
        }
      } finally {
        if (isMountedRef.current) {
          setCurrentTranscript("");
          committedTranscriptRef.current = "";
        }
      }
    },
    [
      status,
      sessionId,
      fullTranscript,
      currentQuestionIndex,
      currentCategory,
      questions,
      router,
      stopRecording,
    ]
  );

  // ============= Start Recording =============
  const startRecording = useCallback(() => {
    if (!speechRecognitionRef.current) {
      console.log("[useInterview] startRecording: No recognition available");
      if (isMountedRef.current) {
        setError("Speech recognition not available");
        setStatus("ERROR");
      }
      return;
    }

    if (recognitionActiveRef.current) {
      console.log("[useInterview] startRecording: Already active");
      return;
    }

    console.log("[useInterview] startRecording: Starting");
    setCurrentTranscript("");
    committedTranscriptRef.current = "";
    intentionalStopRef.current = false;
    setStatus("USER_LISTENING");
    setSilenceTimer(7);

    try {
      speechRecognitionRef.current.start();
      recognitionActiveRef.current = true;

      // Start silence timer
      const updateSilenceTimer = () => {
        if (!recognitionActiveRef.current) return;

        setSilenceTimer((prev) => {
          if (!recognitionActiveRef.current) return prev;

          if (prev <= 1) {
            const hasTranscript = committedTranscriptRef.current.trim().length > 0;

            if (hasTranscript) {
              console.log("[useInterview] startRecording: Silence timeout, submitting");
              stopRecordingAndSubmit();
              return 0;
            } else if (noSpeechCountRef.current >= 3) {
              console.log("[useInterview] startRecording: Max no-speech attempts");
              stopRecordingAndSubmit();
              return 0;
            } else {
              noSpeechCountRef.current++;
              console.log("[useInterview] startRecording: No speech, retry", noSpeechCountRef.current);
              stopRecording();
              setTimeout(startRecording, 1000);
              return 7;
            }
          }

          return prev - 1;
        });
      };

      silenceTimeoutRef.current = setInterval(updateSilenceTimer, 1000);
    } catch (e) {
      console.error("[useInterview] startRecording: Error:", e);
      if (isMountedRef.current) {
        setError("Failed to start recording. Check microphone permissions.");
        setStatus("ERROR");
      }
    }
  }, [stopRecordingAndSubmit, stopRecording]);

  // ============= Speak (TTS) =============
  const speak = useCallback(
    async (text: string, audioUrl?: string) => {
      if (!isMountedRef.current) {
        console.log("[useInterview] speak: Not mounted");
        return;
      }

      if (isSpeakingRef.current) {
        console.log("[useInterview] speak: Already speaking");
        return;
      }

      console.log("[useInterview] speak: Playing:", text.substring(0, 50));
      isSpeakingRef.current = true;
      setStatus("AI_SPEAKING");
      setCurrentQuestionText(text);

      // Add to transcript
      if (!fullTranscript.some((msg) => msg.text === text && msg.speaker === "AI")) {
        setFullTranscript((prev) => [...prev, { speaker: "AI", text, audioUrl }]);
      }

      const finishSpeaking = () => {
        console.log("[useInterview] speak: Finished, starting recording");
        isSpeakingRef.current = false;
        if (isMountedRef.current) {
          setStatus("USER_LISTENING");
          setError(null);
          setTimeout(startRecording, 500);
        }
      };

      try {
        if (window.speechSynthesis) {
          console.log("[useInterview] speak: Using browser TTS");
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          utterance.pitch = 1;
          utterance.volume = 1;

          utterance.onend = finishSpeaking;
          utterance.onerror = (err) => {
            console.error("[useInterview] speak: TTS error:", err);
            finishSpeaking();
          };

          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        } else {
          console.log("[useInterview] speak: No TTS, fallback");
          finishSpeaking();
        }
      } catch (err) {
        console.error("[useInterview] speak: Error:", err);
        finishSpeaking();
      }
    },
    [fullTranscript, startRecording]
  );

  // ============= Load Session =============
  const loadSession = useCallback(async () => {
    if (!sessionId || !isMountedRef.current || isSessionLoadedRef.current) {
      console.log("[useInterview] loadSession: Skipping", {
        sessionId: !!sessionId,
        mounted: isMountedRef.current,
        loaded: isSessionLoadedRef.current,
      });
      return;
    }

    console.log("[useInterview] loadSession: Loading session", sessionId);
    setLoading(true);
    setError(null);

    try {
      const session = await getInterviewSession(sessionId);
      console.log("[useInterview] loadSession: Session loaded:", session);

      if (!isMountedRef.current) return;

      const currentQ = session.questions[session.currentQuestionIndex];
      
      setQuestions(session.questions);
      setCurrentQuestionIndex(session.currentQuestionIndex);
      setCurrentQuestionText(currentQ?.text || "Loading...");
      setCurrentCategory(
        (currentQ?.category as AiInterviewQuestionCategory) ||
        AiInterviewQuestionCategory.INTRODUCTORY
      );
      setLoading(false);
      isSessionLoadedRef.current = true;

      // Start speaking current question
      await speak(currentQ?.text || "Let's continue the interview.", session.audioUrl);
    } catch (err: any) {
      console.error("[useInterview] loadSession: Error:", err);
      if (isMountedRef.current) {
        setError(err.message || "Failed to load session");
        setLoading(false);
        router.push("/practice/ai-interview");
      }
    }
  }, [sessionId, speak, router]);

  // ============= Load Session Effect =============
  useEffect(() => {
    if (!sessionId || phase !== "interview" || !isMountedRef.current) {
      return;
    }
    console.log("[useInterview] Effect: Triggering loadSession");
    loadSession();
  }, [sessionId, phase, loadSession]);

  // ============= Speech Recognition Setup =============
  useEffect(() => {
    console.log("[useInterview] STT: Initializing");

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.log("[useInterview] STT: Not supported");
      if (isMountedRef.current) {
        setError("Speech recognition not supported in this browser");
        setStatus("ERROR");
      }
      return;
    }

    if (!speechRecognitionRef.current) {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        console.log("[useInterview] STT: Started");
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let hasSpeech = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript.trim();
          const confidence = result[0].confidence || 0;

          if (transcript.length > 0 && confidence > 0.6) {
            hasSpeech = true;
          }

          if (result.isFinal) {
            committedTranscriptRef.current += transcript + " ";
          } else {
            interimTranscript += transcript + " ";
          }
        }

        if (hasSpeech) {
          noSpeechCountRef.current = 0;
          setSilenceTimer(7);

          // Reset silence timer
          if (silenceTimeoutRef.current) {
            clearInterval(silenceTimeoutRef.current);
          }

          silenceTimeoutRef.current = setInterval(() => {
            setSilenceTimer((prev) => {
              if (!recognitionActiveRef.current) return prev;

              if (prev <= 1) {
                const hasTranscript = committedTranscriptRef.current.trim().length > 0;

                if (hasTranscript) {
                  stopRecordingAndSubmit();
                  return 0;
                } else if (noSpeechCountRef.current >= 3) {
                  stopRecordingAndSubmit();
                  return 0;
                } else {
                  noSpeechCountRef.current++;
                  stopRecording();
                  setTimeout(startRecording, 1000);
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
        console.error("[useInterview] STT: Error:", event.error);
        recognitionActiveRef.current = false;

        if (silenceTimeoutRef.current) {
          clearInterval(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }

        if (event.error === "no-speech") {
          noSpeechCountRef.current++;
          if (noSpeechCountRef.current >= 3 && isMountedRef.current) {
            stopRecordingAndSubmit();
          } else if (isMountedRef.current) {
            setStatus("USER_LISTENING");
            setTimeout(startRecording, 1000);
          }
        } else if (isMountedRef.current) {
          setError(`Speech recognition error: ${event.error}`);
          setStatus("ERROR");
        }
      };

      recognition.onend = () => {
        console.log("[useInterview] STT: Ended");
        recognitionActiveRef.current = false;

        if (silenceTimeoutRef.current) {
          clearInterval(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }

        if (
          !intentionalStopRef.current &&
          status === "USER_LISTENING" &&
          isMountedRef.current
        ) {
          if (noSpeechCountRef.current < 3) {
            console.log("[useInterview] STT: Auto-restart");
            setTimeout(startRecording, 1000);
          } else {
            console.log("[useInterview] STT: Max attempts, submitting");
            stopRecordingAndSubmit();
          }
        }
      };

      speechRecognitionRef.current = recognition;
    }

    // Request microphone permission
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        console.log("[useInterview] STT: Mic permission granted");
        if (isMountedRef.current) {
          setMicPermission(true);
        }
      })
      .catch((err) => {
        console.error("[useInterview] STT: Mic permission denied:", err);
        if (isMountedRef.current) {
          setMicPermission(false);
          setStatus("ERROR");
          setError("Microphone access denied. Please enable permissions.");
        }
      });

    return () => {
      console.log("[useInterview] STT: Cleanup");
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.abort();
        speechRecognitionRef.current = null;
      }
      if (silenceTimeoutRef.current) {
        clearInterval(silenceTimeoutRef.current);
      }
    };
  }, [stopRecordingAndSubmit, startRecording, stopRecording, status]);

  // ============= Return Hook API =============
  return {
    // State
    phase,
    setPhase,
    status,
    isRecording,
    isAiSpeaking,
    isProcessing,
    micPermission,
    error,
    loading,
    questions,
    currentQuestionIndex,
    currentQuestionText,
    currentCategory,
    fullTranscript,
    currentTranscript,
    feedback,
    silenceTimer,
    submitAttempts,

    // Actions
    startSession,
    startRecording,
    stopRecording,
    stopRecordingAndSubmit,
    speak,
    setError,
    setLoading,
    setCurrentTranscript,
    setFeedback,
  };
}