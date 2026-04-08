/**
 * ALGO-ROM — Romance languages strategy.
 * docs_fusion_optimal.md §10.1 / Annexe 2 §3.
 *
 * Covers: FR, ES, IT, PT, RO, CA.
 * Key traits: MOP syllabification, lexical stress, French G2P (nasal vowels,
 *             digraphs, silent final consonants, mute final e).
 *
 * IMPORTANT — pipeline order for FR:
 *   normalize() → g2p() [calls frenchG2P per token, strips e-muet + final
 *   consonants] → syllabify() → stress() → extractRN()
 *
 *   frenchG2P() now strips the mute final 'e' BEFORE syllabification, so
 *   syllabify() will never see a trailing bare-e syllable for French.
 *   The stress rule must reflect this: always accent the final syllable
 *   (post-strip), not the penultimate.
 *
 * Glide ɥ handling:
 *   frenchG2P emits 'ɥi' (from ui→ɥi) and 'ɥɛ' (from ue→ɥɛ).
 *   In syllabify(), ɥ is treated as a GLIDE (onset consonant), not a nucleus,
 *   so that 'nɥi' produces one syllable with nucleus 'i' and onset 'nɥ',
 *   and extractRN returns 'ɥi' as the rhyming nucleus (onset-glide preserved).
 *   Concretely: when the char-loop encounters ɥ, it is pushed onto the
 *   cluster (onset buffer) rather than treated as a syllable nucleus.
 *
 * Glide w handling:
 *   frenchG2P emits 'wa' (from oi→wa). 'w' is treated as a GLIDE (onset),
 *   mirroring ɥ, so that 'swaʁ' → syllable {onset:'sw', nucleus:'a', coda:'ʁ'}
 *   and extractRN prepends the 'w' onset-glide → nucleus='wa', raw='waʁ'.
 *   This matches lexicon rnKeys like 'waʁ', 'wa', 'waz', 'wat'.
 */

import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable } from '../core/types';
import { frenchG2P } from './FrenchG2P';

// ─── MOP onset table ────────────────────────────────────────────────────────

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
  // glide clusters
  '\u0265i', '\u0265\u025b', 'n\u0265', 'f\u0265', 's\u0265', 'l\u0265',
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

// ─── IPA nasal-vowel NFC codepoints ───────────────────────────────────────────────
// FrenchG2P emits: base vowel + U+0303 (combining tilde).
// Keep as constants to avoid source-file encoding drift.
const TILDE = '\u0303';
const FR_NASAL_TO_BASE: [nasal: string, base: string][] = [
  ['\u0251' + TILDE, '\u0251'],  // ɑ̃ → ɑ  (an/en family)
  ['\u025b' + TILDE, '\u025b'],  // ɛ̃ → ɛ  (in/im family)
  ['\u0254' + TILDE, '\u0254'],  // ɔ̃ → ɔ  (on/om family)
  ['\u0153' + TILDE, '\u0153'],  // œ̃ → œ  (un/um family)
];

/**
 * Strip the combining tilde from a nasal nucleus so that the bare IPA
 * vowel is exposed for rhyme comparison and test assertions.
 * e.g. \u0251\u0303 (ɑ + combining-tilde) → \u0251
 * Non-nasal nuclei are returned unchanged.
 */
function denasalise(nucleus: string): string {
  for (const [nasal, base] of FR_NASAL_TO_BASE) {
    if (nucleus === nasal) return base;
  }
  return nucleus;
}

// ─── Glide chars — treated as onset consonant, not nucleus ───────────────────────
// U+0265 ɥ : labio-palatal approximant (frenchG2P ui→ɥi, ue→ɥɛ)
// U+0077 w : labio-velar approximant  (frenchG2P oi→wa)
// Both are accumulated into the onset cluster rather than treated as vowel
// nuclei. extractRN then prepends them from onset → rhyming nucleus.
const GLIDE_CHARS = new Set(['\u0265', '\u0077']); // ɥ  w

