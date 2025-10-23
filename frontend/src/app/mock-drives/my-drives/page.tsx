import { Suspense } from 'react';
import { Metadata } from 'next';
import {
  getMyMockDriveRegistrationsServer,
  getMyMockDriveAttemptsServer,
  getMyMockDriveResultsServer,
} from '@/lib/api/mock-drive.server';
import MyMockDrivesList from '@/components/mock-drives/student/MyMockDrivesList';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'My Mock Drives | Preplyte',
  description: 'View your mock drive registrations, attempts, and results',
};

async function MyDrivesContent() {
  try {
    const [registrations, attempts, results] = await Promise.all([
      getMyMockDriveRegistrationsServer(),
      getMyMockDriveAttemptsServer(),
      getMyMockDriveResultsServer(),
    ]);

    return (
      <MyMockDrivesList
        registrations={registrations}
        attempts={attempts}
        results={results}
      />
    );
  } catch (error) {
    console.error('Failed to load my drives:', error);
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Failed to load your mock drives. Please try again later.
        </p>
      </Card>
    );
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </Card>
      ))}
    </div>
  );
}

export default function MyMockDrivesPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Mock Drives</h1>
        <p className="text-muted-foreground mt-2">
          Track your registrations, attempts, and results
        </p>
      </div>

      {/* Content */}
      <Suspense fallback={<LoadingSkeleton />}>
        <MyDrivesContent />
      </Suspense>
    </div>
  );
}