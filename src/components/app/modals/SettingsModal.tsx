import React, { useRef, useEffect } from 'react';
import { X, Github, BookOpen, Monitor, Sun, Moon, Volume2, VolumeX, Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation, SUPPORTED_UI_LOCALES } from '../../../i18n';
import { APP_VERSION } from '../../../version';

const SETTINGS_MODAL_VIEWPORT_MARGIN = '2rem';

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
  const currentLocale = SUPPORTED_UI_LOCALES.find(l => l.code === language);
  const langListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            role="dialog"
            aria-modal="true"
            aria-label={t.settings.title}
            className="relative w-full max-w-lg overflow-y-auto bg-fluent-card border border-fluent-border shadow-2xl lcars-panel"
            style={{ maxHeight: `calc(100vh - ${SETTINGS_MODAL_VIEWPORT_MARGIN})` }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-fluent-border bg-white/[0.02]">
              <h2 className="text-sm font-semibold text-zinc-100 tracking-wide uppercase">
                {t.settings.title}
              </h2>
              <button
                onClick={onClose}
                aria-label={t.about.close}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Theme section */}
              <section aria-labelledby="settings-theme-heading">
                <h3 id="settings-theme-heading" className="micro-label text-zinc-500 mb-3 flex items-center gap-2">
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
                      onClick={() => setTheme(value)}
                      aria-pressed={theme === value}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                        theme === value
                          ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10 text-[var(--accent-color)]'
                          : 'border-fluent-border bg-white/[0.02] text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
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
                <h3 id="settings-audio-heading" className="micro-label text-zinc-500 mb-3 flex items-center gap-2">
                  {audioFeedback ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  {t.settings.audio.label}
                </h3>
                <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-fluent-border rounded-lg">
                  <span className="text-xs text-zinc-300">{t.settings.audio.enable}</span>
                  <button
                    role="switch"
                    aria-checked={audioFeedback}
                    onClick={() => setAudioFeedback(!audioFeedback)}
                    className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] ${
                      audioFeedback ? 'bg-[var(--accent-color)]' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        audioFeedback ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </section>

              {/* Language section */}
              <section aria-labelledby="settings-lang-heading">
                <h3 id="settings-lang-heading" className="micro-label text-zinc-500 mb-3 flex items-center gap-2">
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
                      onClick={() => setLanguage(locale.code)}
                      aria-pressed={locale.code === language}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                        locale.code === language
                          ? 'bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/30 text-[var(--accent-color)]'
                          : 'bg-white/[0.02] border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-base leading-none">{locale.flag}</span>
                      <span className="font-medium truncate">{locale.label}</span>
                      {locale.code === language && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent-color)] flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </section>

              {/* About section */}
              <section aria-labelledby="settings-about-heading" className="border-t border-fluent-border pt-6">
                <h3 id="settings-about-heading" className="micro-label text-zinc-500 mb-3">
                  {t.settings.about.version}
                </h3>
                <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-fluent-border rounded-lg mb-3">
                  <span className="text-xs text-zinc-400">{t.app.name}</span>
                  <span className="telemetry-text text-xs text-[var(--accent-color)]">{APP_VERSION}</span>
                </div>
                <div className="flex gap-2">
                  <a
                    href="https://github.com/EmmanuelKerhoz/Vibe"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.settings.about.github}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 hover:border-zinc-600/50 text-zinc-400 hover:text-zinc-200 rounded-lg transition-all text-xs"
                  >
                    <Github className="w-3.5 h-3.5" />
                    {t.settings.about.github}
                  </a>
                  <a
                    href="https://github.com/EmmanuelKerhoz/Vibe/blob/main/README.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.settings.about.docs}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 hover:border-zinc-600/50 text-zinc-400 hover:text-zinc-200 rounded-lg transition-all text-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    {t.settings.about.docs}
                  </a>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
