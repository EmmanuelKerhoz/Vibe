/**
 * ALGO-BNT — Bantu / Niger-Congo generic strategy.
 *
 * Covers: sw, yo, zu, xh.
 * Key traits: H/L tones via diacritics, ATR vowel harmony,
 *             dominant CV structure, nominal class prefixes.
 */

import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable, ToneClass } from '../core/types';
import { extractToneFromDiacritic, stripNominalPrefix, classifyCoda, TONE_DIACRITIC_RE } from '../utils';

/** ATR vowel classification. +ATR vowels map to their harmonic class. */
const ATR_PLUS = new Set(['i', 'u', 'e', 'o']);
const ATR_MINUS = new Set(['ɪ', 'ʊ', 'ɛ', 'ɔ']);

/** Map −ATR vowels to their +ATR counterparts for normalisation. */
const ATR_NORMALIZE: Record<string, string> = {
  'ɪ': 'i', 'ʊ': 'u', 'ɛ': 'e', 'ɔ': 'o',
};

/** Vowel pattern for Bantu orthographic vowels (Latin script + IPA). */
const VOWEL_RE = /[aeiouyàáèéìíòóùúɛɔɪʊə]/i;

export class BantuStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-BNT' as const;

  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 0.8,        // tonal family
    weight: 0.0,
    codaClass: 0.3,   // medium coda relevance — CV dominant
    threshold: 0.75,
  };

  // ─── Step 1: Normalisation ──────────────────────────────────────────────────

  normalize(text: string, _lang: string): string {
    let t = text.normalize('NFC').toLowerCase().trim();
    // Strip non-phonemic punctuation
    t = t.replace(/[^\p{L}\p{M}\s''-]/gu, '');
    // Strip nominal class prefixes from each word
    t = t.split(/\s+/).map(w => stripNominalPrefix(w)).join(' ');
    return t;
  }

  // ─── Step 2: G2P ───────────────────────────────────────────────────────────

  g2p(normalized: string, _lang: string): string {
    // Stub: G2P not yet implemented — grapheme-only analysis.
    // TODO: delegate to eSpeak-NG 'sw'/'yo'/'zu'/'xh' voices or Epitran.
    // Consequence: rhyme detection is orthographic, not phonological.
    return normalized;
  }

  // ─── Step 3: Syllabification ────────────────────────────────────────────────

  syllabify(ipa: string, _lang: string): Syllable[] {
    const chars = [...ipa.replace(/\s+/g, ' ')];
    const syllables: Syllable[] = [];
    let i = 0;

    while (i < chars.length) {
      // Skip whitespace
      if (/\s/.test(chars[i]!)) { i++; continue; }

      let onset = '';
      let nucleus = '';
      let tone: ToneClass = null;

      // Consume onset consonants
      while (i < chars.length && !VOWEL_RE.test(chars[i]!) && !TONE_DIACRITIC_RE.test(chars[i]!) && !/\s/.test(chars[i]!)) {
        onset += chars[i];
        i++;
      }

      // Consume nucleus (vowel)
      if (i < chars.length && VOWEL_RE.test(chars[i]!)) {
        nucleus = chars[i]!;
        i++;
      }

      // Consume tone diacritic immediately following nucleus
      if (i < chars.length && TONE_DIACRITIC_RE.test(chars[i]!)) {
        tone = extractToneFromDiacritic(chars[i]!);
        i++;
      }

      if (nucleus) {
        // Normalise ATR vowels to +ATR class
        const normalizedNucleus = normalizeATR(nucleus);

        syllables.push({
          onset,
          nucleus: normalizedNucleus,
          coda: '',       // CV dominant — coda rare
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

  // ─── Step 4: Rhyme Nucleus extraction ───────────────────────────────────────

  extractRN(syllables: Syllable[], _lang: string): RhymeNucleus {
    // Rime = final vowel + associated tone
    const last = syllables[syllables.length - 1];
    const nucleus = last?.nucleus ?? '';
    const coda = last?.coda ?? '';
    const toneClass = last?.tone ?? null;
    return {
      nucleus,
      coda,
      toneClass,
      weight: null,
      codaClass: classifyCoda(coda),
      raw: `${nucleus}${toneClass ?? ''}`,
      // G2P is a stub — analysis is graphemic only; flag consumers.
      lowResourceFallback: true,
    };
  }

  // ─── Step 5: Scoring ───────────────────────────────────────────────────────

  score(rn1: RhymeNucleus, rn2: RhymeNucleus, weights?: Partial<MatchingWeights>): number {
    return featureWeightedScore(rn1, rn2, { ...this.defaultWeights, ...weights });
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Normalise −ATR vowels to +ATR equivalents for comparison. */
function normalizeATR(vowel: string): string {
  return ATR_NORMALIZE[vowel] ?? vowel;
}

// ATR_PLUS and ATR_MINUS are available for future vowel harmony analysis extensions.
export { ATR_PLUS, ATR_MINUS };
