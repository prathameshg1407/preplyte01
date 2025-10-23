// components/mock-drives/student/MockDriveBrowser.tsx
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
import { Search, Calendar, Clock, Users, ArrowRight } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  getStatusColor,
  formatDateRange,
  formatDuration,
  formatTimeRemaining,
  isRegistrationOpen,
} from '@/lib/utils/mock-drive.helpers';
import type { MockDrivePaginatedResponse } from '@/types/mock-drive.types';
import Link from 'next/link';

interface MockDriveBrowserProps {
  initialData: MockDrivePaginatedResponse;
}

export default function MockDriveBrowser({ initialData }: MockDriveBrowserProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') || 'all'
  );

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    router.push(`/mock-drives?${params.toString()}`);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value !== 'all') {
      params.set('status', value);
    } else {
      params.delete('status');
    }
    params.set('page', '1');
    router.push(`/mock-drives?${params.toString()}`);
  };

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    return `/mock-drives?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
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

          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Drives</SelectItem>
              <SelectItem value="REGISTRATION_OPEN">Registration Open</SelectItem>
              <SelectItem value="ONGOING">Ongoing</SelectItem>
              <SelectItem value="UPCOMING">Upcoming</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Mock Drives Grid */}
      {initialData.data.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No mock drives found</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {initialData.data.map((drive) => (
              <Card key={drive.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg line-clamp-2">
                        {drive.title}
                      </h3>
                      <Badge className={getStatusColor(drive.status)}>
                        {drive.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    {drive.institution && (
                      <p className="text-sm text-muted-foreground">
                        by {drive.institution.name}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  {drive.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {drive.description}
                    </p>
                  )}

                  {/* Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {formatDateRange(
                          drive.registrationStartDate,
                          drive.registrationEndDate
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Duration: {formatDuration(drive.duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {drive._count?.registrations || 0} registered
                      </span>
                    </div>
                  </div>

                  {/* Registration Status */}
                  {isRegistrationOpen(drive) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                      <p className="text-sm text-green-800 text-center">
                        Registration closes{' '}
                        {formatTimeRemaining(drive.registrationEndDate)}
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <Link href={`/mock-drives/${drive.id}`}>
                    <Button className="w-full">
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {initialData.meta.totalPages > 1 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing{' '}
                  {((initialData.meta.page - 1) * initialData.meta.limit) + 1} to{' '}
                  {Math.min(
                    initialData.meta.page * initialData.meta.limit,
                    initialData.meta.total
                  )}{' '}
                  of {initialData.meta.total} results
                </p>

                <Pagination>
                  <PaginationContent>
                    {initialData.meta.page > 1 && (
                      <PaginationItem>
                        <PaginationPrevious
                          href={buildPageUrl(initialData.meta.page - 1)}
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
                                href={buildPageUrl(page)}
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
                          href={buildPageUrl(initialData.meta.page + 1)}
                        />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}