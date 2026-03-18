import React, { useRef, useEffect, useState } from 'react';
import { X, Github, BookOpen, Monitor, Sun, Moon, Volume2, VolumeX, Globe, Settings, Type, FileCode } from 'lucide-react';
import { useTranslation, SUPPORTED_UI_LOCALES } from '../../../i18n';
import { APP_VERSION } from '../../../version';
import { Button } from '../../ui/Button';
import { emojiToTwemojiUrl, isPlainAscii } from '../../../utils/emojiUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  audioFeedback: boolean;
  setAudioFeedback: (value: boolean) => void;
  uiScale: 'small' | 'medium' | 'large';
  setUiScale: (v: 'small' | 'medium' | 'large') => void;
  defaultEditMode: 'section' | 'markdown';
  setDefaultEditMode: (v: 'section' | 'markdown') => void;
}

const UI_SCALE_FONT_SIZES: Record<'small' | 'medium' | 'large', string> = {
  small: '12px',
  medium: '14px',
  large: '16px',
};

function applyUiScalePreview(scale: 'small' | 'medium' | 'large') {
  document.documentElement.style.fontSize = UI_SCALE_FONT_SIZES[scale];
}

function FlagEmoji({ flag, code }: { flag: string; code: string }) {
  const [useFallback, setUseFallback] = React.useState(false);
  const display = flag || code.toUpperCase();

  if (useFallback || isPlainAscii(display)) {
    return (
      <span
        aria-hidden="true"
        style={{
          fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif',
          fontSize: '1.125rem',
          lineHeight: 1,
          display: 'inline-block',
        }}
      >
        {display}
      </span>
    );
  }

  return (
    <img
      src={emojiToTwemojiUrl(display)}
      alt={display}
      aria-hidden="true"
      onError={() => setUseFallback(true)}
      style={{ width: '1.125rem', height: '1.125rem', display: 'inline-block', verticalAlign: '-0.1em' }}
    />
  );
}

