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

/** Duration (ms) the exit animation plays before the portal is unmounted. */
const DROPDOWN_EXIT_MS = 120;

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
  const [closing, setClosing] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [internalSearch, setInternalSearch] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>();
  const [openUpward, setOpenUpward] = useState(false);
  const listboxId = useId();
  const isOpen = controlledIsOpen ?? uncontrolledIsOpen;
  const effectiveSearch = searchValueProp ?? internalSearch;

  // True when the portal should be in the DOM (open OR playing exit animation).
  const portalVisible = isOpen || closing;

  const setOpen = useCallback((nextOpen: boolean) => {
    if (nextOpen === isOpen) return;
    if (controlledIsOpen === undefined) {
      setUncontrolledIsOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }, [controlledIsOpen, isOpen, onOpenChange]);

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

  // Close: start exit animation, then unmount after DROPDOWN_EXIT_MS.
  const close = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setClosing(false);
      setOpen(false);
      setFocusedIndex(-1);
    }, DROPDOWN_EXIT_MS);
  }, [setOpen]);

  // Cleanup timer on unmount.
  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

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
    const shouldOpenUpward = spaceAbove > spaceBelow;
    const availableHeight = shouldOpenUpward ? spaceAbove : spaceBelow;
    const maxDropdownWidth = window.innerWidth - viewportPadding * 2;
    const dropdownWidth = Math.min(maxDropdownWidth, Math.max(rect.width, 320));
    const dropdownLeft = Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - viewportPadding - dropdownWidth));
    setOpenUpward(shouldOpenUpward);
    setDropdownStyle({
      position: 'fixed',
      left: dropdownLeft,
      width: dropdownWidth,
      zIndex: 9999,
      ...(shouldOpenUpward
        ? { bottom: window.innerHeight - rect.top + dropdownGap }
        : { top: rect.bottom + dropdownGap }),
      maxHeight: Math.max(minDropdownHeight, Math.min(maxDropdownHeight, availableHeight)),
    });
  }, []);

  useEffect(() => {
    if (!portalVisible) return;
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
  }, [portalVisible, close]);

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
    if (isOpen) {
      close();
    } else {
      // Cancel any pending close animation before reopening.
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        setClosing(false);
      }
      setOpen(true);
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
          if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            setClosing(false);
          }
          setOpen(true);
          const idx = displayedOptions.findIndex((o) => o.value === value);
          setFocusedIndex(idx >= 0 ? idx : -1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            setClosing(false);
          }
          setOpen(true);
        }
        setFocusedIndex((prev) => nextEnabled(prev, 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            setClosing(false);
          }
          setOpen(true);
        }
        setFocusedIndex((prev) => nextEnabled(prev, -1));
        break;
      case 'Tab':
        if (isOpen) { e.preventDefault(); close(); }
        break;
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => nextEnabled(prev, 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => nextEnabled(prev, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0) {
          const opt = displayedOptions[focusedIndex];
          if (opt && !opt.disabled) { handleSelect(opt.value); return; }
        }
        if (onSearchEnter) {
          const consumed = onSearchEnter();
          if (consumed) return;
        }
        selectFirstVisibleEnabled();
        break;
      case 'Escape':
        e.preventDefault();
        close();
        triggerRef.current?.focus();
        break;
    }
  };

  // Animation class based on direction and closing state.
  const animationClass = closing
    ? (openUpward ? 'lcars-dropdown-exit-up' : 'lcars-dropdown-exit')
    : (openUpward ? 'lcars-dropdown-enter-up' : 'lcars-dropdown-enter');

  const dropdownContent = (
    <div ref={portalRef} style={dropdownStyle}>
      <ul
        ref={listRef}
        id={listboxId}
        role="listbox"
        aria-label={placeholder ?? 'Select'}
        className={`lcars-dropdown-list ${animationClass}`}
        style={{
          overflowY: 'auto',
          maxHeight: 'inherit',
          backgroundColor: 'var(--bg-card)',
          border: `1px solid ${accent}`,
          borderRadius: '4px',
          boxShadow: `0 4px 24px rgba(0,0,0,0.25), 0 0 0 1px ${accent}22`,
          listStyle: 'none',
          padding: '4px 0',
          margin: 0,
        }}
      >
        {searchable && (
          <li
            role="presentation"
            style={{ padding: '4px 8px', borderBottom: '1px solid var(--border-color)' }}
          >
            <input
              ref={searchInputRef}
              type="text"
              value={effectiveSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder ?? 'Search…'}
              aria-label="Filter options"
              style={{
                width: '100%',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '3px',
                padding: '4px 8px',
                fontSize: '13px',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </li>
        )}
        {displayedOptions.map((opt, idx) => {
          const isFocused = idx === focusedIndex;
          const isSelected = opt.value === value;
          if (opt.disabled) {
            return (
              <li
                key={opt.value}
                role="presentation"
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                  borderTop: idx > 0 ? '1px solid var(--border-color)' : undefined,
                  marginTop: idx > 0 ? '4px' : undefined,
                  paddingTop: idx > 0 ? '8px' : undefined,
                }}
              >
                {opt.label}
              </li>
            );
          }
          return (
            <Tooltip key={opt.value} content={opt.title} relationship="description">
              <li
                role="option"
                aria-selected={isSelected}
                style={{
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontFamily: EMOJI_FONT_STACK,
                  color: isSelected ? accent : 'var(--text-primary)',
                  backgroundColor: isFocused
                    ? `${accent}22`
                    : isSelected
                    ? `${accent}11`
                    : 'transparent',
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={() => setFocusedIndex(idx)}
                onMouseLeave={() => setFocusedIndex(-1)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(opt.value);
                }}
              >
                {opt.label}
              </li>
            </Tooltip>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', display: 'inline-block', ...style }}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-label={buttonAriaLabel ?? placeholder}
        data-open={isOpen ? 'true' : 'false'}
        title={buttonTitle}
        className="lcars-select-trigger"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          background: 'var(--bg-card)',
          border: `1px solid var(--border-color)`,
          borderRadius: '3px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: 'var(--text-primary)',
          fontSize: '13px',
          fontFamily: EMOJI_FONT_STACK,
          whiteSpace: 'nowrap',
          opacity: disabled ? 0.5 : 1,
          ['--lcars-select-accent' as string]: accent,
        }}
        onClick={handleTriggerClick}
      >
        <span style={{ flex: 1 }}>{triggerLabel ?? selectedLabel}</span>
        <ChevronDown
          size={12}
          style={{
            transition: 'transform 0.2s cubic-bezier(0.1, 0.9, 0.2, 1)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        />
      </button>
      {portalVisible && dropdownStyle && createPortal(dropdownContent, document.body)}
    </div>
  );
}
