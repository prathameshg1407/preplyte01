'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { 
  Users, 
  GraduationCap, 
  BarChart3, 
  PlusCircle,
  Briefcase,
  Brain,
  TrendingUp,
  Activity,
  Award,
  Calendar,
  FileText,
  Code
} from 'lucide-react';
import { AppUser, InstitutionAdminStats } from '@/types';
import { cn } from '@/lib/utils';
import { formatStatValue } from '@/lib/api/admin-client';


// --- Prop Type Definitions ---
type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  trend?: { value: number; direction: 'up' | 'down' | 'stable' };
};

type ActionButtonProps = {
  title: string;
  href: string;
  icon: React.ElementType;
  description?: string;
};

type PerformanceItemProps = {
  label: string;
  value: number | string;
  className?: string;
};

type TopPerformerProps = {
  name: string;
  score: number;
  rank: number;
};

interface InstitutionAdminDashboardProps {
  user: AppUser;
  stats: InstitutionAdminStats;
}

// --- Reusable Child Components (Memoized) ---
const StatCard = memo(({ title, value, icon: Icon, subtitle, trend }: StatCardProps) => (
  <div className="flex h-full transform flex-col rounded-xl bg-card p-6 shadow-md transition-transform hover:-translate-y-1 hover:shadow-lg">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <div className={cn(
            "mt-2 flex items-center gap-1 text-sm",
            trend.direction === 'up' ? "text-green-600" : 
            trend.direction === 'down' ? "text-red-600" : 
            "text-gray-600"
          )}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>
      <div className="rounded-full bg-primary/10 p-3">
        <Icon className="h-6 w-6 text-primary" />
      </div>
    </div>
  </div>
));
StatCard.displayName = 'StatCard';

const ActionButton = memo(({ title, href, icon: Icon, description }: ActionButtonProps) => (
  <Link
    href={href}
    className="flex items-start gap-4 rounded-lg bg-muted p-4 transition-all duration-200 hover:bg-primary/10 hover:shadow-md"
  >
    <div className="rounded-lg bg-background p-2">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <div className="flex-1">
      <span className="font-semibold text-foreground">{title}</span>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  </Link>
));
ActionButton.displayName = 'ActionButton';

const PerformanceItem = memo(({ label, value, className }: PerformanceItemProps) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={cn("text-lg font-semibold", className)}>
      {value}
    </span>
  </div>
));
PerformanceItem.displayName = 'PerformanceItem';

const TopPerformer = memo(({ name, score, rank }: TopPerformerProps) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-3">
      <div className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
        rank === 1 ? "bg-yellow-100 text-yellow-700" :
        rank === 2 ? "bg-gray-100 text-gray-700" :
        rank === 3 ? "bg-orange-100 text-orange-700" :
        "bg-muted text-muted-foreground"
      )}>
        {rank}
      </div>
      <span className="text-sm font-medium">{name}</span>
    </div>
    <span className="text-sm font-semibold text-primary">
      {score.toFixed(1)}%
    </span>
  </div>
));
TopPerformer.displayName = 'TopPerformer';

