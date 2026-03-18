import React from 'react';
import { Info, Moon, Settings, Sun } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { StorageGauge } from '../ui/StorageGauge';
import { useTranslation } from '../../i18n';
import { tPlural } from '../../i18n/plurals';
import { APP_VERSION } from '../../version';

interface Props {
  song: { length: number };
  wordCount: number;
  charCount: number;
  isGenerating: boolean;
  isAnalyzing: boolean;
  isSuggesting: boolean;
  theme: 'light' | 'dark';
  setTheme: (v: 'light' | 'dark') => void;
  audioFeedback: boolean;
  setAudioFeedback: (v: boolean) => void;
  onOpenAbout: () => void;
  onOpenSettings: () => void;
  /** Extra class applied to the root element (e.g. for mobile hide/show). */
  className?: string;
}

export function StatusBar({
  song, wordCount, charCount, isGenerating, isAnalyzing, isSuggesting,
  theme, setTheme, audioFeedback, setAudioFeedback,
  onOpenAbout, onOpenSettings, className,
}: Props) {
  const { t, language } = useTranslation();

  const isBusy = isGenerating || isAnalyzing || isSuggesting;
  const statusLabel = isGenerating ? t.statusBar.generating
    : isAnalyzing ? t.statusBar.analyzing
    : isSuggesting ? t.statusBar.suggesting
    : t.statusBar.ready;

  const statusBarDict = t.statusBar as Record<string, string | undefined>;

  return (
    // FIX C/D: added `relative` so that `z-40` (z-index:40) takes effect and
    // buttons are not blocked by lower-z overlays or the acrylic backdrop.
    <div className={`relative lcars-status-bar h-10 border-t border-fluent-border flex items-center justify-between px-3 lg:px-6 z-40 text-[10px]${className ? ` ${className}` : ''}`}>
      {/* Left: system status + KPIs desktop only */}
      <div className="flex items-center gap-2 lg:gap-4">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isBusy ? 'bg-[var(--accent-warning)] animate-pulse' : 'bg-[var(--accent-color)] lcars-pulse'}`} />
          <span className="telemetry-text uppercase tracking-wider text-zinc-900 dark:text-zinc-300">
            {statusLabel}
          </span>
          {isBusy && <span className="lcars-cursor-blink text-[var(--accent-warning)]" />}
        </div>
        <div className="lcars-divider" />
        {/* KPIs — desktop only (hidden on mobile, shown in InsightsBar) */}
        <span className="hidden lg:inline telemetry-text text-zinc-600 dark:text-zinc-400">
          {song.length}{' '}
          <span className="text-zinc-400 dark:text-zinc-600 uppercase">
            {tPlural(statusBarDict, 'sections', song.length, language)}
          </span>
        </span>
        <span className="hidden lg:inline telemetry-text text-zinc-600 dark:text-zinc-400">
          {wordCount}{' '}
          <span className="text-zinc-400 dark:text-zinc-600 uppercase">
            {tPlural(statusBarDict, 'words', wordCount, language)}
          </span>
        </span>
        <span className="hidden lg:inline telemetry-text text-zinc-600 dark:text-zinc-400">
          {charCount}{' '}
          <span className="text-zinc-400 dark:text-zinc-600 uppercase">
            {t.insights.characters}
          </span>
        </span>
      </div>

      {/* Right: storage + settings + theme + version */}
      <div className="flex items-center gap-1">
        <StorageGauge />
        <Tooltip title={t.statusBar.settings}>
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
            aria-label={t.statusBar.theme}
            className="lcars-meta-btn min-h-[44px] lg:min-h-0"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{theme === 'dark' ? t.settings.theme.light : t.settings.theme.dark}</span>
          </button>
        </Tooltip>
        <Tooltip title={t.tooltips.appInfo}>
          <button
            onClick={onOpenAbout}
            aria-label={t.settings.about.version}
            className="lcars-meta-btn lcars-app-id min-h-[44px] lg:min-h-0"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{APP_VERSION}</span>
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
