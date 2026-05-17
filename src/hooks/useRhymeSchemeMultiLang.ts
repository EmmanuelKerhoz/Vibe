import { useMemo } from 'react';
import { detectRhymeSchemeMultiLang } from '../lib/rhyme/rhymeSchemeDetector';
import { detectRhymeSchemeLocally } from '../utils/rhymeSchemeUtils';
import { toRhymeLangCode } from '../lib/rhyme/langCode';
import type { SchemeResult } from '../lib/rhyme/types';

export interface MultiLangLine {
  /** Raw lyric text for the line. */
  text: string;
  /** Language of this specific line (name or LangCode). */
  lang: string;
}

function isAABBPattern(letters: string[]): boolean {
  return letters.length % 2 === 0
    && letters.every((letter, index) => index % 2 === 0 || letter === letters[index - 1]);
}

export function getRhymeSchemeLabelFromLetters(letters: string[]): SchemeResult['label'] {
  const pattern = letters.join('');
  if (letters.length > 0 && new Set(letters).size === 1) return 'MONORHYME';
  if (pattern === 'AABB' || isAABBPattern(letters)) return 'AABB';
  if (pattern === 'ABAB' || /^([A-Z])([A-Z])(?:\1\2)+$/.test(pattern)) return 'ABAB';
  if (pattern === 'ABBA') return 'ABBA';
  if (pattern === 'ABCABC') return 'ABCABC';
  if (letters.filter(l => l === 'X').length > letters.length / 2) return 'FREE_VERSE';
  return 'CUSTOM';
}

export function applyLocalSchemeOverride(
  raw: SchemeResult,
  localScheme: string | null,
  expectedLineCount: number,
): SchemeResult {
  if (!localScheme) return raw;

  const localLetters = localScheme.split('');
  const hasConsistentLength =
    localLetters.length === expectedLineCount && raw.letters.length === expectedLineCount;
  const hasConsistentPairIndexes = raw.pairScores.every(
    ({ i, j }) => i >= 0 && j >= 0 && i < expectedLineCount && j < expectedLineCount,
  );

  if (!hasConsistentLength || !hasConsistentPairIndexes) return raw;

  return {
    ...raw,
    letters: localLetters,
    label: getRhymeSchemeLabelFromLetters(localLetters),
    confidence: Math.max(raw.confidence, 0.7),
  };
}

/**
 * Derives the rhyme scheme for a stanza where each line may have a different
 * language — useful for code-switching lyrics (rap, slam, multilingual songs).
 *
 * Wraps `detectRhymeSchemeMultiLang` with:
 * - Memoisation keyed on serialised text+lang pairs
 * - Empty / meta-line filtering (lines starting with '[' or blank)
 * - Safe fallback: returns null on < 2 usable lines or on detection error
 * - Optional `isProxied` stamp (forwarded from song-level analysis)
 * - Optional `forcedScheme` (e.g. "ABAB") — when provided, overrides acoustic
 *   detection and is applied via `applyLocalSchemeOverride` at high priority.
 *   This is how section.rhymeScheme selected by the user is reflected in badges.
 *
 * Drop-in complement to `useRhymeScheme` — same return type (`SchemeResult | null`).
 */
export function useRhymeSchemeMultiLang(
  lines: MultiLangLine[],
  isProxied?: boolean,
  forcedScheme?: string,
): SchemeResult | null {
  const serialised = lines.map(l => `${l.lang}\x01${l.text}`).join('\x00');

  const filtered = useMemo(
    () =>
      lines
        .filter(l => l.text.trim() && !l.text.trim().startsWith('['))
        .map(l => ({ text: l.text, lang: toRhymeLangCode(l.lang) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serialised],
  );

  const result = useMemo(() => {
    if (filtered.length < 2) return null;
    try {
      const raw = detectRhymeSchemeMultiLang(filtered);
      if (raw === null) return null;

      // If the user has explicitly set a scheme for this section, use it directly.
      // It takes precedence over both acoustic detection and local detection.
      if (forcedScheme) {
        const overridden = applyLocalSchemeOverride(raw, forcedScheme, filtered.length);
        return isProxied !== undefined ? { ...overridden, isProxied } : overridden;
      }

      const firstLang = filtered[0]?.lang;
      const singleLang = filtered.every(line => line.lang === firstLang);
      const localScheme = singleLang && firstLang !== undefined && firstLang !== '__unknown__'
        ? detectRhymeSchemeLocally(filtered.map(line => line.text), firstLang)
        : null;
      const corrected = applyLocalSchemeOverride(raw, localScheme, filtered.length);
      return isProxied !== undefined ? { ...corrected, isProxied } : corrected;
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[useRhymeSchemeMultiLang] detection failed:', err);
      }
      return null;
    }
  }, [filtered, isProxied, forcedScheme]);

  return result;
}
