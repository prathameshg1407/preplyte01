'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Download, Award, TrendingUp, Users, BarChart3 } from 'lucide-react';
import {
  getMockDriveAttempts,
  getMockDriveAttemptStats,
  publishMockDriveRankings,
} from '@/lib/api/mock-drive.client';
import type { MockDriveAttemptStats } from '@/types/mock-drive.types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import PublishRankingsDialog from './PublishRankingsDialog';

interface ResultsDashboardProps {
  mockDriveId: string;
}

export default function ResultsDashboard({ mockDriveId }: ResultsDashboardProps) {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [stats, setStats] = useState<MockDriveAttemptStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const limit = 10;
   const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [attemptsResponse, statsData] = await Promise.all([
        getMockDriveAttempts(mockDriveId, {
          page,
          limit,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
        getMockDriveAttemptStats(mockDriveId),
      ]);

      setAttempts(attemptsResponse.data);
      setTotalPages(attemptsResponse.meta.totalPages);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load results:', error);
      toast({
        title: 'Error',
        description: 'Failed to load results',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [mockDriveId, page, statusFilter]);

  const exportResults = () => {
    // TODO: Implement CSV export
    toast({
      title: 'Export',
      description: 'Exporting results to CSV...',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Attempts
                </p>
                <p className="text-3xl font-bold mt-2">{stats.totalAttempts}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed
                </p>
                <p className="text-3xl font-bold mt-2">
                  {stats.completedAttempts}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalAttempts > 0
                    ? Math.round(
                        (stats.completedAttempts / stats.totalAttempts) * 100
                      )
                    : 0}
                  % completion
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Average Score
                </p>
                <p className="text-3xl font-bold mt-2">
                  {stats.averageScore?.toFixed(1) || '-'}%
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Highest Score
                </p>
                <p className="text-3xl font-bold mt-2">
                  {stats.highestScore?.toFixed(1) || '-'}%
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Award className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Actions */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="ABANDONED">Abandoned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={exportResults}>
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>

            <Button onClick={() => setPublishDialogOpen(true)}>
              <Award className="h-4 w-4 mr-2" />
              Publish Rankings
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started At</TableHead>
              <TableHead>Completed At</TableHead>
              <TableHead>Aptitude</TableHead>
              <TableHead>Machine Test</TableHead>
              <TableHead>AI Interview</TableHead>
              <TableHead>Total Score</TableHead>
              <TableHead>Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attempts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <p className="text-muted-foreground">No attempts found</p>
                </TableCell>
              </TableRow>
            ) : (
              attempts.map((attempt) => (
                <TableRow key={attempt.id}>
                  <TableCell className="font-medium">
                    {attempt.user?.profile?.fullName || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        attempt.status === 'COMPLETED'
                          ? 'default'
                          : attempt.status === 'IN_PROGRESS'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {attempt.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(attempt.startedAt), 'PP p')}
                  </TableCell>
                  <TableCell>
                    {attempt.completedAt
                      ? format(new Date(attempt.completedAt), 'PP p')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {attempt.result?.aptitudeScore !== undefined &&
                    attempt.result?.aptitudeMaxScore ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {attempt.result.aptitudeScore.toFixed(1)} /{' '}
                          {attempt.result.aptitudeMaxScore}
                        </p>
                        <Progress
                          value={
                            (attempt.result.aptitudeScore /
                              attempt.result.aptitudeMaxScore) *
                            100
                          }
                          className="h-1"
                        />
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {attempt.result?.machineTestScore !== undefined &&
                    attempt.result?.machineTestMaxScore ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {attempt.result.machineTestScore.toFixed(1)} /{' '}
                          {attempt.result.machineTestMaxScore}
                        </p>
                        <Progress
                          value={
                            (attempt.result.machineTestScore /
                              attempt.result.machineTestMaxScore) *
                            100
                          }
                          className="h-1"
                        />
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {attempt.result?.aiInterviewScore !== undefined &&
                    attempt.result?.aiInterviewMaxScore ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {attempt.result.aiInterviewScore.toFixed(1)} /{' '}
                          {attempt.result.aiInterviewMaxScore}
                        </p>
                        <Progress
                          value={
                            (attempt.result.aiInterviewScore /
                              attempt.result.aiInterviewMaxScore) *
                            100
                          }
                          className="h-1"
                        />
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {attempt.result ? (
                      <p className="font-semibold">
                        {attempt.result.totalScore.toFixed(1)} /{' '}
                        {attempt.result.totalMaxScore}
                      </p>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {attempt.result ? (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {attempt.result.percentage.toFixed(1)}%
                        </span>
                        <Progress
                          value={parseFloat(attempt.result.percentage.toFixed(1))}
                          className="h-2 w-16"
                        />
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination>
              <PaginationContent>
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setPage(page - 1)} />
                  </PaginationItem>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink onClick={() => setPage(p)} isActive={p === page}>
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                {page < totalPages && (
                  <PaginationItem>
                    <PaginationNext onClick={() => setPage(page + 1)} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      {/* Publish Rankings Dialog */}
      <PublishRankingsDialog
        mockDriveId={mockDriveId}
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        onSuccess={loadData}
      />
    </div>
  );
}