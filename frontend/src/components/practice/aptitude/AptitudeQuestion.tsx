// src/components/practice/aptitude/AptitudeQuestion.tsx
'use client';

import React from "react";

import { AptitudeQuestion as AptitudeQuestionType } from "@/types";

interface AptitudeQuestionProps {
  question: AptitudeQuestionType;
  userAnswer: string;
  onAnswerSelect: (questionId: number, selectedOption: string) => void;
  questionNumber: number;
  totalQuestions: number;
}

const AptitudeQuestion: React.FC<AptitudeQuestionProps> = ({
  question,
  userAnswer,
  onAnswerSelect,
  questionNumber,
  totalQuestions,
}) => {
  return (
    <div className="space-y-6 animate-fade-in-down">
      <div>
        <p className="text-sm font-semibold text-primary mb-1">
          Question {questionNumber} of {totalQuestions}
        </p>
        <h2 className="text-lg font-semibold text-foreground">
          {question.question}
        </h2>
      </div>
      <div className="space-y-3">
        {question.options.map((option) => (
          <label
            key={option.id}
            htmlFor={`${question.id}-${option.id}`}
            className={`flex items-center space-x-4 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
              userAnswer === option.id
                ? "bg-primary/10 border-primary shadow-md"
                : "hover:bg-secondary/80 border-border"
            }`}
          >
            <input
              type="radio"
              id={`${question.id}-${option.id}`}
              name={`question-${question.id}`}
              value={option.id}
              checked={userAnswer === option.id}
              onChange={() => onAnswerSelect(question.id, option.id)}
              className="sr-only peer"
            />
            {/* Custom radio button circle */}
            <span className="flex items-center justify-center w-5 h-5 border-2 border-border rounded-full transition-all duration-200 peer-checked:border-primary">
              <span className={`w-2.5 h-2.5 rounded-full bg-primary transition-all duration-200 ${
                  userAnswer === option.id ? 'scale-100' : 'scale-0'
                }`}></span>
            </span>
            <span className="flex-1 text-foreground/90">{option.text}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default AptitudeQuestion;