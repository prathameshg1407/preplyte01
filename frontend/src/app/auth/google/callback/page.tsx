'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * This page is the destination for the Google OAuth popup.
 * It no longer contains complex logic. Its only purpose is to exist
 * so the popup has a valid URL to open. The actual data transfer and
 * closing of the window is now handled by a script sent from the backend.
 */
export default function GoogleCallbackPage() {
  
  // We can add a fallback to close the window just in case the script fails for any reason.
  useEffect(() => {
    const timer = setTimeout(() => {
        // If the window is still open after 5 seconds, close it.
        if (!window.closed) {
            window.close();
        }
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">Authenticating, please wait...</p>
      <p className="mt-2 text-sm text-muted-foreground">This window will close automatically.</p>
    </div>
  );
}