export function SettingsModal({
  isOpen,
  onClose,
  theme,
  setTheme,
  audioFeedback,
  setAudioFeedback,
  uiScale,
  setUiScale,
  defaultEditMode,
  setDefaultEditMode,
}: Props) {
  const { t, language, setLanguage } = useTranslation();
  const [draftTheme, setDraftTheme] = useState(theme);
  const [draftAudioFeedback, setDraftAudioFeedback] = useState(audioFeedback);
  const [draftLanguage, setDraftLanguage] = useState(language);
  const [draftUiScale, setDraftUiScale] = useState(uiScale);
  const [draftDefaultEditMode, setDraftDefaultEditMode] = useState(defaultEditMode);
  const closeActionRef = useRef<'save' | 'close' | null>(null);

  useEffect(() => {
    if (isOpen) {
      closeActionRef.current = null;
      setDraftTheme(theme);
      setDraftAudioFeedback(audioFeedback);
      setDraftLanguage(language);
      setDraftUiScale(uiScale);
      setDraftDefaultEditMode(defaultEditMode);
    }
  }, [isOpen, theme, audioFeedback, language, uiScale, defaultEditMode]);

  useEffect(() => {
    if (isOpen) {
      applyUiScalePreview(draftUiScale);
      return;
    }

    if (closeActionRef.current !== 'save') {
      applyUiScalePreview(uiScale);
    }
    closeActionRef.current = null;
  }, [draftUiScale, isOpen, uiScale]);

  const handleClose = () => {
    closeActionRef.current = 'close';
    applyUiScalePreview(uiScale);
    onClose();
  };

  const handleApply = () => {
    closeActionRef.current = 'save';
    setTheme(draftTheme);
    setAudioFeedback(draftAudioFeedback);
    setLanguage(draftLanguage);
    setUiScale(draftUiScale);
    setDefaultEditMode(draftDefaultEditMode);
    onClose();
  };

  const handleDefault = () => {
    setDraftTheme('dark');
    setDraftAudioFeedback(true);
    setDraftLanguage('en');
    setDraftUiScale('large');
    setDraftDefaultEditMode('section');
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xl animate-in fade-in duration-300"
            onClick={handleClose}
          />

          {/* Ambient glow – dark theme only */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden items-center justify-center hidden dark:flex">
            <div className="w-[500px] h-[400px] bg-[var(--accent-color)]/10 blur-[120px] rounded-full" />
          </div>

          {/* Gradient border wrapper */}
          <div
            className="relative w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-[24px_8px_24px_8px] animate-in zoom-in-95 duration-300"
            style={{
              padding: '2px',
              background: 'var(--accent-rail-gradient-h)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Modal panel */}
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t.settings.title}
              className="relative w-full h-full flex flex-col glass-panel shadow-2xl overflow-hidden rounded-none sm:rounded-[22px_6px_22px_6px]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-sidebar)] flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-[var(--accent-color)]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-widest text-[var(--text-primary)] uppercase">
                      {t.settings.title}
                    </h3>
                    <p className="text-xs text-[var(--accent-color)] uppercase tracking-wider mt-0.5">
                      {APP_VERSION}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  aria-label={t.about.close}
                  className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)] rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable body — clone of original, kept intact */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

                {/* Theme */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-[var(--accent-color)]" />
                    <span className="text-xs font-bold tracking-widest uppercase text-[var(--text-primary)]">{t.settings.theme.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['light', 'dark'] as const).map(opt => (
                      <button key={opt} onClick={() => setDraftTheme(opt)}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                          draftTheme === opt
                            ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)]/40 text-[var(--accent-color)]'
                            : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-color)]/20'
                        }`}
                      >
                        {opt === 'light' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                        {opt === 'light' ? t.settings.theme.light : t.settings.theme.dark}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audio Feedback */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[var(--accent-color)]" />
                    <span className="text-xs font-bold tracking-widest uppercase text-[var(--text-primary)]">{t.settings.audio.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {([true, false] as const).map(opt => (
                      <button key={String(opt)} onClick={() => setDraftAudioFeedback(opt)}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                          draftAudioFeedback === opt
                            ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)]/40 text-[var(--accent-color)]'
                            : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-color)]/20'
                        }`}
                      >
                        {opt ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                        {opt ? t.settings.audio.enable : t.settings.audio.disable}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[var(--accent-color)]" />
                    <span className="text-xs font-bold tracking-widest uppercase text-[var(--text-primary)]">{t.settings.language.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {SUPPORTED_UI_LOCALES.map(locale => (
                      <button key={locale.code} onClick={() => setDraftLanguage(locale.code)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                          draftLanguage === locale.code
                            ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)]/40 text-[var(--accent-color)]'
                            : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-color)]/20'
                        }`}
                      >
                        <FlagEmoji flag={locale.flag} code={locale.code} />
                        <span>{locale.label}</span>
                        {draftLanguage === locale.code && <span className="ml-auto text-[8px] font-bold uppercase tracking-widest opacity-60">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* UI Scale */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-[var(--accent-color)]" />
                    <span className="text-xs font-bold tracking-widest uppercase text-[var(--text-primary)]">{t.settings.scale.label}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['small', 'medium', 'large'] as const).map(opt => (
                      <button key={opt} onClick={() => setDraftUiScale(opt)}
                        className={`flex items-center justify-center px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                          draftUiScale === opt
                            ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)]/40 text-[var(--accent-color)]'
                            : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-color)]/20'
                        }`}
                      >
                        {t.settings.scale[opt]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default Editor */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-[var(--accent-color)]" />
                    <span className="text-xs font-bold tracking-widest uppercase text-[var(--text-primary)]">{t.settings.editMode.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['section', 'markdown'] as const).map(opt => (
                      <button key={opt} onClick={() => setDraftDefaultEditMode(opt)}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                          draftDefaultEditMode === opt
                            ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)]/40 text-[var(--accent-color)]'
                            : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-color)]/20'
                        }`}
                      >
                        {opt === 'section' ? t.settings.editMode.section : t.settings.editMode.markdown}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] flex items-center justify-between flex-shrink-0">
                <Button onClick={handleDefault} variant="outlined" color="info" size="small">
                  {t.settings.actions.default}
                </Button>
                <div className="flex items-center gap-2">
                  <Button onClick={handleClose} variant="outlined" color="info" size="small">
                    {t.settings.actions.close}
                  </Button>
                  <Button onClick={handleApply} variant="contained" color="primary" size="small">
                    {t.settings.actions.save}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
