/**
 * ALGO-ROM — Romance languages strategy.
 * docs_fusion_optimal.md §10.1 / Annexe 2 §3.
 *
 * Covers: FR, ES, IT, PT, RO, CA.
 * Key traits: MOP syllabification, lexical stress, French G2P (nasal vowels,
 *             digraphs), French e-muet handling.
 */

import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable } from '../core/types';
import { frenchG2P } from './FrenchG2P';

// ─── MOP onset table ────────────────────────────────────────────────────────

/**
 * Legal two-consonant onsets shared across FR/ES/IT/PT/RO/CA.
 * Ordered longest-first so the greedy scan finds the largest legal onset.
 */
const LEGAL_ONSETS_2 = new Set([
  'bl', 'br',
  'cl', 'cr',
  'dr',
  'fl', 'fr',
  'gl', 'gr',
  'gn',
  'pl', 'pr',
  'sc',
  'tr',
  'vr',
  'tl', 'dl',
]);

function mopSplit(cluster: string): [onset: string, prevCoda: string] {
  const len = cluster.length;
  if (len === 0) return ['', ''];
  if (len === 1) return [cluster, ''];
  const tryLen = Math.min(2, len);
  const candidate = cluster.slice(len - tryLen);
  if (LEGAL_ONSETS_2.has(candidate)) {
    return [candidate, cluster.slice(0, len - tryLen)];
  }
  return [cluster.slice(-1), cluster.slice(0, -1)];
}

// ─── Strategy ────────────────────────────────────────────────────────────────

