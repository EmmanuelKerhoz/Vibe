import { useMemo, useRef } from 'react';
import { detectRhymeScheme } from '../lib/rhyme/rhymeSchemeDetector';
import type { LangCode, SchemeResult } from '../lib/rhyme/types';

/**
 * Maps a free-form language string (name or code) to a LangCode.
 * Falls back to '__unknown__' when no match is found.
 */
function toLangCode(lang: string): LangCode {
  const lower = lang.toLowerCase().trim();

  // Already a valid LangCode literal?
  const VALID_CODES: readonly string[] = [
    'fr','es','it','pt','en','de','nl','ar','he',
    'zh','ja','ko','th','vi','km','sw','yo',
    'ba','di','ew','mi','bk','cb','og','ha',
    'ru','pl','cs','tr','fi','hu','__unknown__',
  ];
  if ((VALID_CODES as string[]).includes(lower)) return lower as LangCode;

  // Common language-name → code mapping
  const NAME_MAP: Record<string, LangCode> = {
    french: 'fr', spanish: 'es', italian: 'it', portuguese: 'pt',
    english: 'en', german: 'de', dutch: 'nl',
    arabic: 'ar', hebrew: 'he',
    chinese: 'zh', mandarin: 'zh', japanese: 'ja', korean: 'ko',
    thai: 'th', vietnamese: 'vi', khmer: 'km',
    swahili: 'sw', yoruba: 'yo',
    russian: 'ru', polish: 'pl', czech: 'cs',
    turkish: 'tr', finnish: 'fi', hungarian: 'hu',
    hausa: 'ha',
  };
  return NAME_MAP[lower] ?? '__unknown__';
}

/**
 * Derives the rhyme scheme for a stanza (array of line texts) and a language.
 *
 * - Memoised: only recomputes when `lineTexts` content or `lang` changes.
 * - Filters out empty lines and meta lines (starting with '[') before detection.
 * - Returns null when fewer than 2 usable lines are available.
 * - Never throws: errors are caught and logged, returning null.
 * - `isProxied` is stamped onto the result when provided (comes from the
 *   song-level `analyzeSongRhymes` caller, not computed here).
 *
 * `lang` accepts any free-form string (language name or code);
 * it is normalised to a `LangCode` internally.
 */
export function useRhymeScheme(
  lineTexts: string[],
  lang: string,
  isProxied?: boolean,
): SchemeResult | null {
  // Stable reference check: only re-run when actual content changes
  const filteredRef = useRef<string[]>([]);
  const resultRef   = useRef<SchemeResult | null>(null);

  const filtered = useMemo(
    () => lineTexts.filter(t => t.trim() && !t.trim().startsWith('[')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lineTexts.join('\x00')],
  );

  const langCode = useMemo(() => toLangCode(lang), [lang]);

  const result = useMemo(() => {
    if (filtered.length < 2) return null;
    try {
      const raw = detectRhymeScheme(filtered, langCode);
      if (raw === null) return null;
      // Stamp isProxied from the caller — the graphemic detector itself
      // has no visibility into whether a proxy was used upstream.
      return isProxied !== undefined ? { ...raw, isProxied } : raw;
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[useRhymeScheme] detection failed:', err);
      }
      return null;
    }
  // isProxied intentionally included: changing it should re-stamp the result.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, langCode, isProxied]);

  // Keep refs current for external consumers if needed later
  filteredRef.current = filtered;
  resultRef.current   = result;

  return result;
}
