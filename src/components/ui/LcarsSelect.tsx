import React, { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import { ChevronDown } from 'lucide-react';

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
  const listRef = useRef<HTMLUListElement>(null);

  const selectedLabel =
    options.find((o) => o.value === value)?.label ??
    placeholder ??
    (options[0]?.label || '');

  const close = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen, close]);

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
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        className={className}
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
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          aria-activedescendant={focusedIndex >= 0 ? `lcars-opt-${focusedIndex}` : undefined}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 9999,
            marginTop: 2,
            borderRadius: '2px 6px 6px 2px',
            border: '1px solid var(--accent-color)',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 0 20px 2px color-mix(in srgb, var(--accent-color) 30%, transparent)',
            maxHeight: 260,
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
                id={`lcars-opt-${idx}`}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(opt.value);
                }}
                onMouseEnter={() => setFocusedIndex(idx)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  color: isSelected || isFocused ? 'var(--accent-color)' : 'var(--text-primary)',
                  background:
                    isFocused
                      ? 'color-mix(in srgb, var(--accent-color) 15%, transparent)'
                      : 'transparent',
                  borderLeft: isSelected ? '3px solid var(--accent-color)' : '3px solid transparent',
                  transition: 'background 0.1s, color 0.1s',
                  fontSize: 'inherit',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
