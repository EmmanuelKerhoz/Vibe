import { useMemo, useRef } from 'react';
import { detectRhymeScheme } from '../lib/rhyme/rhymeSchemeDetector';
import type { LangCode, SchemeResult } from '../lib/rhyme/types';

/**
 * Maps a free-form language string (name or code) to a LangCode.
 * Falls back to '__unknown__' when no match is found.
 *
 * VALID_CODES is exhaustively derived from the LangCode union in types.ts.
 */
function toLangCode(lang: string): LangCode {
  const lower = lang.toLowerCase().trim();

  const VALID_CODES: readonly string[] = [
    // Romance
    'fr', 'es', 'it', 'pt', 'ro', 'ca',
    // Germanic
    'en', 'de', 'nl', 'sv', 'da', 'no', 'is',
    // Semitic
    'ar', 'he', 'am',
    // CJK
    'zh', 'yue', 'ja', 'ko',
    // TAI
    'th', 'lo',
    // VIET
    'vi', 'km',
    // Bantu
    'sw', 'lg', 'rw', 'sn', 'zu', 'xh', 'ny', 'bm', 'ff', 'jv',
    // Yoruboid
    'yo',
    // KWA
    'ba', 'di', 'ew', 'mi',
    // CRV
    'bk', 'cb', 'og', 'ha',
    // Slavic
    'ru', 'pl', 'cs', 'sk', 'uk', 'bg', 'sr', 'hr',
    // TRK
    'tr', 'az', 'uz', 'kk',
    // FIN
    'fi', 'hu', 'et',
    // IIR
    'hi', 'ur', 'bn', 'fa', 'pa',
    // AUS
    'id', 'ms', 'tl', 'mg',
    // DRA
    'ta', 'te', 'kn', 'ml',
    // Creole / Pidgin
    'nou', 'pcm', 'cfg',
    // Fallback sentinel
    '__unknown__',
  ];

  if ((VALID_CODES as string[]).includes(lower)) return lower as LangCode;

  // Common language-name → code mapping
  const NAME_MAP: Record<string, LangCode> = {
    // Romance
    french: 'fr', spanish: 'es', italian: 'it', portuguese: 'pt',
    romanian: 'ro', catalan: 'ca',
    // Germanic
    english: 'en', german: 'de', dutch: 'nl', swedish: 'sv',
    danish: 'da', norwegian: 'no', icelandic: 'is',
    // Semitic
    arabic: 'ar', hebrew: 'he', amharic: 'am',
    // CJK
    chinese: 'zh', mandarin: 'zh', cantonese: 'yue',
    japanese: 'ja', korean: 'ko',
    // TAI
    thai: 'th', lao: 'lo',
    // VIET
    vietnamese: 'vi', khmer: 'km',
    // Bantu
    swahili: 'sw', luganda: 'lg', kinyarwanda: 'rw', shona: 'sn',
    zulu: 'zu', xhosa: 'xh', chichewa: 'ny', bambara: 'bm',
    fula: 'ff', fulani: 'ff', javanese: 'jv',
    // Yoruboid
    yoruba: 'yo',
    // KWA
    baoulé: 'ba', dioula: 'di', ewe: 'ew', mina: 'mi',
    // CRV
    hausa: 'ha',
    // Slavic
    russian: 'ru', polish: 'pl', czech: 'cs', slovak: 'sk',
    ukrainian: 'uk', bulgarian: 'bg', serbian: 'sr', croatian: 'hr',
    // TRK
    turkish: 'tr', azerbaijani: 'az', uzbek: 'uz', kazakh: 'kk',
    // FIN
    finnish: 'fi', hungarian: 'hu', estonian: 'et',
    // IIR
    hindi: 'hi', urdu: 'ur', bengali: 'bn', persian: 'fa', farsi: 'fa', punjabi: 'pa',
    // AUS
    indonesian: 'id', malay: 'ms', tagalog: 'tl', malagasy: 'mg',
    // DRA
    tamil: 'ta', telugu: 'te', kannada: 'kn', malayalam: 'ml',
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
      return isProxied !== undefined ? { ...raw, isProxied } : raw;
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[useRhymeScheme] detection failed:', err);
      }
      return null;
    }
  }, [filtered, langCode, isProxied]);

  filteredRef.current = filtered;
  resultRef.current   = result;

  return result;
}
