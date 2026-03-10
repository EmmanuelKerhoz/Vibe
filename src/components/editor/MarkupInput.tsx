import React, { useRef } from 'react';
import { getSectionTextColor } from '../../utils/songUtils';

interface MarkupInputProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'onScroll'> {
  value: string;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  className: string;
  onScroll?: React.UIEventHandler<HTMLTextAreaElement>;
}

export const MarkupInput = ({ value, onChange, textareaRef, className, onScroll, ...props }: MarkupInputProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (overlayRef.current) {
      overlayRef.current.scrollTop = e.currentTarget.scrollTop;
      overlayRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    onScroll?.(e);
  };

  const renderStyledMarkup = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      const isSection = (trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('**[') && trimmed.endsWith(']**'));
      
      let colorClass = '';
      if (isSection) {
        const name = trimmed.replace(/[\[\]\*]/g, '');
        colorClass = `${getSectionTextColor(name)} font-bold text-base uppercase tracking-wider lcars-section-title`;
      }
      
      return (
        <div key={i} className={colorClass}>
          {line || '\u00A0'}
        </div>
      );
    });
  };

  return (
    // Container holds the visual shell (bg, border, shadow, padding, rounded, min-h)
    <div className={`relative ${className}`}>
      {/* Highlight overlay: absolutely positioned, inherits font/color from container */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 whitespace-pre-wrap overflow-hidden"
        style={{
          font: 'inherit',
          letterSpacing: 'inherit',
          lineHeight: 'inherit',
          padding: '1.25rem',
          boxSizing: 'border-box',
        }}
      >
        {renderStyledMarkup(value)}
      </div>
      {/* Textarea: transparent text/bg so the overlay shows through, caret always visible */}
      <textarea
        {...props}
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        className="relative z-10 w-full resize-none focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] whitespace-pre-wrap"
        style={{
          font: 'inherit',
          letterSpacing: 'inherit',
          lineHeight: 'inherit',
          padding: '1.25rem',
          boxSizing: 'border-box',
          background: 'transparent',
          color: 'transparent',
          caretColor: 'var(--text-primary)',
          minHeight: 'inherit',
        }}
      />
    </div>
  );
};