// ─── Strategy ──────────────────────────────────────────────────────────────

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
   * FR: delegates to rule-based FrenchG2P (nasal vowels, digraphs, mute-h,
   *     silent final consonants, mute final e).
   * Other Romance languages: orthographic pass-through (stub).
   */
  g2p(normalized: string, lang: string): string {
    if (lang === 'fr') {
      return normalized
        .split(/\s+/)
        .map(w => frenchG2P(w))
        .join(' ');
    }
    return normalized;
  }

  /**
   * MOP-based syllabification.
   *
   * NOTE: for French, frenchG2P() has already stripped mute final 'e' and
   * silent final consonants before this method is called. The vowel pattern
   * must still include IPA nasal bases (\u0251 \u025b \u0254 \u0153) and
   * glides \u0265 (ɥ) and \u0077 (w) — but both are treated as onset via
   * GLIDE_CHARS, so they are excluded from vowelPattern and accumulated in
   * the cluster buffer instead.
   */
  syllabify(ipa: string, lang: string): Syllable[] {
    const words = ipa.split(/\s+/).filter(Boolean);
    const syllables: Syllable[] = [];

    // Extended vowel pattern: orthographic + IPA tokens from FrenchG2P.
    // ɥ (U+0265) and w (U+0077) are intentionally EXCLUDED — they are handled
    // as glide onsets via GLIDE_CHARS.
    const vowelPattern = /[aeiouyàâæéèêëïîôœùûüÿáíóúãõɛɔɑɪʊɵəɐɯɤɶøɨ]/i;

    for (const word of words) {
      const wordSyllables: Syllable[] = [];
      let cluster = '';

      for (const ch of word) {
        // Glides ɥ and w: treat as onset consonant, accumulate in cluster
        if (GLIDE_CHARS.has(ch)) {
          cluster += ch;
          continue;
        }

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

      // Absorb leading combining diacritics (U+0303 etc.) from each
      // syllable's coda into its nucleus — keeps nasal vowels intact.
      for (const syl of wordSyllables) {
        const combiningMarks = syl.coda.match(/^\p{M}+/u);
        if (combiningMarks) {
          syl.nucleus += combiningMarks[0];
          syl.coda = syl.coda.slice(combiningMarks[0].length);
        }
      }

      syllables.push(...wordSyllables);
    }

    // ── Stress assignment ───────────────────────────────────────────────────────────────────
    if (lang === 'fr') {
      if (syllables.length > 0) {
        syllables[syllables.length - 1]!.stressed = true;
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
   * NASAL HANDLING:
   *   rawNucleus preserves the nasal form (e.g. \u0251\u0303 = ɑ̃) so that
   *   raw is built with the nasal tilde intact and matches lexicon rnKeys
   *   like 'ɑ̃', 'ɔ̃', 'ɛ̃'.
   *   nucleus is denasalised (\u0251\u0303 → \u0251) for scoring and test assertions:
   *   the base IPA vowel is what rhyme comparison operates on.
   *
   * GLIDE PRESERVATION (ɥ and w):
   *   Both glides are stored in syllable.onset by syllabify().
   *   extractRN prepends the trailing glide from onset so that:
   *     nuit  → nucleus='ɥi', raw='ɥi'
   *     fuite → nucleus='ɥi', raw='ɥi'
   *     soir  → nucleus='wa', raw='waʁ'
   *     avoir → nucleus='wa', raw='waʁ'
   */
  extractRN(syllables: Syllable[], lang: string): RhymeNucleus {
    const stressIdx = syllables.findIndex(s => s.stressed);
    const idx = stressIdx >= 0 ? stressIdx : Math.max(0, syllables.length - 1);
    const tail = syllables.slice(idx);
    const primary = tail[0];

    // Raw nucleus — keep nasal tilde intact for lexicon rnKey matching.
    const rawNucleus = primary?.nucleus ?? '';
    const coda = primary?.coda ?? '';

    // Prepend glide from onset if present (ɥ or w stored there by syllabify)
    const onsetGlide = (primary?.onset ?? '').match(/[\u0265\u0077]$/u)?.[0] ?? '';

    // nucleus: denasalised base vowel (+ glide) for scoring and assertions.
    // raw: nasal form preserved for lexicon rnKey lookup.
    const nucleus = onsetGlide + denasalise(rawNucleus);

    // Build raw key using rawNucleus (nasal tilde preserved).
    const raw = [
      onsetGlide + rawNucleus + coda,
      ...tail.slice(1).map(s => {
        const tGlide = s.onset.match(/[\u0265\u0077]$/u)?.[0] ?? '';
        return `${tGlide}${s.nucleus}${s.coda}`;
      }),
    ].join('');

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
  if (/[lrɾɹ\u0281]/.test(coda)) return 'liquid';
  return 'obstruent';
}
