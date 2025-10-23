'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Award,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Download,
  Share2,
  BarChart3,
} from 'lucide-react';
import type {
  MockDriveWithRegistration,
  MockDriveResult,
} from '@/types/mock-drive.types';
import { getMockDriveLeaderboard } from '@/lib/api/mock-drive.client';
import MockDriveLeaderboard from './MockDriveLeaderboard';
import { format } from 'date-fns';

interface MockDriveResultsViewProps {
  mockDrive: MockDriveWithRegistration;
  result: MockDriveResult;
}

export default function MockDriveResultsView({
  mockDrive,
  result,
}: MockDriveResultsViewProps) {
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  useEffect(() => {
    if (mockDrive.rankingsPublished) {
      loadLeaderboard();
    }
  }, [mockDrive.rankingsPublished]);

  const loadLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const data = await getMockDriveLeaderboard(mockDrive.id);
      setLeaderboardData(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    return 'F';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{mockDrive.title}</h1>
            <p className="text-muted-foreground">
              Completed on {format(new Date(result.createdAt), 'PPP')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </Card>

      {/* Overall Score */}
      <Card className="p-8">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Overall Score</p>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div
              className={`text-6xl font-bold ${getScoreColor(
                parseFloat(result.percentage.toString())
              )}`}
            >
              {result.percentage.toFixed(1)}%
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold">
                {result.totalScore.toFixed(0)} /{' '}
                {result.totalMaxScore.toFixed(0)}
              </p>
              <Badge className="text-lg px-3 py-1">
                Grade: {getGrade(parseFloat(result.percentage.toString()))}
              </Badge>
            </div>
          </div>
          <Progress
            value={parseFloat(result.percentage.toString())}
            className="h-3 mb-4"
          />
          <p className="text-sm text-muted-foreground">
            {parseFloat(result.percentage.toString()) >= 60
              ? 'Great job! You performed well in this mock drive.'
              : 'Keep practicing to improve your performance.'}
          </p>
        </div>
      </Card>

      {/* Component Scores */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Aptitude Score */}
        {result.aptitudeScore !== null && result.aptitudeMaxScore && (
          <Card className="p-6">
            <div className="text-center">
              <div className="p-3 rounded-full bg-purple-100 w-fit mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">Aptitude Test</p>
              <p className="text-3xl font-bold mb-2">
                {result.aptitudeScore.toFixed(1)} /{' '}
                {result.aptitudeMaxScore.toFixed(0)}
              </p>
              <Progress
                value={
                  (parseFloat(result.aptitudeScore.toString()) /
                    parseFloat(result.aptitudeMaxScore.toString())) *
                  100
                }
                className="h-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {(
                  (parseFloat(result.aptitudeScore.toString()) /
                    parseFloat(result.aptitudeMaxScore.toString())) *
                  100
                ).toFixed(1)}
                %
              </p>
            </div>
          </Card>
        )}

        {/* Machine Test Score */}
        {result.machineTestScore !== null && result.machineTestMaxScore && (
          <Card className="p-6">
            <div className="text-center">
              <div className="p-3 rounded-full bg-blue-100 w-fit mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">Machine Test</p>
              <p className="text-3xl font-bold mb-2">
                {result.machineTestScore.toFixed(1)} /{' '}
                {result.machineTestMaxScore.toFixed(0)}
              </p>
              <Progress
                value={
                  (parseFloat(result.machineTestScore.toString()) /
                    parseFloat(result.machineTestMaxScore.toString())) *
                  100
                }
                className="h-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {(
                  (parseFloat(result.machineTestScore.toString()) /
                    parseFloat(result.machineTestMaxScore.toString())) *
                  100
                ).toFixed(1)}
                %
              </p>
            </div>
          </Card>
        )}

        {/* AI Interview Score */}
        {result.aiInterviewScore !== null && result.aiInterviewMaxScore && (
          <Card className="p-6">
            <div className="text-center">
              <div className="p-3 rounded-full bg-green-100 w-fit mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">AI Interview</p>
              <p className="text-3xl font-bold mb-2">
                {result.aiInterviewScore.toFixed(1)} /{' '}
                {result.aiInterviewMaxScore.toFixed(0)}
              </p>
              <Progress
                value={
                  (parseFloat(result.aiInterviewScore.toString()) /
                    parseFloat(result.aiInterviewMaxScore.toString())) *
                  100
                }
                className="h-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {(
                  (parseFloat(result.aiInterviewScore.toString()) /
                    parseFloat(result.aiInterviewMaxScore.toString())) *
                  100
                ).toFixed(1)}
                %
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Ranking (if published) */}
      {mockDrive.rankingsPublished && result.ranking && (
        <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-100">
                <Award className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Rank</p>
                <p className="text-4xl font-bold text-yellow-900">
                  #{result.ranking.rank}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Percentile</p>
              <p className="text-3xl font-bold text-yellow-900">
                {result.ranking.percentile.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Detailed Analysis */}
      <Tabs defaultValue="feedback" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="strengths">Strengths</TabsTrigger>
          <TabsTrigger value="leaderboard" disabled={!mockDrive.rankingsPublished}>
            Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Analysis</h3>
            {result.detailedReport ? (
              <div className="prose max-w-none">
                {/* Render detailed report */}
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(result.detailedReport, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Detailed feedback will be available soon.
              </p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="strengths" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Strengths */}
            {result.strengths && result.strengths.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {result.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Areas for Improvement */}
            {result.areasForImprovement && result.areasForImprovement.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold">Areas for Improvement</h3>
                </div>
                <ul className="space-y-2">
                  {result.areasForImprovement.map((area, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          {leaderboardData ? (
            <MockDriveLeaderboard data={leaderboardData} />
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">Loading leaderboard...</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}