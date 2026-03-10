import React, { useState } from 'react';
import { Info, Moon, Settings, Sun } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { useTranslation } from '../../i18n';
import { tPlural } from '../../i18n/plurals';
import { SettingsModal } from './modals/SettingsModal';
import { APP_VERSION } from '../../version';

interface Props {
  song: { length: number };
  wordCount: number;
  isGenerating: boolean;
  isAnalyzing: boolean;
  isSuggesting: boolean;
  theme: 'light' | 'dark';
  setTheme: (v: 'light' | 'dark') => void;
  audioFeedback: boolean;
  setAudioFeedback: (v: boolean) => void;
  onOpenAbout: () => void;
}

export function StatusBar({
  song, wordCount, isGenerating, isAnalyzing, isSuggesting,
  theme, setTheme, audioFeedback, setAudioFeedback,
  onOpenAbout,
}: Props) {
  const { t, language } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isBusy = isGenerating || isAnalyzing || isSuggesting;
  const statusLabel = isGenerating ? t.statusBar.generating
    : isAnalyzing ? t.statusBar.analyzing
    : isSuggesting ? t.statusBar.suggesting
    : t.statusBar.ready;

  const statusBarDict = t.statusBar as Record<string, string | undefined>;

  return (
    <>
      <div className="lcars-status-bar h-10 border-t border-fluent-border flex items-center justify-between px-6 z-40 text-[10px]">
        {/* Left: system status + KPIs */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isBusy ? 'bg-[var(--accent-warning)] animate-pulse' : 'bg-[var(--accent-color)] lcars-pulse'}`} />
            <span className="telemetry-text uppercase tracking-wider text-zinc-900 dark:text-zinc-300">
              {statusLabel}
            </span>
          </div>
          <div className="lcars-divider" />
          <span className="telemetry-text text-zinc-600 dark:text-zinc-400">
            {song.length}{' '}
            <span className="text-zinc-400 dark:text-zinc-600 uppercase">
              {tPlural(statusBarDict, 'sections', song.length, language)}
            </span>
          </span>
          <span className="telemetry-text text-zinc-600 dark:text-zinc-400">
            {wordCount}{' '}
            <span className="text-zinc-400 dark:text-zinc-600 uppercase">
              {tPlural(statusBarDict, 'words', wordCount, language)}
            </span>
          </span>
        </div>

        {/* Right: settings + theme + version */}
        <div className="flex items-center gap-1">
          <Tooltip title={t.statusBar.settings}>
            <button
              onClick={() => setIsSettingsOpen(true)}
              aria-label={t.statusBar.settings}
              className="lcars-meta-btn"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{t.statusBar.settings}</span>
            </button>
          </Tooltip>
          <Tooltip title={t.tooltips.theme}>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={t.statusBar.theme}
              className="lcars-meta-btn"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{theme === 'dark' ? t.settings.theme.light : t.settings.theme.dark}</span>
            </button>
          </Tooltip>
          <Tooltip title={t.tooltips.appInfo}>
            <button
              onClick={onOpenAbout}
              aria-label={t.settings.about.version}
              className="lcars-meta-btn lcars-app-id"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{APP_VERSION}</span>
            </button>
          </Tooltip>
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        audioFeedback={audioFeedback}
        setAudioFeedback={setAudioFeedback}
      />
    </>
  );
}
