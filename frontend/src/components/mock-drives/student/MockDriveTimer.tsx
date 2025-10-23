'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MockDriveTimerProps {
  startTime: string | Date;
  duration: number; // in minutes
  onTimeUp?: () => void;
  warningThreshold?: number; // minutes before showing warning (default: 5)
  className?: string;
}

export default function MockDriveTimer({
  startTime,
  duration,
  onTimeUp,
  warningThreshold = 5,
  className = '',
}: MockDriveTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showWarning, setShowWarning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCalledOnTimeUp = useRef(false);

  const calculateTimeRemaining = useCallback(() => {
    const start = new Date(startTime).getTime();
    const end = start + duration * 60 * 1000;
    const now = Date.now();
    const remaining = Math.max(0, end - now);
    return Math.floor(remaining / 1000); // in seconds
  }, [startTime, duration]);

  useEffect(() => {
    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    intervalRef.current = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      // Check warning threshold
      const remainingMinutes = remaining / 60;
      if (remainingMinutes <= warningThreshold && remainingMinutes > 0) {
        setShowWarning(true);
      }

      // Time's up
      if (remaining === 0 && !hasCalledOnTimeUp.current) {
        hasCalledOnTimeUp.current = true;
        onTimeUp?.();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [calculateTimeRemaining, warningThreshold, onTimeUp]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    const remainingMinutes = timeRemaining / 60;
    if (remainingMinutes <= 1) return 'text-red-600 dark:text-red-400';
    if (remainingMinutes <= warningThreshold) return 'text-orange-600 dark:text-orange-400';
    return 'text-foreground';
  };

  const isExpired = timeRemaining === 0;
  const isCritical = timeRemaining <= 60; // Last minute

  return (
    <div className={className}>
      <div className={`flex items-center gap-2 font-mono text-2xl font-bold ${getTimerColor()}`}>
        <Clock className={`h-6 w-6 ${isCritical ? 'animate-pulse' : ''}`} />
        <span className={isCritical ? 'animate-pulse' : ''}>
          {isExpired ? 'Time\'s Up!' : formatTime(timeRemaining)}
        </span>
      </div>

      {showWarning && !isExpired && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Less than {warningThreshold} minutes remaining! Please wrap up your work.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}