'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';

import {
  AptitudeQuestion as AptitudeQuestionType,
  UserAnswer,
  AptitudeResults as AptitudeResultsType,
  GetRandomQuestionsParams,
} from '@/types';
import { getRandomAptitudeQuestions, submitAptitudeTest } from '@/lib/api/aptitude.client';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import AptitudeInstructions from '@/components/practice/aptitude/AptitudeInstructions';
import AptitudeQuestion from '@/components/practice/aptitude/AptitudeQuestion';
import AptitudeResults from '@/components/practice/aptitude/AptitudeResults';
import QuizNavigationBar from '@/components/practice/aptitude/QuizNavigationBar';
import ConfirmSubmitModal from '@/components/practice/aptitude/ConfirmSubmitModal';;

type QuizStatus = 'configuring' | 'loading' | 'in-progress' | 'submitting' | 'finished' | 'error';

// --- Component Props Interface ---
// FIX: Define the props for the component to accept initialQuestions.
interface AptitudeQuizClientProps {
  initialQuestions: AptitudeQuestionType[];
}

// --- UI Helper Components & Functions ---
const primaryButtonClasses = 'inline-flex items-center justify-center rounded-lg px-6 py-2 text-md font-semibold transition-colors bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed';
const outlineButtonClasses = 'inline-flex items-center justify-center rounded-lg px-6 py-2 text-md font-semibold transition-colors bg-transparent border border-input text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
// --- End of UI Helpers ---

