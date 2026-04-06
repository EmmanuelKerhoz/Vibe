import React from 'react';
import { tokenizeMetaInline } from '../../utils/metaUtils';

interface MetaLineProps {
  text: string;
  lineNumber?: number;
  className?: string;
}

/**
 * Renders a pure meta-instruction line with LCARS cyan styling.
 * Brackets are rendered inline around the instruction text — no separate badge.
 * Multiple consecutive meta tokens on the same line are joined inline.
 */
export function MetaLine({ text, lineNumber, className = '' }: MetaLineProps) {
  const parts = tokenizeMetaInline(text);
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="flex-shrink-0 w-6 text-right text-[9px] tabular-nums font-mono text-zinc-500 select-none" aria-hidden="true">
        {lineNumber ?? ''}
      </span>
      <span
        className="inline-flex flex-wrap items-center gap-1.5 text-sm italic text-cyan-400 opacity-85"
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
    </div>
  );
}
