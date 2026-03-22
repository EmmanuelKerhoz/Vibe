import React, { useRef, useEffect, useState } from 'react';
import { X, Github, BookOpen, Monitor, Sun, Moon, Volume2, VolumeX, Globe, Settings } from '../../ui/icons';
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
}

/**
 * Renders a flag emoji as a Twemoji SVG image so it displays correctly on
 * every platform (Windows doesn't render flag-emoji natively).
 * Falls back to the raw emoji character (or country code) if the image fails.
 */
function FlagEmoji({ flag, code }: { flag: string; code: string }) {
  const [useFallback, setUseFallback] = React.useState(false);
  const display = flag || code.toUpperCase();

  // Only attempt the Twemoji image for real emoji characters, not plain ASCII
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
}: Props) {
  const { t, language, setLanguage } = useTranslation();
  const [draftTheme, setDraftTheme] = useState(theme);
  const [draftAudioFeedback, setDraftAudioFeedback] = useState(audioFeedback);
  const [draftLanguage, setDraftLanguage] = useState(language);

  useEffect(() => {
    if (isOpen) {
      setDraftTheme(theme);
      setDraftAudioFeedback(audioFeedback);
      setDraftLanguage(language);
    }
  }, [isOpen, theme, audioFeedback, language]);

  const handleApply = () => {
    setTheme(draftTheme);
    setAudioFeedback(draftAudioFeedback);
    setLanguage(draftLanguage);
    onClose();
  };

  const handleDefault = () => {
    setDraftTheme('dark');
    setDraftAudioFeedback(true);
    setDraftLanguage('en');
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xl animate-in fade-in duration-300"
            onClick={onClose}
          />

          {/* Ambient glow – dark theme only */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden items-center justify-center hidden dark:flex">
            <div className="w-[500px] h-[400px] bg-[var(--accent-color)]/10 blur-[120px] rounded-full" />
          </div>

          {/* Modal panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.settings.title}
            className="relative w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 glass-panel border border-white/10 rounded-none sm:rounded-[24px_8px_24px_8px] shadow-2xl overflow-hidden dark:border-white/8"
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
                onClick={onClose}
                aria-label={t.about.close}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)] rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* Theme section */}
              <section aria-labelledby="settings-theme-heading">
                <h3 id="settings-theme-heading" className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5" />
                  {t.settings.theme.label}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'dark', 'system'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => opt !== 'system' && setDraftTheme(opt)}
                      disabled={opt === 'system'}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs transition-all ${
                        draftTheme === opt
                          ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)]/40 text-[var(--accent-color)]'
                          : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-color)]/20 hover:text-[var(--text-primary)]'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {opt === 'light' ? <Sun className="w-3.5 h-3.5" /> : opt === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                      <span className="capitalize">
                        {opt === 'light' ? t.settings.theme.light : opt === 'dark' ? t.settings.theme.dark : t.settings.theme.system}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Audio section */}
              <section aria-labelledby="settings-audio-heading">
                <h3 id="settings-audio-heading" className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                  {draftAudioFeedback ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  {t.settings.audio.label}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {([true, false] as const).map((val) => (
                    <button
                      key={String(val)}
                      onClick={() => setDraftAudioFeedback(val)}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs transition-all ${
                        draftAudioFeedback === val
                          ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)]/40 text-[var(--accent-color)]'
                          : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-color)]/20 hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {val ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                      <span>{val ? t.settings.audio.enable : (t.settings.audio.disable ?? '')}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Language section */}
              <section aria-labelledby="settings-lang-heading">
                <h3 id="settings-lang-heading" className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" />
                  {t.settings.language.label}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {SUPPORTED_UI_LOCALES.map((loc) => (
                    <button
                      key={loc.code}
                      onClick={() => setDraftLanguage(loc.code)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs transition-all ${
                        draftLanguage === loc.code
                          ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)]/40 text-[var(--accent-color)]'
                          : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-color)]/20 hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <FlagEmoji flag={loc.flag} code={loc.code} />
                      <span className="font-medium truncate">{loc.label}</span>
                      {loc.code === draftLanguage && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent-color)] flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </section>

              {/* About section */}
              <section aria-labelledby="settings-about-heading" className="border-t border-[var(--border-color)] pt-6">
                <h3 id="settings-about-heading" className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-3">
                  {t.settings.about.version}
                </h3>
                <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg mb-3">
                  <span className="text-xs text-[var(--text-secondary)]">{t.app.name}</span>
                  <span className="text-xs font-mono text-[var(--text-primary)]">{APP_VERSION}</span>
                </div>
                <div className="flex gap-2">
                  <a
                    href="https://github.com/EmmanuelKerhoz/Vibe"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.settings.about.github}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[var(--bg-app)] hover:bg-[var(--bg-sidebar)] border border-[var(--border-color)] hover:border-[var(--accent-color)]/30 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-all text-xs"
                  >
                    <Github className="w-3.5 h-3.5" />
                    {t.settings.about.github}
                  </a>
                  <a
                    href="https://github.com/EmmanuelKerhoz/Vibe/blob/main/README.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.settings.about.docs}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[var(--bg-app)] hover:bg-[var(--bg-sidebar)] border border-[var(--border-color)] hover:border-[var(--accent-color)]/30 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-all text-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    {t.settings.about.docs}
                  </a>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] flex-shrink-0">
              <Button onClick={handleDefault} variant="outlined" color="inherit">
                {t.settings.actions.default}
              </Button>
              <div className="flex gap-2">
                <Button onClick={onClose} variant="outlined" color="inherit">
                  {t.settings.actions.close}
                </Button>
                <Button onClick={handleApply} variant="contained" color="primary">
                  {t.settings.actions.save}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
