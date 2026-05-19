import React from 'react';
import { Info, Moon, Settings, Sun } from '../ui/icons';
import { Tooltip } from '../ui/Tooltip';
import { StorageGauge } from '../ui/StorageGauge';
import { StatusBarLanguagePicker } from './StatusBarLanguagePicker';
import { useTranslation, stripInternalPrefix } from '../../i18n';
import { tPlural } from '../../i18n/plurals';
import { APP_VERSION_LABEL } from '../../version';
import { useComposerContext } from '../../contexts/ComposerContext';
import { useAppKpis } from '../../hooks/useAppKpis';
import { useAppNavigationContext } from '../../contexts/AppStateContext';
import { VoiceAssistantButton } from '../../features/voice/VoiceAssistantButton';
import { useVoiceAssistantController } from '../../features/voice/useVoiceAssistantController';
import type { SaveStatus } from '../../hooks/useSessionAutoSave';
import type { Translations } from '../../i18n/locales/types';
import type { EditMode } from '../../types';

interface Props {
  hasApiKey: boolean;
  isAnalyzing: boolean;
  currentEditMode: EditMode;
  theme: 'light' | 'dark';
  setTheme: (v: 'light' | 'dark') => void;
  audioFeedback: boolean;
  setAudioFeedback: (v: boolean) => void;
  onOpenAbout: () => void;
  onOpenSettings: () => void;
  /** True when a valid OPFS session snapshot exists for this device. */
  hasSavedSession?: boolean;
  /** Real-time auto-save status (saving / saved / unsaved / error). */
  saveStatus?: SaveStatus;
  /** Timestamp of the most recent successful save (ms). */
  lastSavedAt?: number | null;
  /** Extra class applied to the root element (e.g. for mobile hide/show). */
  className?: string;
}

/**
 * Returns a safe BCP-47 locale code for use with Intl APIs.
 * Falls back to 'en' when the stripped code is empty or invalid.
 */
function safeLocale(language: string): string {
  const stripped = stripInternalPrefix(language);
  return stripped.length > 0 ? stripped : 'en';
}

