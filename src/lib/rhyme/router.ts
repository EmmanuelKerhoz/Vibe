/**
 * Rhyme Engine v2 — Language → Family Router
 */

import type { FamilyId, LangCode } from './types';

const LANG_FAMILY_MAP: Record<string, FamilyId> = {
  // KWA family
  ba: 'KWA', di: 'KWA', ew: 'KWA', mi: 'KWA',
  // CRV family
  bk: 'CRV', cb: 'CRV', og: 'CRV', ha: 'CRV',
  // Romance
  fr: 'ROM', es: 'ROM', it: 'ROM', pt: 'ROM',
  // Germanic
  en: 'GER', de: 'GER', nl: 'GER',
  // Bantu / Niger-Congo
  sw: 'BNT', yo: 'BNT',
  // Agglutinative → FALLBACK (no dedicated algo yet)
  tr: 'FALLBACK', fi: 'FALLBACK', hu: 'FALLBACK',
  // Slavic → FALLBACK
  ru: 'FALLBACK', pl: 'FALLBACK', cs: 'FALLBACK',
  // CJK → FALLBACK
  zh: 'FALLBACK', ja: 'FALLBACK', ko: 'FALLBACK',
  // SEA → FALLBACK
  th: 'FALLBACK', vi: 'FALLBACK', km: 'FALLBACK',
  // Semitic → FALLBACK
  ar: 'FALLBACK', he: 'FALLBACK',
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
