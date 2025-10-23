'use client';

import React, { useState, useEffect, memo } from 'react';
import { X, Loader2, AlertTriangle, Download, ExternalLink } from 'lucide-react';

interface ResumeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeUrl: string | null;
}

/**
 * Modal for viewing resumes with Google Docs Viewer
 */
function ResumeViewerModal({ isOpen, onClose, resumeUrl }: ResumeViewerModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, resumeUrl]);

  if (!isOpen || !resumeUrl) return null;

  // Use Google Docs Viewer for better compatibility
  const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(resumeUrl)}&embedded=true`;

  const handleDownload = () => {
    window.open(resumeUrl, '_blank');
  };

  const handleOpenInNewTab = () => {
    window.open(viewerUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col border animate-scale-in">
        {/* Header */}
        <div className="flex justify-between items-center border-b p-4 flex-shrink-0 bg-card">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              Resume Preview
            </h2>
            {isLoading && (
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Download"
            >
              <Download size={20} />
            </button>
            
            <button
              onClick={handleOpenInNewTab}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Open in new tab"
            >
              <ExternalLink size={20} />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden bg-muted/30">
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/95">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading resume preview...</p>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-8 bg-background">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Failed to Load Preview
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                The resume preview couldn't be loaded. You can try downloading the file or opening it in a new tab.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <Download size={18} />
                  Download Resume
                </button>
                <button
                  onClick={handleOpenInNewTab}
                  className="flex items-center gap-2 bg-muted text-foreground px-6 py-2.5 rounded-lg hover:bg-muted/80 transition-colors font-medium"
                >
                  <ExternalLink size={18} />
                  Open in New Tab
                </button>
              </div>
            </div>
          )}

          {/* Iframe */}
          <iframe
            src={viewerUrl}
            className="w-full h-full border-0"
            title="Resume Preview"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}

export default memo(ResumeViewerModal);