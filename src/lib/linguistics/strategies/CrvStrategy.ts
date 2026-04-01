/**
 * ALGO-CRV — Cross River / Chadic strategy.
 * docs_fusion_optimal.md §12 / Annexe 1 §6.
 *
 * Covers: BK (Bekwarra), CB (Calabari), OG (Ogoja), HA (Hausa).
 * Key traits: CV/CVC balanced, mora weight (Hausa), HL contours, codas relevant.
 */

import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable, ToneClass, SyllableWeight } from '../core/types';

/** Hausa permissible coda consonants. */
const CRV_CODA_SET = new Set(['m', 'n', 'ŋ', 'l', 'r', 't', 'd', 'k']);

/** Low-resource language codes. */
const LOW_RESOURCE_LANGS = new Set(['bkv', 'iko']);

export class CrvStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-CRV' as const;

  /** §12.3 — nucleus + tone + weight (opt) + coda class. */
  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 0.8,
    weight: 0.5,
    codaClass: 0.3,
    threshold: 0.75,
  };

  // ─── Step 1 — Normalisation ────────────────────────────────────────────────

  normalize(text: string, _lang: string): string {
    return text.normalize('NFC').toLowerCase().trim()
      .replace(/[^\p{L}\p{M}\s]/gu, '');
  }

  // ─── Step 2 — G2P ─────────────────────────────────────────────────────────

  g2p(normalized: string, _lang: string): string {
    // Stub: in production use SSP-based G2P for Hausa, fallback for BK/OG.
    return normalized;
  }

  // ─── Step 3 — Syllabification (SSP CVC greedy) ────────────────────────────

  syllabify(ipa: string, lang: string): Syllable[] {
    const vowelPattern = /[aeioɛɔuəaː]/i;
    const tonePattern = /[\u0300\u0301\u0302\u030C\u0304]/;
    const chars = [...ipa.replace(/\s+/g, '')];
    const syllables: Syllable[] = [];
    let i = 0;

    while (i < chars.length) {
      let onset = '';
      let nucleus = '';
      let coda = '';
      let tone: ToneClass = null;

      // Onset
      while (i < chars.length && !vowelPattern.test(chars[i]!) && !tonePattern.test(chars[i]!)) {
        onset += chars[i];
        i++;
      }
      // Nucleus
      if (i < chars.length && vowelPattern.test(chars[i]!)) {
        nucleus = chars[i]!;
        i++;
        // Long vowel
        if (i < chars.length && chars[i] === 'ː') {
          nucleus += 'ː';
          i++;
        }
      }
      // Tone diacritic
      if (i < chars.length && tonePattern.test(chars[i]!)) {
        tone = mapToneChar(chars[i]!);
        i++;
      }
      // Coda: consume consonant if it's in CRV_CODA_SET and next char is a consonant or end
      if (i < chars.length && CRV_CODA_SET.has(chars[i]!)) {
        const next = chars[i + 1];
        if (!next || !vowelPattern.test(next)) {
          coda = chars[i]!;
          i++;
        }
      }

      if (nucleus) {
        const weight = computeWeight(nucleus, coda, lang);
        const template = coda ? 'CVC' : 'CV';
        syllables.push({
          onset,
          nucleus,
          coda,
          tone,
          weight,
          stressed: false,
          template,
        });
      }
    }

    if (syllables.length > 0) {
      syllables[syllables.length - 1]!.stressed = true;
    }
    return syllables;
  }

  // ─── Step 4 — RN extraction ────────────────────────────────────────────────

  extractRN(syllables: Syllable[], lang: string): RhymeNucleus {
    const last = syllables[syllables.length - 1];
    const nucleus = last?.nucleus ?? '';
    const coda = last?.coda ?? '';
    const toneClass = last?.tone ?? null;
    const weight = last?.weight ?? null;
    const codaClass = classifyCoda(coda);
    const lowResource = LOW_RESOURCE_LANGS.has(lang);

    return {
      nucleus,
      coda,
      toneClass,
      weight,
      codaClass,
      raw: `${nucleus}${coda}${toneClass ?? ''}${weight === 'heavy' ? '+' : ''}${lowResource ? '~' : ''}`,
    };
  }

  // ─── Step 5 — Scoring ─────────────────────────────────────────────────────

  score(rn1: RhymeNucleus, rn2: RhymeNucleus, weights?: Partial<MatchingWeights>): number {
    return featureWeightedScore(rn1, rn2, { ...this.defaultWeights, ...weights });
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function mapToneChar(ch: string): ToneClass {
  switch (ch) {
    case '\u0301': return 'H';
    case '\u0300': return 'L';
    case '\u0302': return 'HL';
    case '\u030C': return 'LH';
    case '\u0304': return 'M';
    default: return null;
  }
}

/** Hausa moraic weight: CVC or long V → heavy. */
function computeWeight(nucleus: string, coda: string, lang: string): SyllableWeight {
  if (lang !== 'ha') return null;
  if (coda || nucleus.includes('ː')) return 'heavy';
  return 'light';
}

function classifyCoda(coda: string): 'nasal' | 'liquid' | 'obstruent' | null {
  if (!coda) return null;
  if (/[mnŋ]/.test(coda)) return 'nasal';
  if (/[lr]/.test(coda)) return 'liquid';
  return 'obstruent';
}
