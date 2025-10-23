'use client';

import React, { useEffect } from 'react';

interface ConfirmSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  unansweredCount: number;
}

const ConfirmSubmitModal: React.FC<ConfirmSubmitModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  unansweredCount,
}) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md p-6 m-4 bg-card text-card-foreground rounded-xl shadow-2xl border border-border animate-scale-in"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="text-center">
          <h3
            id="modal-title"
            className="text-xl font-bold text-foreground"
          >
            Confirm Submission
          </h3>
          <div className="mt-3">
            <p className="text-base text-muted-foreground">
              You have{' '}
              <span className="font-bold text-primary">
                {unansweredCount} unanswered question(s)
              </span>
              . Are you sure you want to submit your test?
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex justify-center rounded-lg border border-input px-6 py-2 text-md font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex justify-center rounded-lg bg-primary px-6 py-2 text-md font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Submit Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmSubmitModal;