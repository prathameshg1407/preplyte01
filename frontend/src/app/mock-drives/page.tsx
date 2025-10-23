// app/mock-drives/page.tsx
import { Suspense } from 'react';
import { Metadata } from 'next';
import { getStudentMockDrivesServer } from '@/lib/api/mock-drive.server';
import MockDriveBrowser from '@/components/mock-drives/student/MockDriveBrowser';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Mock Drives | Preplyte',
  description: 'Browse and register for mock placement drives',
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter skeleton */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
      </Card>

      {/* Grid skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-4">
              <div>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-16" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Separate async component for data fetching
async function MockDrivesList({
  page,
  limit,
  status,
  search,
}: {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}) {
  try {
    const mockDrives = await getStudentMockDrivesServer({
      page,
      limit,
      status: status as any,
      search,
      sortBy: 'driveStartDate',
      sortOrder: 'asc',
    });

    return <MockDriveBrowser initialData={mockDrives} />;
  } catch (error) {
    console.error('Failed to load mock drives:', error);
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Failed to load mock drives. Please try again later.
        </p>
      </Card>
    );
  }
}

// Main page component
export default function MockDrivesPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 12;
  const status = searchParams?.status as string | undefined;
  const search = searchParams?.search as string | undefined;

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mock Placement Drives</h1>
        <p className="text-muted-foreground mt-2">
          Practice with realistic mock drives to prepare for actual placements
        </p>
      </div>

      {/* Mock Drives List */}
      <Suspense fallback={<LoadingSkeleton />}>
        <MockDrivesList 
          page={page} 
          limit={limit} 
          status={status} 
          search={search} 
        />
      </Suspense>
    </div>
  );
}