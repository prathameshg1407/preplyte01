'use client';

import React from 'react';

/**
 * Enhanced skeleton component with better animations and structure
 */
export function ProfileSkeleton() {
  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        {/* Profile Completion Banner Skeleton */}
        <div className="bg-card rounded-xl p-4 border">
          <div className="h-6 bg-muted rounded w-1/3 mb-2" />
          <div className="h-2 bg-muted rounded w-full mb-2" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>

        {/* Main Profile Card */}
        <div className="bg-card rounded-xl shadow-lg border overflow-hidden">
          {/* Header gradient skeleton */}
          <div className="h-32 bg-gradient-to-r from-muted via-muted/80 to-muted/60" />
          
          <div className="px-6 sm:px-8 lg:px-10 pb-8">
            {/* Profile Picture and Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 -mt-16 mb-6">
              {/* Avatar Skeleton */}
              <div className="w-32 h-32 rounded-full bg-muted border-4 border-card flex-shrink-0" />
              
              <div className="text-center sm:text-left flex-grow w-full mt-4 sm:mt-0">
                {/* Name Skeleton */}
                <div className="h-10 bg-muted rounded w-3/4 sm:w-1/2 mb-2 mx-auto sm:mx-0" />
                {/* Email Skeleton */}
                <div className="h-6 bg-muted rounded w-full sm:w-2/3 mb-4 mx-auto sm:mx-0" />
                {/* Info badges */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 mb-3">
                  <div className="h-5 bg-muted rounded w-24" />
                  <div className="h-5 bg-muted rounded w-32" />
                </div>
                {/* Social Links Skeleton */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                  <div className="h-5 bg-muted rounded w-20" />
                  <div className="h-5 bg-muted rounded w-20" />
                  <div className="h-5 bg-muted rounded w-24" />
                </div>
              </div>
              
              {/* Edit Button Skeleton */}
              <div className="h-10 bg-muted rounded-lg w-32 flex-shrink-0" />
            </div>

            {/* Academic Performance Section */}
            <div className="mb-8 pt-6 border-t">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-muted rounded" />
                <div className="h-8 bg-muted rounded w-48" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-muted/50 p-4 rounded-lg border">
                    <div className="h-3 bg-muted rounded w-16 mb-2" />
                    <div className="h-6 bg-muted rounded w-12" />
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Section Skeleton */}
            <div className="mb-8 pt-6 border-t">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-muted rounded" />
                <div className="h-8 bg-muted rounded w-24" />
              </div>
              <div className="flex flex-wrap gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-8 bg-muted rounded-full w-20" />
                ))}
              </div>
            </div>

            {/* Resumes Section Skeleton */}
            <div className="pt-6 border-t">
              <div className="flex justify-between items-center mb-5">
                <div className="h-8 bg-muted rounded w-40" />
                <div className="h-10 bg-muted rounded-lg w-36" />
              </div>
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted/50 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}