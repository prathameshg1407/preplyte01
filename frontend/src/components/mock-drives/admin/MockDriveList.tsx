// components/admin/mock-drives/MockDriveList.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  deleteMockDrive,
  publishMockDrive,
  unpublishMockDrive,
} from '@/lib/api/mock-drive.client';
import {
  getStatusColor,
  formatDateRange,
  formatDuration,
} from '@/lib/utils/mock-drive.helpers';
import type { MockDrivePaginatedResponse } from '@/types/mock-drive.types';
import Link from 'next/link';

interface MockDriveListProps {
  initialData: MockDrivePaginatedResponse;
}

export default function MockDriveList({ initialData }: MockDriveListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') || 'all'
  );
  const [publishedFilter, setPublishedFilter] = useState(
    searchParams.get('isPublished') || 'all'
  );

  const buildUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    return `/admin/mock-drive?${params.toString()}`;
  };

  const handleSearch = () => {
    router.push(buildUrl({ search, page: '1' }));
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    router.push(buildUrl({ status: value, page: '1' }));
  };

  const handlePublishedFilter = (value: string) => {
    setPublishedFilter(value);
    router.push(buildUrl({ isPublished: value, page: '1' }));
  };

  const handleDelete = async () => {
    if (!selectedDriveId) return;

    setIsDeleting(selectedDriveId);
    try {
      await deleteMockDrive(selectedDriveId);
      toast({
        title: 'Success',
        description: 'Mock drive deleted successfully',
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete mock drive',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
      setDeleteDialogOpen(false);
      setSelectedDriveId(null);
    }
  };

  const handlePublish = async (id: string, currentStatus: boolean) => {
    setIsPublishing(id);
    try {
      if (currentStatus) {
        await unpublishMockDrive(id);
        toast({
          title: 'Success',
          description: 'Mock drive unpublished successfully',
        });
      } else {
        await publishMockDrive(id);
        toast({
          title: 'Success',
          description: 'Mock drive published successfully',
        });
      }
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update mock drive',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search mock drives..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="REGISTRATION_OPEN">Registration Open</SelectItem>
                <SelectItem value="REGISTRATION_CLOSED">Registration Closed</SelectItem>
                <SelectItem value="ONGOING">Ongoing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={publishedFilter} onValueChange={handlePublishedFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Published" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Published</SelectItem>
                <SelectItem value="false">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Registrations</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">No mock drives found</p>
                </TableCell>
              </TableRow>
            ) : (
              initialData.data.map((drive) => (
                <TableRow key={drive.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{drive.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {drive.description?.substring(0, 60)}
                        {drive.description && drive.description.length > 60
                          ? '...'
                          : ''}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(drive.status)}>
                      {drive.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">
                        {new Date(drive.driveStartDate).toLocaleDateString()}
                      </p>
                      <p className="text-muted-foreground">
                        {formatDateRange(
                          drive.registrationStartDate,
                          drive.registrationEndDate
                        )}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDuration(drive.duration)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">
                        {drive._count.registrations} registered
                      </p>
                      <p className="text-muted-foreground">
                        {drive._count.attempts} attempts
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={drive.isPublished ? 'default' : 'outline'}
                      onClick={() => handlePublish(drive.id, drive.isPublished)}
                      disabled={isPublishing === drive.id}
                    >
                      {isPublishing === drive.id ? (
                        'Loading...'
                      ) : drive.isPublished ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Published
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          Draft
                        </>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/mock-drive/${drive.id}`}>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/mock-drive/${drive.id}/edit`}>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedDriveId(drive.id);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={drive._count.attempts > 0}
                        title={
                          drive._count.attempts > 0
                            ? 'Cannot delete drive with attempts'
                            : 'Delete drive'
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {initialData.meta.totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination>
              <PaginationContent>
                {initialData.meta.page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href={buildUrl({ page: String(initialData.meta.page - 1) })}
                    />
                  </PaginationItem>
                )}

                {Array.from(
                  { length: initialData.meta.totalPages },
                  (_, i) => i + 1
                )
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === initialData.meta.totalPages ||
                      Math.abs(page - initialData.meta.page) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    const prevPage = array[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;

                    return (
                      <div key={page} className="flex items-center">
                        {showEllipsis && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            href={buildUrl({ page: String(page) })}
                            isActive={page === initialData.meta.page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      </div>
                    );
                  })}

                {initialData.meta.page < initialData.meta.totalPages && (
                  <PaginationItem>
                    <PaginationNext
                      href={buildUrl({ page: String(initialData.meta.page + 1) })}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the mock
              drive and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}