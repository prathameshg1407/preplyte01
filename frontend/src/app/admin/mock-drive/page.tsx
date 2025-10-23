import { Suspense } from 'react';
import { Metadata } from 'next';
import { getAdminMockDrivesServer, getMockDriveStatsServer } from '@/lib/api/mock-drive.server';
import MockDriveList from '@/components/mock-drives/admin/MockDriveList';
import MockDriveStats from '@/components/mock-drives/admin/MockDriveStats';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mock Drives | Admin',
  description: 'Manage mock drives for your institution',
};

async function MockDriveStatsSection() {
  try {
    const stats = await getMockDriveStatsServer();
    return <MockDriveStats stats={stats} />;
  } catch (error) {
    console.error('Failed to load stats:', error);
    return null;
  }
}

async function MockDriveListSection({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 10;
  const status = searchParams.status as string | undefined;
  const search = searchParams.search as string | undefined;
  const isPublished = searchParams.isPublished === 'true' ? true : searchParams.isPublished === 'false' ? false : undefined;

  try {
    const mockDrives = await getAdminMockDrivesServer({
      page,
      limit,
      status: status as any,
      search,
      isPublished,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    return <MockDriveList initialData={mockDrives} />;
  } catch (error) {
    console.error('Failed to load mock drives:', error);
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Failed to load mock drives. Please try again later.
        </p>
      </Card>
    );
  }
}

function LoadingStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16" />
        </Card>
      ))}
    </div>
  );
}

function LoadingList() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </Card>
  );
}

export default function MockDrivePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mock Drives</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage mock placement drives for your students
          </p>
        </div>
        <Link href="/admin/mock-drive/create">
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Create Mock Drive
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <Suspense fallback={<LoadingStats />}>
        <MockDriveStatsSection />
      </Suspense>

      {/* Mock Drive List */}
      <Suspense fallback={<LoadingList />}>
        <MockDriveListSection searchParams={searchParams} />
      </Suspense>
    </div>
  );
}