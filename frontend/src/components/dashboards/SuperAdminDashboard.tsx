'use client';

import React, { memo, useMemo, Component, ReactNode } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Building, 
  FileText, 
  Code, 
  TrendingUp,
  Activity,
  Brain,
  FileCheck,
  Server,
  BarChart3,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { AppUser, SuperAdminStats } from '@/types';
import { cn } from '@/lib/utils';
import { formatStatValue } from '@/lib/api/admin-client';

interface SuperAdminDashboardProps {
  user: AppUser;
  stats: SuperAdminStats;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  href: string;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ElementType;
}

// Error Boundary Component
class DashboardErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto p-8">
          <div className="rounded-lg bg-destructive/10 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-destructive mt-0.5" />
              <div>
                <h2 className="text-xl font-semibold text-destructive">
                  Dashboard Error
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Unable to load dashboard data. Please refresh the page or contact support if the issue persists.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const StatCard = memo(({ title, value, icon: Icon, href, subtitle, trend, trendLabel }: StatCardProps) => {
  const cardContent = (
    <div className="group flex h-full transform flex-col rounded-xl bg-card p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend !== undefined && trend !== null && (
            <div className={cn(
              "mt-2 flex items-center gap-1 text-sm",
              trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-600"
            )}>
              <span aria-hidden="true">{trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}</span>
              <span>{Math.abs(trend).toFixed(1)}%</span>
              {trendLabel && <span className="text-xs text-muted-foreground ml-1">({trendLabel})</span>}
              <span className="sr-only">
                {trend > 0 ? 'Increased' : trend < 0 ? 'Decreased' : 'No change'} by {Math.abs(trend).toFixed(1)}% {trendLabel}
              </span>
            </div>
          )}
        </div>
        <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
      </div>
    </div>
  );

  return (
    <Link href={href} className="block" aria-label={`View ${title} details`}>
      {cardContent}
    </Link>
  );
});
StatCard.displayName = 'StatCard';

const MetricCard = memo(({ label, value, change, icon: Icon }: MetricCardProps) => (
  <div className="rounded-lg bg-muted/50 p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        {change !== undefined && change !== null && (
          <p className={cn(
            "mt-1 text-xs",
            change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-600"
          )}>
            <span aria-hidden="true">{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
            <span className="sr-only">
              {change > 0 ? 'Increased' : change < 0 ? 'Decreased' : 'No change'} by {Math.abs(change).toFixed(1)}%
            </span>
            {' '}from last month
          </p>
        )}
      </div>
      {Icon && (
        <Icon className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
      )}
    </div>
  </div>
));
MetricCard.displayName = 'MetricCard';

