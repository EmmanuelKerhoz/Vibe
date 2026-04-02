/**
 * ALGO-GER — Germanic languages strategy.
 * docs_fusion_optimal.md §10.2 / Annexe 2 §4.
 *
 * Covers: EN, DE, NL, SV, DA, NO.
 * Key traits: irregular orthography (EN), vowel length (DE), Auslautverhärtung.
 */

import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable } from '../core/types';

// ─── Germanic MOP onset table ────────────────────────────────────────────────

/**
 * Legal 3-consonant onsets shared across EN/DE/NL/SV/DA/NO.
 * Ordered before 2-char table so the greedy scan prefers the longest match.
 */
const LEGAL_ONSETS_3 = new Set([
  'str', 'spr', 'spl', 'scr', 'shr', 'thr',
]);

/**
 * Legal 2-consonant onsets for Germanic languages.
 * Covers EN obstruent+liquid, EN/DE fricative+stop clusters, digraphs.
 */
const LEGAL_ONSETS_2 = new Set([
  // Obstruent + liquid
  'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'tr',
  // Fricative + stop / nasal / liquid
  'sp', 'st', 'sk', 'sc', 'sn', 'sm', 'sl', 'sw',
  // Digraphs (treated as single onset unit)
  'th', 'sh', 'ch', 'wh', 'ph',
  // English-specific
  'kn', 'wr', 'dw', 'tw',
  // German-specific
  'kw', 'pf', 'ts', 'tz',
  // Shared
  'gn',
]);

/**
 * Split a pre-vowel consonant cluster using the Maximum Onset Principle
 * for Germanic languages.
 *
 * Scan from right:
 *   1. Try len=3 suffix against LEGAL_ONSETS_3.
 *   2. Try len=2 suffix against LEGAL_ONSETS_2.
 *   3. Single last consonant as onset (always legal), rest is coda.
 *
 * Examples:
 *   "nt"  → onset="t",   prevCoda="n"   (winter → win.ter)
 *   "ndr" → onset="dr",  prevCoda="n"   (children → chil.dren)
 *   "str" → onset="str", prevCoda=""    (destroy → de.stroy)
 *   "mpl" → onset="pl",  prevCoda="m"   (simple → sim.ple)
 *   "ck"  → onset="k",   prevCoda="c"   (lucky → luc.ky)
 *   "ng"  → onset="g",   prevCoda="n"   — intentional: -ng cluster in EN
 *                                          keeps n in coda for rime purposes
 */
function gerMopSplit(cluster: string): [onset: string, prevCoda: string] {
  const len = cluster.length;
  if (len === 0) return ['', ''];
  if (len === 1) return [cluster, ''];

  // Try 3-char onset
  if (len >= 3) {
    const c3 = cluster.slice(len - 3);
    if (LEGAL_ONSETS_3.has(c3)) {
      return [c3, cluster.slice(0, len - 3)];
    }
  }

  // Try 2-char onset
  const c2 = cluster.slice(len - 2);
  if (LEGAL_ONSETS_2.has(c2)) {
    return [c2, cluster.slice(0, len - 2)];
  }

  // Single last consonant as onset
  return [cluster.slice(-1), cluster.slice(0, -1)];
}

// ─── Strategy ────────────────────────────────────────────────────────────────

