/**
 * CloudStoragePickerModal — Sélecteur de fichier cloud multi-provider.
 * Providers supportés : OneDrive, OneDrive Business, Dropbox, Box, Google Drive.
 * S'intègre au pattern modal existant (lcars-gradient-outline, dialog-surface, etc.).
 */
import React, { useState, useCallback, useRef } from 'react';
import { Cloud, X, Upload } from '../../ui/icons';
import { useTranslation } from '../../../i18n';
import { Button } from '../../ui/Button';
import {
  pickCloudFile,
  getProvidersMeta,
  type CloudProviderId,
  type CloudFile,
} from '../../../services/cloudStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onFileLoaded: (file: CloudFile) => void;
}

type PickState = 'idle' | 'picking' | 'error';

const PROVIDER_ICONS: Record<CloudProviderId, string> = {
  'onedrive':          '\u{1F4C4}',
  'onedrive-business': '\u{1F4BC}',
  'dropbox':           '\u{1F4E6}',
  'box':               '\u{1F5C3}',
  'gdrive':            '\u{1F4C1}',
};

export function CloudStoragePickerModal({ isOpen, onClose, onFileLoaded }: Props) {
  const { t } = useTranslation();
  const [pickState, setPickState] = useState<PickState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeProvider, setActiveProvider] = useState<CloudProviderId | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const providers = getProvidersMeta();

  const handlePick = useCallback(async (id: CloudProviderId) => {
    // Annule tout pick précédent
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setActiveProvider(id);
    setPickState('picking');
    setErrorMsg('');
    try {
      const file = await pickCloudFile(id, ac.signal);
      if (!file) {
        setPickState('idle');
        setActiveProvider(null);
        return;
      }
      onFileLoaded(file);
      onClose();
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') {
        setPickState('idle');
        setActiveProvider(null);
        return;
      }
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMsg(msg);
      setPickState('error');
    } finally {
      setActiveProvider(null);
      abortRef.current = null;
    }
  }, [onFileLoaded, onClose]);

  // Toujours fermable — abort le pick en cours si nécessaire
  const handleClose = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPickState('idle');
    setErrorMsg('');
    setActiveProvider(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const cloud = (t as { cloudStorage?: {
    title?: string;
    subtitle?: string;
    pickButton?: string;
    notConfigured?: string;
    picking?: string;
    errorPrefix?: string;
  } }).cloudStorage ?? {};

  const title         = cloud.title         ?? 'Cloud Storage';
  const subtitle      = cloud.subtitle      ?? 'Import a file from your cloud provider';
  const pickButton    = cloud.pickButton    ?? 'Open';
  const notConfigured = cloud.notConfigured ?? 'Not configured';
  const picking       = cloud.picking       ?? 'Opening…';
  const errorPrefix   = cloud.errorPrefix   ?? 'Error:';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden items-center justify-center hidden dark:flex">
        <div className="w-[400px] h-[300px] blur-[120px] rounded-full bg-[var(--accent-color)]/10" />
      </div>

      {/* Gradient border wrapper */}
      <div
        className="lcars-gradient-outline relative w-full sm:max-w-md h-full sm:h-auto rounded-none sm:rounded-[24px_8px_24px_8px] animate-in zoom-in-95 duration-300"
        style={{ padding: '2px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', isolation: 'isolate' }}
      >
        {/* Panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="relative w-full h-full flex flex-col dialog-surface rounded-none sm:rounded-[22px_6px_22px_6px] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between flex-shrink-0 bg-[var(--bg-sidebar)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20">
                <Cloud className="w-4 h-4 text-[var(--accent-color)]" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-widest text-[var(--text-primary)] uppercase">
                  {title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mt-0.5">
                  {subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              aria-label="Close"
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)] rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body — liste des providers */}
          <div className="p-6 space-y-3 bg-[var(--bg-app)] flex-1">
            {providers.map(p => {
              const isActive = activeProvider === p.id && pickState === 'picking';
              return (
                <button
                  key={p.id}
                  disabled={!p.available || pickState === 'picking'}
                  onClick={() => handlePick(p.id)}
                  className={
                    `w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border transition-colors ` +
                    (p.available
                      ? `border-[var(--border-color)] hover:border-[var(--accent-color)]/50 hover:bg-[var(--accent-color)]/5 cursor-pointer`
                      : `border-[var(--border-color)] opacity-40 cursor-not-allowed`)
                  }
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg ${p.colorClass}`} aria-hidden="true">
                      {PROVIDER_ICONS[p.id]}
                    </span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {p.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <span className="text-xs text-[var(--accent-color)] animate-pulse">{picking}</span>
                    ) : !p.available ? (
                      <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">{notConfigured}</span>
                    ) : (
                      <span className="text-xs text-[var(--text-secondary)]">{pickButton}</span>
                    )}
                    {p.available && !isActive && (
                      <Upload className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    )}
                  </div>
                </button>
              );
            })}

            {pickState === 'error' && errorMsg && (
              <p className="text-xs text-red-400 pt-1">
                {errorPrefix} {errorMsg}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] flex justify-end">
            <Button
              onClick={handleClose}
              variant="outlined"
              color="inherit"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
