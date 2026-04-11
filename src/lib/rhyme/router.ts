/**
 * Rhyme Engine v2 — Language → Family Router
 */

import type { FamilyId, LangCode } from './types';

const LANG_FAMILY_MAP: Record<string, FamilyId> = {
  // Romance
  fr: 'ROM', es: 'ROM', it: 'ROM', pt: 'ROM',
  // Germanic
  en: 'GER', de: 'GER', nl: 'GER',
  // KWA
  ba: 'KWA', di: 'KWA', ew: 'KWA', mi: 'KWA',
  // CRV
  bk: 'CRV', cb: 'CRV', og: 'CRV', ha: 'CRV',
  // Bantu
  sw: 'BNT', lg: 'BNT', rw: 'BNT', sn: 'BNT', zu: 'BNT', xh: 'BNT', ny: 'BNT',
  // Yoruboid
  yo: 'YRB',
  // Slavic
  ru: 'SLV', pl: 'SLV', cs: 'SLV',
  // Semitic
  ar: 'SEM', he: 'SEM',
  // Southeast Asia
  th: 'SEA', vi: 'SEA', km: 'SEA',
  // CJK
  zh: 'CJK', ja: 'CJK', ko: 'CJK',
  // Agglutinative
  tr: 'AGG', fi: 'AGG', hu: 'AGG',
  // Indo-Iranian
  hi: 'IIR', ur: 'IIR', bn: 'IIR', fa: 'IIR', pa: 'IIR',
  // Austronesian
  id: 'AUS', ms: 'AUS', tl: 'AUS', mg: 'AUS',
  // Dravidian
  ta: 'DRA', te: 'DRA', kn: 'DRA', ml: 'DRA',
};

export function routeToFamily(
  lang: LangCode
): { family: FamilyId; lowResource: boolean } {
  const family = LANG_FAMILY_MAP[lang];
  if (!family) {
    return { family: 'FALLBACK', lowResource: true };
  }
  return { family, lowResource: false };
}
