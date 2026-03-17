import { Trash2, X } from 'lucide-react';

type ResetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const ResetModal = ({ isOpen, onClose, onConfirm }: ResetModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="acrylic rounded-none sm:rounded-2xl w-full sm:max-w-md h-full sm:h-auto shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[var(--accent-critical)]/[0.02]">
          <h3 className="text-lg text-[var(--accent-critical)] flex items-center gap-2.5">
            <Trash2 className="w-5 h-5" />
            Reset Song
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8">
          <p className="text-sm text-zinc-400 leading-relaxed">
            Are you sure you want to clear the current song? This action will remove all lyrics and structure. You can use the Undo button to recover it if you change your mind.
          </p>
        </div>
        <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 bg-[var(--accent-critical)]/10 hover:bg-[var(--accent-critical)]/20 text-[var(--accent-critical)] text-sm rounded-lg transition-all flex items-center gap-2 border border-[var(--accent-critical)]/20 fluent-button"
          >
            <Trash2 className="w-4 h-4" />
            Clear Everything
          </button>
        </div>
      </div>
    </div>
  );
};
