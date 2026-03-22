import React from 'react';
import { AlertTriangle } from '../../ui/icons';
import { Button } from '../../ui/Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onCancel}
      />

      {/* Modal panel */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="relative w-full sm:max-w-sm h-full sm:h-auto flex flex-col animate-in zoom-in-95 duration-300 glass-panel border border-white/10 rounded-none sm:rounded-[24px_8px_24px_8px] shadow-2xl overflow-hidden dark:border-white/8"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center gap-3 bg-[var(--bg-sidebar)] flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-warning)]/10 border border-[var(--accent-warning)]/20 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-[var(--accent-warning)]" />
          </div>
          <h3 id="confirm-modal-title" className="text-sm font-bold tracking-widest text-[var(--text-primary)] uppercase">
            {title}
          </h3>
        </div>

        {/* Body */}
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed p-6">
          {message}
        </p>

        {/* Footer */}
        <div className="px-6 pb-6 flex justify-end gap-3 flex-shrink-0">
          <Button onClick={onCancel} variant="outlined" color="inherit" size="small">
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} variant="contained" color="primary" size="small">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
