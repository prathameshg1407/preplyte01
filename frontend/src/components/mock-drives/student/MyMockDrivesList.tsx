'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Clock,
  CheckCircle,
  PlayCircle,
  Award,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import type {
  MockDriveRegistration,
  MockDriveAttempt,
  MockDriveResult,
} from '@/types/mock-drive.types';
import { format } from 'date-fns';
import { getStatusColor } from '@/lib/utils/mock-drive.helpers';

interface MyMockDrivesListProps {
  registrations: MockDriveRegistration[];
  attempts: MockDriveAttempt[];
  results: MockDriveResult[];
}

export default function MyMockDrivesList({
  registrations,
  attempts,
  results,
}: MyMockDrivesListProps) {
  return (
    <Tabs defaultValue="registrations" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="registrations">
          Registrations ({registrations.length})
        </TabsTrigger>
        <TabsTrigger value="attempts">
          Attempts ({attempts.length})
        </TabsTrigger>
        <TabsTrigger value="results">
          Results ({results.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="registrations" className="mt-6 space-y-4">
        {registrations.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              You haven't registered for any mock drives yet
            </p>
            <Link href="/mock-drives">
              <Button className="mt-4">Browse Mock Drives</Button>
            </Link>
          </Card>
        ) : (
          registrations.map((reg: any) => (
            <Card key={reg.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    {reg.mockDrive?.title || 'Mock Drive'}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Registered on {format(new Date(reg.registeredAt), 'PP')}
                      </span>
                    </div>
                    <Badge className={getStatusColor(reg.status)}>
                      {reg.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  {reg.batchStudent?.batch && (
                    <Badge variant="outline">
                      Batch: {reg.batchStudent.batch.batchName}
                    </Badge>
                  )}
                </div>
                <Link href={`/mock-drives/${reg.mockDriveId}`}>
                  <Button>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </TabsContent>

      <TabsContent value="attempts" className="mt-6 space-y-4">
        {attempts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              You haven't attempted any mock drives yet
            </p>
          </Card>
        ) : (
          attempts.map((attempt: any) => (
            <Card key={attempt.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    {attempt.mockDrive?.title || 'Mock Drive'}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        Started {format(new Date(attempt.startedAt), 'PPp')}
                      </span>
                    </div>
                    <Badge
                      variant={
                        attempt.status === 'COMPLETED' ? 'default' : 'secondary'
                      }
                    >
                      {attempt.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  {attempt.completedAt && (
                    <p className="text-sm text-muted-foreground">
                      Completed on {format(new Date(attempt.completedAt), 'PPp')}
                    </p>
                  )}
                </div>
                {attempt.status === 'COMPLETED' ? (
                  <Link href={`/mock-drives/${attempt.mockDriveId}/results`}>
                    <Button>
                      <Award className="h-4 w-4 mr-2" />
                      View Results
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/mock-drives/${attempt.mockDriveId}/attempt`}>
                    <Button>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Continue
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))
        )}
      </TabsContent>

      <TabsContent value="results" className="mt-6 space-y-4">
        {results.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No results available yet. Complete a mock drive to see your results.
            </p>
          </Card>
        ) : (
          results.map((result) => (
            <Card key={result.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    Mock Drive Result
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Completed on {format(new Date(result.createdAt), 'PP')}
                      </span>
                    </div>
                  </div>
                </div>
                <Link href={`/mock-drives/${result.mockDriveId}/results`}>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Report
                  </Button>
                </Link>
              </div>

              {/* Score Summary */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Overall Score
                  </p>
                  <p className="text-2xl font-bold">
                    {result.percentage.toFixed(1)}%
                  </p>
                  <Progress value={parseFloat(result.percentage.toString())} className="mt-2 h-2" />
                </div>

                {result.aptitudeScore !== null && (
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Aptitude</p>
                    <p className="text-2xl font-bold">
                      {result.aptitudeScore.toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      / {result.aptitudeMaxScore?.toFixed(0)}
                    </p>
                  </div>
                )}

                {result.machineTestScore !== null && (
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      Machine Test
                    </p>
                    <p className="text-2xl font-bold">
                      {result.machineTestScore.toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      / {result.machineTestMaxScore?.toFixed(0)}
                    </p>
                  </div>
                )}

                {result.aiInterviewScore !== null && (
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      AI Interview
                    </p>
                    <p className="text-2xl font-bold">
                      {result.aiInterviewScore.toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      / {result.aiInterviewMaxScore?.toFixed(0)}
                    </p>
                  </div>
                )}
              </div>

              {/* Ranking */}
              {result.ranking && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      <span className="font-semibold">
                        Rank: #{result.ranking.rank}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {result.ranking.percentile.toFixed(1)}th percentile
                    </span>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}