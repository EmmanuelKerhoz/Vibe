/**
 * ALGO-ROM — Romance languages strategy.
 * docs_fusion_optimal.md §10.1 / Annexe 2 §3.
 *
 * Covers: FR, ES, IT, PT, RO, CA.
 * Key traits: MOP syllabification, lexical stress, French e-muet handling.
 */

import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable } from '../core/types';

// ─── MOP onset table ─────────────────────────────────────────────────────────────

/**
 * Legal two-consonant onsets shared across FR/ES/IT/PT/RO/CA.
 * Ordered longest-first so the greedy scan finds the largest legal onset.
 * Three-consonant onsets (str, spl, spr...) are omitted — they are rare in
 * the Romance corpus and the current G2P stub produces orthographic text
 * rather than IPA, making str-level clusters unreliable anyway.
 *
 * Added in this revision:
 *   'sc' — legal onset in IT/ES/PT: scuola, scrivere, escribir, escrever.
 *           Rare as onset in FR (sceptre is the canonical exception).
 *   'gn' — legal onset in IT: gnocchi, gnomo, gnosi.
 *           Not a true onset in FR (gn is always medial/final in native words)
 *           but G2P is orthographic so inclusion is harmless for FR and
 *           correct for IT.
 */
const LEGAL_ONSETS_2 = new Set([
  'bl', 'br',
  'cl', 'cr',
  'dr',
  'fl', 'fr',
  'gl', 'gr',
  'gn',           // IT: gnocchi, gnomo
  'pl', 'pr',
  'sc',           // IT/ES/PT: scuola, escribir
  'tr',
  'vr',
  // Spanish/IT additional
  'tl', 'dl',
]);

/**
 * Split a pre-vowel consonant cluster using the Maximum Onset Principle.
 *
 * Given the consonants that precede the current vowel, find the
 * longest legal onset suffix, assign the remainder to prevCoda.
 *
 * Returns [onsetForCurrent, codaForPrevious].
 *
 * Examples (orthographic, FR/ES/IT/PT):
 *   cluster="br"  → onset="br",  prevCoda=""
 *   cluster="str" → onset="tr",  prevCoda="s"
 *   cluster="ct"  → onset="t",   prevCoda="c"
 *   cluster="ntr" → onset="tr",  prevCoda="n"
 *   cluster="sc"  → onset="sc",  prevCoda=""   (IT: scu.o.la)
 *   cluster="gn"  → onset="gn",  prevCoda=""   (IT: gno.cchi)
 */
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

  /**
   * Normalise Romance text.
   *
   * French elision (apostrophe contractions) expanded to full forms so that
   * syllabify() never receives opaque onset clusters like 'qu' (from qu'elle)
   * or 'n' (from n'est).
   *
   * Expansion order:
   *   1. 'qu\u2019' / 'qu\'' before 'q\u2019' / 'q\'' to avoid partial match.
   *   2. Multi-char elisions before single-char ones.
   *   3. Both typographic (’) and straight (') apostrophes handled.
   *
   * Covered contractions:
   *   l'   → l     (already present)
   *   j'   → je    (already present)
   *   d'   → de    (already present)
   *   qu'  → que   (NEW)
   *   c'   → ce    (NEW)
   *   m'   → me    (NEW)
   *   n'   → ne    (NEW)
   *   s'   → se    (NEW)
   *   t'   → te    (NEW)
   */
  normalize(text: string, lang: string): string {
    let t = text.normalize('NFC').toLowerCase().trim();

    if (lang === 'fr') {
      // Handle both typographic (’ U+2019) and straight (') apostrophes.
      // qu' must come first to avoid 'q' matching the single-char rule.
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

  g2p(normalized: string, _lang: string): string {
    return normalized;
  }

  /**
   * MOP-based syllabification.
   *
   * Pass 1: collect (onset, nucleus) pairs by scanning char-by-char.
   *   When a vowel is encountered, the consonants accumulated since the
   *   last vowel form a cluster. mopSplit() divides that cluster into:
   *     • the coda of the previous syllable
   *     • the onset of the new syllable
   * Pass 2: trailing consonants after the last vowel become the coda of
   *   the last syllable.
   * Pass 3: mark stress — last non-schwa syllable (FR default; ES/IT/PT
   *   penultimate is correct with real G2P but orthographic stubs make
   *   schwa-detection unreliable, so FR rule is applied universally for now).
   */
  syllabify(ipa: string, _lang: string): Syllable[] {
    const words = ipa.split(/\s+/).filter(Boolean);
    const syllables: Syllable[] = [];
    const vowelPattern = /[aeiouy\u00e0\u00e2\u00e6\u00e9\u00e8\u00ea\u00eb\u00ef\u00ee\u00f4\u0153\u00f9\u00fb\u00fc\u00ff\u00e1\u00ed\u00f3\u00fa\u00e3\u00f5\u025b\u0254\u0251\u026a\u028a\u028f\u0259\u0250]/i;

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

      syllables.push(...wordSyllables);
    }

    // Stress: last non-schwa syllable.
    for (let i = syllables.length - 1; i >= 0; i--) {
      if (syllables[i]!.nucleus !== '\u0259') {
        syllables[i]!.stressed = true;
        break;
      }
    }

    return syllables;
  }

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