// FIX: The component now accepts props.
export default function AptitudeQuizClient({ initialQuestions }: AptitudeQuizClientProps) {
  const [status, setStatus] = useState<QuizStatus>('configuring');
  
  // FIX: Initialize the questions state with the data passed from the server.
  const [questions, setQuestions] = useState<AptitudeQuestionType[]>(initialQuestions);
  
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [results, setResults] = useState<AptitudeResultsType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);

  // State for quiz settings, with defaults matching the initial server fetch.
  const [quizType, setQuizType] = useState('Quantitative');
  const [quizDifficulty, setQuizDifficulty] = useState('Medium');
  const [quizQuestionCount, setQuizQuestionCount] = useState(10);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const performSubmit = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    setStatus('submitting');
    setError(null);
    try {
      const resultData = await submitAptitudeTest({
        type: `${quizType} - ${quizDifficulty}`,
        answers: userAnswers,
        totalQuestions: questions.length,
      });
      setResults(resultData);
      setStatus('finished');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to submit your answers: ${errorMessage}`);
      setStatus('error');
    }
  }, [userAnswers, questions.length, quizType, quizDifficulty]);

  const handleSubmit = useCallback(() => {
    const unansweredCount = questions.length - userAnswers.filter(a => a.selectedOption).length;
    if (unansweredCount > 0) {
      setConfirmModalOpen(true);
    } else {
      performSubmit();
    }
  }, [questions, userAnswers, performSubmit]);
  
  // This effect manages the countdown timer.
  useEffect(() => {
    if (status === 'in-progress' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeRemaining <= 0 && status === 'in-progress') {
      if (timerRef.current) clearInterval(timerRef.current);
      performSubmit(); // Auto-submit when time runs out
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, timeRemaining, performSubmit]);

  const startQuiz = useCallback(async (useInitial: boolean = false) => {
    setStatus('loading');
    setError(null);
    try {
      let fetchedQuestions: AptitudeQuestionType[];

      if (useInitial) {
        // Use the questions already provided by the server
        fetchedQuestions = initialQuestions;
      } else {
        // Fetch new questions because the user changed the settings
        const params: GetRandomQuestionsParams = {
          tags: [quizType],
          difficulty: quizDifficulty.toUpperCase() as any,
        };
        fetchedQuestions = await getRandomAptitudeQuestions(quizQuestionCount, params);
      }
      
      if (!fetchedQuestions || fetchedQuestions.length === 0) {
        throw new Error("No questions found for the selected criteria. Please try different settings.");
      }

      setQuestions(fetchedQuestions);
      setUserAnswers(
        fetchedQuestions.map((q) => ({ questionId: q.id, selectedOption: '' })),
      );
      setTimeRemaining(fetchedQuestions.length * 60); // 1 minute per question
      setCurrentQuestionIndex(0);
      setStatus('in-progress');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      setStatus('error');
    }
  }, [quizType, quizDifficulty, quizQuestionCount, initialQuestions]);

  const handleRestart = () => {
    setStatus('configuring');
    setResults(null);
    setQuestions(initialQuestions); // Reset to initial questions
    setUserAnswers([]);
    setCurrentQuestionIndex(0);
    setError(null);
    setConfirmModalOpen(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleAnswerSelect = (questionId: number, selectedOption: string) => {
    setUserAnswers((prevAnswers) => {
      const otherAnswers = prevAnswers.filter((ans) => ans.questionId !== questionId);
      return [...otherAnswers, { questionId, selectedOption }];
    });
  };

  const handleQuestionSelect = (index: number) => { setCurrentQuestionIndex(index); };
  const handleNext = () => { if (currentQuestionIndex < questions.length - 1) { setCurrentQuestionIndex(currentQuestionIndex + 1); } };
  const handlePrevious = () => { if (currentQuestionIndex > 0) { setCurrentQuestionIndex(currentQuestionIndex - 1); } };

  const renderContent = () => {
    switch (status) {
      case 'configuring':
        return (
          <AptitudeInstructions
            onStartQuiz={() => startQuiz(
              // Determine if we need to fetch new questions or use the initial ones
              quizType === 'Quantitative' && quizDifficulty === 'Medium' && quizQuestionCount === 10
            )}
            type={quizType}
            setType={setQuizType}
            difficulty={quizDifficulty}
            setDifficulty={setQuizDifficulty}
            questionCount={quizQuestionCount}
            setQuestionCount={setQuizQuestionCount}
          />
        );
      case 'loading':
        return <LoadingSpinner message="Generating your custom quiz..." />;
      case 'in-progress':
        if (!questions || questions.length === 0) {
           return <ErrorMessage title="Quiz Error" message="No questions available to display." onDismiss={handleRestart} />
        }
        return (
          <>
            <ConfirmSubmitModal
              isOpen={isConfirmModalOpen}
              onClose={() => setConfirmModalOpen(false)}
              onConfirm={() => { setConfirmModalOpen(false); performSubmit(); }}
              unansweredCount={questions.length - userAnswers.filter(a => a.selectedOption).length}
            />
            <div className="w-full">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">Aptitude Practice</h2>
                <div className="flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1 text-lg font-semibold text-secondary-foreground">
                  <Timer size={20} />
                  <span>{formatTime(timeRemaining)}</span>
                </div>
              </div>
              <AptitudeQuestion
                question={questions[currentQuestionIndex]}
                userAnswer={userAnswers.find((a) => a.questionId === questions[currentQuestionIndex].id)?.selectedOption || ""}
                onAnswerSelect={handleAnswerSelect}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={questions.length}
              />
              <div className="mt-8">
                <QuizNavigationBar
                  totalQuestions={questions.length}
                  currentQuestionIndex={currentQuestionIndex}
                  userAnswers={userAnswers}
                  onQuestionSelect={handleQuestionSelect}
                />
              </div>
              <div className="mt-6 flex items-center justify-between">
                <button onClick={handlePrevious} disabled={currentQuestionIndex === 0} className={outlineButtonClasses}>Previous</button>
                {currentQuestionIndex === questions.length - 1 ? (
                  <button onClick={handleSubmit} className={primaryButtonClasses}>Submit Test</button>
                ) : (
                  <button onClick={handleNext} className={primaryButtonClasses}>Next</button>
                )}
              </div>
            </div>
          </>
        );
      case 'submitting':
        return <LoadingSpinner message="Submitting your answers..." />;
      case 'finished':
        return results ? (
          <AptitudeResults results={results} questions={questions} onRestart={handleRestart} />
        ) : (
          <ErrorMessage title="Display Error" message="Could not display results." onDismiss={handleRestart} />
        );
      case 'error':
        return (
          <ErrorMessage
            title="An Error Occurred"
            message={error || "Something went wrong."}
            onDismiss={handleRestart}
          />
        );
      default:
        return null;
    }
  };

  return (
    <main className="container mx-auto flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl rounded-xl border border-border bg-card p-6 shadow-lg sm:p-8">
        {renderContent()}
      </div>
    </main>
  );
}
