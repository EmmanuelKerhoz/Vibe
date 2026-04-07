/**
 * RhymeSuggestPanel
 *
 * Inline panel rendered below the active lyric line.
 * FUI / Star Trek aesthetic: dark glass surface, cyan accent, monospace IPA.
 *
 * Interaction:
 *  - Click a chip → replaces the last word of the line with the suggestion
 *  - Escape key   → calls onClose()
 *  - data-suggestions-panel attr → LyricInput.handleBlur keeps panel open
 *    while focus is inside it
 */

import React, { useCallback, useEffect } from 'react';
import type { GroupedSuggestion, RhymeGroup } from '../../hooks/useRhymeSuggestions';

interface RhymeSuggestPanelProps {
  query:       string;
  suggestions: GroupedSuggestion[];
  isLoading:   boolean;
  lineText:    string;
  onAccept:    (newText: string) => void;
  onClose:     () => void;
}

const GROUP_LABELS: Record<RhymeGroup, string> = {
  perfect:   'Rime parfaite',
  near:      'Rime approx.',
  assonance: 'Assonance',
};

const GROUP_COLOR: Record<RhymeGroup, string> = {
  perfect:   'text-cyan-400 border-cyan-500/40  bg-cyan-500/10  hover:bg-cyan-500/20',
  near:      'text-sky-400  border-sky-500/40   bg-sky-500/10   hover:bg-sky-500/20',
  assonance: 'text-zinc-400 border-zinc-500/40  bg-zinc-500/10  hover:bg-zinc-500/20',
};

/** Replace the last word of `text` with `replacement`. */
function replaceLastWord(text: string, replacement: string): string {
  return text.replace(/[\p{L}'-]+(?=[^\p{L}'-]*$)/u, replacement);
}

export const RhymeSuggestPanel = React.memo(function RhymeSuggestPanel({
  query,
  suggestions,
  isLoading,
  lineText,
  onAccept,
  onClose,
}: RhymeSuggestPanelProps) {
  // Escape → close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleAccept = useCallback((word: string) => {
    onAccept(replaceLastWord(lineText, word));
  }, [lineText, onAccept]);

  if (!isLoading && suggestions.length === 0) return null;

  // Group by category, preserve order
  const groups: RhymeGroup[] = ['perfect', 'near', 'assonance'];
  const grouped = groups
    .map(g => ({ group: g, items: suggestions.filter(s => s.group === g) }))
    .filter(g => g.items.length > 0);

  return (
    <div
      data-suggestions-panel="true"
      className={[
        'ml-8 mt-0.5 mb-1 rounded border border-cyan-900/50',
        'bg-black/70 dark:bg-zinc-950/80 backdrop-blur-sm',
        'p-2 flex flex-col gap-1.5',
        'text-[11px] font-mono',
        'shadow-[0_0_12px_rgba(6,182,212,0.08)]',
        'transition-all duration-150',
      ].join(' ')}
      // Prevent mousedown from blurring the input
      onMouseDown={e => e.preventDefault()}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-cyan-600 dark:text-cyan-700 tracking-widest uppercase text-[9px]">
          ◈ rimes · <span className="text-cyan-400">{query}</span>
        </span>
        {isLoading && (
          <span className="text-zinc-600 animate-pulse text-[9px]">scanning…</span>
        )}
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-600 hover:text-zinc-400 transition ml-auto leading-none"
          tabIndex={-1}
          aria-label="Fermer les suggestions"
        >
          ✕
        </button>
      </div>

      {/* Suggestion chips, grouped */}
      {grouped.map(({ group, items }) => (
        <div key={group} className="flex flex-col gap-1">
          <span className="text-zinc-600 uppercase tracking-widest text-[8px]">
            {GROUP_LABELS[group]}
          </span>
          <div className="flex flex-wrap gap-1">
            {items.map(s => (
              <button
                key={s.word}
                type="button"
                onClick={() => handleAccept(s.word)}
                className={[
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border',
                  'transition-colors duration-100 cursor-pointer',
                  'focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500',
                  GROUP_COLOR[group],
                ].join(' ')}
              >
                <span className="font-semibold">{s.word}</span>
                {s.nucleus && (
                  <span className="text-zinc-500 text-[9px]">/{s.nucleus}/</span>
                )}
                <span className="text-zinc-600 text-[9px] tabular-nums">
                  {Math.round(s.score * 100)}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});
