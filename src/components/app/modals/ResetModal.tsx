import React from 'react';
import { Trash2, X } from '../../ui/icons';
import { Button } from '../../ui/Button';

type ResetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const ResetModal = ({ isOpen, onClose, onConfirm }: ResetModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Gradient border wrapper */}
      <div
        className="lcars-gradient-outline relative w-full sm:max-w-md h-full sm:h-auto rounded-none sm:rounded-[24px_8px_24px_8px] animate-in zoom-in-95 duration-300"
        style={{
          padding: '2px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          isolation: 'isolate',
        }}
      >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reset-modal-title"
        className="dialog-surface relative rounded-none sm:rounded-[22px_6px_22px_6px] w-full h-full shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-sidebar)] flex-shrink-0">
          <h3 id="reset-modal-title" className="text-sm font-bold tracking-widest text-[var(--accent-critical)] uppercase flex items-center gap-2.5">
            <Trash2 className="w-4 h-4" />
            Reset Song
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-8 bg-[var(--bg-app)]">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Are you sure you want to clear the current song? This action will remove all lyrics and structure. You can use the Undo button to recover it if you change your mind.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] flex justify-end gap-3">
          <Button onClick={onClose} variant="outlined" color="inherit" size="small">
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="contained" color="error" size="small">
            <Trash2 className="w-4 h-4 mr-1" />
            Clear Everything
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
};
