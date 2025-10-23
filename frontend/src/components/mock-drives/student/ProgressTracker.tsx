'use client';

import { Progress } from '@/components/ui/progress';

export default function ProgressTracker({ completed, total }: { completed: number; total: number }) {
  const value = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="text-sm text-muted-foreground">Progress</p>
        <p className="font-semibold">
          {completed} / {total} Components
        </p>
      </div>
      <div className="w-32">
        <Progress value={value} className="h-2" />
      </div>
    </div>
  );
}