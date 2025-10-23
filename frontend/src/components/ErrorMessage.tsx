// src/components/ErrorMessage.tsx
"use client";

import React, { memo } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
}

/**
 * A standardized component for displaying error messages.
 * It's memoized to prevent re-renders unless its props change.
 */
const ErrorMessage: React.FC<ErrorMessageProps> = memo(({ title = 'Error', message, onDismiss }) => {
  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-red-50 rounded-lg shadow-lg border border-red-200 text-center mb-6 animate-fade-in">
      {/* Conditionally render the dismiss button if an onDismiss handler is provided */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-full p-1 transition-colors"
          aria-label="Dismiss"
        >
          <X size={20} />
        </button>
      )}
      <div className="text-red-500 mb-3">
        <AlertTriangle size={48} strokeWidth={1.5} />
      </div>
      <h2 className="text-xl font-bold text-red-800 mb-2">{title}</h2>
      <p className="text-red-700 max-w-sm">{message}</p>
    </div>
  );
});

ErrorMessage.displayName = 'ErrorMessage';

export default ErrorMessage;
