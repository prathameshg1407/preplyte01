'use client';

import React from 'react';
import { BookOpen, CheckSquare, Clock, HelpCircle, Settings, ChevronDown } from 'lucide-react';

// --- Reusable, non-shadcn components styled with Tailwind CSS ---

const CustomSelect = ({ id, value, onChange, children }: { id: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode }) => (
  <div className="relative w-full">
    <select
      id={id}
      value={value}
      onChange={onChange}
      className="appearance-none w-full bg-background border border-input rounded-md py-2 px-3 pr-8 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
    >
      {children}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
      <ChevronDown className="w-4 h-4" />
    </div>
  </div>
);

// --- Main Component ---

interface AptitudeInstructionsProps {
  onStartQuiz: () => void;
  type: string;
  setType: (type: string) => void;
  difficulty: string;
  setDifficulty: (difficulty: string) => void;
  questionCount: number;
  setQuestionCount: (count: number) => void;
}

const AptitudeInstructions: React.FC<AptitudeInstructionsProps> = ({ 
  onStartQuiz,
  type,
  setType,
  difficulty,
  setDifficulty,
  questionCount,
  setQuestionCount,
}) => {
  // Automatically set time limit based on question count (1 min per question)
  const timeLimitInMinutes = questionCount;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-block bg-primary/10 p-4 rounded-full mb-4">
          <BookOpen className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Aptitude Practice Test</h1>
        <p className="text-muted-foreground mt-2">
          Customize your test and read the instructions before you begin.
        </p>
      </div>

      {/* Settings Card */}
      <div className="bg-card border border-border rounded-lg shadow-sm mb-8">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
            <Settings className="w-6 h-6" />
            Quiz Settings
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium text-foreground">Category</label>
            <CustomSelect id="type" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="Quantitative">Quantitative</option>
                <option value="Logical_Reasoning">Logical Reasoning</option>
                <option value="Verbal">Verbal</option>
                <option value="Technical">Technical</option>
                <option value="Data_Interpretation">Data Interpretation</option>
            </CustomSelect>
          </div>
          <div className="space-y-2">
            <label htmlFor="difficulty" className="text-sm font-medium text-foreground">Difficulty</label>
            <CustomSelect id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
            </CustomSelect>
          </div>
          <div className="space-y-2">
            <label htmlFor="question-count" className="text-sm font-medium text-foreground">Number of Questions</label>
            <input
              id="question-count"
              type="number"
              value={questionCount}
              onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              min="1"
              max="50"
              className="w-full bg-background border border-input rounded-md py-2 px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Instructions Card */}
      <div className="bg-card border border-border rounded-lg shadow-sm">
        <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Instructions</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-foreground">Question Count</h3>
              <p className="text-muted-foreground text-sm">You will be presented with {questionCount} multiple-choice questions.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-foreground">Time Limit</h3>
              <p className="text-muted-foreground text-sm">You have {timeLimitInMinutes} minutes to complete the test. The timer starts when you begin.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <CheckSquare className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-foreground">Review Your Answers</h3>
              <p className="text-muted-foreground text-sm">After submitting, you can review your score and the correct answers.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={onStartQuiz}
          className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg px-8 py-3 text-lg font-semibold transition-colors bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
        >
          Start Quiz
        </button>
      </div>
    </div>
  );
};

export default AptitudeInstructions;
