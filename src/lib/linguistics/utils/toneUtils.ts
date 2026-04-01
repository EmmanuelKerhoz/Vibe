/**
 * Shared tonal helpers used by multiple tonal family strategies.
 * Pure functions only — no strategy-specific branching.
 */

import type { ToneClass } from '../core/types';

const TONE_DIACRITIC_CLASS = '[\\u0300\\u0301\\u0302\\u0303\\u0304\\u0309\\u030C\\u0323]';

/** Combining tone marks shared across tonal orthographies handled in the app. */
export const TONE_DIACRITIC_RE = new RegExp(TONE_DIACRITIC_CLASS, 'u');

/** Thai / Lao spacing tone marks. */
export const TAI_TONE_MARK_RE = /[่้๊๋່້໊໋]/u;

const DEFAULT_TONE_BY_DIACRITIC: Record<string, ToneClass> = {
  '\u0301': 'H',
  '\u0300': 'L',
  '\u0302': 'HL',
  '\u0303': 'MH',
  '\u0304': 'M',
  '\u0309': 'LH',
  '\u030C': 'LH',
  '\u0323': 'ML',
};

/** Map a combining diacritic to a ToneClass, with optional family-specific overrides. */
export function extractToneFromDiacritic(
  ch: string,
  overrides?: Partial<Record<string, ToneClass>>,
): ToneClass {
  return overrides?.[ch] ?? DEFAULT_TONE_BY_DIACRITIC[ch] ?? null;
}

/** Return the first combining tone mark found in a string. */
export function findToneDiacritic(text: string): string | null {
  for (const ch of text.normalize('NFD')) {
    if (TONE_DIACRITIC_RE.test(ch)) {
      return ch;
    }
  }
  return null;
}

/** Strip only tonal combining marks while preserving the base graphemes. */
export function stripToneDiacritics(text: string): string {
  return text.normalize('NFD').replace(new RegExp(TONE_DIACRITIC_CLASS, 'gu'), '').normalize('NFC');
}

/** Split a tonal string into a tone-free base and the first tonal combining mark. */
export function splitToneDiacritics(text: string): { base: string; toneMark: string | null } {
  let toneMark: string | null = null;
  let base = '';

  for (const ch of text.normalize('NFD')) {
    if (TONE_DIACRITIC_RE.test(ch)) {
      toneMark ??= ch;
      continue;
    }
    base += ch;
  }

  return {
    base: base.normalize('NFC'),
    toneMark,
  };
}

/** Resolve tone from the first combining tone mark found in a string. */
export function extractToneFromText(
  text: string,
  overrides?: Partial<Record<string, ToneClass>>,
): ToneClass {
  const toneMark = findToneDiacritic(text);
  return toneMark ? extractToneFromDiacritic(toneMark, overrides) : null;
}

/** Extract a trailing tone digit from a romanised token. */
export function extractToneFromToneDigit(
  text: string,
  toneMap: Record<string, ToneClass>,
): { base: string; toneClass: ToneClass; toneDigit: string | null } {
  const match = text.match(/([1-9])$/u);
  if (!match) {
    return { base: text, toneClass: null, toneDigit: null };
  }

  const toneDigit = match[1] ?? null;
  return {
    base: text.slice(0, -1),
    toneClass: toneDigit ? toneMap[toneDigit] ?? null : null,
    toneDigit,
  };
}
