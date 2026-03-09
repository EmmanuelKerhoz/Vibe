import React, { useState, useRef, useEffect } from 'react';
import { Globe, Sun, Moon, Volume2, VolumeX, ChevronDown } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { useTranslation, SUPPORTED_UI_LOCALES } from '../../i18n';
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
  setIsAboutOpen: (v: boolean) => void;
}

export function StatusBar({
  song, wordCount, isGenerating, isAnalyzing, isSuggesting,
  theme, setTheme, audioFeedback, setAudioFeedback,
  setIsAboutOpen,
}: Props) {
  const { t, language, setLanguage } = useTranslation();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const isBusy = isGenerating || isAnalyzing || isSuggesting;
  const statusLabel = isGenerating ? t.statusBar.generating
    : isAnalyzing ? t.statusBar.analyzing
    : isSuggesting ? t.statusBar.suggesting
    : t.statusBar.ready;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLocale = SUPPORTED_UI_LOCALES.find(l => l.code === language);

  return (
    <div className="lcars-status-bar h-10 border-t border-fluent-border flex items-center justify-between px-6 z-40 text-[10px]">
      {/* Left: system status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isBusy ? 'bg-[var(--accent-warning)] animate-pulse' : 'bg-[var(--accent-color)] lcars-pulse'}`} />
          <span className="telemetry-text uppercase tracking-wider text-zinc-900 dark:text-zinc-300">
            {statusLabel}
          </span>
        </div>
        <div className="lcars-divider" />
        <span className="telemetry-text text-zinc-600 dark:text-zinc-400">
          {song.length} <span className="text-zinc-400 dark:text-zinc-600 uppercase">{t.statusBar.sections}</span>
        </span>
        <span className="telemetry-text text-zinc-600 dark:text-zinc-400">
          {wordCount} <span className="text-zinc-400 dark:text-zinc-600 uppercase">{t.statusBar.words}</span>
        </span>
      </div>

      {/* Right: meta controls */}
      <div className="flex items-center gap-1">
        <Tooltip title={t.tooltips.theme}>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="lcars-meta-btn"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{t.statusBar.theme}</span>
          </button>
        </Tooltip>
        <div className="lcars-divider" />
        <Tooltip title={t.tooltips.audioFeedback}>
          <button
            onClick={() => setAudioFeedback(!audioFeedback)}
            className="lcars-meta-btn"
          >
            {audioFeedback ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{t.statusBar.audioFeedback}</span>
          </button>
        </Tooltip>
        <div className="lcars-divider" />
        <div className="relative" ref={langDropdownRef}>
          <Tooltip title={t.statusBar.language}>
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="lcars-meta-btn lcars-lang-btn flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="telemetry-text font-semibold">{currentLocale?.label || language.toUpperCase()}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </Tooltip>
          {isLangDropdownOpen && (
            <div className="absolute bottom-full mb-2 right-0 py-1 bg-fluent-card border border-fluent-border rounded-lg shadow-2xl z-50 backdrop-blur-xl min-w-[160px] overflow-hidden">
              {SUPPORTED_UI_LOCALES.map(locale => (
                <button
                  key={locale.code}
                  onClick={() => {
                    setLanguage(locale.code);
                    setIsLangDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-xs hover:bg-white/5 transition-colors flex items-center gap-2.5 ${
                    locale.code === language ? 'text-[var(--accent-color)] bg-[var(--accent-color)]/10' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-lg leading-none">{locale.flag}</span>
                  <span className="flex-1 font-medium">{locale.label}</span>
                  {locale.code === language && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)]" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="lcars-divider" />
        <Tooltip title={t.tooltips.appInfo}>
          <button
            onClick={() => setIsAboutOpen(true)}
            className="lcars-meta-btn lcars-app-id"
          >
            {t.app.name} <span className="telemetry-text opacity-60">{APP_VERSION}</span>
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
