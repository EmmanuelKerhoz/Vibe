import React from 'react';
import { X, ClipboardPaste, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Tooltip } from '../../ui/Tooltip';
import { useTranslation } from '../../../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pastedText: string;
  setPastedText: (v: string) => void;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}

export function PasteModal({ isOpen, onClose, pastedText, setPastedText, isAnalyzing, onAnalyze }: Props) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.paste.title}
        className="glass-panel w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 rounded-none sm:rounded-[24px_8px_24px_8px] border border-white/10 dark:border-white/8 shadow-2xl"
      >
        <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-sidebar)]">
          <h3 className="text-sm font-bold tracking-widest text-[var(--text-primary)] uppercase flex items-center gap-2.5">
            <ClipboardPaste className="w-4 h-4 text-[var(--accent-color)]" />
            {t.paste.title}
          </h3>
          <button
            onClick={onClose}
            aria-label={t.paste.cancel}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-app)]">
          <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">{t.paste.description}</p>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={t.paste.placeholder}
            className="w-full h-80 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]/50 focus:ring-1 focus:ring-[var(--accent-color)]/30 transition-all resize-none placeholder:text-[var(--text-secondary)] font-mono leading-relaxed"
          />
        </div>

        <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] flex justify-end gap-3">
          <Tooltip title={t.tooltips.analysisCancel}>
            <Button onClick={onClose} variant="text" color="inherit">{t.paste.cancel}</Button>
          </Tooltip>
          <Tooltip title={t.tooltips.analysisImport}>
            <Button
              onClick={onAnalyze}
              disabled={!pastedText.trim() || isAnalyzing}
              variant="contained" color="info"
              startIcon={isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            >
              {isAnalyzing ? t.paste.analyzing : t.paste.analyze}
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
