'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  registerForMockDrive,
  cancelMockDriveRegistration,
  checkMockDriveEligibility,
  getMyBatch,
} from '@/lib/api/mock-drive.client';
import {
  getStatusColor,
  formatDateRange,
  formatDuration,
  formatTimeRemaining,
  isRegistrationOpen,
  isMockDriveActive,
  getRegistrationStatusColor,
  formatBatchTimeSlot,
  canAttemptBasedOnBatch,
} from '@/lib/utils/mock-drive.helpers';
import type {
  MockDriveWithRegistration,
  MockDriveBatch,
  EligibilityCriteria,
} from '@/types/mock-drive.types';
import {
  Calendar,
  Clock,
  BookOpen,
  Code,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Info,
} from 'lucide-react';
import Link from 'next/link';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';

interface MockDriveDetailViewProps {
  mockDrive: MockDriveWithRegistration;
}

export default function MockDriveDetailView({
  mockDrive: initialMockDrive,
}: MockDriveDetailViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [mockDrive, setMockDrive] = useState(initialMockDrive);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [eligibilityCheck, setEligibilityCheck] = useState<{
    eligible: boolean;
    reasons?: string[];
  } | null>(null);
  const [myBatch, setMyBatch] = useState<MockDriveBatch | null>(null);
  const [isLoadingBatch, setIsLoadingBatch] = useState(false);

  const canRegister = isRegistrationOpen(mockDrive) && !mockDrive.isRegistered;
  const canAttempt = isMockDriveActive(mockDrive) && mockDrive.isRegistered;
  const isUpcoming = new Date() < new Date(mockDrive.registrationStartDate);
  const isCompleted = new Date() > new Date(mockDrive.driveEndDate);

  // Cast eligibility criteria for type safety
  const eligibilityCriteria = mockDrive.eligibilityCriteria as EligibilityCriteria;

  // Load batch info if registered
  useEffect(() => {
    if (mockDrive.isRegistered) {
      loadBatchInfo();
    }
  }, [mockDrive.isRegistered]);

  const loadBatchInfo = async () => {
    setIsLoadingBatch(true);
    try {
      const batch = await getMyBatch(mockDrive.id);
      setMyBatch(batch);
    } catch (error) {
      console.error('Failed to load batch info:', error);
    } finally {
      setIsLoadingBatch(false);
    }
  };

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      const registration = await registerForMockDrive(mockDrive.id);

      toast({
        title: 'Success!',
        description: 'You have been registered for this mock drive',
      });

      // Update local state
      setMockDrive({
        ...mockDrive,
        isRegistered: true,
        userRegistration: registration,
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to register for mock drive',
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!mockDrive.userRegistration) return;

    setIsCanceling(true);
    try {
      await cancelMockDriveRegistration(mockDrive.userRegistration.id);

      toast({
        title: 'Registration Cancelled',
        description: 'Your registration has been cancelled',
      });

      setMockDrive({
        ...mockDrive,
        isRegistered: false,
        userRegistration: null,
      });

      setMyBatch(null);
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel registration',
        variant: 'destructive',
      });
    } finally {
      setIsCanceling(false);
    }
  };

  const checkUserEligibility = async () => {
    setIsCheckingEligibility(true);
    try {
      const result = await checkMockDriveEligibility(mockDrive.id);
      setEligibilityCheck(result);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check eligibility',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  // Check if can attempt based on batch
  const batchAttemptCheck = myBatch ? canAttemptBasedOnBatch(myBatch) : null;
  const canActuallyAttempt =
    canAttempt && (!myBatch || (batchAttemptCheck && batchAttemptCheck.canAttempt));

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-2">
              <div className="flex-1">
                <h1 className="text-3xl font-bold">{mockDrive.title}</h1>
                {mockDrive.institution && (
                  <p className="text-muted-foreground mt-1">
                    by {mockDrive.institution.name}
                  </p>
                )}
              </div>
              <Badge className={getStatusColor(mockDrive.status)}>
                {mockDrive.status.replace(/_/g, ' ')}
              </Badge>
            </div>

            {mockDrive.description && (
              <p className="text-muted-foreground mt-3">{mockDrive.description}</p>
            )}

            {/* Registration Status */}
            {mockDrive.isRegistered && mockDrive.userRegistration && (
              <Alert className="mt-4 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-900">You're Registered!</AlertTitle>
                <AlertDescription className="text-green-800">
                  <p>
                    Registered on{' '}
                    {format(new Date(mockDrive.userRegistration.registeredAt), 'PPP')}
                  </p>
                  <p className="mt-1">
                    Status:{' '}
                    <Badge
                      className={getRegistrationStatusColor(
                        mockDrive.userRegistration.status
                      )}
                    >
                      {mockDrive.userRegistration.status.replace(/_/g, ' ')}
                    </Badge>
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Batch Information */}
            {mockDrive.isRegistered && myBatch && (
              <Alert className="mt-4 bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900">Batch Assignment</AlertTitle>
                <AlertDescription className="text-blue-800">
                  <p className="font-semibold">{myBatch.batchName}</p>
                  <p className="mt-1">{formatBatchTimeSlot(myBatch)}</p>
                  {!myBatch.isActive && (
                    <p className="mt-2 text-orange-700">
                      ⚠️ Your batch is currently inactive
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {mockDrive.isRegistered && !myBatch && !isLoadingBatch && (
              <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-900">
                  Batch Not Assigned
                </AlertTitle>
                <AlertDescription className="text-yellow-800">
                  You haven't been assigned to a batch yet. Please contact your
                  institution admin or wait for batch assignment.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 min-w-[200px]">
            {canActuallyAttempt && (
              <Link href={`/mock-drives/${mockDrive.id}/attempt`}>
                <Button size="lg" className="w-full">
                  Start Mock Drive
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}

            {canAttempt && !canActuallyAttempt && batchAttemptCheck && (
              <Button size="lg" disabled className="w-full">
                {batchAttemptCheck.message || 'Not Available'}
              </Button>
            )}

            {canRegister && (
              <Button
                size="lg"
                onClick={handleRegister}
                disabled={isRegistering}
                className="w-full"
              >
                {isRegistering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isRegistering ? 'Registering...' : 'Register Now'}
              </Button>
            )}

            {mockDrive.isRegistered && !canAttempt && !isCompleted && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="lg" className="w-full">
                    Cancel Registration
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Registration?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel your registration for this mock
                      drive? You can register again if registration is still open.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No, Keep Registration</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelRegistration}
                      disabled={isCanceling}
                    >
                      {isCanceling ? 'Canceling...' : 'Yes, Cancel'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {isUpcoming && !mockDrive.isRegistered && (
              <Button variant="outline" size="lg" disabled className="w-full">
                Registration Opens Soon
              </Button>
            )}

            {isCompleted && (
              <Link href={`/mock-drives/${mockDrive.id}/results`}>
                <Button variant="outline" size="lg" className="w-full">
                  View Results
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Schedule */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Schedule</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Registration Period
                  </p>
                  <p className="font-medium">
                    {formatDateRange(
                      mockDrive.registrationStartDate,
                      mockDrive.registrationEndDate
                    )}
                  </p>
                  {isRegistrationOpen(mockDrive) && (
                    <p className="text-sm text-green-600 mt-1">
                      Closes {formatTimeRemaining(mockDrive.registrationEndDate)}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Drive Period</p>
                  <p className="font-medium">
                    {formatDateRange(mockDrive.driveStartDate, mockDrive.driveEndDate)}
                  </p>
                  {isMockDriveActive(mockDrive) && (
                    <p className="text-sm text-blue-600 mt-1">
                      Ends {formatTimeRemaining(mockDrive.driveEndDate)}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Total Duration
                  </span>
                </div>
                <span className="font-semibold">
                  {formatDuration(mockDrive.duration)}
                </span>
              </div>
            </div>
          </Card>

          {/* Test Components */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Test Components</h2>
            </div>

            <div className="space-y-3">
              {/* Aptitude Test */}
              {mockDrive.aptitudeTestId && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Aptitude Test</h3>
                      <p className="text-sm text-muted-foreground">
                        Multiple choice questions on logical reasoning, quantitative
                        aptitude
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Machine Test */}
              {mockDrive._count?.machineTestProblems &&
                mockDrive._count.machineTestProblems > 0 && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Code className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Machine Test</h3>
                        <p className="text-sm text-muted-foreground">
                          {mockDrive._count.machineTestProblems} coding problems to
                          solve
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* AI Interview */}
              {mockDrive.aiInterviewConfig &&
                typeof mockDrive.aiInterviewConfig === 'object' &&
                Object.keys(mockDrive.aiInterviewConfig).length > 0 && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">AI Interview</h3>
                        <p className="text-sm text-muted-foreground">
                          {(mockDrive.aiInterviewConfig as any).totalQuestions || 10}{' '}
                          AI-powered interview questions
                        </p>
                        {(mockDrive.aiInterviewConfig as any).jobTitle && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Role: {(mockDrive.aiInterviewConfig as any).jobTitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </Card>

          {/* Eligibility Criteria */}
          {eligibilityCriteria && Object.keys(eligibilityCriteria).length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Eligibility Criteria</h2>
                </div>
                {!mockDrive.isRegistered && canRegister && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkUserEligibility}
                    disabled={isCheckingEligibility}
                  >
                    {isCheckingEligibility && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Check Eligibility
                  </Button>
                )}
              </div>

              {eligibilityCheck && (
                <Alert
                  className={
                    eligibilityCheck.eligible
                      ? 'bg-green-50 border-green-200 mb-4'
                      : 'bg-red-50 border-red-200 mb-4'
                  }
                >
                  {eligibilityCheck.eligible ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertTitle
                    className={
                      eligibilityCheck.eligible ? 'text-green-900' : 'text-red-900'
                    }
                  >
                    {eligibilityCheck.eligible ? "You're Eligible!" : 'Not Eligible'}
                  </AlertTitle>
                  {eligibilityCheck.reasons && eligibilityCheck.reasons.length > 0 && (
                    <AlertDescription
                      className={
                        eligibilityCheck.eligible ? 'text-green-800' : 'text-red-800'
                      }
                    >
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        {eligibilityCheck.reasons.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  )}
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                {eligibilityCriteria.minCgpa && (
                  <div>
                    <p className="text-sm text-muted-foreground">Minimum CGPA</p>
                    <p className="font-semibold">{eligibilityCriteria.minCgpa}</p>
                  </div>
                )}

                {eligibilityCriteria.minSscPercentage && (
                  <div>
                    <p className="text-sm text-muted-foreground">Minimum SSC %</p>
                    <p className="font-semibold">
                      {eligibilityCriteria.minSscPercentage}%
                    </p>
                  </div>
                )}

                {eligibilityCriteria.minHscPercentage && (
                  <div>
                    <p className="text-sm text-muted-foreground">Minimum HSC %</p>
                    <p className="font-semibold">
                      {eligibilityCriteria.minHscPercentage}%
                    </p>
                  </div>
                )}

                {eligibilityCriteria.requiredSkills &&
                  eligibilityCriteria.requiredSkills.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        Required Skills
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {eligibilityCriteria.requiredSkills.map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Stats */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Registrations</span>
                  <span className="text-2xl font-bold">
                    {mockDrive._count?.registrations || 0}
                  </span>
                </div>
                <Progress value={65} className="h-2" />
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Attempts</span>
                  <span className="text-2xl font-bold">
                    {mockDrive._count?.attempts || 0}
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Eligible Years</p>
                <div className="flex flex-wrap gap-1">
                  {mockDrive.eligibleYear.map((year) => (
                    <Badge key={year} variant="outline">
                      Year {year}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Important Dates */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Important Dates</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Registration Opens</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(mockDrive.registrationStartDate), 'PPP')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Registration Closes</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(mockDrive.registrationEndDate), 'PPP')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Drive Date</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(mockDrive.driveStartDate), 'PPP')}
                  </p>
                </div>
              </div>

              {myBatch && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Your Batch Time</p>
                      <p className="text-xs text-blue-700">
                        {formatBatchTimeSlot(myBatch)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Instructions */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Before You Start
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Ensure stable internet connection</li>
                  <li>• Keep your documents ready</li>
                  <li>• Complete in one sitting</li>
                  <li>• No pausing allowed</li>
                  {myBatch && (
                    <li>
                      • Attempt only during your batch time:{' '}
                      <strong>{myBatch.batchName}</strong>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}