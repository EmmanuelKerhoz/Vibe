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

// ─── Slavic MOP onset table ───────────────────────────────────────────────────

/**
 * Legal 3-consonant onsets for Slavic languages.
 * Polish: str, spr, skr — Czech/Slovak: str, spl, skv — Russian: str, spr.
 */
const SLAV_LEGAL_ONSETS_3 = new Set([
  'str', 'spr', 'skr', 'spl', 'skv', 'zdр', 'zgr',
]);

/**
 * Legal 2-consonant onsets for Slavic languages.
 * Covers PL/CS/SK/RU/UK common clusters.
 * Ordered roughly by frequency; set membership is O(1) so order is cosmetic.
 */
const SLAV_LEGAL_ONSETS_2 = new Set([
  // Stop + liquid
  'kl', 'gl', 'pl', 'bl', 'pr', 'br', 'tr', 'dr', 'kr', 'gr', 'fr', 'vl',
  // Fricative + stop / nasal / liquid
  'sp', 'st', 'sk', 'sn', 'sm', 'sl', 'sv', 'zv', 'zn', 'zm', 'zl', 'zr',
  // Affricate-adjacent
  'ts', 'dz', 'tʃ', 'dʒ',
  // Palatal clusters (Czech/Slovak)
  'šk', 'šp', 'žv',
]);

/**
 * Split an inter-vocalic consonant cluster using the Maximum Onset Principle
 * for Slavic languages.
 *
 * Scan from right (longest → shortest):
 *   1. Try len=3 suffix against SLAV_LEGAL_ONSETS_3.
 *   2. Try len=2 suffix against SLAV_LEGAL_ONSETS_2.
 *   3. Single last consonant as onset (universally legal), rest is coda.
 *
 * Examples (Polish):
 *   "str" → onset="str", prevCoda=""    (strona → stro.na handled at first vowel)
 *   "prz" → onset="rz",  prevCoda="p"   (przepis → prze.pis — approx.)
 *   "szcz"→ onset="cz",  prevCoda="sz"  (szczyt → sz.czyt — approx.)
 *   "wst" → onset="st",  prevCoda="w"   (wstać)
 */
function slavMopSplit(cluster: string): [onset: string, prevCoda: string] {
  const len = cluster.length;
  if (len === 0) return ['', ''];
  if (len === 1) return [cluster, ''];

  // Try 3-char onset
  if (len >= 3) {
    const c3 = cluster.slice(len - 3);
    if (SLAV_LEGAL_ONSETS_3.has(c3)) {
      return [c3, cluster.slice(0, len - 3)];
    }
  }

  // Try 2-char onset
  const c2 = cluster.slice(len - 2);
  if (SLAV_LEGAL_ONSETS_2.has(c2)) {
    return [c2, cluster.slice(0, len - 2)];
  }

  // Single last consonant as onset
  return [cluster.slice(-1), cluster.slice(0, -1)];
}

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
      const wordSyllables: Syllable[] = [];
      let cluster = '';

      for (const ch of cleaned) {
        if (!VOWEL_RE.test(ch)) {
          cluster += ch;
          continue;
        }

        // ch is a vowel
        if (wordSyllables.length === 0) {
          // First vowel: entire pre-vocalic cluster is the onset.
          wordSyllables.push({
            onset: cluster,
            nucleus: ch,
            coda: '',
            tone: null,
            weight: null,
            stressed: false,
          });
        } else {
          // Split the inter-vocalic cluster with Slavic MOP.
          const [onset, coda] = slavMopSplit(cluster);
          wordSyllables[wordSyllables.length - 1]!.coda += coda;
          wordSyllables.push({
            onset,
            nucleus: ch,
            coda: '',
            tone: null,
            weight: null,
            stressed: false,
          });
        }
        cluster = '';
      }

      // Trailing consonants → coda of last syllable
      if (cluster && wordSyllables.length > 0) {
        wordSyllables[wordSyllables.length - 1]!.coda = cluster;
      }

      // Default stress: paroxytone (penultimate syllable)
      if (wordSyllables.length >= 2) {
        wordSyllables[wordSyllables.length - 2]!.stressed = true;
      } else if (wordSyllables.length === 1) {
        wordSyllables[0]!.stressed = true;
      }

      // Reduce unstressed vowels toward schwa
      for (const syl of wordSyllables) {
        if (!syl.stressed) {
          syl.nucleus = syl.nucleus.replace(REDUCIBLE_RE, 'ə');
        }
      }

      syllables.push(...wordSyllables);
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
