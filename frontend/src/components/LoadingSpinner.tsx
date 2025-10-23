// src/components/LoadingSpinner.tsx
import React, { memo } from 'react';

interface LoadingSpinnerProps {
  /** Additional classes for custom sizing or coloring. */
  className?: string;
  /** A message to display below the spinner for a block-level loader. */
  message?: string;
}

/**
 * A versatile loading spinner, memoized for performance.
 * It renders as a large block with a message, or a small inline spinner.
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = memo(({ className = '', message }) => {
  const spinnerSvg = (
    <svg
      className={`animate-spin ${message ? 'h-10 w-10' : 'h-5 w-5'} text-primary ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // If a message is provided, render the larger, block-level spinner.
  if (message) {
    return (
      <div className="flex flex-col items-center justify-center p-4" role="status" aria-live="polite">
        {spinnerSvg}
        <p className="mt-3 text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    );
  }

  // Otherwise, default to the simple, inline SVG spinner.
  return spinnerSvg;
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
