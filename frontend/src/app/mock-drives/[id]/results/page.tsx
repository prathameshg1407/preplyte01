'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { getMockDriveResult } from '@/lib/api/mock-drive.client';
import type { MockDriveResult } from '@/types/mock-drive.types';

export default function AttemptResultPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const attemptId = search.get('attemptId') || '';

  const [result, setResult] = useState<MockDriveResult | null>(null);

  useEffect(() => {
    if (attemptId) {
      getMockDriveResult(attemptId).then(setResult).catch(() => setResult(null));
    }
  }, [attemptId]);

  if (!result) {
    return <div className="p-6">Loading result...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-2">Mock Drive Result</h1>
        <p className="text-muted-foreground">Total Score: {Number(result.totalScore).toFixed(1)} / {Number(result.totalMaxScore).toFixed(1)}</p>
        <p className="text-muted-foreground">Percentage: {Number(result.percentage).toFixed(2)}%</p>
      </Card>
      {result.detailedReport && (
        <Card className="p-6">
          <h2 className="font-semibold mb-2">Breakdown</h2>
          <pre className="text-sm bg-muted p-3 rounded overflow-auto">{JSON.stringify(result.detailedReport, null, 2)}</pre>
        </Card>
      )}
    </div>
  );
}