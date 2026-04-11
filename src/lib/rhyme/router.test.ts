/**
 * router.ts — unit tests
 * Covers: routeToFamily for all 14 families + fallback + __unknown__
 */

import { describe, it, expect } from 'vitest';
import { routeToFamily } from './router';
import type { LangCode } from './types';

const cases: Array<[LangCode, string]> = [
  // ROM
  ['fr', 'ROM'], ['es', 'ROM'], ['it', 'ROM'], ['pt', 'ROM'], ['ro', 'ROM'], ['ca', 'ROM'],
  // GER
  ['en', 'GER'], ['de', 'GER'], ['nl', 'GER'], ['sv', 'GER'], ['da', 'GER'], ['no', 'GER'], ['is', 'GER'],
  // SLV
  ['ru', 'SLV'], ['pl', 'SLV'], ['cs', 'SLV'], ['sk', 'SLV'], ['uk', 'SLV'], ['bg', 'SLV'], ['sr', 'SLV'], ['hr', 'SLV'],
  // SEM
  ['ar', 'SEM'], ['he', 'SEM'], ['am', 'SEM'], ['ha', 'SEM'],
  // CJK
  ['zh', 'CJK'], ['yue', 'CJK'], ['ja', 'CJK'], ['ko', 'CJK'],
  // TAI
  ['th', 'TAI'], ['lo', 'TAI'],
  // VIET
  ['vi', 'VIET'], ['km', 'VIET'],
  // BNT
  ['sw', 'BNT'], ['lg', 'BNT'], ['rw', 'BNT'], ['sn', 'BNT'], ['zu', 'BNT'],
  ['xh', 'BNT'], ['ny', 'BNT'], ['bm', 'BNT'], ['ff', 'BNT'],
  // YRB
  ['yo', 'YRB'],
  // KWA
  ['ba', 'KWA'], ['di', 'KWA'], ['ew', 'KWA'], ['mi', 'KWA'],
  // CRV
  ['bk', 'CRV'], ['cb', 'CRV'], ['og', 'CRV'],
  // TRK
  ['tr', 'TRK'], ['az', 'TRK'], ['uz', 'TRK'], ['kk', 'TRK'],
  // FIN
  ['fi', 'FIN'], ['hu', 'FIN'], ['et', 'FIN'],
  // IIR
  ['hi', 'IIR'], ['ur', 'IIR'], ['bn', 'IIR'], ['fa', 'IIR'], ['pa', 'IIR'],
  // AUS
  ['id', 'AUS'], ['ms', 'AUS'], ['tl', 'AUS'], ['mg', 'AUS'], ['jv', 'AUS'],
  // DRA
  ['ta', 'DRA'], ['te', 'DRA'], ['kn', 'DRA'], ['ml', 'DRA'],
  // CRE
  ['nou', 'CRE'], ['pcm', 'CRE'], ['cfg', 'CRE'],
];

describe('routeToFamily — all 14 families', () => {
  it.each(cases)('%s → %s', (lang, expectedFamily) => {
    const { family, lowResource } = routeToFamily(lang);
    expect(family).toBe(expectedFamily);
    expect(lowResource).toBe(false);
  });
});

describe('routeToFamily — fallback', () => {
  it('__unknown__ → FALLBACK + lowResource: true', () => {
    const { family, lowResource } = routeToFamily('__unknown__' as LangCode);
    expect(family).toBe('FALLBACK');
    expect(lowResource).toBe(true);
  });
});
