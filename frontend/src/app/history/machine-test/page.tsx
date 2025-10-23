// frontend/src/app/history/coding/page.tsx

'use client';

import React, { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import {
  Loader2,
  ServerCrash,
  Inbox,
  Code,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';

import { getMachineTestHistory } from '@/lib/api';
import { MachineTestHistory, MachineTestHistoryItem, Role } from '@/types';
import withAuth from '@/components/withAuth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

/**
 * A memoized, collapsible card component to display one machine test history entry.
 * @param {object} props - The component props.
 * @param {MachineTestHistoryItem} props.test - A single machine test summary object.
 */
const MachineTestHistoryCard = memo(
  ({ test }: { test: MachineTestHistoryItem }) => {
    const [isOpen, setIsOpen] = useState(false);

    const getSummaryColor = (passed: number, total: number) => {
      if (total === 0) return 'text-muted-foreground';
      const passRate = passed / total;
      if (passRate >= 0.75) return 'text-green-500';
      if (passRate >= 0.5) return 'text-yellow-500';
      return 'text-red-500';
    };

    const summaryColor = getSummaryColor(test.problemsPassed, test.problemsCount);

    return (
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
          aria-expanded={isOpen}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              <p className="font-semibold text-primary">
                Machine Test #{test.id}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Taken on {format(new Date(test.completedAt), 'MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-right">
              <p className={`text-2xl font-bold ${summaryColor}`}>
                {test.problemsPassed}/{test.problemsCount}
              </p>
              <p className="text-xs text-muted-foreground">Problems Passed</p>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {isOpen && (
          <div className="p-4 border-t border-border bg-background">
            <h4 className="font-semibold mb-3 text-foreground">Test Summary:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Passed:{' '}
                  <span className="font-medium text-green-500">
                    {test.problemsPassed}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Failed:{' '}
                  <span className="font-medium text-red-500">
                    {test.problemsFailed}
                  </span>
                </p>
              </div>
            </div>
            <Link
              href={`/practice/machine-test/${test.id}`}
              className="mt-4 w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Review Test
            </Link>
          </div>
        )}
      </div>
    );
  },
);
MachineTestHistoryCard.displayName = 'MachineTestHistoryCard';

/**
 * The main page component to display the user's machine test history.
 */
function MachineTestHistoryPage() {
  const [history, setHistory] = useState<MachineTestHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await getMachineTestHistory();
        setHistory(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch machine test history.');
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
        <p className="mt-4 text-muted-foreground">
          Loading Your Machine Test History...
        </p>
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
            Machine Test History
          </CardTitle>
          <CardDescription>
            {history && history.totalTestsTaken > 0
              ? `You have completed a total of ${history.totalTestsTaken} test(s).`
              : 'A record of all the machine tests you have completed.'}
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
                You haven't completed any machine tests yet.
              </p>
              <Link
                href="/practice/coding"
                className="mt-4 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Take a Machine Test
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {history.history.map((test) => (
                <MachineTestHistoryCard key={test.id} test={test} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- ✅ SECURED: This page is now protected and only accessible by students ---
export default withAuth(MachineTestHistoryPage, [Role.STUDENT]);