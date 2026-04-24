/**
 * Rhyme Engine v3 — Tonal Distance Matrices
 *
 * Returns penalty in [0,1]. 0 = same tone, 1 = max penalty.
 * Applied as: finalScore *= (1 - penalty * tonePenaltyFactor)
 */

import type { FamilyId } from './types';

type ToneMatrix = Record<string, Record<string, number>>;

function symGet(matrix: ToneMatrix, a: string, b: string): number {
  return matrix[a]?.[b] ?? matrix[b]?.[a] ?? 0.5;
}

const ZH_MATRIX: ToneMatrix = {
  '1': { '1': 0.0, '2': 0.3, '3': 0.6, '4': 0.7, '0': 0.1 },
  '2': {            '2': 0.0, '3': 0.3, '4': 0.6, '0': 0.1 },
  '3': {                       '3': 0.0, '4': 0.3, '0': 0.1 },
  '4': {                                  '4': 0.0, '0': 0.1 },
  '0': {                                             '0': 0.0 },
};

const YUE_MATRIX: ToneMatrix = {
  '1': { '1': 0.0, '2': 0.2, '3': 0.4, '4': 0.8, '5': 0.7, '6': 0.6 },
  '2': {            '2': 0.0, '3': 0.2, '4': 0.7, '5': 0.5, '6': 0.6 },
  '3': {                       '3': 0.0, '4': 0.6, '5': 0.5, '6': 0.4 },
  '4': {                                  '4': 0.0, '5': 0.2, '6': 0.4 },
  '5': {                                             '5': 0.0, '6': 0.2 },
  '6': {                                                         '6': 0.0 },
};

const TH_MATRIX: ToneMatrix = {
  'M': { 'M': 0.0, 'L': 0.4, 'F': 0.5, 'H': 0.5, 'R': 0.4 },
  'L': {            'L': 0.0, 'F': 0.3, 'H': 0.7, 'R': 0.5 },
  'F': {                       'F': 0.0, 'H': 0.6, 'R': 0.3 },
  'H': {                                  'H': 0.0, 'R': 0.4 },
  'R': {                                             'R': 0.0 },
};

const LO_MATRIX: ToneMatrix = {
  'M':  { 'M': 0.0, 'L': 0.4, 'F': 0.5, 'H': 0.5, 'R': 0.4, 'LF': 0.6 },
  'L':  {            'L': 0.0, 'F': 0.3, 'H': 0.7, 'R': 0.5, 'LF': 0.3 },
  'F':  {                       'F': 0.0, 'H': 0.6, 'R': 0.3, 'LF': 0.4 },
  'H':  {                                  'H': 0.0, 'R': 0.4, 'LF': 0.7 },
  'R':  {                                             'R': 0.0, 'LF': 0.5 },
  'LF': {                                                          'LF': 0.0 },
};

const VI_MATRIX: ToneMatrix = {
  '0':  { '0': 0.0, '`': 0.4, "'": 0.5, '~': 0.7, '?': 0.6, '.': 0.8 },
  '`':  {            '`': 0.0, "'": 0.5, '~': 0.5, '?': 0.4, '.': 0.7 },
  "'":  {                       "'": 0.0, '~': 0.5, '?': 0.5, '.': 0.6 },
  '~':  {                                  '~': 0.0, '?': 0.3, '.': 0.5 },
  '?':  {                                             '?': 0.0, '.': 0.4 },
  '.':  {                                                          '.': 0.0 },
};

const HA_MATRIX: ToneMatrix = {
  'H': { 'H': 0.0, 'L': 0.6, 'F': 0.3 },
  'L': {            'L': 0.0, 'F': 0.3 },
  'F': {                       'F': 0.0 },
};

const KWA_EW_MI_MATRIX: ToneMatrix = {
  'H': { 'H': 0.0, 'M': 0.3, 'L': 0.6 },
  'M': {            'M': 0.0, 'L': 0.3 },
  'L': {                       'L': 0.0 },
};

const KWA_BA_DI_MATRIX: ToneMatrix = {
  'H': { 'H': 0.0, 'L': 0.7 },
  'L': {            'L': 0.0 },
};

const YRB_MATRIX: ToneMatrix = {
  'H': { 'H': 0.0, 'M': 0.3, 'L': 0.7 },
  'M': {            'M': 0.0, 'L': 0.3 },
  'L': {                       'L': 0.0 },
};

export function getTonePenalty(
  toneA: string,
  toneB: string,
  family: FamilyId,
  lang?: string,
): number {
  if (!toneA || !toneB) return 0;
  if (toneA === toneB) return 0;
  switch (family) {
    case 'CJK':
      if (lang === 'yue') return symGet(YUE_MATRIX, toneA, toneB);
      if (lang === 'ja' || lang === 'ko') return 0;
      return symGet(ZH_MATRIX, toneA, toneB);
    case 'TAI':
      if (lang === 'lo') return symGet(LO_MATRIX, toneA, toneB);
      return symGet(TH_MATRIX, toneA, toneB);
    case 'VIET': return symGet(VI_MATRIX, toneA, toneB);
    case 'CRV':  return lang === 'ha' ? symGet(HA_MATRIX, toneA, toneB) : 0;
    case 'KWA':
      if (lang === 'ew' || lang === 'mi') return symGet(KWA_EW_MI_MATRIX, toneA, toneB);
      return symGet(KWA_BA_DI_MATRIX, toneA, toneB);
    case 'YRB': return symGet(YRB_MATRIX, toneA, toneB);
    default:    return 0;
  }
}
