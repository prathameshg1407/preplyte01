// src/components/AppLayout.tsx

'use client';

import { memo, ReactNode } from 'react';

import { useUI } from '@/contexts/UIContext';
import AuthForm from '@/components/AuthForm';
// import Navbar from '@/components/Navbar';

/**
 * A memoized component to prevent the AuthForm from re-rendering unnecessarily.
 * It only renders when the modal's visibility state changes in the UIContext.
 */
const AuthModal = memo(() => {
  const { isAuthModalOpen } = useUI();
  return isAuthModalOpen ? <AuthForm /> : null;
});
AuthModal.displayName = 'AuthModal';

/**
 * This component defines the standard application layout, including the
 * Navbar, a main content area, and a footer.
 *
 * Pages that need this common structure can be wrapped with AppLayout.
 * Pages that need a custom layout (e.g., a full-screen experience)
 * can simply omit it.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* <Navbar /> */}
      {/* The main content grows to fill the space between the navbar and footer */}
      <main className="flex-grow">{children}</main>
      <footer className="bg-background border-t py-6">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Preplyte. All Rights Reserved.</p>
        </div>
      </footer>

      {/* The AuthModal is rendered here so it can overlay all other content */}
      <AuthModal />
    </div>
  );
}