import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '../ui/Button';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
};

/**
 * Replaces window.confirm() for the global regenerate action.
 * Fluent-styled, non-blocking, accessible.
 */
export const RegenerateConfirmModal = ({ isOpen, onClose, onConfirm, message }: Props) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="regen-dialog-title"
        className="acrylic w-full sm:max-w-sm h-full sm:h-auto shadow-[0_32px_64px_rgba(0,0,0,0.5)] rounded-none sm:rounded-[24px_8px_24px_8px] border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300"
      >
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h3 id="regen-dialog-title" className="text-sm font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[var(--accent-color)]" />
            Regenerate Song
          </h3>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-white/5 rounded-md transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-zinc-300 leading-relaxed">{message}</p>
        </div>
        <div className="px-6 pb-5 flex justify-end gap-3">
          <Button onClick={onClose} variant="outlined" color="inherit" size="small">Cancel</Button>
          <Button onClick={handleConfirm} variant="contained" color="primary" size="small"
            startIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Regenerate
          </Button>
        </div>
      </div>
    </div>
  );
};
