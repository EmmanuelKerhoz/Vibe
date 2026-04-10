/**
 * Rhyme Engine v2 — Language → Family Router
 */

import type { FamilyId, LangCode } from './types';

const LANG_FAMILY_MAP: Record<string, FamilyId> = {
  // Romance
  fr: 'ROM', es: 'ROM', it: 'ROM', pt: 'ROM',
  // Germanic
  en: 'GER', de: 'GER', nl: 'GER',
  // KWA (Kwa branch, Niger-Congo)
  ba: 'KWA', di: 'KWA', ew: 'KWA', mi: 'KWA',
  // CRV (Volta-Congo residual)
  bk: 'CRV', cb: 'CRV', og: 'CRV', ha: 'CRV',
  // Bantu (agglutinant, ATR vowel harmony)
  sw: 'BNT', lg: 'BNT', rw: 'BNT', sn: 'BNT', zu: 'BNT', xh: 'BNT', ny: 'BNT',
  // Yoruboid — NOT Bantu, NOT KWA; strictly tonal, open-syllable
  yo: 'YRB',
  // Slavic
  ru: 'SLV', pl: 'SLV', cs: 'SLV',
  // Semitic
  ar: 'SEM', he: 'SEM',
  // Southeast Asia (tonal)
  th: 'SEA', vi: 'SEA', km: 'SEA',
  // CJK (character-level graphemic proxy)
  zh: 'CJK', ja: 'CJK', ko: 'CJK',
  // Agglutinative → FALLBACK (no phonological model yet)
  tr: 'FALLBACK', fi: 'FALLBACK', hu: 'FALLBACK',
};

/**
 * Returns the processing family for a given language code.
 * Unknown codes route to FALLBACK with a warning.
 */
export function routeToFamily(
  lang: LangCode
): { family: FamilyId; lowResource: boolean } {
  const family = LANG_FAMILY_MAP[lang];
  if (!family) {
    return { family: 'FALLBACK', lowResource: true };
  }
  const lowResource = family === 'FALLBACK';
  return { family, lowResource };
}
