import { languageNameToCode } from '../../constants/langFamilyMap';
import type { LangCode } from './types';

const RHYME_LANG_CODES: readonly LangCode[] = [
  'fr', 'es', 'it', 'pt', 'ro', 'ca',
  'en', 'de', 'nl', 'sv', 'da', 'no', 'is',
  'ar', 'he', 'am', 'ha',
  'zh', 'yue', 'ja', 'ko',
  'th', 'lo',
  'vi', 'km',
  'sw', 'lg', 'rw', 'sn', 'zu', 'xh', 'ny', 'bm', 'ff',
  'yo',
  // Internal KWA aliases: Baoulé, Dioula, Ewe, Mina.
  'ba', 'di', 'ew', 'mi',
  // Internal Cross River / Chadic aliases.
  'bk', 'cb', 'og',
  'ru', 'pl', 'cs', 'sk', 'uk', 'bg', 'sr', 'hr',
  'tr', 'az', 'uz', 'kk',
  'fi', 'hu', 'et',
  'hi', 'ur', 'bn', 'fa', 'pa',
  'id', 'ms', 'tl', 'mg', 'jv',
  'ta', 'te', 'kn', 'ml',
  // Creole / Pidgin codes used by the rhyme router.
  'nou', 'pcm', 'cfg',
  '__unknown__',
];

const RHYME_LANG_CODE_SET = new Set<string>(RHYME_LANG_CODES);

const RHYME_LANG_ALIASES: Record<string, LangCode> = {
  bci: 'ba',
  dyu: 'di',
  ee: 'ew',
  gej: 'mi',
  bkv: 'bk',
  ijn: 'cb',
  iko: 'og',
};

/**
 * Extracts the text payload from a custom language id.
 * Returns null when the payload is another reserved lang-id prefix to avoid
 * recursively interpreting nested adapt/ui/custom markers as user text.
 */
function getSafeCustomLanguageText(value: string): string | null {
  const customText = value.slice('custom:'.length).trim();
  return /^(?:adapt|ui|custom):/.test(customText) ? null : customText;
}

/**
 * Resolves a lowercased language code or name to a LangCode supported by the
 * rhyme router, trying direct codes first, then shared name mapping, then
 * router-specific aliases for canonical codes.
 */
function resolveSupportedRhymeLangCode(value: string): LangCode {
  const normalized = value.toLowerCase();
  if (RHYME_LANG_CODE_SET.has(normalized)) return normalized as LangCode;

  const mapped = languageNameToCode(normalized);
  if (!mapped) return '__unknown__';

  const normalizedMapped = mapped.toLowerCase();
  if (RHYME_LANG_CODE_SET.has(normalizedMapped)) return normalizedMapped as LangCode;
  return RHYME_LANG_ALIASES[normalizedMapped] ?? '__unknown__';
}

export function toRhymeLangCode(lang: string): LangCode {
  let normalized = lang.toLowerCase().trim();
  const canonicalMatch = /^(?:adapt|ui):([a-z]{2,3})$/.exec(normalized);
  if (canonicalMatch?.[1]) {
    normalized = canonicalMatch[1];
  } else if (normalized.startsWith('custom:')) {
    const customText = getSafeCustomLanguageText(normalized);
    if (customText === null) return '__unknown__';
    normalized = customText;
  }

  return resolveSupportedRhymeLangCode(normalized);
}
