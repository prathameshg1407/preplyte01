'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { apiGet } from '@/lib/api/client';
import type { ProfileWithSkills } from '@/types';
import ProfileDisplay from '@/components/profile/ProfileDisplay';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';

/**
 * Profile page - displays and manages user profile information
 */
export default function ProfilePage() {
  const { user, isLoading: isAuthLoading, isAuthenticated, refetchUser } = useAuth();
  const { showToast } = useUI();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileWithSkills | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      showToast({
        type: 'info',
        message: 'Please sign in to view your profile',
      });
      router.push('/');
    }
  }, [isAuthLoading, isAuthenticated, router, showToast]);

  // Fetch profile data
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      const fetchProfile = async () => {
        setIsProfileLoading(true);
        setError(null);
        
        try {
          const detailedProfile = await apiGet<ProfileWithSkills>('/profile/me');
          setProfile(detailedProfile);
        } catch (error: any) {
          console.error('Failed to fetch profile:', error);
          setError(error.message || 'Failed to load profile');
          showToast({
            type: 'error',
            message: 'Could not load your profile. Please try again.',
          });
        } finally {
          setIsProfileLoading(false);
        }
      };

      fetchProfile();
    }
  }, [isAuthLoading, isAuthenticated, showToast]);

  /**
   * Handle profile update - update local state and refresh auth context
   */
  const handleProfileUpdate = (updatedProfile: ProfileWithSkills) => {
    setProfile(updatedProfile);
    // Refresh auth context in background to sync global state
    refetchUser();
  };

  // Show skeleton while loading
  if (isAuthLoading || isProfileLoading) {
    return <ProfileSkeleton />;
  }

  // Show error state
  if (error || !profile || !user) {
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <div className="max-w-md mx-auto bg-card border rounded-xl p-8">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Could Not Load Profile
          </h2>
          <p className="text-muted-foreground mb-6">
            {error || 'There was a problem loading your profile data.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <ProfileDisplay
        user={user}
        profile={profile}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
}