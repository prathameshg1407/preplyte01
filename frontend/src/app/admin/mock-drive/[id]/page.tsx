import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAdminMockDriveServer } from '@/lib/api/mock-drive.server';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import MockDriveOverview from '@/components/mock-drives/admin/MockDriveOverview';
import BatchManagement from '@/components/mock-drives/admin/BatchManagement';
import RegistrationsList from '@/components/mock-drives/admin/RegistrationsList';
import { ResultsDashboard } from '@/components/mock-drives';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const mockDrive = await getAdminMockDriveServer(params.id);
    return {
      title: `${mockDrive.title} | Mock Drive Details`,
      description: mockDrive.description || 'View and manage mock drive settings',
    };
  } catch {
    return {
      title: 'Mock Drive Not Found',
    };
  }
}

async function MockDriveDetails({ id }: { id: string }) {
  const mockDrive = await getAdminMockDriveServer(id);
  
  if (!mockDrive) {
    notFound();
  }

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="batches">
          Batches
          {mockDrive._count?.registrations && (
            <span className="ml-2 text-xs">({mockDrive._count.registrations})</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="registrations">
          Registrations
          {mockDrive._count?.registrations && (
            <span className="ml-2 text-xs">({mockDrive._count.registrations})</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="results">
          Results
          {mockDrive._count?.attempts && (
            <span className="ml-2 text-xs">({mockDrive._count.attempts})</span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <MockDriveOverview mockDrive={mockDrive} />
      </TabsContent>

      <TabsContent value="batches" className="mt-6">
        <BatchManagement mockDriveId={id} />
      </TabsContent>

      <TabsContent value="registrations" className="mt-6">
        <RegistrationsList mockDriveId={id} />
      </TabsContent>

      <TabsContent value="results" className="mt-6">
        <ResultsDashboard mockDriveId={id} />
      </TabsContent>
    </Tabs>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full" />
      <Card className="p-6">
        <Skeleton className="h-64 w-full" />
      </Card>
    </div>
  );
}

export default function MockDriveDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/mock-drive">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mock Drive Details</h1>
          <p className="text-muted-foreground mt-1">
            View and manage mock drive settings
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <MockDriveDetails id={params.id} />
      </Suspense>
    </div>
  );
}