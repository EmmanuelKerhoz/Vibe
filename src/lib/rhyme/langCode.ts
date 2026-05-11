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
  'ba', 'di', 'ew', 'mi',
  'bk', 'cb', 'og',
  'ru', 'pl', 'cs', 'sk', 'uk', 'bg', 'sr', 'hr',
  'tr', 'az', 'uz', 'kk',
  'fi', 'hu', 'et',
  'hi', 'sa', 'ur', 'bn', 'fa', 'pa',
  'id', 'ms', 'tl', 'mg', 'jv',
  'ta', 'te', 'kn', 'ml',
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

function getSafeCustomLanguageText(value: string): string | null {
  const customText = value.slice('custom:'.length).trim();
  return /^(?:adapt|ui|custom):/.test(customText) ? null : customText;
}

function resolveSupportedRhymeLangCode(value: string): LangCode {
  if (RHYME_LANG_CODE_SET.has(value)) return value as LangCode;

  const mapped = languageNameToCode(value);
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
