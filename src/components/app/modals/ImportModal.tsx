import { AlertTriangle, Upload, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useTranslation } from '../../../i18n';

type ImportModalProps = {
  isOpen: boolean;
  hasExistingWork: boolean;
  onClose: () => void;
  onChooseFile: () => void;
};

export function ImportModal({ isOpen, hasExistingWork, onClose, onChooseFile }: ImportModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Ambient glow – dark theme only */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden items-center justify-center hidden dark:flex">
        <div className="w-[400px] h-[300px] bg-[var(--accent-color)]/10 blur-[120px] rounded-full" />
      </div>

      {/* Modal panel */}
      <div className="relative w-full max-w-md flex flex-col animate-in zoom-in-95 duration-300 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[24px_8px_24px_8px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-sidebar)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
              hasExistingWork
                ? 'bg-amber-500/10 border-amber-500/20'
                : 'bg-[var(--accent-color)]/10 border-[var(--accent-color)]/20'
            }`}>
              {hasExistingWork
                ? <AlertTriangle className="w-4 h-4 text-amber-500" />
                : <Upload className="w-4 h-4 text-[var(--accent-color)]" />
              }
            </div>
            <h3 className="text-sm font-bold tracking-widest text-[var(--text-primary)] uppercase">
              {t.importDialog.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 bg-[var(--bg-card)]">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {hasExistingWork ? t.importDialog.replaceDescription : t.importDialog.emptyDescription}
          </p>
          {hasExistingWork && (
            <div className="rounded-[12px_4px_12px_4px] border border-amber-500/20 bg-amber-500/10 px-4 py-3">
              <p className="text-sm text-amber-500 leading-relaxed">{t.importDialog.warning}</p>
            </div>
          )}
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">{t.importDialog.supportedFiles}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] flex justify-end gap-3 flex-shrink-0">
          <Button onClick={onClose} variant="text" color="inherit">
            {t.importDialog.cancel}
          </Button>
          <Button onClick={onChooseFile} variant="contained" color={hasExistingWork ? 'warning' : 'info'} startIcon={<Upload className="w-4 h-4" />}>
            {t.importDialog.chooseFile}
          </Button>
        </div>
      </div>
    </div>
  );
}
