'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Award, Medal } from 'lucide-react';
import type { MockDriveLeaderboard as LeaderboardType } from '@/types/mock-drive.types';

interface MockDriveLeaderboardProps {
  data: LeaderboardType;
}

export default function MockDriveLeaderboard({ data }: MockDriveLeaderboardProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Award className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-600" />;
    return null;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1)
      return <Badge className="bg-yellow-500 text-white">1st Place</Badge>;
    if (rank === 2)
      return <Badge className="bg-gray-400 text-white">2nd Place</Badge>;
    if (rank === 3)
      return <Badge className="bg-orange-600 text-white">3rd Place</Badge>;
    return <Badge variant="outline">#{rank}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{data.mockDriveTitle}</h2>
            <p className="text-muted-foreground">
              {data.totalParticipants} participants
            </p>
          </div>
          {data.userRanking && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Your Rank</p>
              <p className="text-3xl font-bold">#{data.userRanking.rank}</p>
              <p className="text-sm text-muted-foreground">
                {data.userRanking.percentile.toFixed(1)}th percentile
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Top 3 */}
      <div className="grid gap-4 md:grid-cols-3">
        {data.rankings.slice(0, 3).map((ranking) => (
          <Card
            key={ranking.userId}
            className={`p-6 ${
              ranking.rank === 1
                ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                : ranking.rank === 2
                ? 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
                : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'
            }`}
          >
            <div className="text-center">
              <div className="flex justify-center mb-3">{getRankIcon(ranking.rank)}</div>
              <Avatar className="h-16 w-16 mx-auto mb-3">
                <AvatarImage src={ranking.profileImageUrl} />
                <AvatarFallback>{ranking.userName.charAt(0)}</AvatarFallback>
              </Avatar>
              <p className="font-semibold mb-1">{ranking.userName}</p>
              {getRankBadge(ranking.rank)}
              <p className="text-2xl font-bold mt-3">
                {ranking.percentage.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">
                {ranking.totalScore.toFixed(0)} points
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Full Leaderboard */}
      <Card>
        <div className="divide-y">
          {data.rankings.map((ranking, index) => (
            <div
              key={ranking.userId}
              className={`p-4 flex items-center gap-4 ${
                data.userRanking?.rank === ranking.rank
                  ? 'bg-blue-50 border-l-4 border-blue-500'
                  : ''
              }`}
            >
              <div className="w-12 text-center font-bold text-lg">
                #{ranking.rank}
              </div>

              <Avatar className="h-10 w-10">
                <AvatarImage src={ranking.profileImageUrl} />
                <AvatarFallback>{ranking.userName.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <p className="font-semibold">{ranking.userName}</p>
                <p className="text-sm text-muted-foreground">
                  {ranking.percentile.toFixed(1)}th percentile
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold">{ranking.percentage.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">
                  {ranking.totalScore.toFixed(0)} pts
                </p>
              </div>

              <div className="flex gap-2">
                {ranking.aptitudeScore && (
                  <Badge variant="outline" className="text-xs">
                    Apt: {ranking.aptitudeScore.toFixed(0)}
                  </Badge>
                )}
                {ranking.machineTestScore && (
                  <Badge variant="outline" className="text-xs">
                    Code: {ranking.machineTestScore.toFixed(0)}
                  </Badge>
                )}
                {ranking.aiInterviewScore && (
                  <Badge variant="outline" className="text-xs">
                    AI: {ranking.aiInterviewScore.toFixed(0)}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}