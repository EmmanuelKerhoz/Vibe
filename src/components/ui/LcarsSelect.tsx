import React, { useState, useRef, useEffect, useCallback, useId, type CSSProperties } from 'react';
import { ChevronDown } from './icons';
import { createPortal } from 'react-dom';
import { Tooltip } from './Tooltip';

const EMOJI_FONT_STACK =
  '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';

interface LcarsSelectOption {
  value: string;
  label: React.ReactNode;
  title?: string;
  /** When true the item is rendered as a non-interactive separator/header. */
  disabled?: boolean;
  /** When true, the item is shown even when a search filter is active. */
  alwaysShow?: boolean;
  /** Optional plain-text value used for live filtering. Falls back to extracted label text. */
  searchText?: string;
}

interface LcarsSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: LcarsSelectOption[];
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  /** When provided, always shows this label in the trigger button instead of the selected option label. */
  triggerLabel?: React.ReactNode;
  /** Override the glow/border accent colour (CSS colour string or var()). Defaults to var(--accent-color). */
  accentColor?: string;
  buttonTitle?: string;
  /** Accessible label for the trigger button (aria-label). Falls back to placeholder when omitted. */
  buttonAriaLabel?: string;
  /** Renders a live filter input at the top of the dropdown. Filtering is case-insensitive `includes` on the option label text. */
  searchable?: boolean;
  /** Controlled search value. When provided, the parent owns the filter state. */
  searchValue?: string;
  /** Notified on every keystroke in the search input. */
  onSearchChange?: (value: string) => void;
  /** Placeholder for the search input. */
  searchPlaceholder?: string;
  /**
   * Called when the user presses Enter inside the search input.
   * Return true to consume the event and suppress the default auto-select
   * behaviour (selectFirstVisibleEnabled). Return false/undefined to let the
   * default behaviour run.
   */
  onSearchEnter?: () => boolean;
}

function nodeToText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join(' ');
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return nodeToText(props.children);
  }
  return '';
}

function getOptionSearchText(opt: LcarsSelectOption): string {
  return opt.searchText ?? nodeToText(opt.label);
}

