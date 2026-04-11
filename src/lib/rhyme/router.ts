/**
 * Rhyme Engine v2 — Language → Family Router
 */

import type { FamilyId, LangCode } from './types';

const LANG_FAMILY_MAP: Record<string, FamilyId> = {
  // Romance
  fr: 'ROM', es: 'ROM', it: 'ROM', pt: 'ROM', ro: 'ROM', ca: 'ROM',
  // Germanic
  en: 'GER', de: 'GER', nl: 'GER', sv: 'GER', da: 'GER', no: 'GER', is: 'GER',
  // Slavic
  ru: 'SLV', pl: 'SLV', cs: 'SLV', sk: 'SLV', uk: 'SLV', bg: 'SLV', sr: 'SLV', hr: 'SLV',
  // Semitic
  ar: 'SEM', he: 'SEM', am: 'SEM',
  // CJK
  zh: 'CJK', yue: 'CJK', ja: 'CJK', ko: 'CJK',
  // TAI (Thai, Lao)
  th: 'TAI', lo: 'TAI',
  // VIET (Vietnamese, Khmer)
  vi: 'VIET', km: 'VIET',
  // Bantu
  sw: 'BNT', lg: 'BNT', rw: 'BNT', sn: 'BNT', zu: 'BNT', xh: 'BNT', ny: 'BNT',
  bm: 'BNT', ff: 'BNT', jv: 'BNT',
  // Yoruboid
  yo: 'YRB',
  // KWA
  ba: 'KWA', di: 'KWA', ew: 'KWA', mi: 'KWA',
  // CRV
  bk: 'CRV', cb: 'CRV', og: 'CRV', ha: 'CRV',
  // TRK (Turkic)
  tr: 'TRK', az: 'TRK', uz: 'TRK', kk: 'TRK',
  // FIN (Finno-Ugric)
  fi: 'FIN', hu: 'FIN', et: 'FIN',
  // Indo-Iranian
  hi: 'IIR', ur: 'IIR', bn: 'IIR', fa: 'IIR', pa: 'IIR',
  // Austronesian
  id: 'AUS', ms: 'AUS', tl: 'AUS', mg: 'AUS',
  // Dravidian
  ta: 'DRA', te: 'DRA', kn: 'DRA', ml: 'DRA',
  // Creole / Pidgin
  nou: 'CRE', pcm: 'CRE', cfg: 'CRE',
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
