'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function SettingsPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { openAuthModal } = useUI();
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- CHANGE 1: Handle Authentication and Redirection in useEffect ---
  // This hook ensures that we only check for authentication after the initial
  // loading is complete.
  useEffect(() => {
    if (isAuthLoading) {
      return; // Wait for the auth check to finish
    }
    // If the user is not logged in, open the modal and redirect to the homepage.
    if (!isAuthenticated) {
      openAuthModal();
      router.replace('/');
    }
  }, [isAuthenticated, isAuthLoading, router, openAuthModal]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      // --- CHANGE 2: Corrected 'fetchWithAuth' arguments ---
      // The token is handled automatically by the utility, so we pass null.
      // The options object is the third argument.
      await fetchWithAuth(`${API_URL}/users/change-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });

      setMessage({ text: 'Password changed successfully!', type: 'success' });
      setNewPassword('');
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to change password.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // While the auth state is being determined, show a full-page loader.
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated, render nothing. The useEffect will handle the redirect.
  if (!isAuthenticated) {
    return null;
  }

  // --- CHANGE 3: UI/UX Improvements ---
  return (
    <div className="container mx-auto py-10 px-4 max-w-lg">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="bg-card p-8 rounded-lg shadow-md border">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-muted-foreground">
              New Password
            </label>
            <input
              id="newPassword" name="newPassword" type="password" required minLength={8}
              className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm bg-background focus:outline-none focus:ring-primary focus:border-primary"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter at least 8 characters"
            />
          </div>

          {message && (
            <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
              {message.text}
            </p>
          )}

          <div>
            <button
              type="submit" disabled={isSubmitting || newPassword.length < 8}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}