export function LcarsSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
  style,
  disabled = false,
  isOpen: controlledIsOpen,
  onOpenChange,
  triggerLabel,
  accentColor,
  buttonTitle,
  buttonAriaLabel,
  searchable = false,
  searchValue: searchValueProp,
  onSearchChange,
  searchPlaceholder,
  onSearchEnter,
}: LcarsSelectProps) {
  const accent = accentColor ?? 'var(--accent-color)';
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [internalSearch, setInternalSearch] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>();
  const listboxId = useId();
  const isOpen = controlledIsOpen ?? uncontrolledIsOpen;
  const effectiveSearch = searchValueProp ?? internalSearch;

  const setOpen = useCallback((nextOpen: boolean) => {
    if (nextOpen === isOpen) return;
    if (controlledIsOpen === undefined) {
      setUncontrolledIsOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }, [controlledIsOpen, isOpen, onOpenChange, setUncontrolledIsOpen]);

  const displayedOptions = React.useMemo(() => {
    if (!searchable) return options;
    const q = effectiveSearch.trim().toLowerCase();
    if (q === '') return options;
    return options.filter((o) => {
      if (o.alwaysShow) return true;
      if (o.disabled) return false;
      return getOptionSearchText(o).toLowerCase().includes(q);
    });
  }, [options, searchable, effectiveSearch]);

  const selectedLabel: React.ReactNode =
    options.find((o) => o.value === value)?.label ??
    placeholder ??
    options[0]?.label ?? '';

  const close = useCallback(() => {
    setOpen(false);
    setFocusedIndex(-1);
  }, [setOpen]);

  useEffect(() => {
    if (!isOpen) setFocusedIndex(-1);
  }, [isOpen]);

  const nextEnabled = useCallback((from: number, direction: 1 | -1): number => {
    let i = from + direction;
    while (i >= 0 && i < displayedOptions.length) {
      const opt = displayedOptions[i];
      if (opt && !opt.disabled) return i;
      i += direction;
    }
    return from;
  }, [displayedOptions]);

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
      if (
        !containerRef.current?.contains(target) &&
        !listRef.current?.contains(target) &&
        !portalRef.current?.contains(target)
      ) close();
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

  useEffect(() => {
    if (isOpen && searchable) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    if (!isOpen || !searchable) return;
    setFocusedIndex(-1);
  }, [effectiveSearch, isOpen, searchable]);

  const handleTriggerClick = () => {
    if (disabled) return;
    const nextOpen = !isOpen;
    setOpen(nextOpen);
    if (nextOpen) {
      const idx = displayedOptions.findIndex((o) => o.value === value);
      setFocusedIndex(idx >= 0 ? idx : -1);
    }
  };

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    close();
  };

  const handleSearchChange = (next: string) => {
    if (searchValueProp === undefined) {
      setInternalSearch(next);
    }
    onSearchChange?.(next);
  };

  const selectFirstVisibleEnabled = () => {
    const firstIdx = displayedOptions.findIndex((o) => !o.disabled);
    if (firstIdx >= 0) {
      const opt = displayedOptions[firstIdx];
      if (opt) handleSelect(opt.value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          const opt = displayedOptions[focusedIndex];
          if (opt && !opt.disabled) handleSelect(opt.value);
        } else {
          setOpen(true);
          const idx = displayedOptions.findIndex((o) => o.value === value);
          setFocusedIndex(idx >= 0 ? idx : nextEnabled(-1, 1));
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) { setOpen(true); setFocusedIndex(nextEnabled(-1, 1)); }
        else setFocusedIndex((i) => nextEnabled(Math.min(i, displayedOptions.length - 1), 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) { setOpen(true); setFocusedIndex(nextEnabled(displayedOptions.length, -1)); }
        else setFocusedIndex((i) => nextEnabled(Math.max(i, 0), -1));
        break;
      default:
        break;
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0) {
          const opt = displayedOptions[focusedIndex];
          if (opt && !opt.disabled) handleSelect(opt.value);
        } else {
          // Give the parent a chance to intercept Enter (e.g. to commit a
          // custom-language value). If onSearchEnter returns true, the event
          // is consumed and we do NOT fall through to auto-select.
          if (onSearchEnter?.()) break;
          selectFirstVisibleEnabled();
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((i) => nextEnabled(Math.min(i, displayedOptions.length - 1), 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((i) => nextEnabled(Math.max(i, 0), -1));
        break;
      default:
        break;
    }
  };

  const resolvedAriaLabel = buttonAriaLabel ?? (typeof placeholder === 'string' ? placeholder : undefined);

  const triggerBlock = (
    <div
      className="lcars-gradient-outline"
      style={{ borderRadius: '6px 2px 6px 2px', display: 'block', width: '100%' }}
    >
      <button
        type="button"
        ref={triggerRef}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-label={resolvedAriaLabel}
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
        onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.borderColor = accent; } }}
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
          {(() => {
            const displayLabel = triggerLabel ?? selectedLabel;
            return typeof displayLabel === 'string' ? (
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', width: '100%' }}>
                {displayLabel}
              </span>
            ) : (
              <>{displayLabel}</>
            );
          })()}
        </div>
        <ChevronDown style={{ width: 14, height: 14, flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
    </div>
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      {buttonTitle ? <Tooltip title={buttonTitle}>{triggerBlock}</Tooltip> : triggerBlock}

      {isOpen && dropdownStyle && createPortal(
        <div
          ref={portalRef}
          className="lcars-gradient-outline"
          style={{
            ...dropdownStyle,
            borderRadius: '2px 6px 6px 2px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {searchable && (
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                padding: '6px 8px',
                background: 'var(--bg-card)',
                borderTopLeftRadius: '2px',
                borderTopRightRadius: '6px',
                borderBottom: `1px solid color-mix(in srgb, ${accent} 30%, var(--border-color))`,
                flexShrink: 0,
                fontFamily: EMOJI_FONT_STACK,
              }}
            >
              <input
                ref={searchInputRef}
                type="text"
                value={effectiveSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={searchPlaceholder ?? 'Filter…'}
                aria-label={searchPlaceholder ?? 'Filter options'}
                aria-controls={listboxId}
                style={{
                  width: '100%',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: 'inherit',
                  outline: 'none',
                  fontFamily: EMOJI_FONT_STACK,
                }}
              />
            </div>
          )}
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-activedescendant={focusedIndex >= 0 ? `${listboxId}-opt-${focusedIndex}` : undefined}
            style={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              flex: 1,
              minHeight: 0,
              fontFamily: EMOJI_FONT_STACK,
              borderRadius: searchable ? '0 0 6px 2px' : '2px 6px 6px 2px',
              border: '1px solid var(--border-color)',
              borderTop: searchable ? 'none' : '1px solid var(--border-color)',
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
            {displayedOptions.length === 0 && (
              <li
                role="presentation"
                style={{
                  padding: '10px 14px',
                  color: 'var(--text-muted, #888)',
                  fontSize: '0.85em',
                  opacity: 0.7,
                  userSelect: 'none',
                }}
              >
                No matches
              </li>
            )}
            {displayedOptions.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isFocused = idx === focusedIndex;
              const isDisabled = opt.disabled === true;
              return (
                <li
                  key={opt.value}
                  id={`${listboxId}-opt-${idx}`}
                  role={isDisabled ? 'presentation' : 'option'}
                  aria-selected={isDisabled ? undefined : isSelected}
                  aria-disabled={isDisabled ? true : undefined}
                  title={opt.title}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (!isDisabled) handleSelect(opt.value);
                  }}
                  onMouseEnter={() => { if (!isDisabled) setFocusedIndex(idx); }}
                  style={{
                    padding: isDisabled ? '6px 14px 2px' : '10px 14px',
                    cursor: isDisabled ? 'default' : 'pointer',
                    fontFamily: EMOJI_FONT_STACK,
                    color: isDisabled
                      ? 'var(--text-muted, #888)'
                      : isSelected || isFocused ? accent : 'var(--text-primary)',
                    background: (!isDisabled && isFocused)
                      ? `color-mix(in srgb, ${accent} 15%, transparent)`
                      : 'transparent',
                    borderLeft: (!isDisabled && isSelected)
                      ? `3px solid ${accent}`
                      : '3px solid transparent',
                    opacity: isDisabled ? 0.5 : 1,
                    pointerEvents: isDisabled ? 'none' : 'auto',
                    transition: 'background 0.1s, color 0.1s',
                    fontSize: isDisabled ? '0.7em' : 'inherit',
                    whiteSpace: 'normal',
                    overflow: 'visible',
                    textOverflow: 'clip',
                    lineHeight: 1.4,
                    textAlign: 'start',
                    userSelect: 'none',
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
