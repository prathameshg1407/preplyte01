// src/app/practice/aptitude/page.tsx

import { getRandomAptitudeQuestionsServer } from '@/lib/api/aptitude.server';
import AptitudeQuizClient from '@/components/practice/aptitude/AptitudeQuizClient';
import { AptitudeQuestion, QuestionDifficulty } from '@/types';
import { ShieldAlert } from 'lucide-react';

const APTITUDE_QUESTION_COUNT = 10;

// A simple, self-contained error component for this page
const ErrorMessage = ({ title, message }: { title: string, message: string }) => (
    <div className="flex flex-col items-center justify-center text-destructive p-4 bg-destructive/10 rounded-lg">
        <ShieldAlert className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold">{title}</h2>
        <p>{message}</p>
    </div>
);

/**
 * This is a Next.js Server Component that fetches the initial quiz data.
 */
export default async function AptitudePracticePage() {
  try {
    const initialQuestions: AptitudeQuestion[] = await getRandomAptitudeQuestionsServer(
      APTITUDE_QUESTION_COUNT,
      {
        tags: ['Quantitative'],
        difficulty: QuestionDifficulty.MEDIUM,
      },
    );

    return <AptitudeQuizClient initialQuestions={initialQuestions} />;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';

    return (
      <main className="container mx-auto flex min-h-screen items-center justify-center">
        <ErrorMessage
          title="Failed to Load Quiz"
          message={errorMessage}
        />
      </main>
    );
  }
}