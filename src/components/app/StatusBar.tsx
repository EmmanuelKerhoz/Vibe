import React from 'react';
import { Moon, Sun, Volume2, VolumeX, Info, Settings } from '../ui/icons';
import { Tooltip } from '../ui/Tooltip';
import { useTranslation } from '../../i18n';
import { useAppKpis } from '../../hooks/useAppKpis';

interface StatusBarProps {
  className?: string;
  isAnalyzing: boolean;
  theme: string;
  setTheme: (theme: string) => void;
  audioFeedback: boolean;
  setAudioFeedback: (v: boolean) => void;
  onOpenAbout: () => void;
  onOpenSettings: () => void;
}

export function StatusBar({
  className,
  isAnalyzing,
  theme,
  setTheme,
  audioFeedback,
  setAudioFeedback,
  onOpenAbout,
  onOpenSettings,
}: StatusBarProps) {
  const { wordCount, charCount } = useAppKpis();
  const { t } = useTranslation();

  return (
    <div className={`flex items-center justify-between px-4 py-1.5 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] text-[10px] text-zinc-500 shrink-0 ${className ?? ''}`}>
      <div className="flex items-center gap-4">
        <span className="tabular-nums">
          {t.statusBar?.words ?? 'Words'}: <span className="text-zinc-300">{wordCount}</span>
        </span>
        <span className="tabular-nums">
          {t.statusBar?.chars ?? 'Chars'}: <span className="text-zinc-300">{charCount}</span>
        </span>
        {isAnalyzing && (
          <span className="text-[var(--accent-color)] animate-pulse">
            {t.statusBar?.analyzing ?? 'Analyzing…'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Tooltip title={t.tooltips?.toggleTheme ?? 'Toggle theme'}>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="ux-interactive p-1 hover:text-zinc-300 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </Tooltip>
        <Tooltip title={t.tooltips?.toggleAudio ?? 'Toggle audio feedback'}>
          <button
            onClick={() => setAudioFeedback(!audioFeedback)}
            className="ux-interactive p-1 hover:text-zinc-300 transition-colors"
            aria-label="Toggle audio feedback"
          >
            {audioFeedback ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </Tooltip>
        <Tooltip title={t.tooltips?.openSettings ?? 'Settings'}>
          <button
            onClick={onOpenSettings}
            className="ux-interactive p-1 hover:text-zinc-300 transition-colors"
            aria-label="Open settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip title={t.tooltips?.openAbout ?? 'About'}>
          <button
            onClick={onOpenAbout}
            className="ux-interactive p-1 hover:text-zinc-300 transition-colors"
            aria-label="Open about"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
