import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, ScanText } from '../../ui/icons';
import { Tooltip } from '../../ui/Tooltip';
import { EmojiSign } from '../../ui/EmojiSign';
import { getLanguageDisplay, useTranslation, SUPPORTED_ADAPTATION_LANGUAGES } from '../../../i18n';

type LanguageDisplay = ReturnType<typeof getLanguageDisplay>;

const POPOVER_WIDTH = 240;
const POPOVER_GAP = 6;

interface DetectLanguageButtonProps {
  detectedDisplays: LanguageDisplay[];
  hasLyrics: boolean;
  isDetectingLanguage: boolean;
  hasApiKey: boolean;
  /** Sync or async — both accepted. Rejections are caught and logged. */
  onDetect: () => void | Promise<void>;
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
  const listboxId = useId();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  const isDisabled = !hasApiKey || isDetectingLanguage;

  const detectedLanguageList = detectedDisplays.slice(0, 3).map(d => `${d.sign} ${d.label}`).join(', ');
  const tooltipTitle = !hasApiKey
    ? (t.tooltips?.aiUnavailable ?? 'AI unavailable')
    : !hasLyrics
      ? 'Set default language for generation'
      : detectedDisplays.length > 0
        ? (t.tooltips?.redetectLanguage ?? 'Detected: {langs} — click to re-detect').replace('{langs}', detectedLanguageList)
        : (t.tooltips?.detectLanguage ?? 'Detect song language');

  // ── Picker open / close ──────────────────────────────────────────────────
  const closePicker = useCallback(() => {
    setPickerOpen(false);
    setActiveIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const openPicker = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const POPOVER_MAX_H = 260;
    const spaceBelow = window.innerHeight - r.bottom - POPOVER_GAP;
    if (spaceBelow >= POPOVER_MAX_H) {
      setCoords({ top: r.bottom + POPOVER_GAP, left: r.left });
    } else {
      setCoords({ bottom: window.innerHeight - r.top + POPOVER_GAP, left: r.left });
    }
    const preselect = defaultLanguage
      ? SUPPORTED_ADAPTATION_LANGUAGES.findIndex(l => l.code.toLowerCase() === defaultLanguage.toLowerCase())
      : 0;
    setActiveIndex(preselect >= 0 ? preselect : 0);
    setPickerOpen(true);
  }, [defaultLanguage]);

  const handleClick = (e: React.MouseEvent) => {
    if (!hasLyrics && onSetDefaultLanguage) {
      openPicker(e);
    } else {
      Promise.resolve(onDetect()).catch((err: unknown) => {
        console.error('[DetectLanguageButton] onDetect failed:', err);
      });
    }
  };

  // Move focus into listbox after open. activeIndex intentionally omitted from
  // deps: we only want to focus on *open*, not on every arrow key press.
  useEffect(() => {
    if (!pickerOpen) return;
    const raf = requestAnimationFrame(() => {
      const items = listboxRef.current?.querySelectorAll<HTMLElement>('[role="option"]');
      // eslint-disable-next-line react-hooks/exhaustive-deps
      items?.[activeIndex >= 0 ? activeIndex : 0]?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [pickerOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll active item into view when activeIndex changes via keyboard
  useEffect(() => {
    if (!pickerOpen || activeIndex < 0) return;
    const items = listboxRef.current?.querySelectorAll<HTMLElement>('[role="option"]');
    items?.[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, pickerOpen]);

  // Close on outside mousedown
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        closePicker();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen, closePicker]);

  const handleListboxKeyDown = useCallback((e: React.KeyboardEvent) => {
    const count = SUPPORTED_ADAPTATION_LANGUAGES.length;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(i => (i + 1) % count);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(i => (i - 1 + count) % count);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(count - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0 && onSetDefaultLanguage) {
          const selectedLanguage = SUPPORTED_ADAPTATION_LANGUAGES[activeIndex];
          if (!selectedLanguage) return;
          onSetDefaultLanguage(selectedLanguage.code.toLowerCase());
          closePicker();
        }
        break;
      case 'Escape':
        e.preventDefault();
        closePicker();
        break;
      default:
        break;
    }
  }, [activeIndex, closePicker, onSetDefaultLanguage]);

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
      const defLang = defaultLanguage
        ? SUPPORTED_ADAPTATION_LANGUAGES.find(l => l.code.toLowerCase() === defaultLanguage.toLowerCase())
        : null;
      return (
        <>
          <ScanText className="w-3 h-3" aria-hidden="true" />
          {defLang
            ? (<><EmojiSign sign={defLang.sign} /><span className="hidden sm:inline">{defLang.code.toUpperCase()}</span></>)
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
          <span className="hidden sm:inline">{detectedDisplays.at(0)?.label}</span>
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
            ...(coords.top !== undefined ? { top: coords.top } : { bottom: coords.bottom }),
            left: coords.left,
            zIndex: 9999,
            width: `${POPOVER_WIDTH}px`,
          }}
        >
          <div
            ref={listboxRef}
            id={listboxId}
            className="w-full rounded shadow-xl text-[11px] overflow-hidden"
            style={{ background: 'var(--bg-app, #1a1a2e)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))' }}
            role="listbox"
            aria-label="Default language"
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
            onKeyDown={handleListboxKeyDown}
          >
            <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-[0.18em] opacity-50" aria-hidden="true">
              Default language
            </div>
            <div className="max-h-64 overflow-y-auto">
              {SUPPORTED_ADAPTATION_LANGUAGES.map((lang, idx) => {
                const isSelected = lang.code.toLowerCase() === defaultLanguage?.toLowerCase();
                const isActive = idx === activeIndex;
                return (
                  // ARIA 1.1 §6.32: role=option must not be on a native interactive
                  // element. Using div with roving tabIndex + onClick is compliant.
                  <div
                    key={lang.code}
                    id={`${listboxId}-opt-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => { onSetDefaultLanguage(lang.code.toLowerCase()); closePicker(); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSetDefaultLanguage(lang.code.toLowerCase());
                        closePicker();
                      }
                    }}
                    className={[
                      'w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors outline-none cursor-pointer',
                      isSelected ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white/90',
                      isActive ? 'ring-1 ring-inset ring-white/30' : '',
                    ].join(' ')}
                  >
                    <EmojiSign sign={lang.sign} />
                    <span className="uppercase font-semibold text-[10px] tracking-wider flex-shrink-0">{lang.code}</span>
                    <span className="text-[10px] truncate">{lang.aiName}{lang.region ? ` – ${lang.region}` : ''}</span>
                    {isSelected && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                    )}
                  </div>
                );
              })}
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
          aria-haspopup={!hasLyrics && !!onSetDefaultLanguage ? 'listbox' : undefined}
          aria-expanded={!hasLyrics && !!onSetDefaultLanguage ? pickerOpen : undefined}
          aria-controls={pickerOpen ? listboxId : undefined}
          className="ux-interactive px-2.5 py-1 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-[11px] font-bold rounded flex items-center gap-1.5 disabled:opacity-50 border border-black/10 dark:border-white/10 whitespace-nowrap shrink-0"
        >
          {buttonContent}
        </button>
      </Tooltip>
      {picker}
    </div>
  );
}
