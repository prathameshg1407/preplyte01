'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  deleteMockDrive,
  publishMockDrive,
  unpublishMockDrive,
} from '@/lib/api/mock-drive.client';
import {
  getStatusColor,
  getDifficultyColor,
  formatDateRange,
  formatDuration,
  isMockDriveActive,
  isRegistrationOpen,
} from '@/lib/utils/mock-drive.helpers';
import type { MockDrive } from '@/types/mock-drive.types';
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  Code,
  MessageSquare,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  TrendingUp,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import EditMockDriveDialog from './EditMockDriveDialog';

interface MockDriveOverviewProps {
  mockDrive: MockDrive;
}

export default function MockDriveOverview({ mockDrive }: MockDriveOverviewProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
   const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMockDrive(mockDrive.id);
      toast({
        title: 'Success',
        description: 'Mock drive deleted successfully',
      });
      router.push('/admin/mock-drive');
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete mock drive',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      if (mockDrive.isPublished) {
        await unpublishMockDrive(mockDrive.id);
        toast({
          title: 'Success',
          description: 'Mock drive unpublished successfully',
        });
      } else {
        await publishMockDrive(mockDrive.id);
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
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(mockDrive.status)}>
              {mockDrive.status.replace(/_/g, ' ')}
            </Badge>
            {mockDrive.isPublished ? (
              <Badge variant="default">
                <CheckCircle className="h-3 w-3 mr-1" />
                Published
              </Badge>
            ) : (
              <Badge variant="outline">
                <XCircle className="h-3 w-3 mr-1" />
                Draft
              </Badge>
            )}
            {isRegistrationOpen(mockDrive) && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Registration Open
              </Badge>
            )}
            {isMockDriveActive(mockDrive) && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Active Now
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>

            <Button
              variant={mockDrive.isPublished ? 'outline' : 'default'}
              size="sm"
              onClick={handlePublish}
              disabled={isPublishing}
            >
              {isPublishing ? (
                'Loading...'
              ) : mockDrive.isPublished ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Unpublish
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Publish
                </>
              )}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={mockDrive._count && mockDrive._count.attempts > 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    mock drive and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Details */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-2">{mockDrive.title}</h2>
            {mockDrive.description && (
              <p className="text-muted-foreground">{mockDrive.description}</p>
            )}

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Institution
                </p>
                <p className="font-medium">{mockDrive.institution?.name || '-'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Eligible Years
                </p>
                <div className="flex gap-1">
                  {mockDrive.eligibleYear.map((year) => (
                    <Badge key={year} variant="secondary">
                      Year {year}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total Duration
                </p>
                <p className="font-medium">{formatDuration(mockDrive.duration)}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Created On
                </p>
                <p className="font-medium">
                  {new Date(mockDrive.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Schedule */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Schedule</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Registration Period
                </p>
                <p className="font-medium">
                  {formatDateRange(
                    mockDrive.registrationStartDate,
                    mockDrive.registrationEndDate
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Drive Period
                </p>
                <p className="font-medium">
                  {formatDateRange(mockDrive.driveStartDate, mockDrive.driveEndDate)}
                </p>
              </div>
            </div>
          </Card>

          {/* Eligibility Criteria */}
          {mockDrive.eligibilityCriteria && 
           Object.keys(mockDrive.eligibilityCriteria).length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Eligibility Criteria</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {mockDrive.eligibilityCriteria.minCgpa && (
                  <div>
                    <p className="text-sm text-muted-foreground">Minimum CGPA</p>
                    <p className="font-medium">
                      {mockDrive.eligibilityCriteria.minCgpa}
                    </p>
                  </div>
                )}

                {mockDrive.eligibilityCriteria.minSscPercentage && (
                  <div>
                    <p className="text-sm text-muted-foreground">Minimum SSC %</p>
                    <p className="font-medium">
                      {mockDrive.eligibilityCriteria.minSscPercentage}%
                    </p>
                  </div>
                )}

                {mockDrive.eligibilityCriteria.minHscPercentage && (
                  <div>
                    <p className="text-sm text-muted-foreground">Minimum HSC %</p>
                    <p className="font-medium">
                      {mockDrive.eligibilityCriteria.minHscPercentage}%
                    </p>
                  </div>
                )}

                {mockDrive.eligibilityCriteria.requiredSkills &&
                  mockDrive.eligibilityCriteria.requiredSkills.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        Required Skills
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {mockDrive.eligibilityCriteria.requiredSkills.map((skill) => (
                          <Badge key={skill} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </Card>
          )}

          {/* Test Configuration */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Test Configuration</h3>
            </div>

            <div className="space-y-4">
              {/* Aptitude Test */}
              {mockDrive.aptitudeTest && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                    <h4 className="font-semibold">Aptitude Test</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {mockDrive.aptitudeTest.name}
                  </p>
                  {mockDrive.aptitudeTest.description && (
                    <p className="text-sm">{mockDrive.aptitudeTest.description}</p>
                  )}
                </div>
              )}

              {/* Machine Test */}
              {mockDrive.machineTestProblems &&
                mockDrive.machineTestProblems.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Code className="h-4 w-4 text-blue-600" />
                      <h4 className="font-semibold">Machine Test</h4>
                      <Badge variant="secondary">
                        {mockDrive.machineTestProblems.length} Problems
                      </Badge>
                    </div>
                    <div className="space-y-2 mt-3">
                      {mockDrive.machineTestProblems.map((mp) => (
                        <div
                          key={mp.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              #{mp.orderIndex + 1}
                            </span>
                            <span>{mp.problem.title}</span>
                            <Badge
                              variant="outline"
                              className={getDifficultyColor(mp.problem.difficulty)}
                            >
                              {mp.problem.difficulty}
                            </Badge>
                          </div>
                          <span className="text-muted-foreground">
                            {mp.points} points
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* AI Interview */}
              {mockDrive.aiInterviewConfig &&
                typeof mockDrive.aiInterviewConfig === 'object' &&
                Object.keys(mockDrive.aiInterviewConfig).length > 0 && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                      <h4 className="font-semibold">AI Interview</h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      {(mockDrive.aiInterviewConfig as any).jobTitle && (
                        <p>
                          <span className="text-muted-foreground">Job Title:</span>{' '}
                          {(mockDrive.aiInterviewConfig as any).jobTitle}
                        </p>
                      )}
                      {(mockDrive.aiInterviewConfig as any).companyName && (
                        <p>
                          <span className="text-muted-foreground">Company:</span>{' '}
                          {(mockDrive.aiInterviewConfig as any).companyName}
                        </p>
                      )}
                      {(mockDrive.aiInterviewConfig as any).totalQuestions && (
                        <p>
                          <span className="text-muted-foreground">Questions:</span>{' '}
                          {(mockDrive.aiInterviewConfig as any).totalQuestions}
                        </p>
                      )}
                      {(mockDrive.aiInterviewConfig as any).durationMinutes && (
                        <p>
                          <span className="text-muted-foreground">Duration:</span>{' '}
                          {formatDuration(
                            (mockDrive.aiInterviewConfig as any).durationMinutes
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </Card>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Registrations</span>
                </div>
                <span className="text-2xl font-bold">
                  {mockDrive._count?.registrations || 0}
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Attempts</span>
                </div>
                <span className="text-2xl font-bold">
                  {mockDrive._count?.attempts || 0}
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Results</span>
                </div>
                <span className="text-2xl font-bold">
                  {mockDrive._count?.results || 0}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link href={`/admin/mock-drive/${mockDrive.id}?tab=batches`}>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Batches
                </Button>
              </Link>

              <Link href={`/admin/mock-drive/${mockDrive.id}?tab=registrations`}>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  View Registrations
                </Button>
              </Link>

              <Link href={`/admin/mock-drive/${mockDrive.id}?tab=results`}>
                <Button variant="outline" className="w-full justify-start">
                  <Award className="h-4 w-4 mr-2" />
                  View Results
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditMockDriveDialog
        mockDrive={mockDrive}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  );
}