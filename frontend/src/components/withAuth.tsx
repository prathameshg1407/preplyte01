'use client';

import { ComponentType, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { Role } from '@/types/enum';

interface WithAuthProps {
  // You can pass any additional props if needed
}

// This HOC protects a page and ensures only users with allowed roles can access it.
export default function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  allowedRoles: Role[]
) {
  const AuthComponent = (props: P & WithAuthProps) => {
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { openAuthModal } = useUI();
    const router = useRouter();

    useEffect(() => {
      if (isAuthLoading) {
        return; // Wait until the authentication check is complete.
      }

      // If not authenticated, prompt login and redirect to home.
      if (!isAuthenticated) {
        openAuthModal();
        router.replace('/');
        return;
      }

      // If authenticated, check for role authorization.
      if (user) {
        // If the user's role is not in the allowed list, redirect them.
        if (!allowedRoles.includes(user.role)) {
          // Redirect admins to their dashboard if they land on a student page.
          if (user.role === Role.SUPER_ADMIN || user.role === Role.INSTITUTION_ADMIN) {
            router.replace('/admin/dashboard');
          } 
          // Redirect students to their dashboard if they land on an admin page.
          else {
            router.replace('/dashboard');
          }
          return;
        }
      }
    }, [user, isAuthenticated, isAuthLoading, router, openAuthModal]);

    // While loading auth status or if user is not yet available, show a loader.
    if (isAuthLoading || !user) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      );
    }
    
    // If the user is authenticated and their role is allowed, render the page.
    if (isAuthenticated && allowedRoles.includes(user.role)) {
        return <WrappedComponent {...props} />;
    }

    // Fallback loader while redirecting.
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  };

  return AuthComponent;
}