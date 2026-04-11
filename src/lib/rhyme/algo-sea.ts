/**
 * Rhyme Engine v2 — SEA + CJK Family Algorithms
 * Re-exports only. Dedicated logic lives in:
 *   algo-tai.ts  (TH, LO)
 *   algo-viet.ts (VI, KM)
 *
 * CJK (ZH, JA, KO) logic remains here as it has no dedicated file yet.
 *
 * Languages: ZH (Mandarin), JA (Japanese), KO (Korean) → CJK
 *
 * CJK Strategy:
 * - ZH: last CJK character as graphemic proxy (no G2P without dict).
 * - JA: last hiragana/katakana mora; kanji → graphemic fallback.
 * - KO: Hangul jamo decomposition — jung-seong (vowel) + jong-seong (coda).
 *
 * Scoring CJK: graphemic identity 100% (penalised 0.6× for non-identical)
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';
import { phonemeEditDistance } from './scoring';
export { extractNucleusTAI as extractNucleusSEA, scoreTAI as scoreSEA } from './algo-tai';

// ─── Korean (Hangul jamo decomposition) ───────────────────────────────────────

function decomposeHangul(ch: string): { cho: string; jung: string; jong: string } | null {
  const cp = ch.codePointAt(0);
  if (cp === undefined || cp < 0xAC00 || cp > 0xD7A3) return null;
  const offset = cp - 0xAC00;
  const jong = offset % 28;
  const jung = Math.floor(offset / 28) % 21;
  const cho  = Math.floor(offset / 28 / 21);
  return {
    cho:  String.fromCodePoint(0x1100 + cho),
    jung: String.fromCodePoint(0x1161 + jung),
    jong: jong > 0 ? String.fromCodePoint(0x11A7 + jong) : '',
  };
}

function extractKO(surface: string): { vowels: string; coda: string } {
  const chars = [...surface];
  for (let i = chars.length - 1; i >= 0; i--) {
    const decomposed = decomposeHangul(chars[i]!);
    if (decomposed) return { vowels: decomposed.jung, coda: decomposed.jong };
  }
  return { vowels: surface.slice(-2), coda: '' };
}

// ─── Japanese (kana last mora) ─────────────────────────────────────────────────

const JA_KANA = /[\u3041-\u3096\u30A1-\u30F6]/gu;

function extractJA(surface: string): { vowels: string; coda: string } {
  const kanaMatches = surface.match(JA_KANA);
  if (kanaMatches?.length) return { vowels: kanaMatches.at(-1)!, coda: '' };
  return { vowels: surface.slice(-2), coda: '' };
}

// ─── Chinese (graphemic last character) ───────────────────────────────────────

function extractZH(surface: string): { vowels: string; coda: string } {
  const cjkMatches = surface.match(/[\u4E00-\u9FFF\u3400-\u4DBF]/gu);
  const last = cjkMatches?.at(-1) ?? surface.slice(-1);
  return { vowels: last, coda: '' };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function extractNucleusCJK(
  unit: LineEndingUnit,
  lang: LangCode
): RhymeNucleus {
  const { surface } = unit;
  if (!surface) return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 };

  let vowels = '', coda = '';

  switch (lang) {
    case 'zh': { const r = extractZH(surface); vowels = r.vowels; coda = r.coda; break; }
    case 'ja': { const r = extractJA(surface); vowels = r.vowels; coda = r.coda; break; }
    case 'ko': { const r = extractKO(surface); vowels = r.vowels; coda = r.coda; break; }
    default:   { vowels = surface.slice(-2); coda = ''; break; }
  }

  return { vowels, coda, tone: '', onset: '', moraCount: 1 };
}

export function scoreCJK(a: RhymeNucleus, b: RhymeNucleus): number {
  if (!a.vowels || !b.vowels) return 0;
  if (a.vowels === b.vowels) return 1;
  return (1 - phonemeEditDistance(a.vowels, b.vowels)) * 0.6;
}
