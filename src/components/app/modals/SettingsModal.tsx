import React, { useRef, useEffect, useState } from 'react';
import { X, Github, BookOpen, Monitor, Sun, Moon, Volume2, VolumeX, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation, SUPPORTED_UI_LOCALES } from '../../../i18n';
import { APP_VERSION } from '../../../version';
import { Button } from '../../ui/Button';

const DEFAULT_SETTINGS = {
  theme: 'dark' as const,
  audioFeedback: true,
  language: 'en',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  setTheme: (v: 'light' | 'dark') => void;
  audioFeedback: boolean;
  setAudioFeedback: (v: boolean) => void;
}

export function SettingsModal({
  isOpen, onClose,
  theme, setTheme,
  audioFeedback, setAudioFeedback,
}: Props) {
  const { t, language, setLanguage } = useTranslation();
  const langListRef = useRef<HTMLDivElement>(null);
  const [draftTheme, setDraftTheme] = useState(theme);
  const [draftAudioFeedback, setDraftAudioFeedback] = useState(audioFeedback);
  const [draftLanguage, setDraftLanguage] = useState(language);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setDraftTheme(theme);
    setDraftAudioFeedback(audioFeedback);
    setDraftLanguage(language);
  }, [audioFeedback, isOpen, language, theme]);

  const handleDefault = () => {
    setDraftTheme(DEFAULT_SETTINGS.theme);
    setDraftAudioFeedback(DEFAULT_SETTINGS.audioFeedback);
    setDraftLanguage(DEFAULT_SETTINGS.language);
  };

  const handleSave = () => {
    setTheme(draftTheme);
    setAudioFeedback(draftAudioFeedback);
    setLanguage(draftLanguage);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-xl"
          />
          {/* Ambient glow – dark theme only */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden items-center justify-center hidden dark:flex">
            <div className="w-[500px] h-[300px] bg-[var(--accent-color)]/10 blur-[120px] rounded-full" />
          </div>

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            role="dialog"
            aria-modal="true"
            aria-label={t.settings.title}
            className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[24px_8px_24px_8px] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)] flex-shrink-0">
              <h2 className="text-sm font-bold tracking-widest text-[var(--text-primary)] uppercase">
                {t.settings.title}
              </h2>
              <button
                onClick={onClose}
                aria-label={t.about.close}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)] rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* Theme section */}
              <section aria-labelledby="settings-theme-heading">
                <h3 id="settings-theme-heading" className="micro-label text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5" />
                  {t.settings.theme.label}
                </h3>
                <div className="flex gap-2">
                  {(
                    [
                      { value: 'dark', label: t.settings.theme.dark, icon: <Moon className="w-4 h-4" /> },
                      { value: 'light', label: t.settings.theme.light, icon: <Sun className="w-4 h-4" /> },
                    ] as const
                  ).map(({ value, label, icon }) => (
                    <button
                      key={value}
                      onClick={() => setDraftTheme(value)}
                      aria-pressed={draftTheme === value}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                        draftTheme === value
                          ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10 text-[var(--accent-color)]'
                          : 'border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sidebar)]'
                      }`}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Audio section */}
              <section aria-labelledby="settings-audio-heading">
                <h3 id="settings-audio-heading" className="micro-label text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                  {draftAudioFeedback ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  {t.settings.audio.label}
                </h3>
                <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg">
                  <span className="text-xs text-[var(--text-primary)]">{t.settings.audio.enable}</span>
                  <button
                    role="switch"
                    aria-checked={draftAudioFeedback}
                    onClick={() => setDraftAudioFeedback(!draftAudioFeedback)}
                    className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] ${
                      draftAudioFeedback ? 'bg-[var(--accent-color)]' : 'bg-[var(--border-color)]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        draftAudioFeedback ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </section>

              {/* Language section */}
              <section aria-labelledby="settings-lang-heading">
                <h3 id="settings-lang-heading" className="micro-label text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" />
                  {t.settings.language.label}
                </h3>
                <div
                  ref={langListRef}
                  className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto custom-scrollbar"
                >
                  {SUPPORTED_UI_LOCALES.map(locale => (
                    <button
                      key={locale.code}
                      onClick={() => setDraftLanguage(locale.code)}
                      aria-pressed={locale.code === draftLanguage}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                        locale.code === draftLanguage
                          ? 'bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/30 text-[var(--accent-color)]'
                          : 'bg-[var(--bg-app)] border border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sidebar)]'
                      }`}
                    >
                      <span className="text-base leading-none">{locale.flag}</span>
                      <span className="font-medium truncate">{locale.label}</span>
                       {locale.code === draftLanguage && (
                         <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent-color)] flex-shrink-0" />
                       )}
                     </button>
                  ))}
                </div>
              </section>

              {/* About section */}
              <section aria-labelledby="settings-about-heading" className="border-t border-[var(--border-color)] pt-6">
                <h3 id="settings-about-heading" className="micro-label text-[var(--text-secondary)] mb-3">
                  {t.settings.about.version}
                </h3>
                <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg mb-3">
                  <span className="text-xs text-[var(--text-secondary)]">{t.app.name}</span>
                  <span className="telemetry-text text-xs text-[var(--accent-color)]">{APP_VERSION}</span>
                </div>
                <div className="flex gap-2">
                  <a
                    href="https://github.com/EmmanuelKerhoz/Vibe"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.settings.about.github}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[var(--bg-app)] hover:bg-[var(--bg-sidebar)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-all text-xs"
                  >
                    <Github className="w-3.5 h-3.5" />
                    {t.settings.about.github}
                  </a>
                  <a
                    href="https://github.com/EmmanuelKerhoz/Vibe/blob/main/README.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.settings.about.docs}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[var(--bg-app)] hover:bg-[var(--bg-sidebar)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-all text-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    {t.settings.about.docs}
                  </a>
                </div>
              </section>
            </div>
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] flex-shrink-0">
              <Button onClick={handleDefault} variant="outlined" color="inherit">
                {t.settings.actions.default}
              </Button>
              <div className="flex items-center gap-3">
                <Button onClick={onClose} variant="text" color="inherit">
                  {t.settings.actions.close}
                </Button>
                <Button onClick={handleSave} variant="contained" color="primary">
                  {t.settings.actions.save}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
