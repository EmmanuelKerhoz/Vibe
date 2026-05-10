/**
 * Rhyme Engine v2 — Austronesian Family Algorithm
 * Languages: ID (Indonesian), MS (Malay), TL (Tagalog), MG (Malagasy)
 *
 * Strategy:
 * - All four languages use Latin script → grapheme-to-phoneme via regex rules
 * - ID/MS: digraphs ng→ŋ, ny→ɲ, kh→x, sy→ʃ, gh→ɣ; near-identical phonology
 * - TL: similar to ID/MS + ng digraph, final glottal stop (unmarked) ignored
 * - MG: distinct Bantu-influenced phonology; final -tra/-na/-ka reduction rules
 *
 * Scoring: vowel nucleus 65% + coda 35%
 * Rationale: Austronesian languages favour open syllables (CV dominant);
 *            coda consonants are infrequent and less contrastive for rhyme.
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';
import { phonemeEditDistance } from './scoring';

// ─── Shared Austronesian digraph map (ID, MS, TL) ────────────────────────────

const AUS_DIGRAPHS: Array<[RegExp, string]> = [
  [/ng/gu,  'ng'],  // preserve as unit for edit distance
  [/ny/gu,  'ny'],
  [/kh/gu,  'kh'],
  [/sy/gu,  'sh'],
  [/gh/gu,  'g'],
  [/ts/gu,  'ts'],
  [/dj/gu,  'j'],
  [/tj/gu,  'ch'],
];

const AUS_VOWELS = /[aeiouàáâäèéêëìíîïòóôöùúûü]+/giu;

function normalizeAUS(token: string): string {
  let s = token.toLowerCase().normalize('NFC');
  s = s.replace(/[àáâä]/gu, 'a').replace(/[èéêë]/gu, 'e').replace(/[ìíîï]/gu, 'i')
        .replace(/[òóôö]/gu, 'o').replace(/[ùúûü]/gu, 'u');
  for (const [re, rep] of AUS_DIGRAPHS) s = s.replace(re, rep);
  return s;
}

// ─── Malagasy specific normalisation ─────────────────────────────────────────

const MG_ENDINGS: Array<[RegExp, string]> = [
  [/tra$/u,  'a'],
  [/na$/u,   'a'],
  [/ka$/u,   'a'],
  [/ny$/u,   'i'],
  [/nty$/u,  'i'],
];

function normalizeMG(token: string): string {
  let s = token.toLowerCase().normalize('NFC');
  for (const [re, rep] of MG_ENDINGS) s = s.replace(re, rep);
  return normalizeAUS(s);
}

// ─── charSpan helper ──────────────────────────────────────────────────────────
/**
 * Finds the last vowel cluster in `surface` (NFC lowercase) and returns
 * the exact character span (vowels + coda tail) within the original surface.
 */
function surfaceSpanAUS(surface: string): { charSpanStart: number; charSpanEnd: number } {
  const nfc = surface.normalize('NFC').toLowerCase();
  const SIMPLE_VOWELS = /[aeiouàáâäèéêëìíîïòóôöùúûü]+/giu;
  SIMPLE_VOWELS.lastIndex = 0;
  const matches = [...nfc.matchAll(SIMPLE_VOWELS)];
  if (!matches.length) {
    const start = Math.max(0, nfc.length - 2);
    return { charSpanStart: start, charSpanEnd: nfc.length };
  }
  const last = matches.at(-1)!;
  return {
    charSpanStart: last.index!,
    charSpanEnd:   nfc.length, // span through end of token (coda included)
  };
}

// ─── Nucleus extractor ────────────────────────────────────────────────────────

function extractLatinNucleusAUS(normalized: string): { vowels: string; coda: string; onset: string } {
  const matches = [...normalized.matchAll(AUS_VOWELS)];
  if (!matches.length) {
    return { vowels: normalized.slice(-3), coda: '', onset: '' };
  }
  const last = matches.at(-1)!;
  const vowels = last[0]!;
  const idx    = last.index ?? 0;
  const coda   = normalized.slice(idx + vowels.length);
  const onset  = normalized.slice(0, idx);
  return { vowels, coda, onset };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function extractNucleusAUS(
  unit: LineEndingUnit,
  lang: LangCode
): RhymeNucleus {
  const { surface } = unit;
  if (!surface) {
    return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1,
             charSpanStart: -1, charSpanEnd: -1 };
  }

  const normalized = lang === 'mg' ? normalizeMG(surface) : normalizeAUS(surface);
  const { vowels, coda, onset } = extractLatinNucleusAUS(normalized);
  const { charSpanStart, charSpanEnd } = surfaceSpanAUS(surface);

  return {
    vowels,
    coda,
    tone:      '',
    onset,
    moraCount: 1,
    charSpanStart,
    charSpanEnd,
  };
}

export function scoreAUS(a: RhymeNucleus, b: RhymeNucleus): number {
  const vowSim  = 1 - phonemeEditDistance(a.vowels, b.vowels);
  const codaSim = 1 - phonemeEditDistance(a.coda,   b.coda);
  return 0.65 * vowSim + 0.35 * codaSim;
}
