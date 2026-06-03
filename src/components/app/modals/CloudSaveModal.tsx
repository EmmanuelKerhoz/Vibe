/**
 * CloudSaveModal — Export lyrics to Google Drive or OneDrive.
 *
 * Google Drive : uses googleDriveService.saveFile() (drive.file scope, OAuth2 popup).
 * OneDrive     : uses @azure/msal-browser via oneDriveSaveService (stub — extend when ready).
 *
 * Opens when ModalContext receives openModal('cloudSave', { provider: 'gdrive' | 'onedrive' }).
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useModalState, useModalDispatch } from '../../../contexts/ModalContext';
import { useSongContext } from '../../../contexts/SongContext';
import { saveFile, isGDriveConfigured } from '../../../services/googleDriveService';

type Status = 'idle' | 'saving' | 'success' | 'error';

const EXPORT_FORMATS = [
  { value: 'txt',  label: 'Plain text (.txt)',      mime: 'text/plain' },
  { value: 'md',   label: 'Markdown (.md)',          mime: 'text/markdown' },
  { value: 'json', label: 'JSON (.json)',             mime: 'application/json' },
] as const;

type FormatValue = typeof EXPORT_FORMATS[number]['value'];

function buildContent(song: ReturnType<typeof useSongContext>['song'], format: FormatValue, musicalPrompt: string | undefined): string {
  const lyricsText = song
    .map(s => {
      const h = s.name?.trim() ? `[${s.name.trim()}]\n` : '';
      return h + s.lines.map((l: { text?: string }) => l.text ?? '').join('\n');
    })
    .join('\n\n')
    .trim();

  if (format === 'json') {
    return JSON.stringify({ song, musicalPrompt }, null, 2);
  }
  return lyricsText;
}

export function CloudSaveModal() {
  const { uiState } = useModalState();
  const { closeModal } = useModalDispatch();
  const { song, musicalPrompt } = useSongContext();

  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fileName, setFileName] = useState('lyrics.txt');
  const [format, setFormat] = useState<FormatValue>('txt');

  const { isCloudSaveOpen, cloudSaveProvider } = uiState;
  const isGDrive = cloudSaveProvider === 'gdrive';
  const configured = isGDrive ? isGDriveConfigured() : true;

  // Sync extension when format changes
  useEffect(() => {
    setFileName(prev => {
      const base = prev.replace(/\.[^.]+$/, '');
      return `${base}.${format}`;
    });
  }, [format]);

  // Reset state on open
  useEffect(() => {
    if (isCloudSaveOpen) {
      setStatus('idle');
      setErrorMsg('');
      setFileName('lyrics.txt');
      setFormat('txt');
    }
  }, [isCloudSaveOpen]);

  const handleClose = useCallback(() => closeModal('cloudSave'), [closeModal]);

  const handleSave = useCallback(async () => {
    setStatus('saving');
    setErrorMsg('');
    try {
      const selectedFormat = EXPORT_FORMATS.find(f => f.value === format)!;
      const content = buildContent(song, format, musicalPrompt);

      if (isGDrive) {
        await saveFile(content, fileName, selectedFormat.mime);
      } else {
        // OneDrive: stub — wire oneDriveSaveService when implemented
        throw new Error('OneDrive export not yet implemented. Use local export for now.');
      }

      setStatus('success');
      setTimeout(() => closeModal('cloudSave'), 1800);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMsg(msg);
      setStatus('error');
    }
  }, [song, musicalPrompt, fileName, format, isGDrive, closeModal]);

  if (!isCloudSaveOpen) return null;

  const providerLabel = isGDrive ? 'Google Drive' : 'OneDrive';
  const hasContent = song.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-label={`Save to ${providerLabel}`}
    >
      <div
        className="rounded-xl shadow-2xl w-full"
        style={{
          maxWidth: '420px',
          backgroundColor: 'var(--bg-surface, #1a1a1a)',
          border: '1px solid var(--border-color, #333)',
          padding: '1.5rem',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {isGDrive ? (
              <svg width="18" height="18" viewBox="0 0 87.3 78" aria-hidden="true">
                <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="M43.65 25L29.9 1.2C28.55.4 27 0 25.45 0H0l43.65 75.5z" fill="#00ac47"/>
                <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H60.8l5.45 10.35z" fill="#ea4335"/>
                <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.95 0H34.35c-1.55 0-3.1.4-4.45 1.2z" fill="#00832d"/>
                <path d="M60.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.45 1.2h50.9c1.55 0 3.1-.4 4.45-1.2z" fill="#2684fc"/>
                <path d="M73.4 26.5l-13.1-22.7c-1.35-.8-2.9-1.2-4.45-1.2H52.95L87.3 53h-26.5z" fill="#ffba00"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 4h9l5 5v11a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="#0078d4" strokeWidth="1.5"/>
                <path d="M14 4v5h5" stroke="#0078d4" strokeWidth="1.5"/>
              </svg>
            )}
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary, #fff)' }}>
              Save to {providerLabel}
            </h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            style={{ color: 'var(--text-secondary, #888)', lineHeight: 1 }}
            className="hover:opacity-70 transition-opacity"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Not configured warning */}
        {!configured && (
          <div
            className="rounded-lg px-3 py-2 mb-4 text-xs"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            {isGDrive
              ? 'VITE_GDRIVE_CLIENT_ID is not configured. Contact your administrator.'
              : 'OneDrive is not configured.'}
          </div>
        )}

        {/* No content warning */}
        {!hasContent && (
          <div
            className="rounded-lg px-3 py-2 mb-4 text-xs"
            style={{ backgroundColor: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}
          >
            No lyrics to save. Write something first.
          </div>
        )}

        {/* Format selector */}
        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #888)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Format
        </label>
        <select
          value={format}
          onChange={e => setFormat(e.target.value as FormatValue)}
          disabled={status === 'saving'}
          className="w-full rounded-md text-sm mb-4"
          style={{
            padding: '0.5rem 0.75rem',
            backgroundColor: 'var(--bg-input, #111)',
            border: '1px solid var(--border-color, #333)',
            color: 'var(--text-primary, #fff)',
            outline: 'none',
          }}
        >
          {EXPORT_FORMATS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        {/* File name */}
        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #888)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          File name
        </label>
        <input
          type="text"
          value={fileName}
          onChange={e => setFileName(e.target.value)}
          disabled={status === 'saving'}
          className="w-full rounded-md text-sm mb-5"
          style={{
            padding: '0.5rem 0.75rem',
            backgroundColor: 'var(--bg-input, #111)',
            border: '1px solid var(--border-color, #333)',
            color: 'var(--text-primary, #fff)',
            outline: 'none',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent-color, #4f98a3)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border-color, #333)')}
        />

        {/* Status messages */}
        {status === 'error' && (
          <div
            className="rounded-lg px-3 py-2 mb-4 text-xs break-words"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            {errorMsg}
          </div>
        )}
        {status === 'success' && (
          <div
            className="rounded-lg px-3 py-2 mb-4 text-xs"
            style={{ backgroundColor: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}
          >
            ✓ Saved to {providerLabel} successfully.
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleClose}
            disabled={status === 'saving'}
            className="rounded-md text-xs transition-colors"
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--border-color, #333)',
              color: 'var(--text-secondary, #888)',
              backgroundColor: 'transparent',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => { void handleSave(); }}
            disabled={status === 'saving' || !configured || !hasContent || !fileName.trim()}
            className="rounded-md text-xs font-medium transition-opacity disabled:opacity-40"
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: 'var(--accent-color, #4f98a3)',
              color: '#fff',
              border: 'none',
            }}
          >
            {status === 'saving' ? 'Saving\u2026' : 'Save to ' + providerLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
