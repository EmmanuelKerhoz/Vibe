import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileCode2, FileText, FileType2, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useTranslation } from '../../../i18n';
import type { ExportFormat } from '../../../utils/exportUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
}

export function ExportModal({ isOpen, onClose, onExport }: Props) {
  const { t } = useTranslation();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('txt');

  useEffect(() => {
    if (isOpen) setSelectedFormat('txt');
  }, [isOpen]);

  const formats = useMemo(() => ([
    {
      value: 'txt' as const,
      label: t.exportDialog.formats.txt,
      extension: '.txt',
      icon: FileText,
    },
    {
      value: 'markup' as const,
      label: t.exportDialog.formats.markup,
      extension: '.md',
      icon: FileCode2,
    },
    {
      value: 'odt' as const,
      label: t.exportDialog.formats.odt,
      extension: '.odt',
      icon: FileType2,
    },
    {
      value: 'docx' as const,
      label: t.exportDialog.formats.docx,
      extension: '.docx',
      icon: FileType2,
    },
  ]), [t]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xl animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-lg h-full sm:h-auto flex flex-col animate-in zoom-in-95 duration-300 glass-panel border border-white/10 rounded-none sm:rounded-[24px_8px_24px_8px] shadow-2xl overflow-hidden dark:border-white/8">
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-sidebar)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center">
              <Download className="w-4 h-4 text-[var(--accent-color)]" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-widest text-[var(--text-primary)] uppercase">
                {t.exportDialog.title}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {t.exportDialog.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t.exportDialog.cancel}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 bg-[var(--bg-app)]">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-3">
            {t.exportDialog.formatLabel}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {formats.map(format => {
              const Icon = format.icon;
              const isSelected = format.value === selectedFormat;
              return (
                <button
                  key={format.value}
                  type="button"
                  onClick={() => setSelectedFormat(format.value)}
                  className={`text-left rounded-[16px_6px_16px_6px] border px-4 py-4 transition-all ${
                    isSelected
                      ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10 shadow-[0_0_0_1px_var(--accent-color)]'
                      : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-color)]/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-[12px_4px_12px_4px] border flex items-center justify-center ${
                      isSelected
                        ? 'border-[var(--accent-color)]/30 bg-[var(--accent-color)]/10 text-[var(--accent-color)]'
                        : 'border-[var(--border-color)] text-[var(--text-secondary)]'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{format.label}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{format.extension}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] flex items-center justify-end gap-3">
          <Button onClick={onClose} variant="outlined" color="inherit">
            {t.exportDialog.cancel}
          </Button>
          <Button
            onClick={() => {
              onExport(selectedFormat);
              onClose();
            }}
            variant="contained"
            color="primary"
          >
            {t.exportDialog.save}
          </Button>
        </div>
      </div>
    </div>
  );
}
