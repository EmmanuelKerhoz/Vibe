import React from 'react';
import { tokenizeMetaInline } from '../../utils/metaUtils';

interface MetaLineProps {
  text: string;
  className?: string;
}

/**
 * Renders a pure meta-instruction line with LCARS cyan styling.
 * Brackets are rendered inline around the instruction text — no separate badge.
 * Multiple consecutive meta tokens on the same line are joined inline.
 */
export function MetaLine({ text, className = '' }: MetaLineProps) {
  const parts = tokenizeMetaInline(text);
  return (
    <span
      className={`inline-flex flex-wrap items-center gap-1.5 text-sm italic text-cyan-400 opacity-85 ${className}`}
      aria-label={`Meta instruction: ${text}`}
    >
      {parts.map((part, i) =>
        part.isMeta ? (
          <span key={i} className="inline-flex items-center gap-0 not-italic font-semibold">
            <span className="text-cyan-500/50 select-none">[</span>
            <span className="text-cyan-300">{part.text}</span>
            <span className="text-cyan-500/50 select-none">]</span>
          </span>
        ) : (
          <span key={i} className="text-cyan-400/70">{part.text}</span>
        )
      )}
    </span>
  );
}
