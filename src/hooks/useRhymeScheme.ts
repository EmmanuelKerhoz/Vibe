import { useMemo, useRef } from 'react';
import { detectRhymeScheme } from '../lib/rhyme/rhymeSchemeDetector';
import type { LangCode, SchemeResult } from '../lib/rhyme/types';

/**
 * Derives the rhyme scheme for a stanza (array of line texts) and a language.
 *
 * - Memoised: only recomputes when `lineTexts` content or `lang` changes.
 * - Filters out empty lines and meta lines (starting with '[') before detection.
 * - Returns null when fewer than 2 usable lines are available.
 * - Never throws: errors are caught and logged, returning null.
 */
export function useRhymeScheme(
  lineTexts: string[],
  lang: LangCode,
): SchemeResult | null {
  // Stable reference check: only re-run when actual content changes
  const filteredRef = useRef<string[]>([]);
  const resultRef   = useRef<SchemeResult | null>(null);

  const filtered = useMemo(
    () => lineTexts.filter(t => t.trim() && !t.trim().startsWith('[')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lineTexts.join('\x00')],
  );

  const result = useMemo(() => {
    if (filtered.length < 2) return null;
    try {
      return detectRhymeScheme(filtered, lang);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[useRhymeScheme] detection failed:', err);
      }
      return null;
    }
  }, [filtered, lang]);

  // Keep refs current for external consumers if needed later
  filteredRef.current = filtered;
  resultRef.current   = result;

  return result;
}