// --- Main Dashboard Component ---
function InstitutionAdminDashboard({ user, stats }: InstitutionAdminDashboardProps) {
  // Calculate derived metrics
  const studentMetrics = useMemo(() => {
    const activeRate = stats.students.total > 0 
      ? (stats.students.active / stats.students.total) * 100 
      : 0;
    return {
      activeRate: Math.round(activeRate),
      pendingRate: stats.students.total > 0
        ? Math.round((stats.students.pendingProfileCompletion / stats.students.total) * 100)
        : 0,
    };
  }, [stats.students]);

  const totalActiveOpportunities = useMemo(() => {
    return stats.careerOpportunities.jobs.active + 
           stats.careerOpportunities.internships.active + 
           stats.careerOpportunities.hackathons.upcoming;
  }, [stats.careerOpportunities]);

  // Memoize the statCards array
  type TrendDirection = 'up' | 'down';
  const statCards = useMemo(() => [
    { 
      title: 'Total Students', 
      value: formatStatValue(stats.students.total, 'number'),
      icon: Users,
      subtitle: `${stats.students.active} active`,
      trend: { 
        value: studentMetrics.activeRate, 
        direction: (studentMetrics.activeRate > 70 ? 'up' : 'down') as TrendDirection
      }
    },
    { 
      title: 'AI Interviews', 
      value: formatStatValue(stats.aiInterviews.totalSessions, 'number'),
      icon: Brain,
      subtitle: `${stats.aiInterviews.completedSessions} completed`,
    },
    { 
      title: 'Active Opportunities', 
      value: totalActiveOpportunities,
      icon: Briefcase,
      subtitle: 'Jobs, Internships & Hackathons'
    },
    { 
      title: 'Avg Performance', 
      value: `${stats.assessmentPerformance.averageAptitudeScore.toFixed(1)}%`,
      icon: Award,
      subtitle: 'Aptitude average'
    },
  ], [stats, studentMetrics, totalActiveOpportunities]);

  const quickActions = useMemo(() => [
    { 
      title: "Manage Students", 
      href: "/admin/users", 
      icon: Users,
      description: `${stats.students.total} total, ${stats.students.active} active`
    },
    { 
      title: "Create Content", 
      href: "/admin/content/create", 
      icon: PlusCircle,
      description: `${stats.content.aptitudeTests} tests, ${stats.content.codingProblems} problems`
    },
    { 
      title: "Post Opportunities", 
      href: "/admin/opportunities", 
      icon: Briefcase,
      description: `${totalActiveOpportunities} active postings`
    },
    { 
      title: "View Analytics", 
      href: "/admin/analytics", 
      icon: BarChart3,
      description: "Detailed insights & reports"
    },
  ], [stats, totalActiveOpportunities]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Institution Dashboard</h1>
        <p className="text-muted-foreground">
          {stats.institutionName} • {new Date(stats.generatedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Actions - Takes 1 column */}
        <div className="rounded-xl bg-card p-6 shadow-md">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
            <Activity className="h-5 w-5" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            {quickActions.map(action => (
              <ActionButton key={action.href} {...action} />
            ))}
          </div>
        </div>

        {/* Performance Overview - Takes 1 column */}
        <div className="rounded-xl bg-card p-6 shadow-md">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
            <TrendingUp className="h-5 w-5" />
            Performance Overview
          </h2>
          <div className="space-y-1">
            <PerformanceItem 
              label="Aptitude Average" 
              value={`${stats.assessmentPerformance.averageAptitudeScore.toFixed(1)}%`}
              className="text-blue-600"
            />
            <PerformanceItem 
              label="Coding Success Rate" 
              value={`${stats.assessmentPerformance.averageCodingScore.toFixed(1)}%`}
              className="text-green-600"
            />
            <PerformanceItem 
              label="AI Interview Avg" 
              value={`${stats.aiInterviews.averageScore.toFixed(1)}%`}
              className="text-purple-600"
            />
            <div className="mt-3 border-t pt-3">
              <PerformanceItem 
                label="Total Submissions" 
                value={formatStatValue(stats.assessmentPerformance.totalCodingSubmissions, 'number')}
              />
              <PerformanceItem 
                label="Tests Attempted" 
                value={formatStatValue(stats.assessmentPerformance.totalAptitudeAttempts, 'number')}
              />
            </div>
          </div>
        </div>

        {/* Top Performers - Takes 1 column */}
        <div className="rounded-xl bg-card p-6 shadow-md">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
            <GraduationCap className="h-5 w-5" />
            Top Performers
          </h2>
          <div className="space-y-1">
            {stats.assessmentPerformance.topPerformers.length > 0 ? (
              stats.assessmentPerformance.topPerformers.map((performer, index) => (
                <TopPerformer
                  key={performer.userId}
                  name={performer.name}
                  score={performer.averageScore}
                  rank={index + 1}
                />
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                No performance data available yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Stats Row */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Career Opportunities */}
        <div className="rounded-xl bg-card p-6 shadow-md">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
            <Briefcase className="h-5 w-5" />
            Career Opportunities
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {stats.careerOpportunities.jobs.total}
              </p>
              <p className="text-xs text-muted-foreground">Jobs Posted</p>
              <p className="mt-1 text-xs font-medium text-green-600">
                {stats.careerOpportunities.jobs.active} active
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {stats.careerOpportunities.internships.total}
              </p>
              <p className="text-xs text-muted-foreground">Internships</p>
              <p className="mt-1 text-xs font-medium text-green-600">
                {stats.careerOpportunities.internships.active} active
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {stats.careerOpportunities.hackathons.total}
              </p>
              <p className="text-xs text-muted-foreground">Hackathons</p>
              <p className="mt-1 text-xs font-medium text-green-600">
                {stats.careerOpportunities.hackathons.upcoming} upcoming
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl bg-card p-6 shadow-md">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
            <Calendar className="h-5 w-5" />
            Recent Activity (Last 7 Days)
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {stats.recentActivity.lastWeekSubmissions}
              </p>
              <p className="text-xs text-muted-foreground">Code Submissions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {stats.recentActivity.lastWeekApplications}
              </p>
              <p className="text-xs text-muted-foreground">Applications</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">
                {stats.recentActivity.lastWeekRegistrations}
              </p>
              <p className="text-xs text-muted-foreground">Registrations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Institution Content */}
      <div className="mt-6 rounded-xl bg-card p-6 shadow-md">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
          <FileText className="h-5 w-5" />
          Your Content Library
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
            <FileText className="h-10 w-10 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{stats.content.aptitudeTests}</p>
              <p className="text-sm text-muted-foreground">Aptitude Tests</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
            <Code className="h-10 w-10 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{stats.content.codingProblems}</p>
              <p className="text-sm text-muted-foreground">Coding Problems</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
            <Users className="h-10 w-10 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">{stats.content.batches}</p>
              <p className="text-sm text-muted-foreground">Student Batches</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(InstitutionAdminDashboard);