export function StatusBar({
  hasApiKey,
  isAnalyzing,
  currentEditMode,
  theme, setTheme, audioFeedback, setAudioFeedback,
  onOpenAbout, onOpenSettings, hasSavedSession,
  saveStatus = 'idle', lastSavedAt = null,
  className,
}: Props) {
  const { isGenerating, isSuggesting } = useComposerContext();
  const { sectionCount, wordCount, charCount } = useAppKpis();
  const { t, language } = useTranslation();
  const { activeTab } = useAppNavigationContext();

  // ── Voice assistant (moved from TopRibbon) ───────────────────────────────
  const {
    invoke: invokeVoiceAssistant,
    uiState: voiceUiState,
    promptText: voicePromptText,
    textFallback: voiceTextFallback,
    errorText: voiceErrorText,
  } = useVoiceAssistantController({
    enabled: hasApiKey,
    page: activeTab,
    mode: currentEditMode,
  });

  const voiceLabel =
    voiceUiState === 'listening'
      ? (t.tooltips?.voiceListening ?? 'Listening…')
      : voiceUiState === 'processing'
        ? (t.tooltips?.voiceProcessing ?? 'Processing your request…')
        : voiceUiState === 'speaking'
          ? (t.tooltips?.voiceSpeaking ?? 'Speaking…')
          : (t.tooltips?.voiceAssistant ?? 'Voice assistant');

  const isBusy = isGenerating || isAnalyzing || isSuggesting;
  const statusLabel = isGenerating ? t.statusBar.generating
    : isAnalyzing ? t.statusBar.analyzing
    : isSuggesting ? t.statusBar.suggesting
    : t.statusBar.ready;

  const statusBarDict = t.statusBar as Record<string, string | undefined>;

  // ── Persistence indicator ────────────────────────────────────────────────
  const isPersistenceActive = saveStatus !== 'idle';
  const persistenceVisible = isPersistenceActive || hasSavedSession;
  const persistenceState: SaveStatus = isPersistenceActive
    ? saveStatus
    : (hasSavedSession ? 'saved' : 'idle');

  const persistenceLabel =
    persistenceState === 'saving'  ? (t.statusBar.saving   ?? 'saving…')
    : persistenceState === 'unsaved' ? (t.statusBar.unsaved  ?? 'unsaved')
    : persistenceState === 'error'   ? (t.statusBar.saveError ?? 'save error')
    : (t.statusBar.sessionSavedBadge ?? 'saved');

  const persistenceTooltip =
    persistenceState === 'saving'  ? (t.statusBar.saving   ?? 'Saving…')
    : persistenceState === 'unsaved' ? (t.statusBar.unsaved  ?? 'Unsaved changes')
    : persistenceState === 'error'   ? (t.statusBar.saveError ?? 'Save error')
    : lastSavedAt
      ? `${t.statusBar.sessionSavedTooltip ?? 'Session auto-saved to this device'} — ${new Date(lastSavedAt).toLocaleTimeString(safeLocale(language))}`
      : (t.statusBar.sessionSavedTooltip ?? 'Session auto-saved to this device');

  // ── Persistence dot / text — CSS tokens only (no Tailwind color classes) ──
  const persistenceDotClass =
    persistenceState === 'saving'  ? 'mobile-status-dot mobile-status-dot--saving'
    : persistenceState === 'unsaved' ? 'mobile-status-dot mobile-status-dot--unsaved'
    : persistenceState === 'error'   ? 'mobile-status-dot mobile-status-dot--error'
    : 'mobile-status-dot mobile-status-dot--saved';

  const persistenceTextStyle: React.CSSProperties =
    persistenceState === 'saving'
      ? { color: 'var(--accent-warning)' }
      : persistenceState === 'unsaved'
      ? { color: 'var(--text-secondary)' }
      : persistenceState === 'error'
      ? { color: 'var(--accent-error, #ef4444)' }
      : { color: 'var(--accent-success, #10b981)' };

  const themeAriaLabel = theme === 'dark'
    ? (t.statusBar.themeSwitchToLight ?? `${t.statusBar.theme} — ${t.settings.theme.light}`)
    : (t.statusBar.themeSwitchToDark  ?? `${t.statusBar.theme} — ${t.settings.theme.dark}`);

  const insights: Translations['insights'] = t.insights;

  const voiceActive = voiceUiState !== 'idle';

  return (
    <div className={`relative lcars-status-bar h-10 border-t border-fluent-border flex items-center justify-between px-3 lg:px-6 z-40 text-xs${className ? ` ${className}` : ''}`}>
      {/* Left: system status + storage gauge + KPIs (desktop only) */}
      <div className="flex items-center gap-2 lg:gap-4">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
            isBusy || !hasApiKey
              ? 'bg-[var(--accent-warning)] animate-pulse'
              : 'bg-[var(--accent-color)] lcars-pulse'
          }`} />
          <span className="telemetry-text uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            {statusLabel}
          </span>
          {isBusy && <span className="lcars-cursor-blink text-[var(--accent-warning)]" />}
        </div>

        {/* Session persistence indicator */}
        {persistenceVisible && (
          <Tooltip title={persistenceTooltip}>
            <div
              className="flex items-center gap-1 cursor-default"
              role="status"
              aria-live="polite"
            >
              <span className={persistenceDotClass} />
              <span
                className="telemetry-text uppercase tracking-wider hidden sm:inline"
                style={persistenceTextStyle}
              >
                {persistenceLabel}
              </span>
            </div>
          </Tooltip>
        )}

        <div className="lcars-divider" />
        <StorageGauge />
        <div className="lcars-divider hidden lg:block" />

        {/* KPI counters */}
        <span className="hidden lg:inline telemetry-text" style={{ color: 'var(--text-primary)' }}>
          {sectionCount}{' '}
          <span className="uppercase" style={{ color: 'var(--text-secondary)' }}>
            {tPlural(statusBarDict, 'sections', sectionCount, language)}
          </span>
        </span>
        <span className="hidden lg:inline telemetry-text" style={{ color: 'var(--text-primary)' }}>
          {wordCount}{' '}
          <span className="uppercase" style={{ color: 'var(--text-secondary)' }}>
            {tPlural(statusBarDict, 'words', wordCount, language)}
          </span>
        </span>
        <span className="hidden lg:inline telemetry-text" style={{ color: 'var(--text-primary)' }}>
          {charCount}{' '}
          <span className="uppercase" style={{ color: 'var(--text-secondary)' }}>
            {insights?.characters}
          </span>
        </span>
      </div>

      {/* Centre: Voice activation — big pill button using available horizontal space */}
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
        <Tooltip title={voiceLabel}>
          <button
            onClick={invokeVoiceAssistant}
            disabled={!hasApiKey}
            aria-label={voiceLabel}
            aria-pressed={voiceActive}
            className="flex items-center gap-2 px-4 h-7 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              fontSize: '0.625rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: voiceActive ? 'var(--lcars-cyan, #4f98a3)' : 'var(--text-secondary)',
              background: voiceActive
                ? 'color-mix(in srgb, var(--lcars-cyan, #4f98a3) 14%, transparent)'
                : 'color-mix(in srgb, var(--text-secondary) 6%, transparent)',
              border: `1px solid ${voiceActive
                ? 'color-mix(in srgb, var(--lcars-cyan, #4f98a3) 30%, transparent)'
                : 'color-mix(in srgb, var(--text-secondary) 15%, transparent)'}`,
              boxShadow: voiceActive
                ? '0 0 8px color-mix(in srgb, var(--lcars-cyan, #4f98a3) 20%, transparent)'
                : 'none',
            }}
          >
            {/* Inline VoiceAssistantButton icon logic without wrapper div */}
            <VoiceAssistantButton
              state={voiceUiState}
              disabled={!hasApiKey}
              onInvoke={invokeVoiceAssistant}
            />
            <span className="hidden lg:inline">
              {voiceLabel}
            </span>
          </button>
        </Tooltip>
        {/* Inline voice feedback strip */}
        {(voicePromptText || voiceTextFallback || voiceErrorText) && (
          <div
            role={voiceErrorText ? 'alert' : 'status'}
            aria-live={voiceErrorText ? 'assertive' : 'polite'}
            className="absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border-color)] bg-[var(--bg-sidebar)] px-2.5 py-1 text-[10px] text-[var(--text-secondary)] shadow z-50"
          >
            {voiceErrorText ?? voiceTextFallback ?? voicePromptText}
          </div>
        )}
      </div>

      {/* Right: settings + theme + version */}
      <div className="flex items-center gap-1">
        <Tooltip title={t.statusBar.settingsTooltip ?? t.statusBar.settings}>
          <button
            onClick={onOpenSettings}
            aria-label={t.statusBar.settings}
            className="lcars-meta-btn min-h-[44px] lg:min-h-0"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.statusBar.settings}</span>
          </button>
        </Tooltip>
        <Tooltip title={t.tooltips.theme}>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={themeAriaLabel}
            aria-pressed={theme === 'dark'}
            className="lcars-meta-btn min-h-[44px] lg:min-h-0"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {theme === 'dark' ? t.settings.theme.light : t.settings.theme.dark}
            </span>
          </button>
        </Tooltip>
        <StatusBarLanguagePicker />
        <Tooltip title={t.tooltips.appInfo}>
          <button
            onClick={onOpenAbout}
            aria-label={t.settings.about.version}
            className="lcars-meta-btn lcars-app-id min-h-[44px] lg:min-h-0"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{APP_VERSION_LABEL}</span>
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
