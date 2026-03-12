import React from 'react';
import { tokenizeMetaInline } from '../../utils/metaUtils';

interface MetaLineProps {
  text: string;
  className?: string;
}

/**
 * Renders a pure meta-instruction line with LCARS cyan styling.
 * Used in SectionEditor when line.isMeta === true.
 */
export function MetaLine({ text, className = '' }: MetaLineProps) {
  const parts = tokenizeMetaInline(text);
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm italic text-cyan-400 opacity-85 ${className}`}
      aria-label={`Meta instruction: ${text}`}
    >
      <span className="text-[9px] font-bold uppercase tracking-widest text-cyan-500/60 border border-cyan-500/30 rounded px-1 py-0 mr-1 not-italic">
        [ ]
      </span>
      {parts.map((part, i) =>
        part.isMeta ? (
          <span key={i} className="text-cyan-300 font-semibold not-italic">{part.text}</span>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </span>
  );
}
