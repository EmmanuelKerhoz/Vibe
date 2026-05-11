import { useMemo, useRef } from 'react';
import { detectRhymeSchemeMultiLang } from '../lib/rhyme/rhymeSchemeDetector';
import { detectRhymeSchemeLocally } from '../utils/rhymeSchemeUtils';
import type { LangCode, SchemeResult } from '../lib/rhyme/types';

/**
 * Maps a free-form language string (name or code) to a LangCode.
 * Mirrors the same mapping in useRhymeScheme — kept as a local copy to avoid
 * a shared-state coupling between the two hooks.
 */
function toLangCode(lang: string): LangCode {
  let normalized = lang.toLowerCase().trim();
  const canonicalMatch = /^(?:adapt|ui):([a-z]{2,3})$/.exec(normalized);
  if (canonicalMatch?.[1]) {
    normalized = canonicalMatch[1];
  } else if (normalized.startsWith('custom:')) {
    const customText = getSafeCustomLanguageText(normalized);
    if (customText === null) return '__unknown__';
    normalized = customText;
  }

  const VALID_CODES: readonly string[] = [
    'fr','es','it','pt','ro','ca',
    'en','de','nl','sv','da','no','is',
    'ar','he','am',
    'zh','yue','ja','ko',
    'th','lo',
    'vi','km',
    'sw','lg','rw','sn','zu','xh','ny','bm','ff','jv',
    'yo',
    'ba','di','ew','mi',
    'bk','cb','og','ha',
    'ru','pl','cs','sk','uk','bg','sr','hr',
    'tr','az','uz','kk',
    'fi','hu','et',
    'hi','ur','bn','fa','pa',
    'id','ms','tl','mg',
    'ta','te','kn','ml',
    'nou','pcm','cfg',
    '__unknown__',
  ];
  if ((VALID_CODES as string[]).includes(normalized)) return normalized as LangCode;

  const NAME_MAP: Record<string, LangCode> = {
    french:'fr', spanish:'es', italian:'it', portuguese:'pt',
    romanian:'ro', catalan:'ca',
    english:'en', german:'de', dutch:'nl', swedish:'sv',
    danish:'da', norwegian:'no', icelandic:'is',
    arabic:'ar', hebrew:'he', amharic:'am',
    chinese:'zh', mandarin:'zh', cantonese:'yue',
    japanese:'ja', korean:'ko',
    thai:'th', lao:'lo',
    vietnamese:'vi', khmer:'km',
    swahili:'sw', luganda:'lg', kinyarwanda:'rw', shona:'sn',
    zulu:'zu', xhosa:'xh', chichewa:'ny', bambara:'bm',
    fula:'ff', fulani:'ff', javanese:'jv',
    yoruba:'yo',
    baoule:'ba', dioula:'di', ewe:'ew', mina:'mi',
    hausa:'ha',
    russian:'ru', polish:'pl', czech:'cs', slovak:'sk',
    ukrainian:'uk', bulgarian:'bg', serbian:'sr', croatian:'hr',
    turkish:'tr', azerbaijani:'az', uzbek:'uz', kazakh:'kk',
    finnish:'fi', hungarian:'hu', estonian:'et',
    hindi:'hi', urdu:'ur', bengali:'bn', persian:'fa', farsi:'fa', punjabi:'pa',
    indonesian:'id', malay:'ms', tagalog:'tl', malagasy:'mg',
    tamil:'ta', telugu:'te', kannada:'kn', malayalam:'ml',
  };
  return NAME_MAP[normalized] ?? '__unknown__';
}

function getSafeCustomLanguageText(value: string): string | null {
  const customText = value.slice('custom:'.length).trim();
  return /^(?:adapt|ui|custom):/.test(customText) ? null : customText;
}

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
 *
 * Drop-in complement to `useRhymeScheme` — same return type (`SchemeResult | null`).
 *
 * @example
 * const lines = [
 *   { text: "On the road again",  lang: "en" },
 *   { text: "Sur la route encore", lang: "fr" },
 *   { text: "Back to the beat",    lang: "en" },
 *   { text: "Le coeur qui bat fort",lang: "fr" },
 * ];
 * const scheme = useRhymeSchemeMultiLang(lines);
 * // scheme.label === 'ABAB' (cross-family FALLBACK path)
 */
export function useRhymeSchemeMultiLang(
  lines: MultiLangLine[],
  isProxied?: boolean,
): SchemeResult | null {
  const filteredRef = useRef<Array<{ text: string; lang: LangCode }>>([]);
  const resultRef   = useRef<SchemeResult | null>(null);

  // Serialise for stable memo key — avoids deep-equality overhead.
  // Dependency is the inline expression so filtered re-evaluates whenever
  // the serialised content changes, regardless of referential identity of `lines`.
  const serialised = lines.map(l => `${l.lang}\x01${l.text}`).join('\x00');

  const filtered = useMemo(
    () =>
      lines
        .filter(l => l.text.trim() && !l.text.trim().startsWith('['))
        .map(l => ({ text: l.text, lang: toLangCode(l.lang) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serialised],
  );

  const result = useMemo(() => {
    if (filtered.length < 2) return null;
    try {
      const raw = detectRhymeSchemeMultiLang(filtered);
      if (raw === null) return null;
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
  }, [filtered, isProxied]);

  filteredRef.current = filtered;
  resultRef.current   = result;

  return result;
}
