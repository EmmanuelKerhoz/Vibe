/**
 * ALGO-ROBUST — Universal fallback strategy.
 *
 * Used when a language code is absent, unknown, or not yet mapped
 * in LANG_TO_FAMILY. Provides a best-effort rhyme score rather than
 * throwing or returning undefined.
 *
 * Design decisions:
 *   - CV-greedy syllabification: safe across virtually all writing systems.
 *   - Nucleus comparison: character-level Levenshtein distance on the
 *     vowel string, normalised to [0, 1].
 *   - Score hard cap: 0.65. Signals partial confidence to consumers.
 *     Callers that care about confidence should check RhymeNucleus.lowResourceFallback.
 *   - No tones, no coda class, no vowel harmony — all weights zeroed
 *     except nucleus.
 *   - Threshold: 0.50 (permissive — better a false positive than silence).
 */

import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import type { MatchingWeights, RhymeNucleus, Syllable } from '../core/types';

/** Maximum score returnable by ALGO-ROBUST. */
const ROBUST_SCORE_CAP = 0.65;

/** Unicode vowel set covering Latin, Cyrillic, Arabic, Devanagari basics. */
const VOWEL_RE = /[aeiouyéèêàùâîôûœøɛɔɑɪʊəʌæɒ\u0627\u0648\u064A\u0410\u0415\u0418\u041E\u0423\u042B\u042E\u042F\u0430\u0435\u0438\u043E\u0443\u044B\u044E\u044F\u0900-\u097F]/i;

/** Levenshtein distance between two strings. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i]![j] = a[i - 1] === b[j - 1]
        ? dp[i - 1]![j - 1]!
        : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }
  return dp[a.length]![b.length]!;
}

/** Normalised similarity in [0, 1] from Levenshtein distance. */
function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

export class FallbackStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-ROBUST' as const;

  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 0.0,
    weight: 0.0,
    codaClass: 0.0,
    threshold: 0.50,
  };

  // ─── Step 1 — Normalisation ───────────────────────────────────────────────

  normalize(text: string, _lang: string): string {
    return text
      .normalize('NFC')
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{M}\s]/gu, '');
  }

  // ─── Step 2 — G2P (identity: no language-specific rules) ─────────────────

  g2p(normalized: string, _lang: string): string {
    // No G2P available — operate on graphemes directly.
    return normalized;
  }

  // ─── Step 3 — Syllabification (CV-greedy, universal) ─────────────────────

  syllabify(text: string, _lang: string): Syllable[] {
    const chars = [...text.replace(/\s+/g, '')];
    const syllables: Syllable[] = [];
    let i = 0;

    while (i < chars.length) {
      let onset = '';
      let nucleus = '';
      let coda = '';

      while (i < chars.length && !VOWEL_RE.test(chars[i]!)) {
        onset += chars[i];
        i++;
      }
      if (i < chars.length && VOWEL_RE.test(chars[i]!)) {
        nucleus = chars[i]!;
        i++;
      }
      if (
        nucleus &&
        i < chars.length &&
        !VOWEL_RE.test(chars[i]!) &&
        (i + 1 >= chars.length || !VOWEL_RE.test(chars[i + 1] ?? ''))
      ) {
        coda = chars[i]!;
        i++;
      }

      if (nucleus) {
        syllables.push({
          onset,
          nucleus,
          coda,
          tone: null,
          weight: null,
          stressed: false,
          template: coda ? 'CVC' : 'CV',
        });
      }
    }

    if (syllables.length > 0) {
      syllables[syllables.length - 1]!.stressed = true;
    }

    return syllables;
  }

  // ─── Step 4 — RN extraction ───────────────────────────────────────────────

  extractRN(syllables: Syllable[], _lang: string): RhymeNucleus {
    const last = syllables[syllables.length - 1];
    const nucleus = last?.nucleus ?? '';
    return {
      nucleus,
      coda: last?.coda ?? '',
      toneClass: null,
      weight: null,
      codaClass: null,
      raw: nucleus,
      lowResourceFallback: true,
    };
  }

  // ─── Step 5 — Scoring (capped at ROBUST_SCORE_CAP) ───────────────────────

  score(rn1: RhymeNucleus, rn2: RhymeNucleus, _weights?: Partial<MatchingWeights>): number {
    if (!rn1.nucleus || !rn2.nucleus) return 0;
    const raw = levenshteinSimilarity(rn1.nucleus, rn2.nucleus);
    return Math.min(raw, ROBUST_SCORE_CAP);
  }
}
