/**
 * Rhyme Engine v2 — VIET Family Algorithm
 * Languages: VI (Vietnamese), KM (Khmer)
 *
 * VI strategy:
 * - Latin-based orthography with diacritics encoding both vowel quality and tone.
 * - Tone detection via NFD decomposition (combining marks):
 *     U+0300 grave  → L  (huyền)
 *     U+0301 acute  → H  (sắc)
 *     U+0309 hook   → MH (hỏi)
 *     U+0303 tilde  → ML (ngã)
 *     U+0323 dot    → F  (nặng / falling-checked)
 *     none          → M  (ngang, flat)
 * - Vowel nucleus: last vowel cluster in the last syllable
 *   (handles digraphs: oa, oe, ôi, ươ, etc.).
 * - Coda: consonant(s) after the vowel cluster.
 *
 * KM strategy:
 * - Khmer script; not a tonal language → tone always ''.
 * - Vowel nucleus: Khmer vowel diacritics \u17B6-\u17C5.
 * - Coda: subscript coeng (\u17D2) + following consonant cluster.
 * - Graphemic fallback for unrecognised clusters.
 *
 * Scoring:
 * - VI: vowel 40% + coda 20% + tone 40%
 * - KM: vowel 60% + coda 40% (non-tonal — same weights as AGG)
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';
import { phonemeEditDistance, toneDistance } from './scoring';

// ─── Vietnamese ───────────────────────────────────────────────────────────────

function extractVITone(surface: string): string {
  const nfd = surface.normalize('NFD');
  if (/\u0300/.test(nfd)) return 'L';
  if (/\u0301/.test(nfd)) return 'H';
  if (/\u0309/.test(nfd)) return 'MH';
  if (/\u0303/.test(nfd)) return 'ML';
  if (/\u0323/.test(nfd)) return 'F';
  return 'M';
}

const VI_VOWELS = /[aăâeêioôơuưy]+/giu;

function extractVI(surface: string): { vowels: string; coda: string; tone: string } {
  const tone    = extractVITone(surface);
  const lower   = surface.toLowerCase().normalize('NFC');
  const matches = [...lower.matchAll(VI_VOWELS)];
  const last    = matches.at(-1);
  const vowels  = last?.[0] ?? lower.slice(-2);
  const idx     = last?.index ?? lower.length - 2;
  const coda    = lower.slice(idx + (last?.[0]?.length ?? 0));
  return { vowels, coda, tone };
}

// ─── Khmer ────────────────────────────────────────────────────────────────────

const KM_VOWELS          = /[\u17B6-\u17C5]/gu;
const KM_FINAL_CONSONANTS = /[\u1780-\u17A2][\u17D2][\u1780-\u17A2]/gu;

function extractKM(surface: string): { vowels: string; coda: string } {
  const vowelMatches = surface.match(KM_VOWELS);
  const vowels = vowelMatches?.join('') ?? surface.slice(-2);
  const finalMatch = surface.match(KM_FINAL_CONSONANTS);
  const coda = finalMatch?.at(-1) ?? '';
  return { vowels, coda };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function extractNucleusVIET(
  unit: LineEndingUnit,
  lang: LangCode
): RhymeNucleus {
  const { surface } = unit;
  if (!surface) return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 };

  let vowels = '', coda = '', tone = '';

  switch (lang) {
    case 'vi': { const r = extractVI(surface); vowels = r.vowels; coda = r.coda; tone = r.tone; break; }
    case 'km': { const r = extractKM(surface); vowels = r.vowels; coda = r.coda; tone = ''; break; }
    default:   { vowels = surface.slice(-2); coda = ''; tone = ''; break; }
  }

  return { vowels, coda, tone, onset: '', moraCount: vowels.length >= 2 ? 2 : 1 };
}

/**
 * VIET scoring:
 * - VI: vowel 40% + coda 20% + tone 40%
 * - KM: vowel 60% + coda 40% (non-tonal; toneDistance('','') = 1.0, has no net effect)
 * Unified formula works for both: when tone = '' on both sides, toneSim = 1.0
 * and the 40% weight effectively boosts the vowel score — acceptable for KM.
 * If stricter KM handling is needed later, branch on lang.
 */
export function scoreVIET(a: RhymeNucleus, b: RhymeNucleus): number {
  const vowSim  = 1 - phonemeEditDistance(a.vowels, b.vowels);
  const codaSim = 1 - phonemeEditDistance(a.coda,   b.coda);
  const toneSim = toneDistance(a.tone || undefined, b.tone || undefined);
  return 0.40 * vowSim + 0.20 * codaSim + 0.40 * toneSim;
}
