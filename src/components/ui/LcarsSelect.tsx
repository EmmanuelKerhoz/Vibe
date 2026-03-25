import React, { useState, useRef, useEffect, useCallback, useId, type CSSProperties } from 'react';
import { ChevronDown } from './icons';
import { createPortal } from 'react-dom';

const EMOJI_FONT_STACK =
  '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';

interface LcarsSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: React.ReactNode; title?: string }[];
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  /** Override the glow/border accent colour (CSS colour string or var()). Defaults to var(--accent-color). */
  accentColor?: string;
  buttonTitle?: string;
}

export function LcarsSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
  style,
  disabled = false,
  accentColor,
  buttonTitle,
}: LcarsSelectProps) {
  const accent = accentColor ?? 'var(--accent-color)';
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>();
  const listboxId = useId();

  const selectedLabel: React.ReactNode =
    options.find((o) => o.value === value)?.label ??
    placeholder ??
    options[0]?.label ?? '';

  const close = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
  }, []);

  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportPadding = 8;
    const dropdownGap = 2;
    const maxDropdownHeight = 260;
    const minDropdownHeight = 120;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const openUpward = spaceBelow < minDropdownHeight && spaceAbove > spaceBelow;
    const availableHeight = openUpward ? spaceAbove : spaceBelow;
    const maxDropdownWidth = window.innerWidth - viewportPadding * 2;
    const dropdownWidth = Math.min(maxDropdownWidth, Math.max(rect.width, 320));
    const dropdownLeft = Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - viewportPadding - dropdownWidth));
    setDropdownStyle({
      position: 'fixed',
      left: dropdownLeft,
      width: dropdownWidth,
      zIndex: 9999,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + dropdownGap }
        : { top: rect.bottom + dropdownGap }),
      maxHeight: Math.max(minDropdownHeight, Math.min(maxDropdownHeight, availableHeight)),
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!containerRef.current?.contains(target) && !listRef.current?.contains(target)) close();
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [isOpen, updateDropdownPosition]);

  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[focusedIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, focusedIndex]);

  const handleTriggerClick = () => {
    if (disabled) return;
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      const idx = options.findIndex((o) => o.value === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
  };

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          const opt = options[focusedIndex];
          if (opt) handleSelect(opt.value);
        } else {
          setIsOpen(true);
          const idx = options.findIndex((o) => o.value === value);
          setFocusedIndex(idx >= 0 ? idx : 0);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) { setIsOpen(true); setFocusedIndex(0); }
        else setFocusedIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) { setIsOpen(true); setFocusedIndex(options.length - 1); }
        else setFocusedIndex((i) => Math.max(i - 1, 0));
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      {/* Gradient-outline wrapper — provides the multicolor border via ::before pseudo.
          The button inside must be position:relative + z-index:1 so it sits above the outline.
          In light mode .lcars-gradient-outline::before has opacity:0, so no visual change. */}
      <div
        className="lcars-gradient-outline"
        style={{
          borderRadius: '6px 2px 6px 2px',
          display: 'block',
          width: '100%',
        }}
      >
        <button
          type="button"
          ref={triggerRef}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          title={buttonTitle}
          onClick={handleTriggerClick}
          onKeyDown={handleKeyDown}
          className={['ux-interactive', className].filter(Boolean).join(' ')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '6px 10px',
            borderRadius: '6px 2px 6px 2px',
            /* Light: solid border. Dark: transparent — gradient outline wrapper takes over. */
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'box-shadow 0.2s, border-color 0.2s',
            outline: 'none',
            gap: '6px',
            fontSize: 'inherit',
            fontFamily: EMOJI_FONT_STACK,
            textAlign: 'left',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 1,
            ...style,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = accent; }}
          onBlur={(e) => { if (!containerRef.current?.contains(e.relatedTarget as Node)) { e.currentTarget.style.borderColor = 'var(--border-color)'; } }}
          onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = accent; } }}
          onMouseLeave={(e) => { if (!e.currentTarget.matches(':focus')) { e.currentTarget.style.borderColor = 'var(--border-color)'; } }}
        >
          <div style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            fontFamily: EMOJI_FONT_STACK,
            overflow: 'hidden',
          }}>
            {typeof selectedLabel === 'string' ? (
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', width: '100%' }}>
                {selectedLabel}
              </span>
            ) : (
              <>{selectedLabel}</>
            )}
          </div>
          <ChevronDown style={{ width: 14, height: 14, flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </button>
      </div>

      {isOpen && dropdownStyle && createPortal(
        <div
          className="lcars-gradient-outline"
          style={{
            ...dropdownStyle,
            borderRadius: '2px 6px 6px 2px',
          }}
        >
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-activedescendant={focusedIndex >= 0 ? `${listboxId}-opt-${focusedIndex}` : undefined}
            style={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              height: '100%',
              maxHeight: 'inherit',
              fontFamily: EMOJI_FONT_STACK,
              borderRadius: '2px 6px 6px 2px',
              /* Light: keep solid border. Dark: transparent — gradient outline wrapper takes over. */
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              backdropFilter: 'blur(2px)',
              boxShadow: `0 0 20px 2px color-mix(in srgb, ${accent} 30%, transparent)`,
              overflowY: 'auto',
              listStyle: 'none',
              margin: 0,
              padding: 0,
              scrollbarWidth: 'thin',
              scrollbarColor: `${accent} transparent`,
            }}
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isFocused = idx === focusedIndex;
              return (
                <li
                  key={opt.value}
                  id={`${listboxId}-opt-${idx}`}
                   role="option"
                   aria-selected={isSelected}
                   title={opt.title}
                   onMouseDown={(e) => { e.preventDefault(); handleSelect(opt.value); }}
                   onMouseEnter={() => setFocusedIndex(idx)}
                   style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    fontFamily: EMOJI_FONT_STACK,
                    color: isSelected || isFocused ? accent : 'var(--text-primary)',
                    background: isFocused ? `color-mix(in srgb, ${accent} 15%, transparent)` : 'transparent',
                    borderLeft: isSelected ? `3px solid ${accent}` : '3px solid transparent',
                    transition: 'background 0.1s, color 0.1s',
                    fontSize: 'inherit',
                    whiteSpace: 'normal',
                    overflow: 'visible',
                    textOverflow: 'clip',
                    lineHeight: 1.4,
                    textAlign: 'start',
                  }}
                  dir="auto"
                >
                  {opt.label}
                </li>
              );
            })}
          </ul>
        </div>,
        document.body,
      )}
    </div>
  );
}
