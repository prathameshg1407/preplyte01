// frontend/src/app/history/aptitude/page.tsx

'use client';

import React, { useState, useEffect, memo } from 'react';
import {
  Loader2,
  ChevronDown,
  ServerCrash,
  Inbox,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

import {
  AptitudeHistory,
  AptitudeResponse,
  AptitudeResultDetail,
  Role,
} from '@/types';
import { getUserAptitudeHistory } from '@/lib/api';
import withAuth from '@/components/withAuth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

/**
 * A memoized, collapsible card component to display a single test response.
 * @param {object} props - The component props.
 * @param {AptitudeResponse} props.response - The aptitude test response data.
 */
const HistoryCard = memo(({ response }: { response: AptitudeResponse }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getScoreColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      {/* Card Header - Always visible and clickable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex-1">
          <p className="font-semibold text-primary">{response.type}</p>
          <p className="text-sm text-muted-foreground">
            Taken on {format(new Date(response.createdAt), 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-right">
            <p
              className={`text-2xl font-bold ${getScoreColor(
                response.percentage,
              )}`}
            >
              {response.percentage}%
            </p>
            <p className="text-xs text-muted-foreground">
              Score: {response.score}/{response.total}
            </p>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Collapsible Body - Shows detailed answers */}
      {isOpen && (
        <div className="p-4 border-t border-border bg-background">
          <h4 className="font-semibold mb-3 text-foreground">
            Detailed Results:
          </h4>
          <ul className="space-y-3">
            {response.answers.map(
              (answer: AptitudeResultDetail, index: number) => (
                <li
                  key={index}
                  className="p-3 bg-muted/50 rounded-md flex items-start gap-3"
                >
                  {answer.correct ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Your answer:{' '}
                      <span className="font-medium text-foreground">
                        {answer.userAnswer}
                      </span>
                    </p>
                    {!answer.correct && (
                      <p className="text-sm text-muted-foreground">
                        Correct answer:{' '}
                        <span className="font-medium text-green-500">
                          {answer.correctAnswer}
                        </span>
                      </p>
                    )}
                  </div>
                </li>
              ),
            )}
          </ul>
        </div>
      )}
    </div>
  );
});
HistoryCard.displayName = 'HistoryCard';

/**
 * The main page component to display the user's aptitude test history.
 * It handles fetching data and displaying loading, error, empty, and success states.
 */
function AptitudeHistoryPage() {
  const [history, setHistory] = useState<AptitudeHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await getUserAptitudeHistory();
        setHistory(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch aptitude history.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Your History...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center bg-destructive/10 border border-destructive rounded-lg p-4">
        <ServerCrash className="w-12 h-12 text-destructive" />
        <p className="mt-4 font-semibold text-destructive">An Error Occurred</p>
        <p className="text-sm text-destructive/80">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            Aptitude Test History
          </CardTitle>
          <CardDescription>
            {history && history.totalTestsTaken > 0
              ? `You have completed a total of ${history.totalTestsTaken} test(s).`
              : 'A record of all the aptitude tests you have completed.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!history || history.totalTestsTaken === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center border border-dashed rounded-lg p-4">
              <Inbox className="w-12 h-12 text-muted-foreground" />
              <p className="mt-4 font-semibold text-foreground">
                No History Found
              </p>
              <p className="text-sm text-muted-foreground">
                You haven't completed any aptitude tests yet.
              </p>
              <Link
                href="/practice/aptitude"
                className="mt-4 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Take a Test
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {history.responses.map((response) => (
                <HistoryCard key={response.id} response={response} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- ✅ SECURED: This page is now protected and only accessible by students ---
export default withAuth(AptitudeHistoryPage, [Role.STUDENT]);