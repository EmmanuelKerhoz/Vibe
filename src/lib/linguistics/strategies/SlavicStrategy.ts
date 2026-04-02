/**
 * ALGO-SLV — Slavic languages strategy.
 *
 * Covers: ru, pl, cs, sk, uk, bg, sr, hr.
 * Key traits: paroxytone stress, palatalisation normalisation,
 *             unstressed vowel reduction, high coda relevance.
 */

import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable } from '../core/types';
import { classifyCoda, stripPalatalization } from '../utils';

/** Vowel pattern for Slavic orthographic vowels (Cyrillic + Latin). */
const VOWEL_RE = /[аеёиоуыэюяaeiouyáéíóúůýěăůàâîèü]/i;

/** Unstressed vowels that reduce toward schwa. */
const REDUCIBLE_RE = /[аоеяэ]/gi;

export class SlavicStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-SLV' as const;

  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 0.0,
    weight: 0.0,
    codaClass: 0.7,
    threshold: 0.75,
  };

  // ─── Step 1: Normalisation ──────────────────────────────────────────────────

  normalize(text: string, _lang: string): string {
    let t = text.normalize('NFC').toLowerCase().trim();
    // Strip non-phonemic punctuation, keep apostrophes and hyphens
    t = t.replace(/[^\p{L}\p{M}\s''\-]/gu, '');
    return t;
  }

  // ─── Step 2: G2P ───────────────────────────────────────────────────────────

  g2p(normalized: string, _lang: string): string {
    // Stub: G2P not yet implemented — grapheme-only analysis.
    // TODO: delegate to eSpeak-NG / Epitran and model final devoicing,
    // vowel reduction, and language-specific stress placement.
    // Consequence: rhyme detection is mostly orthographic; Cyrillic is closer
    // to phonology than Latin Slavic orthographies, but still incomplete.
    return normalized;
  }

  // ─── Step 3: Syllabification ────────────────────────────────────────────────

  syllabify(ipa: string, _lang: string): Syllable[] {
    const words = ipa.split(/\s+/).filter(Boolean);
    const syllables: Syllable[] = [];

    for (const word of words) {
      // Normalise palatalisation for rhyme comparison
      const cleaned = stripPalatalization(word);
      let current = '';

      for (const ch of cleaned) {
        current += ch;
        if (VOWEL_RE.test(ch)) {
          syllables.push({
            onset: current.slice(0, -1),
            nucleus: ch,
            coda: '',
            tone: null,
            weight: null,
            stressed: false,
          });
          current = '';
        }
      }
      // Trailing consonants → coda of last syllable
      if (current && syllables.length > 0) {
        syllables[syllables.length - 1]!.coda = current;
      }
    }

    // Default stress: paroxytone (penultimate syllable)
    if (syllables.length >= 2) {
      syllables[syllables.length - 2]!.stressed = true;
    } else if (syllables.length === 1) {
      syllables[0]!.stressed = true;
    }

    // Reduce unstressed vowels toward schwa
    for (const syl of syllables) {
      if (!syl.stressed) {
        syl.nucleus = syl.nucleus.replace(REDUCIBLE_RE, 'ə');
      }
    }

    return syllables;
  }

  // ─── Step 4: Rhyme Nucleus extraction ───────────────────────────────────────

  extractRN(syllables: Syllable[], _lang: string): RhymeNucleus {
    const stressIdx = syllables.findIndex(s => s.stressed);
    const idx = stressIdx >= 0 ? stressIdx : Math.max(0, syllables.length - 1);
    const tail = syllables.slice(idx);
    const raw = tail.map(s => `${s.nucleus}${s.coda}`).join('');
    const primary = tail[0];
    return {
      nucleus: primary?.nucleus ?? '',
      coda: primary?.coda ?? '',
      toneClass: null,
      weight: null,
      codaClass: classifyCoda(primary?.coda ?? ''),
      raw,
      // G2P is a stub — analysis is graphemic only; flag consumers.
      lowResourceFallback: true,
    };
  }

  // ─── Step 5: Scoring ───────────────────────────────────────────────────────

  score(rn1: RhymeNucleus, rn2: RhymeNucleus, weights?: Partial<MatchingWeights>): number {
    return featureWeightedScore(rn1, rn2, { ...this.defaultWeights, ...weights });
  }
}
