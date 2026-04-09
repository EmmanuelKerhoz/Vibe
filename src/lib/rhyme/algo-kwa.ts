/**
 * Rhyme Engine v2 — KWA Family Algorithm
 * Languages: BA (Baoulé), DI (Dioula), EW (Ewe), MI (Mina)
 * Strategy: G2P tonal rules + CV-greedy syllabification + binary HL nucleus
 */

import type { LineEndingUnit, RhymeNucleus } from './types';

// ─── Tonal diacritic → tone class ────────────────────────────────────────────

// Maps combining diacritics and precomposed chars to H/L tone labels
const TONE_MAP: Array<[RegExp, string]> = [
  // Combining acute  → High
  [/[\u0301\u02B9]/u,   'H'],
  // Combining grave   → Low
  [/[\u0300\u02BA]/u,   'L'],
  // Combining macron  → Mid (treated as H for binary HL)
  [/[\u0304]/u,         'H'],
  // Combining caron   → Rising (treated as L for binary HL)
  [/[\u030C]/u,         'L'],
  // Precomposed é ê ó → High
  [/[éêóôàèáâ]/u,       'H'],
];

function extractTone(syllable: string): string {
  const nfd = syllable.normalize('NFD');
  for (const [re, tone] of TONE_MAP) {
    if (re.test(nfd)) return tone;
  }
  return 'M'; // default mid
}

// ─── Vowel normalization (strip tone diacritics) ─────────────────────────────

const COMBINING_DIACRITICS = /[\u0300-\u036F]/gu;

function stripToneDiacritics(s: string): string {
  return s.normalize('NFD').replace(COMBINING_DIACRITICS, '').normalize('NFC');
}

// ─── KWA vowels and consonant lists ──────────────────────────────────────────

// Core KWA vowels (including nasals)
const KWA_VOWELS = new Set(['a', 'e', 'ɛ', 'i', 'o', 'ɔ', 'u', 'ʊ', 'ə',
                             'ã', 'ẽ', 'ĩ', 'õ', 'ũ']);

function isVowel(c: string): boolean {
  return KWA_VOWELS.has(c.toLowerCase()) || /[aeiouáàâéèêíìîóòôúùû]/iu.test(c);
}

// ─── CV-greedy syllabification ───────────────────────────────────────────────

/**
 * Greedy CV syllabification: consume consonant clusters then vowel nucleus.
 * Returns the last syllable of the token.
 */
function getLastSyllable(token: string): { onset: string; nucleus: string; coda: string } {
  const stripped = stripToneDiacritics(token.toLowerCase());
  const chars = [...stripped];

  // Build syllable list greedily
  const syllables: Array<{ onset: string; nucleus: string; coda: string }> = [];
  let i = 0;

  while (i < chars.length) {
    // Onset: consume consonants
    let onset = '';
    while (i < chars.length && !isVowel(chars[i])) {
      onset += chars[i++];
    }

    // Nucleus: consume vowels
    let nucleus = '';
    while (i < chars.length && isVowel(chars[i])) {
      nucleus += chars[i++];
    }

    // Coda: consume consonants until next vowel or end
    let coda = '';
    while (i < chars.length && !isVowel(chars[i])) {
      // Peek: if next consonant is followed by vowel, it's the next onset
      if (i + 1 < chars.length && isVowel(chars[i + 1])) break;
      coda += chars[i++];
    }

    if (nucleus) {
      syllables.push({ onset, nucleus, coda });
    } else if (onset) {
      // Stray consonant cluster — absorb into previous coda or create minimal syllable
      if (syllables.length) {
        syllables[syllables.length - 1].coda += onset;
      } else {
        syllables.push({ onset: '', nucleus: onset, coda: '' });
      }
    }
  }

  return syllables.at(-1) ?? { onset: '', nucleus: stripped, coda: '' };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function extractNucleusKWA(unit: LineEndingUnit): RhymeNucleus {
  const { surface } = unit;
  const tone  = extractTone(surface);
  const syl   = getLastSyllable(surface);

  return {
    vowels:     syl.nucleus,
    coda:       syl.coda,
    tone,
    onset:      syl.onset,
    moraCount:  syl.nucleus.length >= 2 ? 2 : 1,
  };
}
