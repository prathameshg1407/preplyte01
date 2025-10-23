'use client';

import { ReactNode, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { UIProvider } from '@/contexts/UIContext';
import AuthModal from './AuthModal';
import ErrorBoundary from './ErrorBoundary';


interface ProvidersProps {
  children: ReactNode;
}

/**
 * Root providers component that wraps the entire application
 * with necessary context providers and error boundaries
 */
export default function Providers({ children }: ProvidersProps) {
  // Prevent FOUC (Flash of Unstyled Content)
  useEffect(() => {
    document.documentElement.classList.add('hydrated');
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
        storageKey="preplyte-theme"
      >
        <AuthProvider>
          <UIProvider>
            {children}
            <AuthModal />
          </UIProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}