function SuperAdminDashboard({ user, stats }: SuperAdminDashboardProps) {
  // Ensure stats have safe defaults
  const safeStats = useMemo(() => ({
    totalUsers: stats?.totalUsers ?? 0,
    totalInstitutions: stats?.totalInstitutions ?? 0,
    generatedAt: stats?.generatedAt ?? new Date().toISOString(),
    assessmentContent: {
      totalAptitudeQuestions: stats?.assessmentContent?.totalAptitudeQuestions ?? 0,
      totalCodingProblems: stats?.assessmentContent?.totalCodingProblems ?? 0,
      publicCodingProblems: stats?.assessmentContent?.publicCodingProblems ?? 0,
      aptitudeByDifficulty: {
        EASY: stats?.assessmentContent?.aptitudeByDifficulty?.EASY ?? 0,
        MEDIUM: stats?.assessmentContent?.aptitudeByDifficulty?.MEDIUM ?? 0,
        HARD: stats?.assessmentContent?.aptitudeByDifficulty?.HARD ?? 0,
      },
      codingByDifficulty: {
        EASY: stats?.assessmentContent?.codingByDifficulty?.EASY ?? 0,
        MEDIUM: stats?.assessmentContent?.codingByDifficulty?.MEDIUM ?? 0,
        HARD: stats?.assessmentContent?.codingByDifficulty?.HARD ?? 0,
      },
    },
    usersByStatus: {
      ACTIVE: stats?.usersByStatus?.ACTIVE ?? 0,
      PENDING_PROFILE_COMPLETION: stats?.usersByStatus?.PENDING_PROFILE_COMPLETION ?? 0,
      SUSPENDED: stats?.usersByStatus?.SUSPENDED ?? 0,
    },
    usersByRole: {
      students: stats?.usersByRole?.students ?? 0,
      institutionAdmins: stats?.usersByRole?.institutionAdmins ?? 0,
      superAdmins: stats?.usersByRole?.superAdmins ?? 0,
    },
    growth: {
      usersThisMonth: stats?.growth?.usersThisMonth ?? 0,
      usersLastMonth: stats?.growth?.usersLastMonth ?? 0,
      growthPercentage: stats?.growth?.growthPercentage ?? 0,
    },
    platformActivity: {
      activeSessionsCount: stats?.platformActivity?.activeSessionsCount ?? 0,
      totalSubmissions: stats?.platformActivity?.totalSubmissions ?? 0,
      totalResumes: stats?.platformActivity?.totalResumes ?? 0,
      totalAiInterviews: stats?.platformActivity?.totalAiInterviews ?? 0,
    },
  }), [stats]);

  // Calculate additional metrics
  const activeUserRate = useMemo(() => {
    return safeStats.totalUsers > 0 
      ? (safeStats.usersByStatus.ACTIVE / safeStats.totalUsers) * 100 
      : 0;
  }, [safeStats]);

  // Safe date formatting
  const formattedDate = useMemo(() => {
    try {
      return new Date(safeStats.generatedAt).toLocaleString();
    } catch {
      return 'Recently';
    }
  }, [safeStats.generatedAt]);

  // Main stat cards
  const statCards = useMemo(() => [
    { 
      title: 'Total Users', 
      value: formatStatValue(safeStats.totalUsers, 'number'),
      icon: Users, 
      href: '/admin/users',
      subtitle: `${safeStats.usersByRole.students} students`,
      trend: safeStats.growth.growthPercentage,
      trendLabel: 'this month'
    },
    { 
      title: 'Institutions', 
      value: formatStatValue(safeStats.totalInstitutions, 'number'),
      icon: Building, 
      href: '/admin/institutions',
      subtitle: 'Registered organizations'
    },
    { 
      title: 'Aptitude Bank', 
      value: formatStatValue(safeStats.assessmentContent.totalAptitudeQuestions, 'number'),
      icon: FileText, 
      href: '/admin/content/aptitude',
      subtitle: `${safeStats.assessmentContent.aptitudeByDifficulty.EASY}E, ${safeStats.assessmentContent.aptitudeByDifficulty.MEDIUM}M, ${safeStats.assessmentContent.aptitudeByDifficulty.HARD}H`
    },
    { 
      title: 'Coding Problems', 
      value: formatStatValue(safeStats.assessmentContent.totalCodingProblems, 'number'),
      icon: Code, 
      href: '/admin/content/coding',
      subtitle: `${safeStats.assessmentContent.publicCodingProblems} public`
    },
    { 
      title: 'AI Interviews', 
      value: formatStatValue(safeStats.platformActivity.totalAiInterviews, 'number'),
      icon: Brain, 
      href: '/admin/ai-interviews',
      subtitle: 'Total sessions'
    },
  ], [safeStats]);

  // Platform metrics
  const platformMetrics = useMemo(() => [
    {
      label: 'Active Sessions',
      value: formatStatValue(safeStats.platformActivity.activeSessionsCount, 'number'),
      icon: Activity
    },
    {
      label: 'Total Submissions',
      value: formatStatValue(safeStats.platformActivity.totalSubmissions, 'number'),
      icon: FileCheck
    },
    {
      label: 'Resumes Uploaded',
      value: formatStatValue(safeStats.platformActivity.totalResumes, 'number'),
      icon: FileText
    },
    {
      label: 'New Users This Month',
      value: formatStatValue(safeStats.growth.usersThisMonth, 'number'),
      change: safeStats.growth.growthPercentage,
      icon: UserCheck
    }
  ], [safeStats]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Platform Overview</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.profile?.fullName || 'Admin'} • {formattedDate}
        </p>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
        {statCards.map((card) => (
          <StatCard key={card.href} {...card} />
        ))}
      </div>

      {/* Secondary Dashboard Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* User Distribution */}
        <div className="rounded-xl bg-card p-6 shadow-md">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <Users className="h-5 w-5 text-primary" aria-hidden="true" />
            User Distribution
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Users</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{safeStats.usersByStatus.ACTIVE}</span>
                <span className="text-xs text-green-600">
                  ({activeUserRate.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pending Completion</span>
              <span className="font-semibold text-yellow-600">
                {safeStats.usersByStatus.PENDING_PROFILE_COMPLETION}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Suspended</span>
              <span className="font-semibold text-red-600">
                {safeStats.usersByStatus.SUSPENDED}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Students</span>
                <span className="font-semibold">{safeStats.usersByRole.students}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium">Institution Admins</span>
                <span className="font-semibold">{safeStats.usersByRole.institutionAdmins}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium">Super Admins</span>
                <span className="font-semibold">{safeStats.usersByRole.superAdmins}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Metrics */}
        <div className="rounded-xl bg-card p-6 shadow-md">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
            Growth Metrics
          </h2>
          <div className="space-y-4">
            <div className="rounded-lg bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">This Month</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-300">
                {safeStats.growth.usersThisMonth}
              </p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-500">new users</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium text-muted-foreground">Last Month</p>
              <p className="text-2xl font-bold">{safeStats.growth.usersLastMonth}</p>
              <p className="mt-1 text-xs text-muted-foreground">users joined</p>
            </div>
            <div className={cn(
              "rounded-lg p-4",
              safeStats.growth.growthPercentage > 0 ? "bg-green-50 dark:bg-green-900/20" : 
              safeStats.growth.growthPercentage < 0 ? "bg-red-50 dark:bg-red-900/20" : 
              "bg-gray-50 dark:bg-gray-900/20"
            )}>
              <p className="text-sm font-medium">Growth Rate</p>
              <p className={cn(
                "text-2xl font-bold",
                safeStats.growth.growthPercentage > 0 ? "text-green-600" : 
                safeStats.growth.growthPercentage < 0 ? "text-red-600" : 
                "text-gray-600"
              )}>
                {safeStats.growth.growthPercentage > 0 ? '+' : ''}
                {safeStats.growth.growthPercentage.toFixed(1)}%
              </p>
              <p className="mt-1 text-xs text-muted-foreground">month-over-month</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl bg-card p-6 shadow-md">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/admin/users"
              className="flex items-center justify-between rounded-lg bg-muted p-3 transition-colors hover:bg-primary/10"
              aria-label="Navigate to manage users"
            >
              <span className="text-sm font-medium">Manage Users</span>
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </Link>
            <Link
              href="/admin/institutions"
              className="flex items-center justify-between rounded-lg bg-muted p-3 transition-colors hover:bg-primary/10"
              aria-label="Navigate to manage institutions"
            >
              <span className="text-sm font-medium">Manage Institutions</span>
              <Building className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </Link>
            <Link
              href="/admin/content"
              className="flex items-center justify-between rounded-lg bg-muted p-3 transition-colors hover:bg-primary/10"
              aria-label="Navigate to content management"
            >
              <span className="text-sm font-medium">Content Management</span>
              <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </Link>
            <Link
              href="/admin/analytics"
              className="flex items-center justify-between rounded-lg bg-muted p-3 transition-colors hover:bg-primary/10"
              aria-label="Navigate to analytics dashboard"
            >
              <span className="text-sm font-medium">Analytics Dashboard</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </Link>
            <Link
              href="/admin/health"
              className="flex items-center justify-between rounded-lg bg-muted p-3 transition-colors hover:bg-primary/10"
              aria-label="Navigate to system health"
            >
              <span className="text-sm font-medium">System Health</span>
              <Server className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* Platform Activity Metrics */}
      <div className="mt-8 rounded-xl bg-card p-6 shadow-md">
        <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
          <Activity className="h-5 w-5 text-primary" aria-hidden="true" />
          Platform Activity
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {platformMetrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
      </div>

      {/* Assessment Content Distribution */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-card p-6 shadow-md">
          <h3 className="mb-4 text-lg font-semibold">Aptitude Questions by Difficulty</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" aria-hidden="true"></div>
                <span className="text-sm">Easy</span>
                <span className="sr-only">difficulty level</span>
              </div>
              <span className="font-semibold">{safeStats.assessmentContent.aptitudeByDifficulty.EASY}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" aria-hidden="true"></div>
                <span className="text-sm">Medium</span>
                <span className="sr-only">difficulty level</span>
              </div>
              <span className="font-semibold">{safeStats.assessmentContent.aptitudeByDifficulty.MEDIUM}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" aria-hidden="true"></div>
                <span className="text-sm">Hard</span>
                <span className="sr-only">difficulty level</span>
              </div>
              <span className="font-semibold">{safeStats.assessmentContent.aptitudeByDifficulty.HARD}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-card p-6 shadow-md">
          <h3 className="mb-4 text-lg font-semibold">Coding Problems by Difficulty</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" aria-hidden="true"></div>
                <span className="text-sm">Easy</span>
                <span className="sr-only">difficulty level</span>
              </div>
              <span className="font-semibold">{safeStats.assessmentContent.codingByDifficulty.EASY}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" aria-hidden="true"></div>
                <span className="text-sm">Medium</span>
                <span className="sr-only">difficulty level</span>
              </div>
              <span className="font-semibold">{safeStats.assessmentContent.codingByDifficulty.MEDIUM}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" aria-hidden="true"></div>
                <span className="text-sm">Hard</span>
                <span className="sr-only">difficulty level</span>
              </div>
              <span className="font-semibold">{safeStats.assessmentContent.codingByDifficulty.HARD}</span>
            </div>
            <div className="mt-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Public Problems</span>
                <span className="font-semibold text-primary">
                  {safeStats.assessmentContent.publicCodingProblems}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export with error boundary wrapper
export default memo(function SuperAdminDashboardWrapper(props: SuperAdminDashboardProps) {
  return (
    <DashboardErrorBoundary>
      <SuperAdminDashboard {...props} />
    </DashboardErrorBoundary>
  );
});