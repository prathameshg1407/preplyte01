'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle, XCircle, Award, RotateCw, ChevronDown, BarChart2, Edit3 } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';

import { AptitudeResults as AptitudeResultsType, AptitudeQuestion as AptitudeQuestionType } from '@/types';
import 'react-circular-progressbar/dist/styles.css';

interface AptitudeResultsProps {
  results: AptitudeResultsType;
  questions: AptitudeQuestionType[];
  onRestart: () => void;
}

// A single item for the accordion review list
const ReviewItem = ({
  res,
  question,
  index,
  isOpen,
  onToggle,
}: {
  res: AptitudeResultsType['results'][0];
  question: AptitudeQuestionType;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const userAnswerText = res.userAnswer || 'Not answered';
  const correctAnswerText = res.correctAnswer;

  return (
    <div className="rounded-lg border border-border bg-secondary/40 transition-all duration-300">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left"
        aria-expanded={isOpen}
      >
        <p className="flex-1 font-semibold text-foreground">
          <span className="mr-2 text-primary">{index + 1}.</span>
          {question.question}
        </p>
        <div className="flex items-center gap-4 pl-4">
          {res.correct ? (
            <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-500" />
          ) : (
            <XCircle className="h-6 w-6 flex-shrink-0 text-destructive" />
          )}
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      {isOpen && (
        <div className="animate-fade-in-down border-t border-border p-4">
          {!res.correct && (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-destructive">Your answer: </span>
                <span className="line-through">{userAnswerText}</span>
              </p>
              <p>
                <span className="font-semibold text-green-600">Correct answer: </span>
                <span>{correctAnswerText}</span>
              </p>
            </div>
          )}
          {res.correct && (
             <p className="text-sm text-muted-foreground">You answered this question correctly!</p>
          )}
        </div>
      )}
    </div>
  );
};

const AptitudeResults: React.FC<AptitudeResultsProps> = ({
  results,
  questions,
  onRestart,
}) => {
  const [openItem, setOpenItem] = useState<number | null>(null);
  const { score, total, percentage, results: detailedResults } = results;

  const questionsMap = useMemo(() => new Map(questions.map(q => [q.id, q])), [questions]);
  
  // FIX: Calculate the number of attempted questions from the results.
  const attemptedQuestions = useMemo(() => 
    detailedResults.filter(res => res.userAnswer !== 'Not answered').length,
    [detailedResults]
  );

  const getPerformanceMessage = () => {
    if (percentage >= 80) return "Excellent work! You have a strong grasp of these concepts.";
    if (percentage >= 60) return "Good job! A little more practice and you'll be an expert.";
    return "Keep practicing! Every attempt helps you improve.";
  };

  return (
    <div className="w-full animate-fade-in-down">
      <div className="text-center">
        <div className="mb-4 inline-block bg-primary/10 p-4 rounded-full">
          <Award className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Quiz Completed!</h1>
        <p className="mt-2 text-muted-foreground">{getPerformanceMessage()}</p>
      </div>

      {/* Score and Stats Section */}
      <div className="my-8 grid grid-cols-1 gap-8 rounded-xl border border-border bg-secondary/40 p-6 md:grid-cols-2">
        <div className="flex flex-col items-center justify-center">
          <h2 className="mb-4 text-lg font-semibold text-muted-foreground">Overall Score</h2>
          <div style={{ width: 150, height: 150 }}>
            <CircularProgressbar
              value={percentage}
              text={`${Math.round(percentage)}%`}
              styles={buildStyles({
                textColor: 'hsl(var(--foreground))',
                pathColor: 'hsl(var(--primary))',
                trailColor: 'hsl(var(--border))',
                textSize: '20px',
              })}
            />
          </div>
        </div>
        <div className="flex flex-col justify-center space-y-4">
           <h2 className="mb-2 text-center text-lg font-semibold text-muted-foreground md:text-left">Statistics</h2>
           <div className="flex items-center justify-between rounded-lg bg-background p-3">
            <span className="font-semibold">Total Questions</span>
            <span className="font-bold text-primary">{total}</span>
          </div>
          {/* FIX: Added the "Attempted Questions" stat */}
           <div className="flex items-center justify-between rounded-lg bg-background p-3">
            <span className="font-semibold">Attempted Questions</span>
            <span className="font-bold text-foreground">{attemptedQuestions}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-background p-3">
            <span className="font-semibold">Correct Answers</span>
            <span className="font-bold text-green-500">{score}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-background p-3">
            <span className="font-semibold">Incorrect Answers</span>
            <span className="font-bold text-destructive">{attemptedQuestions - score}</span>
          </div>
        </div>
      </div>
      
      {/* Answer Review Section */}
      <div>
        <h3 className="mb-4 text-xl font-bold">Review Your Answers</h3>
        <div className="space-y-3">
          {detailedResults.map((res, index) => {
            const question = questionsMap.get(res.questionId);
            if (!question) return null;
            return (
              <ReviewItem
                key={index}
                res={res}
                question={question}
                index={index}
                isOpen={openItem === index}
                onToggle={() => setOpenItem(openItem === index ? null : index)}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-10 text-center">
        <button
          onClick={onRestart}
          className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg px-8 py-3 text-lg font-semibold transition-all duration-300 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-100"
        >
          <RotateCw className="h-5 w-5 mr-2" />
          Practice Again
        </button>
      </div>
    </div>
  );
};

export default AptitudeResults;
