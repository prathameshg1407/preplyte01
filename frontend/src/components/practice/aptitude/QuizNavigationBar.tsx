'use client';

import React from 'react';

import { UserAnswer } from '@/types';

interface QuizNavigationBarProps {
  totalQuestions: number;
  currentQuestionIndex: number;
  userAnswers: UserAnswer[];
  onQuestionSelect: (index: number) => void;
}

const QuizNavigationBar: React.FC<QuizNavigationBarProps> = ({
  totalQuestions,
  currentQuestionIndex,
  userAnswers,
  onQuestionSelect,
}) => {
  const getButtonClass = (index: number) => {
    const isCurrent = index === currentQuestionIndex;
    const isAnswered = userAnswers[index]?.selectedOption !== '';
    let classes =
      'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm transition-all duration-200 ';
    
    if (isCurrent) {
      classes += 'bg-primary text-primary-foreground scale-110 shadow-lg';
    } else if (isAnswered) {
      classes += 'bg-primary/20 text-primary hover:bg-primary/30';
    } else {
      classes += 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
    }
    return classes;
  };

  return (
    <div className="w-full bg-secondary/40 p-3 rounded-lg border border-border mb-6">
       <h3 className="text-sm font-semibold text-muted-foreground mb-3 text-center">Question Navigator</h3>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {Array.from({ length: totalQuestions }, (_, i) => (
          <button
            key={i}
            onClick={() => onQuestionSelect(i)}
            className={getButtonClass(i)}
            aria-label={`Go to question ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuizNavigationBar;