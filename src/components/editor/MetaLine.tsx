import React from 'react';
import { tokenizeMetaInline } from '../../utils/metaUtils';

interface MetaLineProps {
  text: string;
  className?: string;
}

/**
 * Renders a pure meta-instruction line with LCARS cyan styling.
 * Used in SectionEditor when line.isMeta === true.
 *
 * tokenizeMetaInline now returns `inner` (without brackets) for meta tokens,
 * so we render a single [ ] badge followed by the inner text — no duplication.
 * Multiple consecutive meta tokens on the same line are joined inline.
 */
export function MetaLine({ text, className = '' }: MetaLineProps) {
  const parts = tokenizeMetaInline(text);
  return (
    <span
      className={`inline-flex flex-wrap items-center gap-1 text-sm italic text-cyan-400 opacity-85 ${className}`}
      aria-label={`Meta instruction: ${text}`}
    >
      {parts.map((part, i) =>
        part.isMeta ? (
          <span key={i} className="inline-flex items-center gap-0.5 not-italic">
            <span className="text-[9px] font-bold uppercase tracking-widest text-cyan-500/60 border border-cyan-500/30 rounded px-1 py-0">
              [ ]
            </span>
            <span className="text-cyan-300 font-semibold">{part.text}</span>
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </span>
  );
}
