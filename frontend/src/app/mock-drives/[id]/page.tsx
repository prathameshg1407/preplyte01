import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStudentMockDriveServer } from '@/lib/api/mock-drive.server';
import MockDriveDetailView from '@/components/mock-drives/student/MockDriveDetailView';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const mockDrive = await getStudentMockDriveServer(params.id);
    return {
      title: `${mockDrive.title} | Mock Drives`,
      description: mockDrive.description || 'Mock placement drive details',
    };
  } catch (error) {
    return {
      title: 'Mock Drive | Preplyte',
    };
  }
}

async function MockDriveContent({ id }: { id: string }) {
  try {
    const mockDrive = await getStudentMockDriveServer(id);
    return <MockDriveDetailView mockDrive={mockDrive} />;
  } catch (error) {
    console.error('Failed to load mock drive:', error);
    notFound();
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <Skeleton className="h-64 w-full" />
        </Card>
        <Card className="p-6">
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    </div>
  );
}

export default function MockDriveDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Back Button */}
      <Link href="/mock-drives">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Mock Drives
        </Button>
      </Link>

      {/* Content */}
      <Suspense fallback={<LoadingSkeleton />}>
        <MockDriveContent id={params.id} />
      </Suspense>
    </div>
  );
}