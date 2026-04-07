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
 */
const EN_SILENT_CODA_MAP: [pattern: RegExp, replacement: string][] = [
  [/ght$/, 't'],   // night, light, fight, bought
  [/gn$/,  'n'],   // sign, align, design, foreign
  [/kn$/,  'n'],   // (rare in coda)
  [/mb$/,  'm'],   // lamb, bomb, thumb, dumb
  [/mn$/,  'm'],   // damn, hymn, autumn
  [/bt$/,  't'],   // debt, doubt, subtle
  [/gh$/,  ''],    // high, sigh, through
];

function silentCodaStrip(coda: string, lang: string): string {
  if (lang !== 'en') return coda;
  for (const [pattern, replacement] of EN_SILENT_CODA_MAP) {
    if (pattern.test(coda)) {
      return coda.replace(pattern, replacement);
    }
  }
  return coda;
}

function gerMopSplit(cluster: string): [onset: string, prevCoda: string] {
  const len = cluster.length;
  if (len === 0) return ['', ''];
  if (len === 1) return [cluster, ''];

  if (len >= 3) {
    const c3 = cluster.slice(len - 3);
    if (LEGAL_ONSETS_3.has(c3)) {
      return [c3, cluster.slice(0, len - 3)];
    }
  }

  const c2 = cluster.slice(len - 2);
  if (LEGAL_ONSETS_2.has(c2)) {
    return [c2, cluster.slice(0, len - 2)];
  }

  return [cluster.slice(-1), cluster.slice(0, -1)];
}

const EN_VOWEL_DIGRAPHS = new Set([
  'ou', 'oo', 'ee', 'ea', 'ai', 'oa', 'oi', 'au', 'oy', 'ay', 'ey',
]);

const EN_VERBAL_CONTRACTIONS: [pattern: RegExp, replacement: string][] = [
  [/n't/g, ' not'],
  [/'re/g,  ' are'],
  [/'ve/g,  ' have'],
  [/'ll/g,  ' will'],
  [/'d/g,   ' would'],
  [/'m/g,   ' am'],
];

// ─── EN oxytone dictionary ───────────────────────────────────────────────────

/**
 * Mini stress dictionary for English words that are oxytone (final-syllable
 * stress) and are frequent in song lyrics.
 *
 * The suffix-based heuristic in applyEnglishStress() defaults to penultimate
 * stress, which is correct for most English polysyllabic words. However,
 * oxytones are common in lyrical vocabulary (verbs, prepositions, contractions)
 * and cause systematic mis-anchoring of the rhyme nucleus when undetected.
 *
 * This dictionary is intentionally small (~60 entries). It covers the words
 * most likely to appear at line-end in popular-music lyrics.
 * It will be superseded once a CMU dict G2P replaces the orthographic stub.
 *
 * Format: lowercased orthographic form → 0-based index of stressed syllable
 * (counted from the start, not from the end).
 */
const EN_OXYTONE_DICT: Record<string, number> = {
  // 2-syllable oxytones (stress on syllable 1 = last)
  guitar: 1, believe: 1, tonight: 1, desire: 1, before: 1, alone: 1,
  above: 1, again: 1, around: 1, inside: 1, outside: 1, without: 1,
  within: 1, beyond: 1, between: 1, beneath: 1, behind: 1, beside: 1,
  because: 1, become: 1, began: 1, begin: 1, belong: 1, below: 1,
  away: 1, alive: 1, afraid: 1, ahead: 1, apart: 1, arise: 1,
  reply: 1, deny: 1, apply: 1, comply: 1, imply: 1, rely: 1, supply: 1,
  define: 1, divine: 1, online: 1, refine: 1, decline: 1, combine: 1,
  control: 1, console: 1, patrol: 1, enroll: 1,
  // 3-syllable oxytones (stress on syllable 2 = last)
  understand: 2, entertain: 2, overcome: 2, disappear: 2, intervene: 2,
  volunteer: 2, engineer: 2, guarantee: 2,
};

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
    return normalized;
  }

  syllabify(ipa: string, lang: string): Syllable[] {
    const words = ipa.split(/\s+/).filter(Boolean);
    const syllables: Syllable[] = [];
    const vowelPattern = /[aeiouyæɛɪɒɔʊʌəɜɑ]/i;

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
        } else if (
          lang === 'en' &&
          cluster === '' &&
          wordSyllables.length > 0 &&
          EN_VOWEL_DIGRAPHS.has(
            wordSyllables[wordSyllables.length - 1]!.nucleus + ch,
          )
        ) {
          wordSyllables[wordSyllables.length - 1]!.nucleus += ch;
        } else {
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

      if (cluster && wordSyllables.length > 0) {
        wordSyllables[wordSyllables.length - 1]!.coda += cluster;
      }

      // EN: collapse silent final 'e'.
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

    const rawCoda = primary?.coda ?? '';
    const phonCoda = silentCodaStrip(rawCoda, lang);

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
      lowResourceFallback: true,
    };
  }

  score(rn1: RhymeNucleus, rn2: RhymeNucleus, weights?: Partial<MatchingWeights>): number {
    return featureWeightedScore(rn1, rn2, { ...this.defaultWeights, ...weights });
  }
}

// ─── English stress heuristic ─────────────────────────────────────────────────

/**
 * Suffix-based English stress placement with oxytone dictionary override.
 *
 * Priority order (highest to lowest):
 * 0. EN_OXYTONE_DICT lookup — explicit index for frequent lyrical oxytones.
 *    Checked first to override all heuristic rules below.
 * 1. Monosyllabic word: stress index 0.
 * 2. Antepenultimate suffixes: -tion, -sion, -ic, -ical, -ity, -ify, -ious,
 *    -eous, -ual → stress on syllable before suffix (antepenult).
 * 3. Penultimate suffixes: -ness, -less, -ful, -ment, -er, -est, -ing, -ed,
 *    -ly, -y, -ow, -le → stress on penultimate.
 * 4. Default: penultimate (paroxyton dominant for EN polysyllabic words).
 */
function applyEnglishStress(word: string, syllables: Syllable[]): void {
  const n = syllables.length;
  if (n === 0) return;
  if (n === 1) { syllables[0]!.stressed = true; return; }

  const w = word.toLowerCase();

  // 0. Oxytone dictionary override
  if (Object.prototype.hasOwnProperty.call(EN_OXYTONE_DICT, w)) {
    const dictIdx = EN_OXYTONE_DICT[w]!;
    const idx = Math.min(dictIdx, n - 1);
    syllables[idx]!.stressed = true;
    return;
  }

  // 1. Antepenultimate suffixes
  if (/(?:tion|sion|ic|ical|ity|ify|ious|eous|ual)$/.test(w)) {
    const idx = Math.max(0, n - 3);
    syllables[idx]!.stressed = true;
    return;
  }

  // 2. Penultimate suffixes
  if (/(?:ness|less|ful|ment|ing|ed|est|er|ly|[^aeiou]y|ow|le)$/.test(w)) {
    const idx = Math.max(0, n - 2);
    syllables[idx]!.stressed = true;
    return;
  }

  // 3. Default: penultimate
  const idx = Math.max(0, n - 2);
  syllables[idx]!.stressed = true;
}

function classifyCoda(coda: string): 'nasal' | 'liquid' | 'obstruent' | null {
  if (!coda) return null;
  if (/[mnŋ]/.test(coda)) return 'nasal';
  if (/[lrɾɹ]/.test(coda)) return 'liquid';
  return 'obstruent';
}
