import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Tooltip } from '../ui/Tooltip';
import { LanguageBadge } from '../ui/LanguageBadge';
import { useTranslation, SUPPORTED_UI_LOCALES } from '../../i18n';

const POPOVER_WIDTH = 180;
const VIEWPORT_PADDING = 8;
const POPOVER_GAP = 6;

/**
 * Compact language picker for the StatusBar.
 *
 * Shows the current UI locale as flag + two-letter code.
 * Clicking/pressing opens a vertical popover with all available locales.
 */
export function StatusBarLanguagePicker() {
  const { t, language, setLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ bottom: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // SUPPORTED_UI_LOCALES is never empty — no third fallback needed.
  const currentLocale = SUPPORTED_UI_LOCALES.find(l => l.langId === language)
    ?? SUPPORTED_UI_LOCALES[0]!;

  const updateCoords = useCallback(() => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const right = Math.max(VIEWPORT_PADDING, window.innerWidth - r.right);
      setCoords({
        bottom: window.innerHeight - r.top + POPOVER_GAP,
        right,
      });
    }
  }, []);

  const toggle = useCallback(() => {
    setOpen(prev => {
      if (!prev) updateCoords();
      return !prev;
    });
  }, [updateCoords]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Keep position on resize
  useEffect(() => {
    if (!open) return;
    const onResize = () => updateCoords();
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [open, updateCoords]);

  const handleSelect = (langId: string) => {
    setLanguage(langId);
    setOpen(false);
  };

  const popover = open && coords ? createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        bottom: coords.bottom,
        right: coords.right,
        zIndex: 9999,
        width: `${POPOVER_WIDTH}px`,
      }}
    >
      <div
        className="w-full rounded-[12px_4px_12px_4px] shadow-xl text-[11px]"
        style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(4px) saturate(200%)',
          WebkitBackdropFilter: 'blur(4px) saturate(200%)',
          border: '2px solid transparent',
          backgroundClip: 'padding-box',
          position: 'relative',
        }}
        role="listbox"
        aria-label={t.settings.language.label}
      >
        {/* Gradient border */}
        <div
          className="absolute inset-0 rounded-[12px_4px_12px_4px] pointer-events-none"
          style={{
            background: 'var(--accent-rail-gradient-h)',
            zIndex: -1,
            margin: '-2px',
          }}
        />
        {/* Inner content */}
        <div
          className="relative bg-white/98 dark:bg-black/95 rounded-[10px_2px_10px_2px] overflow-hidden"
          style={{
            backdropFilter: 'blur(4px) saturate(200%)',
            WebkitBackdropFilter: 'blur(4px) saturate(200%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          {SUPPORTED_UI_LOCALES.map((loc) => (
            <button
              key={loc.code}
              role="option"
              aria-selected={loc.langId === language}
              onClick={() => handleSelect(loc.langId)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                loc.langId === language
                  ? 'bg-[var(--accent-color)]/10 text-[var(--accent-color)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--accent-color)]/5 hover:text-[var(--text-primary)]'
              }`}
            >
              <LanguageBadge
                langId={loc.langId}
                className="min-w-0"
                labelClassName="text-[10px] truncate"
              />
              {loc.langId === language && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent-color)] flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <Tooltip title={t.settings.language.label}>
        <div
          ref={triggerRef}
          role="button"
          tabIndex={0}
          aria-label={t.settings.language.label}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={toggle}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle()}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-color)]/5 transition-colors"
        >
          <LanguageBadge langId={currentLocale.langId} signOnly />
          <span className="uppercase font-semibold text-[10px] tracking-wider">
            {currentLocale.code}
          </span>
        </div>
      </Tooltip>
      {popover}
    </>
  );
}
