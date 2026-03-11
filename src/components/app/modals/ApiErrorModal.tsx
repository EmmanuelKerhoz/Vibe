import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../../ui/Button';

interface ApiErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export function ApiErrorModal({ isOpen, onClose, message }: ApiErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="API Error"
        className="relative w-full max-w-md flex flex-col animate-in zoom-in-95 duration-300 glass-panel border border-white/10 rounded-[24px_8px_24px_8px] shadow-2xl overflow-hidden dark:border-white/8"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-sidebar)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-warning)]/10 border border-[var(--accent-warning)]/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-[var(--accent-warning)]" />
            </div>
            <h3 className="text-sm font-bold tracking-widest text-[var(--text-primary)] uppercase">
              API Error
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] flex justify-end flex-shrink-0">
          <Button onClick={onClose} variant="contained" color="primary">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
