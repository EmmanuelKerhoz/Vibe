/**
 * Syllable counting utilities with family-based dispatching
 * Implements incremental phonemic engine foundation
 * Based on docs_fusion_optimal.md specification
 */

import { getAlgoFamily, getFamilyConfig, type AlgoFamily } from '../constants/langFamilyMap';

/**
 * Syllable counting result with metadata
 */
export interface SyllableResult {
  count: number;
  method: 'graphemic' | 'moraic' | 'tonal-CV' | 'phonemic';
  family?: AlgoFamily;
}

/**
 * Strip parenthesised content from lyrics text before counting.
 * Text inside parentheses (e.g. stage directions, backing vocals) is
 * not sung by the lead voice and must not be counted.
 */
const stripParenthesised = (text: string): string =>
  text.replace(/\([^)]*\)/g, ' ').replace(/\s{2,}/g, ' ').trim();

/**
 * Count syllables for French text (current implementation)
 * This is the legacy graphemic approach that works for French
 */
const countSyllablesFrench = (text: string): number => {
  if (!text) return 0;
  const words = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().match(/[a-z]+/g);
  if (!words) return 0;
  let total = 0;
  for (const raw of words) {
    let w = raw
      .replace(/eau/g, '#').replace(/oeu/g, '#').replace(/ai/g, '#').replace(/ei/g, '#')
      .replace(/au/g, '#').replace(/ou/g, '#').replace(/oi/g, '#').replace(/eu/g, '#')
      .replace(/ain/g, '#').replace(/ein/g, '#').replace(/an/g, '#').replace(/en/g, '#')
      .replace(/am(?=[^aeiouy#]|$)/g, '#').replace(/em(?=[^aeiouy#]|$)/g, '#')
      .replace(/in(?=[^aeiouy#]|$)/g, '#').replace(/ion(?=[^aeiouy#]|$)/g, '#').replace(/on/g, '#')
      .replace(/om(?=[^aeiouy#]|$)/g, '#').replace(/un/g, '#')
      .replace(/um(?=[^aeiouy#]|$)/g, '#');
    let count = (w.match(/[aeiouy#]/g) ?? []).length;
    if (count > 1 && /(?<![aeiouy#])e$/.test(w)) count--;
    if (count > 1 && /(?<![aeiouy#])es$/.test(w)) count--;
    total += Math.max(1, count);
  }
  return total;
};

/**
 * Count syllables for English text.
 * Uses vowel-cluster approach with common suffix elision rules.
 * More accurate than the generic Germanic fallback.
 */
const countSyllablesEnglish = (text: string): number => {
  const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
  return words.reduce((sum, raw) => {
    // Remove silent trailing -e patterns and common suffixes
    let w = raw
      .replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, '')
      .replace(/^y/, '');
    // Collapse vowel digraphs & diphthongs into single unit
    w = w
      .replace(/[aeiou]{2}/g, '#')
      .replace(/[aeiouy]/g, '#');
    const count = (w.match(/#/g) ?? []).length;
    return sum + Math.max(1, count);
  }, 0);
};

/**
 * Count syllables for Romance languages (fallback graphemic)
 * Simplified version - full implementation would use G2P
 */
const countSyllablesRomance = (text: string, langCode: string): number => {
  if (langCode === 'fr') {
    return countSyllablesFrench(text);
  }

  // Fallback for other Romance languages (ES, IT, PT)
  // Remove diacritics and count vowel groups
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const vowelGroups = normalized.match(/[aeiou]+/g);
  return vowelGroups ? vowelGroups.length : 0;
};

/**
 * Count syllables for Germanic languages (graphemic)
 * English uses a dedicated function; other Germanic languages use basic vowel counting.
 */
const countSyllablesGermanic = (text: string, langCode: string): number => {
  if (langCode === 'en') {
    return countSyllablesEnglish(text);
  }
  // DE, NL, SV, DA, NO, IS — basic vowel-group counting
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const vowelGroups = normalized.match(/[aeiouy]+/g);
  return vowelGroups ? vowelGroups.length : 0;
};

/**
 * Count morae for Japanese text.
 * 1 hiragana/katakana character ≈ 1 mora.
 * Kanji fallback: each CJK character counts as 1 mora.
 */
const countMoraeJapanese = (text: string): number => {
  const hiragana = text.match(/[\u3040-\u309F]/g) ?? [];
  const katakana = text.match(/[\u30A0-\u30FF]/g) ?? [];
  const kanaCount = hiragana.length + katakana.length;
  if (kanaCount > 0) return kanaCount;
  // Fallback: kanji characters (each = 1 mora when no kana present)
  const kanji = text.match(/[\u4E00-\u9FFF\u3400-\u4DBF]/g) ?? [];
  return kanji.length;
};

/**
 * Count syllables for Sinitic languages.
 * 1 CJK character = 1 syllable (with tone).
 * Covers BMP block + Extension A/B.
 */
const countSyllablesSinitic = (text: string): number => {
  const cjk = text.match(/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g);
  return cjk ? cjk.length : 0;
};

/**
 * Count syllables for tonal CV languages (KWA family).
 * Uses NFC normalisation to avoid double-counting decomposed tonal diacritics.
 */
const countSyllablesTonalCV = (text: string): number => {
  // NFC: keep composed characters — tonal diacritics stay attached to their base vowel
  const normalized = text.normalize('NFC').toLowerCase();
  const vowelGroups = normalized.match(/[aeiouɛɔʊ]+/g);
  return vowelGroups ? vowelGroups.length : 0;
};

/**
 * Count syllables for CVC tonal languages (CRV family).
 * Uses NFC normalisation for the same reason as KWA.
 */
const countSyllablesTonalCVC = (text: string): number => {
  const normalized = text.normalize('NFC').toLowerCase();
  const vowelGroups = normalized.match(/[aeiouɛɔʊ]+/g);
  return vowelGroups ? vowelGroups.length : 0;
};

/**
 * Fallback syllable counting for unrecognized languages.
 * Uses basic vowel group counting.
 */
const countSyllablesFallback = (text: string): number => {
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const vowelGroups = normalized.match(/[aeiou]+/g);
  return vowelGroups ? vowelGroups.length : 0;
};

/**
 * Main dispatcher: count syllables based on language family
 * @param text - The text to count syllables for
 * @param langCode - Optional ISO 639 language code
 * @returns Syllable count result with metadata
 */
export const countSyllablesWithFamily = (text: string, langCode?: string): SyllableResult => {
  if (!text || !text.trim()) {
    return { count: 0, method: 'graphemic' };
  }

  // Strip parenthesised content (backing vocals, stage directions, etc.)
  const cleanText = stripParenthesised(text);
  if (!cleanText) {
    return { count: 0, method: 'graphemic' };
  }

  // If no language code, use French fallback (legacy behavior)
  if (!langCode) {
    return {
      count: countSyllablesFrench(cleanText),
      method: 'graphemic',
    };
  }

  const family = getAlgoFamily(langCode);
  const config = getFamilyConfig(langCode);

  if (!family || !config) {
    // Unknown language - use fallback
    return {
      count: countSyllablesFallback(cleanText),
      method: 'graphemic',
    };
  }

  // Dispatch based on family
  switch (family) {
    case 'ALGO-ROM':
      return {
        count: countSyllablesRomance(cleanText, langCode),
        method: 'graphemic',
        family,
      };

    case 'ALGO-GER':
      return {
        count: countSyllablesGermanic(cleanText, langCode),
        method: 'graphemic',
        family,
      };

    case 'ALGO-JAP':
      return {
        count: countMoraeJapanese(cleanText),
        method: 'moraic',
        family,
      };

    case 'ALGO-SIN':
      return {
        count: countSyllablesSinitic(cleanText),
        method: 'graphemic',
        family,
      };

    case 'ALGO-KWA':
      return {
        count: countSyllablesTonalCV(cleanText),
        method: 'tonal-CV',
        family,
      };

    case 'ALGO-CRV':
      return {
        count: countSyllablesTonalCVC(cleanText),
        method: 'tonal-CV',
        family,
      };

    default:
      // For all other families, use basic fallback
      return {
        count: countSyllablesFallback(cleanText),
        method: 'graphemic',
        family,
      };
  }
};

/**
 * Legacy function for backward compatibility
 * Maintains the same interface as the original countSyllables
 */
export const countSyllables = (text: string, langCode?: string): number => {
  return countSyllablesWithFamily(text, langCode).count;
};
