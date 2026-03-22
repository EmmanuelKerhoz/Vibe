import React, { useState, useEffect } from 'react';
import { AlertTriangle } from '../../ui/icons';
import { Button } from '../../ui/Button';

interface PromptModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function PromptModal({
  isOpen,
  title,
  message,
  placeholder,
  defaultValue = '',
  confirmLabel = 'Save',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) setValue(defaultValue);
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const trimmed = value.trim();
    if (trimmed) onConfirm(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) handleConfirm();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-300"
        onClick={onCancel}
      />

      {/* Gradient border wrapper */}
      <div
        className="relative w-full sm:max-w-sm h-full sm:h-auto rounded-none sm:rounded-[24px_8px_24px_8px] animate-in zoom-in-95 duration-300"
        style={{
          padding: '2px',
          background: 'var(--accent-rail-gradient-h)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          isolation: 'isolate',
        }}
      >
      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-modal-title"
        className="relative w-full h-full flex flex-col dialog-surface rounded-none sm:rounded-[22px_6px_22px_6px] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center gap-3 bg-[var(--bg-sidebar)] flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-warning)]/10 border border-[var(--accent-warning)]/20 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-[var(--accent-warning)]" />
          </div>
          <h3 id="prompt-modal-title" className="text-sm font-bold tracking-widest text-[var(--text-primary)] uppercase">
            {title}
          </h3>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          <label htmlFor="prompt-modal-input" className="text-sm text-[var(--text-secondary)] leading-relaxed block">
            {message}
          </label>
          <input
            id="prompt-modal-input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
            className="bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] w-full focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
          />
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex justify-end gap-3 flex-shrink-0">
          <Button onClick={onCancel} variant="outlined" color="inherit" size="small">
            {cancelLabel}
          </Button>
          <Button onClick={handleConfirm} variant="contained" color="primary" size="small" disabled={!value.trim()}>
            {confirmLabel}
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
