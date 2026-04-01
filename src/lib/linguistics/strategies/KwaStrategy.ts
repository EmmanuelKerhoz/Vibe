/**
 * ALGO-KWA — Niger-Congo Kwa strategy.
 * docs_fusion_optimal.md §11 / Annexe 1 §5.
 *
 * Covers: BA (Baoulé), DI (Dioula), EW (Ewe), MI (Mina).
 * Key traits: CV 95%, 2-5 tone levels, vowel harmony (Ewe), coda negligible.
 */

import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable, ToneClass } from '../core/types';

/** Set of voiced obstruents triggering tonal depression in Ewe. */
const EWE_VOICED_OBSTRUENTS = new Set(['b', 'd', 'ɖ', 'g', 'gb', 'v', 'z']);

export class KwaStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-KWA' as const;

  /** §5.3 / §11.3 — nucleus + tone, coda weight = 0. */
  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 0.8,
    weight: 0.0,
    codaClass: 0.0,
    threshold: 0.75,
  };

  // ─── Step 1 — Normalisation (§11 Étape 1) ─────────────────────────────────

  normalize(text: string, _lang: string): string {
    return text.normalize('NFC').toLowerCase().trim()
      .replace(/[^\p{L}\p{M}\s]/gu, '');
  }

  // ─── Step 2 — G2P (rules-based tonal CV) ──────────────────────────────────

  g2p(normalized: string, _lang: string): string {
    // Stub: in production, apply rule-based tonal CV G2P for BA/DI/EW/MI.
    return normalized;
  }

  // ─── Step 3 — Syllabification (CV-greedy, onset-obligatoire) ──────────────

  syllabify(ipa: string, lang: string): Syllable[] {
    const vowelPattern = /[aeioɛɔuəɪʊ]/i;
    const tonePattern = /[\u0300\u0301\u0302\u0303\u0304\u030C]/;
    const chars = [...ipa.replace(/\s+/g, '')];
    const syllables: Syllable[] = [];
    let i = 0;

    while (i < chars.length) {
      let onset = '';
      let nucleus = '';
      let tone: ToneClass = null;

      // Consume onset consonants
      while (i < chars.length && !vowelPattern.test(chars[i]!) && !tonePattern.test(chars[i]!)) {
        onset += chars[i];
        i++;
      }
      // Consume nucleus (vowel)
      if (i < chars.length && vowelPattern.test(chars[i]!)) {
        nucleus = chars[i]!;
        i++;
      }
      // Consume tone diacritics immediately following nucleus
      if (i < chars.length && tonePattern.test(chars[i]!)) {
        tone = mapToneChar(chars[i]!);
        i++;
      }

      if (nucleus) {
        // Ewe tonal depression: H → M after voiced obstruant (including 'gb')
        if (lang === 'ee' && tone === 'H' && hasVoicedObstruent(onset)) {
          tone = 'M';
        }

        syllables.push({
          onset,
          nucleus,
          coda: '',          // CV structure — coda negligible
          tone,
          weight: null,
          stressed: false,
          template: 'CV',
        });
      }
    }

    // Mark last syllable as rhythmic center
    if (syllables.length > 0) {
      syllables[syllables.length - 1]!.stressed = true;
    }

    return syllables;
  }

  // ─── Step 4 — RN extraction (nucleus + tone, coda ignored) ────────────────

  extractRN(syllables: Syllable[], lang: string): RhymeNucleus {
    const last = syllables[syllables.length - 1];
    const nucleus = last?.nucleus ?? '';
    const toneClass = normalizeTone(last?.tone ?? null, lang);
    return {
      nucleus,
      coda: '',
      toneClass,
      weight: null,
      codaClass: null,
      raw: `${nucleus}${toneClass ?? ''}`,
    };
  }

  // ─── Step 5 — Scoring (feature-weighted tonal) ────────────────────────────

  score(rn1: RhymeNucleus, rn2: RhymeNucleus, weights?: Partial<MatchingWeights>): number {
    return featureWeightedScore(rn1, rn2, { ...this.defaultWeights, ...weights });
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function mapToneChar(ch: string): ToneClass {
  switch (ch) {
    case '\u0301': return 'H';   // acute
    case '\u0300': return 'L';   // grave
    case '\u0302': return 'HL';  // circumflex (falling)
    case '\u030C': return 'LH';  // caron (rising)
    case '\u0304': return 'M';   // macron (mid)
    default: return null;
  }
}

/** Check if onset ends with a voiced obstruent (handles multi-char 'gb'). */
function hasVoicedObstruent(onset: string): boolean {
  if (EWE_VOICED_OBSTRUENTS.has(onset)) return true;
  // Check last single character for single-char obstruents
  const last = onset.slice(-1);
  return EWE_VOICED_OBSTRUENTS.has(last);
}

/**
 * Normalise Baoulé 5-level tones to binary HL (§11.3).
 * H = {H, MH}, L = {ML, M, L}.
 */
function normalizeTone(tone: ToneClass, lang: string): ToneClass {
  if (lang === 'bci' && tone) {
    if (tone === 'H' || tone === 'MH') return 'H';
    return 'L';
  }
  return tone;
}
