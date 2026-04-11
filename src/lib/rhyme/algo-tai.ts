/**
 * Rhyme Engine v2 — TAI Family Algorithm
 * Languages: TH (Thai), LO (Lao — future)
 *
 * Strategy:
 * - Thai script tone class detection via tone marks:
 *   mai ek (่) → L, mai tho (้) → ML, mai tri (๊) → H, mai jattawa (๋) → MH
 *   No mark → mid tone M (default class depends on consonant class,
 *   but consonant class detection would require G2P; M is a safe proxy).
 * - Vowel nucleus:
 *   Leading vowels \u0E40-\u0E44 (เ แ โ ใ ไ) appear before the consonant visually
 *   but belong to the same syllable. Collected first.
 *   Following vowels \u0E30-\u0E39 + sara ae (\u0E45) are diacritics after.
 * - Coda: last Thai consonant in range \u0E01-\u0E2E.
 * - Lao: same Unicode strategy; Lao block \u0E80-\u0EFF.
 *   Tone marks: \u0EC8 → L, \u0EC9 → MH, \u0ECA → H, \u0ECB → ML.
 *   Vowels: \u0EB0-\u0EB9 + \u0EC0-\u0EC4 (leading).
 *
 * Scoring: vowel 40% + coda 20% + tone 40%
 * Rationale: tone is phonemically distinctive in Thai/Lao;
 * identical vowel+coda with different tone = different word/meaning.
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';
import { phonemeEditDistance, toneDistance } from './scoring';

// ─── Thai ─────────────────────────────────────────────────────────────────────

const TH_TONE_MARKS: Record<string, string> = {
  '\u0E48': 'L',   // mai ek ่
  '\u0E49': 'ML',  // mai tho ้
  '\u0E4A': 'H',   // mai tri ๊
  '\u0E4B': 'MH',  // mai jattawa ๋
};

const TH_LEADING_VOWELS  = /[\u0E40-\u0E44]/u;
const TH_FOLLOWING_VOWELS = /[\u0E30-\u0E39\u0E45]/gu;

function extractTH(surface: string): { vowels: string; coda: string; tone: string } {
  let tone = 'M';
  for (const [mark, t] of Object.entries(TH_TONE_MARKS)) {
    if (surface.includes(mark)) { tone = t; break; }
  }

  const leadingMatch    = surface.match(TH_LEADING_VOWELS);
  const followingMatches = surface.match(TH_FOLLOWING_VOWELS);
  const vowels = [
    ...(leadingMatch   ? [leadingMatch[0]!] : []),
    ...(followingMatches ?? []),
  ].join('');

  const thConsonants = [...surface].filter(ch => {
    const cp = ch.codePointAt(0) ?? 0;
    return cp >= 0x0E01 && cp <= 0x0E2E;
  });
  const coda = thConsonants.at(-1) ?? '';

  return { vowels: vowels || surface.slice(-2), coda, tone };
}

// ─── Lao ──────────────────────────────────────────────────────────────────────

const LO_TONE_MARKS: Record<string, string> = {
  '\u0EC8': 'L',
  '\u0EC9': 'MH',
  '\u0ECA': 'H',
  '\u0ECB': 'ML',
};

const LO_LEADING_VOWELS   = /[\u0EC0-\u0EC4]/u;
const LO_FOLLOWING_VOWELS  = /[\u0EB0-\u0EB9]/gu;

function extractLO(surface: string): { vowels: string; coda: string; tone: string } {
  let tone = 'M';
  for (const [mark, t] of Object.entries(LO_TONE_MARKS)) {
    if (surface.includes(mark)) { tone = t; break; }
  }

  const leadingMatch    = surface.match(LO_LEADING_VOWELS);
  const followingMatches = surface.match(LO_FOLLOWING_VOWELS);
  const vowels = [
    ...(leadingMatch   ? [leadingMatch[0]!] : []),
    ...(followingMatches ?? []),
  ].join('');

  const loConsonants = [...surface].filter(ch => {
    const cp = ch.codePointAt(0) ?? 0;
    return cp >= 0x0E81 && cp <= 0x0EAE;
  });
  const coda = loConsonants.at(-1) ?? '';

  return { vowels: vowels || surface.slice(-2), coda, tone };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function extractNucleusTAI(
  unit: LineEndingUnit,
  lang: LangCode
): RhymeNucleus {
  const { surface } = unit;
  if (!surface) return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 };

  let vowels = '', coda = '', tone = '';

  switch (lang) {
    case 'th': { const r = extractTH(surface); vowels = r.vowels; coda = r.coda; tone = r.tone; break; }
    case 'lo': { const r = extractLO(surface); vowels = r.vowels; coda = r.coda; tone = r.tone; break; }
    default:   { vowels = surface.slice(-2); coda = ''; tone = ''; break; }
  }

  return { vowels, coda, tone, onset: '', moraCount: vowels.length >= 2 ? 2 : 1 };
}

/**
 * TAI scoring: vowel 40% + coda 20% + tone 40%
 */
export function scoreTAI(a: RhymeNucleus, b: RhymeNucleus): number {
  const vowSim  = 1 - phonemeEditDistance(a.vowels, b.vowels);
  const codaSim = 1 - phonemeEditDistance(a.coda,   b.coda);
  const toneSim = toneDistance(a.tone || undefined, b.tone || undefined);
  return 0.40 * vowSim + 0.20 * codaSim + 0.40 * toneSim;
}
