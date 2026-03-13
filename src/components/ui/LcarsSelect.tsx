import React, { useState, useRef, useEffect, useCallback, useId, type CSSProperties } from 'react';
import { ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

interface LcarsSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
}

export function LcarsSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
  style,
  disabled = false,
}: LcarsSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>();
  const listboxId = useId();

  const selectedLabel =
    options.find((o) => o.value === value)?.label ??
    placeholder ??
    (options[0]?.label || '');

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

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedTrigger = containerRef.current?.contains(target);
      const clickedList = listRef.current?.contains(target);
      if (!clickedTrigger && !clickedList) {
        close();
      }
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

  // Scroll focused option into view
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
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex((i) => Math.min(i + 1, options.length - 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(options.length - 1);
        } else {
          setFocusedIndex((i) => Math.max(i - 1, 0));
        }
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      {/* Trigger button */}
      <button
        type="button"
        ref={triggerRef}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
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
          transition: 'box-shadow 0.2s',
          outline: 'none',
          gap: '6px',
          fontSize: 'inherit',
          fontFamily: 'inherit',
          textAlign: 'left',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow =
            '0 0 0 2px var(--accent-color), 0 0 10px 1px var(--accent-color)';
        }}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
        onMouseEnter={(e) => {
          if (!disabled)
            e.currentTarget.style.boxShadow =
              '0 0 0 2px var(--accent-color), 0 0 10px 1px var(--accent-color)';
        }}
        onMouseLeave={(e) => {
          if (!e.currentTarget.matches(':focus'))
            e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <span dir="auto" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedLabel}
        </span>
        <ChevronDown
          style={{
            width: 14,
            height: 14,
            flexShrink: 0,
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && dropdownStyle && createPortal(
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-activedescendant={focusedIndex >= 0 ? `${listboxId}-opt-${focusedIndex}` : undefined}
          style={{
            ...dropdownStyle,
            borderRadius: '2px 6px 6px 2px',
            border: '1px solid var(--accent-color)',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 0 20px 2px color-mix(in srgb, var(--accent-color) 30%, transparent)',
            overflowY: 'auto',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--accent-color) transparent',
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(opt.value);
                }}
                onMouseEnter={() => setFocusedIndex(idx)}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  color: isSelected || isFocused ? 'var(--accent-color)' : 'var(--text-primary)',
                  background:
                    isFocused
                      ? 'color-mix(in srgb, var(--accent-color) 15%, transparent)'
                      : 'transparent',
                  borderLeft: isSelected ? '3px solid var(--accent-color)' : '3px solid transparent',
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
        </ul>,
        document.body,
      )}
    </div>
  );
}
