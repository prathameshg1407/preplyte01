'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { apiGet } from '@/lib/api/client';
import type { StudentStats } from '@/types';
import { Role } from '@/types/enum';
import StudentDashboard from '@/components/dashboards/StudentDashboard';

/**
 * Loading skeleton for dashboard
 */
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-4 bg-muted rounded w-24 mb-2" />
          <div className="h-10 bg-muted rounded w-full max-w-md mb-2" />
          <div className="h-6 bg-muted rounded w-full max-w-sm" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-6">
              <div className="h-4 bg-muted rounded w-24 mb-4" />
              <div className="h-10 bg-muted rounded w-16" />
            </div>
          ))}
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-6 h-24" />
            ))}
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-xl border bg-card p-6 h-96" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Error state component
 */
function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Failed to Load Dashboard
        </h2>
        <p className="text-muted-foreground mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

/**
 * Main dashboard page
 */
export default function DashboardPage() {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const { showToast } = useUI();
  const router = useRouter();

  const [stats, setStats] = useState<StudentStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard stats - memoized to prevent recreating on every render
  const fetchStats = useCallback(async () => {
    if (!user) {
      setIsLoadingStats(false);
      return;
    }

    setIsLoadingStats(true);
    setError(null);

    try {
      const response = await apiGet<StudentStats>('/users/stats/me');
      setStats(response);
    } catch (err: any) {
      console.error('Failed to fetch dashboard stats:', err);
      const errorMessage = err.message || 'Failed to load dashboard data';
      setError(errorMessage);
      showToast({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setIsLoadingStats(false);
    }
  }, [user, showToast]);

  // Redirect if not authenticated or not a student
  useEffect(() => {
    if (isAuthLoading) return; // Wait for auth to load

    if (!isAuthenticated) {
      showToast({
        type: 'info',
        message: 'Please sign in to access your dashboard',
      });
      router.push('/');
      return;
    }

    if (user && user.role !== Role.STUDENT) {
      // Redirect non-students to their appropriate dashboard
      if (user.role === Role.SUPER_ADMIN) {
        router.push('/admin/dashboard');
      } else if (user.role === Role.INSTITUTION_ADMIN) {
        router.push('/admin/dashboard');
      }
    }
  }, [isAuthLoading, isAuthenticated, user, router, showToast]);

  // Fetch stats when user is available and is a student
  useEffect(() => {
    if (!isAuthLoading && user?.role === Role.STUDENT) {
      fetchStats();
    }
  }, [user, isAuthLoading, fetchStats]);

  // Show loading state
  if (isAuthLoading || (isLoadingStats && !error)) {
    return <DashboardSkeleton />;
  }

  // Don't render if redirecting
  if (!user || user.role !== Role.STUDENT) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return <DashboardError message={error} onRetry={fetchStats} />;
  }

  // Show dashboard
  if (stats) {
    return <StudentDashboard user={user} stats={stats} />;
  }

  // Fallback
  return <DashboardSkeleton />;
}