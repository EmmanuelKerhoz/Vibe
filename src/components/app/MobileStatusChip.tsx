import React from 'react';
import { useTranslation, stripInternalPrefix } from '../../i18n';
import { useComposerContext } from '../../contexts/ComposerContext';
import type { SaveStatus } from '../../hooks/useSessionAutoSave';

interface Props {
  hasApiKey: boolean;
  saveStatus?: SaveStatus;
  lastSavedAt?: number | null;
}

export function MobileStatusChip({ hasApiKey, saveStatus = 'idle', lastSavedAt = null }: Props) {
  const { isGenerating, isSuggesting } = useComposerContext();
  const { t, language } = useTranslation();

  const isBusy = isGenerating || isSuggesting;

  // ── Save status dot
  const dotClass =
    saveStatus === 'saving'  ? 'mobile-status-dot mobile-status-dot--saving'
    : saveStatus === 'unsaved' ? 'mobile-status-dot mobile-status-dot--unsaved'
    : saveStatus === 'error'   ? 'mobile-status-dot mobile-status-dot--error'
    : 'mobile-status-dot mobile-status-dot--saved';

  const saveLabel =
    saveStatus === 'saving'  ? (t.statusBar?.saving   ?? 'saving')
    : saveStatus === 'unsaved' ? (t.statusBar?.unsaved  ?? 'unsaved')
    : saveStatus === 'error'   ? (t.statusBar?.saveError ?? 'error')
    : lastSavedAt
      ? new Date(lastSavedAt).toLocaleTimeString(
          stripInternalPrefix(language) || 'en',
          { hour: '2-digit', minute: '2-digit' },
        )
      : (t.statusBar?.sessionSavedBadge ?? 'saved');

  // ── Language code
  const langCode = (stripInternalPrefix(language) || 'en').toUpperCase().slice(0, 2);

  // ── API key indicator
  const apiDotClass = hasApiKey
    ? 'mobile-status-dot mobile-status-dot--saved'
    : 'mobile-status-dot mobile-status-dot--error';
  const apiLabel = hasApiKey
    ? (t.statusBar?.ready ?? 'API')
    : (t.settings?.apiKey?.missingShort ?? 'NO KEY');

  return (
    <div className="mobile-status-chip" role="status" aria-live="polite" aria-label="App status">
      {/* Save status */}
      <span className="mobile-status-chip__item">
        <span className={dotClass} />
        <span className="mobile-status-chip__label">{saveLabel}</span>
      </span>

      <span className="mobile-status-chip__divider" />

      {/* Language */}
      <span className="mobile-status-chip__item">
        <span className="mobile-status-chip__label mobile-status-chip__label--mono">{langCode}</span>
      </span>

      <span className="mobile-status-chip__divider" />

      {/* API key */}
      <span className="mobile-status-chip__item">
        <span className={apiDotClass} />
        <span className="mobile-status-chip__label">{apiLabel}</span>
      </span>

      {/* Busy indicator — right-aligned */}
      {isBusy && (
        <>
          <span className="mobile-status-chip__divider" />
          <span className="mobile-status-chip__item mobile-status-chip__item--busy">
            <span className="mobile-status-chip__spinner" aria-hidden="true" />
            <span className="mobile-status-chip__label">
              {isGenerating
                ? (t.statusBar?.generating ?? 'GEN')
                : (t.statusBar?.suggesting ?? 'AI')}
            </span>
          </span>
        </>
      )}
    </div>
  );
}
