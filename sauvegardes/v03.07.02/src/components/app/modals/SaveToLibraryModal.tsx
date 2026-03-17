import React from 'react';
import { Save, X, BookOpen, Music, Clock, Loader2, Library, Trash2, FolderOpen } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useTranslation } from '../../../i18n';
import type { LibraryAsset } from '../../../utils/libraryUtils';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  onLoadAsset?: (asset: LibraryAsset) => void;
  onDeleteAsset?: (assetId: string) => void;
  isSaving: boolean;
  currentTitle: string;
  libraryAssets: LibraryAsset[];
  hasCurrentSong?: boolean;
};

export function SaveToLibraryModal({
  isOpen,
  onClose,
  onSave,
  onLoadAsset,
  onDeleteAsset,
  isSaving,
  currentTitle,
  libraryAssets,
  hasCurrentSong = true,
}: Props) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg h-full sm:h-auto flex flex-col animate-in zoom-in-95 duration-300 fluent-animate-panel glass-panel border border-white/10 rounded-none sm:rounded-[24px_8px_24px_8px] shadow-2xl overflow-hidden dark:border-white/8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-sidebar)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center">
              <Library className="w-4 h-4 text-[var(--accent-color)]" />
            </div>
            <h3 className="text-sm font-bold tracking-widest text-[var(--text-primary)] uppercase">
              {t.saveToLibrary.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Save current song section */}
        {hasCurrentSong && (
          <div className="p-6 border-b border-[var(--border-color)]">
            <div className="flex items-center justify-between gap-4 p-4 rounded-[12px_4px_12px_4px] bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20">
              <div className="flex items-center gap-3 min-w-0">
                <Music className="w-4 h-4 text-[var(--accent-color)] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {currentTitle}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {t.saveToLibrary.saveDescription}
                  </p>
                </div>
              </div>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="fluent-animate-pressable flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-[var(--accent-color)] hover:opacity-90 text-[var(--on-accent-color)] text-xs font-bold rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {isSaving ? t.saveToLibrary.saving : t.saveToLibrary.save}
              </button>
            </div>
          </div>
        )}

        {/* Library list */}
        <div className="overflow-y-auto max-h-80 custom-scrollbar">
          <div className="px-6 pt-4 pb-2 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
              {t.saveToLibrary.yourLibrary} ({libraryAssets.length})
            </span>
          </div>

          {libraryAssets.length === 0 ? (
            <div className="px-6 pb-6 pt-2 flex flex-col items-center justify-center text-center space-y-2">
              <p className="text-sm text-[var(--text-secondary)]">
                {t.saveToLibrary.empty}
              </p>
            </div>
          ) : (
            <div className="px-6 pb-6 pt-2 space-y-2">
              {[...libraryAssets].reverse().map(asset => (
                <div
                  key={asset.id}
                  className="fluent-animate-in fluent-animate-pressable flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)] hover:border-[var(--accent-color)]/30 transition-colors"
                >
                  <div className="w-7 h-7 rounded-md bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center flex-shrink-0">
                    <Music className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {asset.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-[var(--text-secondary)]" />
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        {new Date(asset.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-[10px] text-[var(--text-secondary)]">
                      {asset.sections.length} section{asset.sections.length !== 1 ? 's' : ''}
                    </div>
                    {onLoadAsset && (
                      <button
                        type="button"
                        onClick={() => onLoadAsset(asset)}
                        aria-label={`${t.saveToLibrary.load}: ${asset.title}`}
                        title={t.saveToLibrary.loadDescription}
                        className="fluent-animate-pressable flex items-center gap-1 rounded border border-[var(--accent-color)]/30 bg-[var(--accent-color)]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--accent-color)] transition hover:bg-[var(--accent-color)]/20"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        {t.saveToLibrary.load}
                      </button>
                    )}
                    {onDeleteAsset && (
                      <button
                        type="button"
                        onClick={() => onDeleteAsset(asset.id)}
                        aria-label={`Remove ${asset.title} from library`}
                        title="Remove from library"
                        className="fluent-animate-pressable flex h-7 w-7 items-center justify-center rounded border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/25 hover:text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] flex justify-end">
          <Button onClick={onClose} variant="outlined" color="info" size="small">
            {t.saveToLibrary.close}
          </Button>
        </div>
      </div>
    </div>
  );
}
