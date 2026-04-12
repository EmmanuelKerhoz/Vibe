import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, ScanText } from '../../ui/icons';
import { Tooltip } from '../../ui/Tooltip';
import { EmojiSign } from '../../ui/EmojiSign';
import { getLanguageDisplay, useTranslation, SUPPORTED_UI_LOCALES } from '../../../i18n';

type LanguageDisplay = ReturnType<typeof getLanguageDisplay>;

const POPOVER_WIDTH = 220;
const POPOVER_GAP = 6;

interface DetectLanguageButtonProps {
  detectedDisplays: LanguageDisplay[];
  hasLyrics: boolean;
  isDetectingLanguage: boolean;
  hasApiKey: boolean;
  onDetect: () => void;
  /** Called when user picks a default language (no-lyrics mode). */
  onSetDefaultLanguage?: (langCode: string) => void;
  /** Current default/target language code (shown in no-lyrics mode). */
  defaultLanguage?: string;
}

export function DetectLanguageButton({
  detectedDisplays,
  hasLyrics,
  isDetectingLanguage,
  hasApiKey,
  onDetect,
  onSetDefaultLanguage,
  defaultLanguage,
}: DetectLanguageButtonProps) {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [coords, setCoords] = useState<{ bottom: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Disabled only when AI unavailable or currently detecting — NOT when hasLyrics is false
  const isDisabled = !hasApiKey || isDetectingLanguage;

  const detectedLanguageList = detectedDisplays.slice(0, 3).map(d => `${d.sign} ${d.label}`).join(', ');
  const tooltipTitle = !hasApiKey
    ? (t.tooltips?.aiUnavailable ?? 'AI unavailable')
    : !hasLyrics
      ? 'Set default language for generation'
      : detectedDisplays.length > 0
        ? (t.tooltips?.redetectLanguage ?? 'Detected: {langs} — click to re-detect').replace('{langs}', detectedLanguageList)
        : (t.tooltips?.detectLanguage ?? 'Detect song language');

  // ── Picker portal ────────────────────────────────────────────────────────
  const openPicker = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setCoords({ bottom: window.innerHeight - r.top + POPOVER_GAP, left: r.left });
    setPickerOpen(true);
  };

  const handleClick = () => {
    if (!hasLyrics && onSetDefaultLanguage) {
      openPicker();
    } else {
      void onDetect();
    }
  };

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  // ── Button label ─────────────────────────────────────────────────────────
  const buttonContent = (() => {
    if (isDetectingLanguage) {
      return (
        <>
          <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
          <span className="sr-only">{t.editor?.detectingLanguageLabel ?? 'Detecting…'}</span>
        </>
      );
    }
    if (!hasLyrics) {
      const defLocale = defaultLanguage
        ? SUPPORTED_UI_LOCALES.find(l => l.code === defaultLanguage)
        : null;
      return (
        <>
          <ScanText className="w-3 h-3" aria-hidden="true" />
          {defLocale
            ? (<><EmojiSign sign={defLocale.flag} /><span className="hidden sm:inline">{defLocale.code.toUpperCase()}</span></>)
            : (<><EmojiSign sign="🌐" /><span className="hidden sm:inline">{t.editor?.detect ?? 'Lang'}</span></>)}
        </>
      );
    }
    if (detectedDisplays.length > 0) {
      return (
        <>
          <ScanText className="w-3 h-3" aria-hidden="true" />
          {detectedDisplays.slice(0, 3).map((d, i) => (
            <EmojiSign key={i} sign={d.sign} />
          ))}
          <span className="hidden sm:inline">{detectedDisplays[0]!.label}</span>
        </>
      );
    }
    return (
      <>
        <ScanText className="w-3 h-3" aria-hidden="true" />
        <EmojiSign sign="🌐" />
        <span className="hidden sm:inline">{t.editor?.detect ?? 'Detect'}</span>
      </>
    );
  })();

  // ── Picker popover (no-lyrics mode) ──────────────────────────────────────
  const picker = pickerOpen && coords && onSetDefaultLanguage
    ? createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            bottom: coords.bottom,
            left: coords.left,
            zIndex: 9999,
            width: `${POPOVER_WIDTH}px`,
          }}
        >
          <div
            className="w-full rounded shadow-xl text-[11px] overflow-hidden"
            style={{ background: 'var(--bg-app, #1a1a2e)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))' }}
            role="listbox"
            aria-label="Default language"
          >
            <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-[0.18em] opacity-50">
              Default language
            </div>
            <div className="max-h-52 overflow-y-auto">
              {SUPPORTED_UI_LOCALES.map(loc => (
                <button
                  key={loc.code}
                  role="option"
                  aria-selected={loc.code === defaultLanguage}
                  onClick={() => { onSetDefaultLanguage(loc.code); setPickerOpen(false); }}
                  className={[
                    'w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors',
                    loc.code === defaultLanguage
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white/90',
                  ].join(' ')}
                >
                  <EmojiSign sign={loc.flag} />
                  <span className="uppercase font-semibold text-[10px] tracking-wider">{loc.code}</span>
                  <span className="text-[10px] truncate">{loc.label}</span>
                  {loc.code === defaultLanguage && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="relative">
      <Tooltip title={tooltipTitle}>
        <button
          ref={triggerRef}
          onClick={handleClick}
          disabled={isDisabled}
          aria-disabled={isDisabled}
          aria-busy={isDetectingLanguage}
          className="ux-interactive px-2.5 py-1 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-[11px] font-bold rounded flex items-center gap-1.5 disabled:opacity-50 border border-black/10 dark:border-white/10 whitespace-nowrap shrink-0"
        >
          {buttonContent}
        </button>
      </Tooltip>
      {picker}
    </div>
  );
}
