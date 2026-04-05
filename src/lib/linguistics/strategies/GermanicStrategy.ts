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
 *
 * Note: 'gn' is a legal onset in DE/NL/FR but NOT in EN (sign, gnome — the g
 * is always silent word-initially in EN). It is intentionally absent here;
 * EN silent grapheme stripping is handled by silentCodaStrip() instead.
 */
const LEGAL_ONSETS_2 = new Set([
  // Obstruent + liquid
  'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'tr',
  // Fricative + stop / nasal / liquid
  'sp', 'st', 'sk', 'sc', 'sn', 'sm', 'sl', 'sw',
  // Digraphs (treated as single onset unit)
  'th', 'sh', 'ch', 'wh', 'ph',
  // English-specific (kn/wr are silent-g/w in onset — handled orthographically)
  'kn', 'wr', 'dw', 'tw',
  // German/Dutch-specific
  'kw', 'pf', 'ts', 'tz', 'gn',
  // Shared
]);

/**
 * EN-only silent coda graphemes.
 *
 * These sequences appear in the final coda of English words where one or more
 * graphemes are historically present but phonologically silent. Stripping them
 * before coda classification ensures that, e.g., 'sign' and 'wine' produce
 * the same codaClass (null / no coda), and 'knight'/'night' match correctly.
 *
 * Each entry maps the orthographic coda suffix → the phonological coda remnant.
 * Order matters: longer patterns must come first.
 *
 * Examples:
 *   sign  → coda "gn" → strip "g" → remnant "n"  → nasal
 *   knife → coda "" (onset kn) — handled by MOP, not here
 *   lamb  → coda "mb" → strip "b" → remnant "m"  → nasal
 *   debt  → coda "bt" → strip "b" → remnant "t"  → obstruent
 *   night → coda "ght" → strip "gh" → remnant "t" → obstruent
 *   damn  → coda "mn" → strip "n" → remnant "m"  → nasal
 */
const EN_SILENT_CODA_MAP: [pattern: RegExp, replacement: string][] = [
  [/ght$/, 't'],   // night, light, fight, bought
  [/gn$/,  'n'],   // sign, align, design, foreign
  [/kn$/,  'n'],   // (rare in coda, e.g. 'blacken' edge case)
  [/mb$/,  'm'],   // lamb, bomb, thumb, dumb
  [/mn$/,  'm'],   // damn, hymn, autumn
  [/bt$/,  't'],   // debt, doubt, subtle
  [/gh$/,  ''],    // high, sigh, through (trailing gh — no remnant)
];

/**
 * Strip EN silent graphemes from a coda string.
 * Only applied when lang === 'en'.
 */
function silentCodaStrip(coda: string, lang: string): string {
  if (lang !== 'en') return coda;
  for (const [pattern, replacement] of EN_SILENT_CODA_MAP) {
    if (pattern.test(coda)) {
      return coda.replace(pattern, replacement);
    }
  }
  return coda;
}

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

// ─── EN vowel digraphs ──────────────────────────────────────────────────────

/**
 * Common English vowel digraphs where two adjacent graphemic vowels
 * represent a single phonological vowel / diphthong.  Used by
 * syllabify() to keep these pairs in one syllable rather than
 * splitting them across two.
 *
 * Conservative list — excludes sequences that are often hiatus
 * in English (io, ia, ua, uo, ie, ei, ue …).
 */
const EN_VOWEL_DIGRAPHS = new Set([
  'ou', 'oo', 'ee', 'ea', 'ai', 'oa', 'oi', 'au', 'oy', 'ay', 'ey',
]);

/**
 * English verbal contractions to expand during normalisation.
 *
 * IMPORTANT — possessive 's (John's, Mary's) is intentionally excluded:
 * expanding it to "is" would alter the syllable count and rhyme nucleus of
 * the host word, causing systematic mis-anchoring. Only unambiguously verbal
 * contractions are expanded here. The possessive apostrophe is stripped by
 * the general punctuation filter that follows.
 */
const EN_VERBAL_CONTRACTIONS: [pattern: RegExp, replacement: string][] = [
  [/n't/g, ' not'],
  [/'re/g,  ' are'],
  [/'ve/g,  ' have'],
  [/'ll/g,  ' will'],
  [/'d/g,   ' would'],
  [/'m/g,   ' am'],
];

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
      // Expand verbal contractions only — possessive 's is excluded
      // to avoid "John's" → "John is" (syllable distortion).
      for (const [pattern, replacement] of EN_VERBAL_CONTRACTIONS) {
        t = t.replace(pattern, replacement);
      }
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
        } else if (
          lang === 'en' &&
          cluster === '' &&
          wordSyllables.length > 0 &&
          EN_VOWEL_DIGRAPHS.has(
            wordSyllables[wordSyllables.length - 1]!.nucleus + ch,
          )
        ) {
          // EN vowel digraph: adjacent vowels forming a single phonological
          // unit (ou, oo, ea …). Merge into the current syllable's nucleus
          // rather than creating a new syllable.
          wordSyllables[wordSyllables.length - 1]!.nucleus += ch;
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

      // EN: collapse silent final 'e'.
      // English words like "wine", "make", "take" end in a silent 'e' that
      // the orthographic stub incorrectly syllabifies as a separate vowel.
      // Move the onset consonants of the phantom syllable back to the
      // previous syllable's coda and drop the final syllable.
      if (lang === 'en' && wordSyllables.length >= 2) {
        const last = wordSyllables[wordSyllables.length - 1]!;
        if (last.nucleus === 'e' && last.coda === '') {
          wordSyllables[wordSyllables.length - 2]!.coda += last.onset;
          wordSyllables.pop();
        }
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

  extractRN(syllables: Syllable[], lang: string): RhymeNucleus {
    const stressIdx = syllables.findIndex(s => s.stressed);
    const idx = stressIdx >= 0 ? stressIdx : Math.max(0, syllables.length - 1);
    const tail = syllables.slice(idx);
    const primary = tail[0];

    // Strip EN silent graphemes from the primary coda before classification.
    const rawCoda = primary?.coda ?? '';
    const phonCoda = silentCodaStrip(rawCoda, lang);

    // Rebuild raw from phonological coda (not orthographic).
    const raw = tail.map((s, i) => {
      const c = i === 0 ? phonCoda : silentCodaStrip(s.coda, lang);
      return `${s.nucleus}${c}`;
    }).join('');

    return {
      nucleus: primary?.nucleus ?? '',
      coda: phonCoda,
      toneClass: null,
      weight: null,
      codaClass: classifyCoda(phonCoda),
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
