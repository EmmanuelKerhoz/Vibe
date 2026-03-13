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

/**
 * Markup mode editor with a syntax-highlight preview overlay for meta-instructions.
 * Architecture: invisible textarea (input) + read-only div mirror (highlight layer).
 * The mirror is pixel-aligned on top; the textarea sits in front for input.
 */
export function MarkupInput({ value, onChange, textareaRef, className = '', spellCheck = false }: MarkupInputProps) {
  const mirrorRef = useRef<HTMLDivElement>(null);

  // Sync scroll position of mirror to textarea
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

  /**
   * Converts raw markup text into highlighted HTML for the mirror layer.
   * Section headers get their characteristic color; meta tokens get cyan styling.
   */
  const buildHighlightedHtml = (text: string): string => {
    return text
      .split('\n')
      .map(line => {
        const escaped = line
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        // Check if this is a section header line (e.g. [Verse 1], [Chorus])
        const headerMatch = line.trim().match(/^\[(.+)\]$/);
        if (headerMatch && headerMatch[1] && isSectionHeader(headerMatch[1])) {
          const color = getSectionColorHex(headerMatch[1]);
          return `<span class="markup-section-header" style="color:${color}">${escaped}</span>`;
        }
        if (isPureMetaLine(line)) {
          // Entire line is a meta instruction
          return `<span class="markup-meta-line">${escaped}</span>`;
        }
        // Inline meta tokens within a normal line
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
      {/* Highlight mirror — read-only, sits behind the textarea */}
      <div
        ref={mirrorRef}
        aria-hidden="true"
        className={`markup-mirror pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words ${className}`}
        style={{ caretColor: 'transparent', userSelect: 'none', padding: '1.5rem' }}
        dangerouslySetInnerHTML={{ __html: highlightedHtml + '\n' }}
      />
      {/* Actual textarea — transparent background so mirror shows through */}
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
          font-style: italic;
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
