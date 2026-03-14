import React, { useRef, useEffect } from 'react';
import { isPureMetaLine, isSectionHeader, tokenizeMetaInline } from '../../utils/metaUtils';
import { getSectionColorHex } from '../../utils/songUtils';

interface MarkupInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  className?: string;
  spellCheck?: boolean;
}

export function MarkupInput({ value, onChange, textareaRef, className = '', spellCheck = false }: MarkupInputProps) {
  const mirrorRef = useRef<HTMLDivElement>(null);

  const syncScroll = () => {
    if (textareaRef.current && mirrorRef.current) {
      mirrorRef.current.scrollTop = textareaRef.current.scrollTop;
      mirrorRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.addEventListener('scroll', syncScroll);
    return () => ta.removeEventListener('scroll', syncScroll);
  }, [textareaRef]);

  const buildHighlightedHtml = (text: string): string => {
    return text
      .split('\n')
      .map(line => {
        const trimmed = line.trim();

        // Empty line or bare [] — render as non-breaking space
        if (!trimmed || trimmed === '[]') return '&nbsp;';

        const escaped = line
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

        // Section header: [Name] where Name is non-empty and is a known section
        const headerMatch = trimmed.match(/^\[(.+)\]$/);
        if (headerMatch && headerMatch[1] && headerMatch[1].trim() && isSectionHeader(headerMatch[1])) {
          const color = getSectionColorHex(headerMatch[1]);
          return `<span class="markup-section-header" style="color:${color}">${escaped}</span>`;
        }

        // Pure meta line
        if (isPureMetaLine(trimmed)) {
          return `<span class="markup-meta-line">${escaped}</span>`;
        }

        // Inline meta tokens
        const parts = tokenizeMetaInline(line);
        if (parts.some(p => p.isMeta)) {
          return parts
            .map(p => {
              const t = p.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
              return p.isMeta ? `<span class="markup-meta-token">${t}</span>` : t;
            })
            .join('');
        }

        return escaped;
      })
      .join('\n');
  };

  const highlightedHtml = buildHighlightedHtml(value);

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden">
      <div
        ref={mirrorRef}
        aria-hidden="true"
        className={`markup-mirror pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words ${className}`}
        style={{ caretColor: 'transparent', userSelect: 'none', padding: '1.5rem' }}
        dangerouslySetInnerHTML={{ __html: highlightedHtml + '\n' }}
      />
      <textarea
        ref={textareaRef as React.RefObject<HTMLTextAreaElement>}
        value={value}
        onChange={onChange}
        spellCheck={spellCheck}
        className={`absolute inset-0 w-full h-full resize-none bg-transparent caret-[var(--text-primary)] outline-none ${className}`}
        style={{ padding: '1.5rem', color: 'transparent' }}
      />
      <style>{`
        .markup-section-header {
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .markup-meta-line {
          color: #22d3ee;
          opacity: 0.85;
        }
        .markup-meta-token {
          color: #67e8f9;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