export class RomanceStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-ROM' as const;

  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 0.0,
    weight: 0.0,
    codaClass: 0.5,
    threshold: 0.75,
  };

  normalize(text: string, lang: string): string {
    let t = text.normalize('NFC').toLowerCase().trim();
    if (lang === 'fr') {
      t = t
        .replace(/qu[\u2019']/g, 'que ')
        .replace(/l[\u2019']/g, 'l ')
        .replace(/j[\u2019']/g, 'je ')
        .replace(/d[\u2019']/g, 'de ')
        .replace(/c[\u2019']/g, 'ce ')
        .replace(/m[\u2019']/g, 'me ')
        .replace(/n[\u2019']/g, 'ne ')
        .replace(/s[\u2019']/g, 'se ')
        .replace(/t[\u2019']/g, 'te ');
    }
    t = t.replace(/[^\p{L}\p{M}\s''-]/gu, '');
    return t;
  }

  /**
   * Grapheme-to-phoneme transform.
   * FR: delegates to rule-based FrenchG2P (nasal vowels, digraphs, mute-h).
   * Other Romance languages: orthographic pass-through (stub).
   */
  g2p(normalized: string, lang: string): string {
    if (lang === 'fr') {
      return normalized
        .split(/\s+/)
        .map(w => frenchG2P(w))
        .join(' ');
    }
    // ES / IT / PT / RO / CA — orthographic stub (TODO per-language G2P)
    return normalized;
  }

  /**
   * MOP-based syllabification.
   *
   * vowelPattern includes IPA tokens produced by FrenchG2P:
   *   ɑ̃ ɛ̃ ɔ̃ œ̃  — nasal vowels
   *   ø           — front rounded (eu/œu)
   *   w           — onset of /wa/ (oi)
   * These are multi-codepoint sequences; the char-by-char scan treats each
   * Unicode scalar value individually. Nasal vowels (base + combining tilde
   * U+0303) will be seen as two chars: the scanner picks up the base vowel
   * (ɑ ɛ ɔ œ) which are included in the vowelPattern, then the combining
   * diacritic is absorbed as a non-vowel into the next cluster (harmless
   * since it's never a syllable boundary).
   */
  syllabify(ipa: string, lang: string): Syllable[] {
    const words = ipa.split(/\s+/).filter(Boolean);
    const syllables: Syllable[] = [];

    // Extended vowel pattern: orthographic + IPA tokens from FrenchG2P
    const vowelPattern = /[aeiouyàâæéèêëïîôœùûüÿáíóúãõɛɔɑɪʊɵəɐɯɤɶøɨ]/i;

    for (const word of words) {
      const wordSyllables: Syllable[] = [];
      let cluster = '';

      for (const ch of word) {
        if (!vowelPattern.test(ch)) {
          cluster += ch;
          continue;
        }

        if (wordSyllables.length === 0) {
          wordSyllables.push({
            onset: cluster,
            nucleus: ch,
            coda: '',
            tone: null,
            weight: null,
            stressed: false,
          });
        } else if (cluster === '' && wordSyllables.length > 0) {
          const prev = wordSyllables[wordSyllables.length - 1]!;
          if ((prev.nucleus === 'i' || prev.nucleus === 'u') && prev.coda === '') {
            wordSyllables.pop();
            wordSyllables.push({
              onset: prev.onset + prev.nucleus,
              nucleus: ch,
              coda: '',
              tone: null,
              weight: null,
              stressed: false,
            });
          } else {
            const [onset, coda] = mopSplit(cluster);
            prev.coda = coda;
            wordSyllables.push({
              onset,
              nucleus: ch,
              coda: '',
              tone: null,
              weight: null,
              stressed: false,
            });
          }
        } else {
          const [onset, coda] = mopSplit(cluster);
          wordSyllables[wordSyllables.length - 1]!.coda = coda;
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

      if (cluster && wordSyllables.length > 0) {
        wordSyllables[wordSyllables.length - 1]!.coda += cluster;
      }

      // Absorb leading combining diacritics (e.g. U+0303 combining tilde) from
      // each syllable's coda into its nucleus, so that nasal vowels like ɑ̃
      // stay together as one nucleus token rather than being split.
      for (const syl of wordSyllables) {
        const combiningMarks = syl.coda.match(/^\p{M}+/u);
        if (combiningMarks) {
          syl.nucleus += combiningMarks[0];
          syl.coda = syl.coda.slice(combiningMarks[0].length);
        }
      }

      syllables.push(...wordSyllables);
    }

    // ── Stress assignment ────────────────────────────────────────────────────
    if (lang === 'fr') {
      if (syllables.length >= 2) {
        const last = syllables[syllables.length - 1]!;
        if (last.nucleus === 'e' && last.coda === '') {
          syllables[syllables.length - 2]!.stressed = true;
        } else {
          last.stressed = true;
        }
      } else if (syllables.length === 1) {
        syllables[0]!.stressed = true;
      }
    } else {
      if (syllables.length >= 2) {
        syllables[syllables.length - 2]!.stressed = true;
      } else if (syllables.length === 1) {
        syllables[0]!.stressed = true;
      }
    }

    return syllables;
  }

  /**
   * Extract the rhyme nucleus from the stressed syllable through end of word.
   *
   * For French (lang === 'fr'), IPA nasal vowels produced by FrenchG2P are
   * mapped back to their orthographic base vowel categories for rhyme
   * comparison: ɑ̃→a, ɛ̃→e, ɔ̃→o, œ̃→e. This ensures that words like
   * "chante" and "plante" share the same rhyme nucleus 'a', matching the
   * orthographic convention used in French song-lyric analysis.
   */
  extractRN(syllables: Syllable[], lang: string): RhymeNucleus {
    const stressIdx = syllables.findIndex(s => s.stressed);
    const idx = stressIdx >= 0 ? stressIdx : Math.max(0, syllables.length - 1);
    const tail = syllables.slice(idx);
    const primary = tail[0];

    // Map IPA nasal vowels to their orthographic base for rhyme comparison.
    // e.g. ɑ̃ → a, ɛ̃ → e, ɔ̃ → o, œ̃ → e so that "chante" and "plante" share 'a'.
    let nucleus = primary?.nucleus ?? '';
    if (lang === 'fr') {
      nucleus = nucleus
        .replace(/ɑ\u0303/g, 'a')
        .replace(/ɛ\u0303/g, 'e')
        .replace(/ɔ\u0303/g, 'o')
        .replace(/œ\u0303/g, 'e');
    }
    const coda = primary?.coda ?? '';

    const raw = [nucleus + coda, ...tail.slice(1).map(s => `${s.nucleus}${s.coda}`)].join('');

    return {
      nucleus,
      coda,
      toneClass: null,
      weight: null,
      codaClass: coda ? classifyCoda(coda) : null,
      raw,
      lowResourceFallback: false,
    };
  }

  score(rn1: RhymeNucleus, rn2: RhymeNucleus, weights?: Partial<MatchingWeights>): number {
    return featureWeightedScore(rn1, rn2, { ...this.defaultWeights, ...weights });
  }
}

function classifyCoda(coda: string): 'nasal' | 'liquid' | 'obstruent' | null {
  if (!coda) return null;
  if (/[mnŋɲ]/.test(coda)) return 'nasal';
  if (/[lrɾɹ]/.test(coda)) return 'liquid';
  return 'obstruent';
}
