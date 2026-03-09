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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="acrylic rounded-2xl w-full max-w-md shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className={`p-6 border-b border-white/5 flex items-center justify-between ${hasExistingWork ? 'bg-amber-500/5' : 'bg-white/[0.02]'}`}>
          <h3 className={`text-lg flex items-center gap-2.5 ${hasExistingWork ? 'text-amber-500' : 'text-zinc-100'}`}>
            {hasExistingWork ? <AlertTriangle className="w-5 h-5" /> : <Upload className="w-5 h-5 text-[var(--accent-color)]" />}
            {t.importDialog.title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-4">
          <p className="text-sm text-zinc-400 leading-relaxed">
            {hasExistingWork ? t.importDialog.replaceDescription : t.importDialog.emptyDescription}
          </p>
          {hasExistingWork && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
              <p className="text-sm text-amber-400 leading-relaxed">{t.importDialog.warning}</p>
            </div>
          )}
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t.importDialog.supportedFiles}</p>
        </div>

        <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
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
