'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, isInstitutionAdminStats, isSuperAdminStats } from '@/lib/api/admin-client';
import { AppUser, AdminStats, Role } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import SuperAdminDashboard from '@/components/dashboards/SuperAdminDashboard';
import InstitutionAdminDashboard from '@/components/dashboards/InstitutionAdminDashboard';
import withAuth from '@/components/HOCs/withAuth';

/**
 * Renders the correct dashboard based on the user's role and the fetched stats.
 */
const DashboardContent = ({ user, stats }: { user: AppUser; stats: AdminStats }) => {
  if (user.role === Role.SUPER_ADMIN && isSuperAdminStats(stats)) {
    return <SuperAdminDashboard user={user} stats={stats} />;
  }

  if (user.role === Role.INSTITUTION_ADMIN && isInstitutionAdminStats(stats)) {
    return <InstitutionAdminDashboard user={user} stats={stats} />;
  }

  // Fallback if the user role and stats type do not match.
  return <ErrorMessage message="Could not determine the correct dashboard for your role." />;
};

/**
 * The main page for the admin dashboard.
 * This component acts as a controller that fetches data and renders the
 * appropriate dashboard (Super Admin or Institution Admin) based on the user's role.
 */
function AdminDashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // We need a user with a specific admin role to fetch data.
    const isAdmin = user && (user.role === Role.SUPER_ADMIN || user.role === Role.INSTITUTION_ADMIN);

    if (!isAdmin) {
      // If the user isn't an admin (or is logged out), stop the loading process.
      setIsStatsLoading(false);
      return;
    }

    const fetchStats = async () => {
      setIsStatsLoading(true);
      setError(null);
      try {
        console.log('[Dashboard] Fetching admin stats for user:', user.email, user.role);
        
        // Use the proper adminApi which handles authentication via cookies
        const data = await adminApi.getDashboardStats();
        
        console.log('[Dashboard] Successfully fetched stats:', data);
        setStats(data);
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to fetch dashboard statistics.';
        setError(errorMessage);
        console.error('[Dashboard] Error fetching admin stats:', err);
      } finally {
        setIsStatsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  // Combined loading state for a smoother user experience
  if (isAuthLoading || isStatsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <ErrorMessage message={error} />
      </div>
    );
  }
  
  // After loading and error checks, if we still don't have user or stats,
  // it implies an authorization or data availability issue.
  if (!user || !stats) {
    return (
      <div className="container mx-auto p-8">
        <ErrorMessage message="You are not authorized to view this page or required data is unavailable." />
      </div>
    );
  }

  return <DashboardContent user={user} stats={stats} />;
}

// Protect this route, allowing access only to admin roles.
export default withAuth(AdminDashboardPage, [
  Role.SUPER_ADMIN,
  Role.INSTITUTION_ADMIN,
]);