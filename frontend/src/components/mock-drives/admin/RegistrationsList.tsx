'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Download, UserPlus, Trash2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getMockDriveRegistrations,
  getMockDriveBatches,
  assignStudentsToBatch,
  removeStudentFromBatch,
} from '@/lib/api/mock-drive.client';
import type {
  AdminRegistrationListItem,
  MockDriveBatchWithStudents,
} from '@/types/mock-drive.types';
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
import { getRegistrationStatusColor } from '@/lib/utils/mock-drive.helpers';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RegistrationsListProps {
  mockDriveId: string;
}

export default function RegistrationsList({
  mockDriveId,
}: RegistrationsListProps) {
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<AdminRegistrationListItem[]>([]);
  const [batches, setBatches] = useState<MockDriveBatchWithStudents[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [assignBatchDialogOpen, setAssignBatchDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [removingStudent, setRemovingStudent] = useState<string | null>(null);
  const limit = 10;

  const loadRegistrations = async () => {
    setIsLoading(true);
    try {
      const response = await getMockDriveRegistrations(mockDriveId, {
        page,
        limit,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      setRegistrations(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load registrations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBatches = async () => {
    try {
      const batchesData = await getMockDriveBatches(mockDriveId);
      setBatches(batchesData);
    } catch (error) {
      console.error('Failed to load batches:', error);
    }
  };

  useEffect(() => {
    loadRegistrations();
    loadBatches();
  }, [mockDriveId, page, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    loadRegistrations();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Only select students not assigned to batch
      const unassignedIds = registrations
        .filter((reg) => !reg.batchStudent)
        .map((reg) => reg.userId);
      setSelectedStudents(unassignedIds);
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, userId]);
    } else {
      setSelectedStudents(selectedStudents.filter((id) => id !== userId));
    }
  };

  const handleAssignToBatch = async () => {
    if (!selectedBatch || selectedStudents.length === 0) return;

    setIsAssigning(true);
    try {
      await assignStudentsToBatch(mockDriveId, selectedBatch, {
        studentIds: selectedStudents,
      });

      toast({
        title: 'Success',
        description: `${selectedStudents.length} student(s) assigned to batch successfully`,
      });

      setSelectedStudents([]);
      setAssignBatchDialogOpen(false);
      setSelectedBatch('');
      loadRegistrations();
      loadBatches();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign students to batch',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveFromBatch = async (
    batchId: string,
    studentId: string,
    studentName: string
  ) => {
    setRemovingStudent(studentId);
    try {
      await removeStudentFromBatch(mockDriveId, batchId, studentId);

      toast({
        title: 'Success',
        description: `${studentName} removed from batch successfully`,
      });

      loadRegistrations();
      loadBatches();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove student from batch',
        variant: 'destructive',
      });
    } finally {
      setRemovingStudent(null);
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Name', 'Email', 'Year', 'CGPA', 'Registered On', 'Status', 'Batch'];
    const rows = registrations.map((reg) => [
      reg.user.profile.fullName,
      reg.user.email,
      reg.user.profile.graduationYear
        ? reg.user.profile.graduationYear - new Date().getFullYear()
        : 'N/A',
      reg.user.profile.averageCgpa || 'N/A',
      format(new Date(reg.registeredAt), 'PP'),
      reg.status.replace(/_/g, ' '),
      reg.batchStudent?.batch.batchName || 'Not Assigned',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mock-drive-registrations-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Registrations exported to CSV',
    });
  };

  const unassignedCount = registrations.filter((reg) => !reg.batchStudent).length;
  const allUnassignedSelected =
    selectedStudents.length > 0 &&
    selectedStudents.length === unassignedCount &&
    unassignedCount > 0;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats & Actions Bar */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Registrations</p>
            <p className="text-3xl font-bold mt-1">{total}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Batch Assigned</p>
            <p className="text-3xl font-bold mt-1 text-green-600">
              {total - unassignedCount}
            </p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Unassigned</p>
            <p className="text-3xl font-bold mt-1 text-orange-600">
              {unassignedCount}
            </p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Selected</p>
            <p className="text-3xl font-bold mt-1 text-blue-600">
              {selectedStudents.length}
            </p>
          </div>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="REGISTERED">Registered</SelectItem>
                <SelectItem value="BATCH_ASSIGNED">Batch Assigned</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {selectedStudents.length > 0 && (
              <Button onClick={() => setAssignBatchDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign to Batch ({selectedStudents.length})
              </Button>
            )}

            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allUnassignedSelected}
                  onCheckedChange={handleSelectAll}
                  disabled={unassignedCount === 0}
                />
              </TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>CGPA</TableHead>
              <TableHead>Registered On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <p className="text-muted-foreground">No registrations found</p>
                </TableCell>
              </TableRow>
            ) : (
              registrations.map((reg) => {
                const isSelected = selectedStudents.includes(reg.userId);
                const isAssigned = !!reg.batchStudent;

                return (
                  <TableRow key={reg.id}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelectStudent(reg.userId, checked as boolean)
                        }
                        disabled={isAssigned}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {reg.user.profile.fullName}
                    </TableCell>
                    <TableCell>{reg.user.email}</TableCell>
                    <TableCell>
                      {reg.user.profile.graduationYear
                        ? `Year ${
                            reg.user.profile.graduationYear -
                            new Date().getFullYear()
                          }`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {reg.user.profile.averageCgpa
                        ? parseFloat(reg.user.profile.averageCgpa.toString()).toFixed(
                            2
                          )
                        : '-'}
                    </TableCell>
                    <TableCell>{format(new Date(reg.registeredAt), 'PP')}</TableCell>
                    <TableCell>
                      <Badge className={getRegistrationStatusColor(reg.status)}>
                        {reg.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {reg.batchStudent ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {reg.batchStudent.batch.batchName}
                          </Badge>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  Assigned on{' '}
                                  {format(
                                    new Date(reg.batchStudent.addedAt),
                                    'PPP'
                                  )}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Not Assigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {reg.batchStudent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveFromBatch(
                              reg.batchStudent!.batch.id,
                              reg.userId,
                              reg.user.profile.fullName
                            )
                          }
                          disabled={removingStudent === reg.userId}
                        >
                          {removingStudent === reg.userId ? (
                            'Removing...'
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
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

                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setPage(pageNum)}
                        isActive={pageNum === page}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

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

      {/* Assign to Batch Dialog */}
      <Dialog open={assignBatchDialogOpen} onOpenChange={setAssignBatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Students to Batch</DialogTitle>
            <DialogDescription>
              Select a batch to assign {selectedStudents.length} selected student(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger>
                <SelectValue placeholder="Select a batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => {
                  const availableSlots = batch.maxStudents
                    ? batch.maxStudents - (batch._count?.students || 0)
                    : Infinity;
                  const isFull = availableSlots === 0;
                  const canAccommodate =
                    availableSlots >= selectedStudents.length || availableSlots === Infinity;

                  return (
                    <SelectItem
                      key={batch.id}
                      value={batch.id}
                      disabled={isFull || !canAccommodate}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{batch.batchName}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {batch._count?.students || 0}
                          {batch.maxStudents ? `/${batch.maxStudents}` : ''} students
                          {isFull && ' (Full)'}
                          {!canAccommodate &&
                            !isFull &&
                            ` (Only ${availableSlots} slots)`}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {batches.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No batches available. Please create a batch first.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignBatchDialogOpen(false)}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignToBatch}
              disabled={!selectedBatch || isAssigning}
            >
              {isAssigning ? 'Assigning...' : 'Assign to Batch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}