export class GermanicStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-GER' as const;

  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 0.0,
    weight: 0.0,
    codaClass: 0.6,
    threshold: 0.75,
  };

  normalize(text: string, lang: string): string {
    let t = text.normalize('NFC').toLowerCase().trim();
    if (lang === 'en') {
      t = t.replace(/n't/g, ' not').replace(/'re/g, ' are').replace(/'s/g, ' is');
    }
    t = t.replace(/[^\p{L}\p{M}\s''-]/gu, '');
    return t;
  }

  g2p(normalized: string, _lang: string): string {
    // Stub: G2P not yet implemented — grapheme-only analysis.
    // TODO: delegate to CMU dict / eSpeak-NG and handle EN irregular spelling,
    // DE vowel length + Auslautverhärtung, and NL/Scandinavian specifics.
    // Consequence: rhyme detection is orthographic, not phonological.
    return normalized;
  }

  /**
   * MOP-based syllabification for Germanic languages.
   *
   * Pass 1: collect (onset, nucleus) pairs.
   *   When a vowel is encountered, the consonant cluster since the last vowel
   *   is split by gerMopSplit():
   *     • coda  → appended to the previous syllable
   *     • onset → used for the new syllable
   * Pass 2: trailing consonants after the last vowel → coda of last syllable.
   * Pass 3: stress assignment (EN heuristic or DE/NL/SV penultimate).
   */
  syllabify(ipa: string, lang: string): Syllable[] {
    const words = ipa.split(/\s+/).filter(Boolean);
    const syllables: Syllable[] = [];
    const vowelPattern = /[aeiouyæɛɪɒɔʊʌəɜɑ]/i;

    for (const word of words) {
      const wordSyllables: Syllable[] = [];
      let cluster = ''; // consonants accumulated since the last vowel

      for (const ch of word) {
        if (!vowelPattern.test(ch)) {
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
          // Split the inter-vocalic cluster with MOP.
          const [onset, coda] = gerMopSplit(cluster);
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

      // Trailing consonants → coda of last syllable.
      if (cluster && wordSyllables.length > 0) {
        wordSyllables[wordSyllables.length - 1]!.coda += cluster;
      }

      if (wordSyllables.length > 0) {
        if (lang === 'en') {
          applyEnglishStress(word, wordSyllables);
        } else {
          // DE/NL/SV/DA/NO: penultimate default
          const stressIdx = Math.max(0, wordSyllables.length - 2);
          wordSyllables[stressIdx]!.stressed = true;
        }
      }

      syllables.push(...wordSyllables);
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
      // G2P is a stub — analysis is graphemic only; flag consumers.
      lowResourceFallback: true,
    };
  }

  score(rn1: RhymeNucleus, rn2: RhymeNucleus, weights?: Partial<MatchingWeights>): number {
    return featureWeightedScore(rn1, rn2, { ...this.defaultWeights, ...weights });
  }
}

// ─── English stress heuristic ─────────────────────────────────────────────────

/**
 * Suffix-based English stress placement.
 * Covers ~80% of common cases without a CMU dict lookup.
 *
 * Rules (highest to lowest priority):
 * 1. Monosyllabic word: stress index 0.
 * 2. Antepenultimate suffixes: -tion, -sion, -ic, -ical, -ity, -ify, -ious, -eous, -ual
 *    → stress on syllable before suffix (antepenult).
 * 3. Penultimate suffixes: -ness, -less, -ful, -ment, -er, -est, -ing, -ed, -ly,
 *    -y, -ow, -le
 *    → stress on penultimate.
 *    Rationale for additions:
 *      -y   : "happy", "lucky", "pretty", "hungry" — all penultimate
 *      -ow  : "follow", "borrow", "hollow", "narrow" — all penultimate
 *      -le  : "little", "simple", "table", "circle" — all penultimate
 * 4. Default: penultimate (paroxyton dominant en anglais dissyllabique).
 *    Rationale: the penult carries stress in the large majority of English
 *    polysyllabic words not covered by rules 2–3 (lesson, burden, open,
 *    current, river, center…). True oxytones (guitar, believe, around)
 *    are less numerous and will be correctly handled once a CMU dict G2P
 *    replaces this heuristic. Defaulting to ultima caused systematic
 *    mis-anchoring of the rhyme nucleus on common bisyllabic words.
 */
function applyEnglishStress(word: string, syllables: Syllable[]): void {
  const n = syllables.length;
  if (n === 0) return;
  if (n === 1) { syllables[0]!.stressed = true; return; }

  const w = word.toLowerCase();

  // Antepenultimate suffixes
  if (/(?:tion|sion|ic|ical|ity|ify|ious|eous|ual)$/.test(w)) {
    const idx = Math.max(0, n - 3);
    syllables[idx]!.stressed = true;
    return;
  }

  // Penultimate suffixes (extended)
  if (/(?:ness|less|ful|ment|ing|ed|est|er|ly|[^aeiou]y|ow|le)$/.test(w)) {
    const idx = Math.max(0, n - 2);
    syllables[idx]!.stressed = true;
    return;
  }

  // Default: penultimate (paroxyton dominant — see JSDoc above).
  const idx = Math.max(0, n - 2);
  syllables[idx]!.stressed = true;
}

function classifyCoda(coda: string): 'nasal' | 'liquid' | 'obstruent' | null {
  if (!coda) return null;
  if (/[mnŋ]/.test(coda)) return 'nasal';
  if (/[lrɾɹ]/.test(coda)) return 'liquid';
  return 'obstruent';
}
