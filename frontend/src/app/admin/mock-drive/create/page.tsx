import { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import CreateMockDriveForm from '@/components/mock-drives/admin/CreateMockDriveForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Create Mock Drive | Admin',
  description: 'Create a new mock placement drive',
};

export default function CreateMockDrivePage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Breadcrumb - Optional */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground transition-colors">
          Admin
        </Link>
        <span>/</span>
        <Link href="/admin/mock-drive" className="hover:text-foreground transition-colors">
          Mock Drives
        </Link>
        <span>/</span>
        <span className="text-foreground">Create</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/mock-drive">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Create Mock Drive</h1>
          <p className="text-muted-foreground mt-1">
            Set up a new mock placement drive for your students
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6">
        <CreateMockDriveForm />
      </Card>
    </div>
  );
}