'use client';

import React, { useState, useRef, useCallback, memo } from 'react';
import {
  GraduationCap,
  Linkedin,
  Github,
  Globe,
  Edit,
  Camera,
  Loader2,
  BookOpen,
  Award,
  Building,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

import type { FullUserProfile, ProfileWithSkills } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { uploadFile } from '@/lib/api/client';

import ProfileForm from './ProfileForm';
import ResumeSection from './ResumeSection';
import ResumeViewerModal from './ResumeViewerModal';

// ============================================================================
// ## Component Props
// ============================================================================

interface ProfileDisplayProps {
  user: FullUserProfile;
  profile: ProfileWithSkills;
  onProfileUpdate: (updatedProfile: ProfileWithSkills) => void;
}

// ============================================================================
// ## Helper Components
// ============================================================================

const ScoreCard = memo<{
  label: string;
  value: number | string | null | undefined;
}>(({ label, value }) => {
  if (value === null || value === undefined) return null;

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
});
ScoreCard.displayName = 'ScoreCard';

const SocialLink = memo<{
  href: string;
  icon: React.ComponentType<LucideProps>;
  label: string;
}>(({ href, icon: Icon, label }) => {
  const prefixUrl = (url: string) => {
    if (!url) return '#';
    return /^(f|ht)tps?:\/\//i.test(url) ? url : `https://${url}`;
  };

  return (
    <a
      href={prefixUrl(href)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
    >
      <Icon size={18} className="group-hover:scale-110 transition-transform" />
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
});
SocialLink.displayName = 'SocialLink';

// ============================================================================
// ## Main Component
// ============================================================================

function ProfileDisplay({ user, profile, onProfileUpdate }: ProfileDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewingResumeUrl, setViewingResumeUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { refetchUser } = useAuth();
  const { showToast } = useUI();

  /**
   * Handle profile save from ProfileForm
   */
  const handleSave = useCallback(
    (updatedProfile: ProfileWithSkills) => {
      onProfileUpdate(updatedProfile);
      setIsEditing(false);
      showToast({
        type: 'success',
        message: 'Profile updated successfully!',
      });
    },
    [onProfileUpdate, showToast]
  );

  /**
   * Handle avatar upload with progress
   */
  const handleAvatarFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast({
          type: 'error',
          message: 'Please upload an image file',
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast({
          type: 'error',
          message: 'Image size must be less than 5MB',
        });
        return;
      }

      setIsUploadingAvatar(true);
      setUploadProgress(0);

      showToast({
        type: 'info',
        message: 'Uploading profile picture...',
      });

      try {
        const result = await uploadFile<{ imageUrl: string }>(
          '/profile/me/avatar',
          file,
          'avatar',  // Field name expected by backend
          undefined,  // No additional data
          (progress: number) => setUploadProgress(progress)  // Explicit type for progress
        );

        const updatedProfile = {
          ...profile,
          profileImageUrl: result.imageUrl,
        };

        onProfileUpdate(updatedProfile);

        showToast({
          type: 'success',
          message: 'Profile picture updated!',
        });
      } catch (error: any) {
        console.error('Avatar upload error:', error);
        showToast({
          type: 'error',
          message: error?.message || 'Failed to upload profile picture',
        });
      } finally {
        setIsUploadingAvatar(false);
        setUploadProgress(0);
        if (avatarInputRef.current) {
          avatarInputRef.current.value = '';
        }
      }
    },
    [profile, onProfileUpdate, showToast]
  );

  /**
   * Handle resumes update
   */
  const handleResumesUpdate = useCallback(() => {
    refetchUser();
  }, [refetchUser]);

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    profile.fullName || user.email
  )}&background=3b82f6&color=ffffff&bold=true&size=256`;

  const calculateProfileCompletion = () => {
    const fields = [
      profile.fullName,
      profile.graduationYear,
      profile.profileImageUrl,
      profile.linkedinUrl,
      profile.githubUrl,
      profile.averageCgpa,
      profile.skills?.length,
    ];

    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const completionPercentage = calculateProfileCompletion();

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Profile Completion Banner */}
        {completionPercentage < 100 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">Complete Your Profile</h3>
              <span className="text-sm font-bold text-primary">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              A complete profile increases your visibility to recruiters
            </p>
          </div>
        )}

        {/* Main Profile Card */}
        <div className="bg-card rounded-xl shadow-lg border overflow-hidden">
          {/* Header with gradient background */}
          <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5" />

          <div className="px-6 sm:px-8 lg:px-10 pb-8">
            {/* Profile Picture and Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 -mt-16 mb-6">
              {/* Avatar */}
              <div className="relative group flex-shrink-0">
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingAvatar}
                />
                <div className="relative">
                  <img
                    key={profile.profileImageUrl}
                    src={profile.profileImageUrl || defaultAvatar}
                    alt={`${profile.fullName}'s avatar`}
                    className="w-32 h-32 rounded-full object-cover border-4 border-card shadow-xl"
                  />
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <div className="text-white text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-1" />
                        <span className="text-xs">{uploadProgress}%</span>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-2 right-2 bg-primary text-primary-foreground p-2.5 rounded-full shadow-lg transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Upload profile picture"
                >
                  {isUploadingAvatar ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera size={20} />}
                </button>
              </div>

              {/* User Info */}
              <div className="text-center sm:text-left flex-grow mt-4 sm:mt-0">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
                  {profile.fullName || user.email}
                </h1>
                <p className="text-lg text-muted-foreground mb-4">{user.email}</p>

                {/* Social Links */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                  {profile.graduationYear && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap size={18} />
                      <span className="text-sm font-medium">Class of {profile.graduationYear}</span>
                    </div>
                  )}
                  {user.institution && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building size={18} />
                      <span className="text-sm font-medium">{user.institution.name}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-3">
                  {profile.linkedinUrl && <SocialLink href={profile.linkedinUrl} icon={Linkedin} label="LinkedIn" />}
                  {profile.githubUrl && <SocialLink href={profile.githubUrl} icon={Github} label="GitHub" />}
                  {profile.websiteUrl && <SocialLink href={profile.websiteUrl} icon={Globe} label="Website" />}
                </div>
              </div>

              {/* Edit Button */}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-shrink-0 flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
                >
                  <Edit size={18} />
                  Edit Profile
                </button>
              )}
            </div>

            {/* Content Area */}
            {isEditing ? (
              <ProfileForm currentProfile={profile} onSave={handleSave} onCancel={() => setIsEditing(false)} />
            ) : (
              <>
                {/* Academic Performance */}
                <div className="mb-8 pt-6 border-t">
                  <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                    <BookOpen size={24} className="text-primary" />
                    Academic Record
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <ScoreCard label="Avg. CGPA" value={profile.averageCgpa} />
                    <ScoreCard label="SSC %" value={profile.sscPercentage} />
                    <ScoreCard label="HSC %" value={profile.hscPercentage} />
                    <ScoreCard label="Diploma %" value={profile.diplomaPercentage} />
                    <ScoreCard label="Sem 1" value={profile.degreeSem1Cgpa} />
                    <ScoreCard label="Sem 2" value={profile.degreeSem2Cgpa} />
                    <ScoreCard label="Sem 3" value={profile.degreeSem3Cgpa} />
                    <ScoreCard label="Sem 4" value={profile.degreeSem4Cgpa} />
                    <ScoreCard label="Sem 5" value={profile.degreeSem5Cgpa} />
                    <ScoreCard label="Sem 6" value={profile.degreeSem6Cgpa} />
                    <ScoreCard label="Sem 7" value={profile.degreeSem7Cgpa} />
                    <ScoreCard label="Sem 8" value={profile.degreeSem8Cgpa} />
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-8 pt-6 border-t">
                  <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                    <Award size={24} className="text-primary" />
                    Skills
                  </h2>
                  {profile.skills && profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <span
                          key={skill.id}
                          className="inline-flex items-center bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-medium px-4 py-2 rounded-full text-sm border border-primary/20 hover:border-primary/40 transition-colors"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground py-4">No skills added yet. Click "Edit Profile" to add your skills.</p>
                  )}
                </div>

                {/* Resumes */}
                <div className="pt-6 border-t">
                  <ResumeSection user={user} onUpdate={handleResumesUpdate} onView={setViewingResumeUrl} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Resume Viewer Modal */}
      <ResumeViewerModal isOpen={!!viewingResumeUrl} onClose={() => setViewingResumeUrl(null)} resumeUrl={viewingResumeUrl} />
    </>
  );
}

export default memo(ProfileDisplay);