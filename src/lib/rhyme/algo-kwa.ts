/**
 * Rhyme Engine v2 — KWA Family Algorithm
 * Languages: BA (Baoulé), DI (Dioula), EW (Ewe), MI (Mina)
 */

import type { LineEndingUnit, RhymeNucleus } from './types';

const TONE_MAP: Array<[RegExp, string]> = [
  [/[\u0301\u02B9]/u,   'H'],
  [/[\u0300\u02BA]/u,   'L'],
  [/[\u0304]/u,         'H'],
  [/[\u030C]/u,         'L'],
  [/[éêóôàèáâ]/u,       'H'],
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

const KWA_VOWEL_SET = new Set(['a','e','ɛ','i','o','ɔ','u','ʊ','ə',
                               'ã','ẽ','ĩ','õ','ũ']);

function isVowel(c: string): boolean {
  return KWA_VOWEL_SET.has(c.toLowerCase())
    || /[aeiouáàâéèêíìîóòôúùû]/iu.test(c);
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

export function extractNucleusKWA(unit: LineEndingUnit): RhymeNucleus {
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
