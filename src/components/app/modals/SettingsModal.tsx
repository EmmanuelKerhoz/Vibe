import React, { useRef, useEffect, useState } from 'react';
import { X, Github, BookOpen, Monitor, Sun, Moon, Volume2, VolumeX, Globe, Settings, Type, FileCode } from '../../ui/icons';
import { useTranslation, SUPPORTED_UI_LOCALES } from '../../../i18n';
import { APP_VERSION_LABEL } from '../../../version';
import { Button } from '../../ui/Button';
import { FlagEmoji } from '../../ui/FlagEmoji';

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
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-300"
            onClick={handleClose}
          />

          {/* Ambient glow – dark theme only */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden items-center justify-center hidden dark:flex">
            <div className="w-[500px] h-[400px] bg-[var(--accent-color)]/10 blur-[120px] rounded-full" />
          </div>

          {/* Gradient border wrapper — isolation prevents gradient from bleeding into interior */}
          <div
            className="relative w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-[24px_8px_24px_8px] animate-in zoom-in-95 duration-300"
            style={{
              padding: '2px',
              background: 'var(--accent-rail-gradient-h)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              isolation: 'isolate',
            }}
          >
            {/* Modal panel — dialog-surface ensures opaque dark background */}
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t.settings.title}
              className="relative w-full h-full flex flex-col animate-in zoom-in-95 duration-300 dialog-surface shadow-2xl overflow-hidden rounded-none sm:rounded-[22px_6px_22px_6px]"
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
                      {APP_VERSION_LABEL}
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

                {/* UI Scale section */}
                <section aria-labelledby="settings-scale-heading">
                  <h3 id="settings-scale-heading" className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                    <Type className="w-3.5 h-3.5" />
                    {t.settings.scale?.label ?? 'UI Scale'}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(['small', 'medium', 'large'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setDraftUiScale(opt)}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs transition-all ${
                          draftUiScale === opt
                            ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)]/40 text-[var(--accent-color)]'
                            : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-color)]/20 hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <span className={opt === 'small' ? 'text-[10px]' : opt === 'medium' ? 'text-xs' : 'text-sm'}>A</span>
                        <span>
                          {opt === 'small'
                            ? (t.settings.scale?.small ?? 'Small')
                            : opt === 'medium'
                            ? (t.settings.scale?.medium ?? 'Medium')
                            : (t.settings.scale?.large ?? 'Large')}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Default Edit Mode section */}
                <section aria-labelledby="settings-editmode-heading">
                  <h3 id="settings-editmode-heading" className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5" />
                    {t.settings.editMode?.label ?? 'Default Editor'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(['section', 'markdown'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setDraftDefaultEditMode(opt)}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs transition-all ${
                          draftDefaultEditMode === opt
                            ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)]/40 text-[var(--accent-color)]'
                            : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-color)]/20 hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <span>
                          {opt === 'section'
                            ? (t.settings.editMode?.section ?? 'Section Editor')
                            : (t.settings.editMode?.markdown ?? 'Markdown Editor')}
                        </span>
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
                    <span className="text-xs font-mono text-[var(--text-primary)]">{APP_VERSION_LABEL}</span>
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
                  <Button onClick={handleClose} variant="outlined" color="inherit">
                    {t.settings.actions.close}
                  </Button>
                  <Button onClick={handleApply} variant="contained" color="primary">
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
