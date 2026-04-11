/**
 * Rhyme Engine v2 — KWA Family Algorithm
 * Languages: BA (Baoulé), DI (Dioula), EW (Ewe), MI (Mina)
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';

const TONE_MAP: Array<[RegExp, string]> = [
  [/[\u0301\u02B9]/u,   'H'],
  [/[\u0300\u02BA]/u,   'L'],
  [/[\u0304]/u,         'H'],
  [/[\u030C]/u,         'L'],
  [/[\u0302]/u,         'F'],
  [/[\u0308]/u,         'F'],
  [/[\u00e9\u00ea\u00f3\u00f4\u00e0\u00e8\u00e1\u00e2]/u, 'H'],
];

function extractTone(syllable: string): string {
  const nfd = syllable.normalize('NFD');
  for (const [re, tone] of TONE_MAP) {
    if (re.test(nfd)) return tone;
  }
  return 'M';
}

const COMBINING_DIACRITICS = /[\u0300-\u036F]/gu;

function stripToneDiacritics(s: string): string {
  return s.normalize('NFD').replace(COMBINING_DIACRITICS, '').normalize('NFC');
}

const KWA_VOWEL_SET = new Set(['a','e','\u025b','i','o','\u0254','u','\u028a','\u0259',
                               '\u00e3','\u1ebd','\u0129','\u00f5','\u0169']);

function isVowel(c: string): boolean {
  return KWA_VOWEL_SET.has(c.toLowerCase())
    || /[aeiou\u00e1\u00e0\u00e2\u00e9\u00e8\u00ea\u00ed\u00ec\u00ee\u00f3\u00f2\u00f4\u00fa\u00f9\u00fb]/iu.test(c);
}

interface Syllable { onset: string; nucleus: string; coda: string; }

function getLastSyllable(token: string): Syllable {
  const stripped = stripToneDiacritics(token.toLowerCase());
  const chars = [...stripped];
  const syllables: Syllable[] = [];
  let i = 0;

  while (i < chars.length) {
    let onset = '';
    while (i < chars.length && !isVowel(chars[i] ?? '')) {
      onset += chars[i++] ?? '';
    }

    let nucleus = '';
    while (i < chars.length && isVowel(chars[i] ?? '')) {
      nucleus += chars[i++] ?? '';
    }

    let coda = '';
    while (i < chars.length && !isVowel(chars[i] ?? '')) {
      const next = chars[i + 1];
      if (next !== undefined && isVowel(next)) break;
      coda += chars[i++] ?? '';
    }

    if (nucleus) {
      syllables.push({ onset, nucleus, coda });
    } else if (onset) {
      const last = syllables[syllables.length - 1];
      if (last) {
        last.coda += onset;
      } else {
        syllables.push({ onset: '', nucleus: onset, coda: '' });
      }
    }
  }

  return syllables[syllables.length - 1]
    ?? { onset: '', nucleus: stripped, coda: '' };
}

export function extractNucleusKWA(
  unit: LineEndingUnit,
  _lang?: LangCode
): RhymeNucleus {
  const { surface } = unit;
  const tone = extractTone(surface);
  const syl  = getLastSyllable(surface);
  return {
    vowels:    syl.nucleus,
    coda:      syl.coda,
    tone,
    onset:     syl.onset,
    moraCount: syl.nucleus.length >= 2 ? 2 : 1,
  };
}

/**
 * KWA score: tone-sensitive (Kwa languages are lexically tonal).
 * tone 30% + vowel nucleus 50% + coda 20%.
 * Falling tone (F) is compatible with either H or L for partial credit.
 */
export function scoreKWA(
  a: RhymeNucleus,
  b: RhymeNucleus,
  _lang?: LangCode
): number {
  // Tonal similarity
  let tSim: number;
  if (a.tone === b.tone) {
    tSim = 1.0;
  } else if (a.tone === 'F' || b.tone === 'F') {
    tSim = 0.5; // falling tone partially compatible
  } else if (a.tone === 'M' || b.tone === 'M') {
    tSim = 0.4; // unmarked: uncertain
  } else {
    tSim = 0.0; // H vs L: tonal mismatch
  }

  // Vowel similarity (partial credit for shared chars)
  const vSim = vowelSimilarity(a.vowels, b.vowels);

  // Coda similarity
  const cSim = a.coda === b.coda ? 1.0
    : a.coda && b.coda && a.coda[0] === b.coda[0] ? 0.5
    : 0.0;

  return 0.3 * tSim + 0.5 * vSim + 0.2 * cSim;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Simple vowel similarity: exact > shared prefix/suffix > length-based fallback */
function vowelSimilarity(a: string, b: string): number {
  if (!a && !b) return 1.0;
  if (!a || !b) return 0.0;
  if (a === b) return 1.0;
  // Shared final vowel (most important for rhyme)
  if (a.at(-1) === b.at(-1)) return 0.8;
  // Shared first vowel
  if (a[0] === b[0]) return 0.4;
  return 0.0;
}
