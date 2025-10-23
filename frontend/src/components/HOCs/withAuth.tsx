'use client';

import { useRouter } from 'next/navigation';
import { useEffect, ComponentType } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';

import { Role } from '@/types/enum';
import { useAuth } from '@/contexts/AuthContext';
/**
 * Higher-Order Component for route protection
 */
export default function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  allowedRoles: Role[],
) {
  const AuthComponent = (props: P) => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.replace('/');
      }
    }, [isLoading, isAuthenticated, router]);

    // Loading state
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    // Authenticated with correct role
    if (isAuthenticated && user && allowedRoles.includes(user.role)) {
      return <WrappedComponent {...props} />;
    }

    // Authenticated but wrong role
    if (isAuthenticated && user) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
          <div className="max-w-md w-full bg-card border rounded-xl p-8">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">
              Access Denied
            </h2>
            <p className="text-muted-foreground mb-6">
              You don't have permission to view this page.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      );
    }

    // Fallback - brief moment before redirect
    return null;
  };

  AuthComponent.displayName = `withAuth(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return AuthComponent;
}