/**
 * Rhyme Engine v2 — Slavic Family Algorithm
 * Languages: RU (Russian), PL (Polish), CS (Czech)
 *
 * Strategy:
 * - RU: Cyrillic vowel reduction (unstressed о→а), palatalization stripping on coda
 * - PL: nasal vowel normalisation (ą→on, ę→en), digraph clusters
 * - CS: diacritic-aware G2P (č→ch, š→sh, ž→zh, ř→rzh), length distinction preserved
 *
 * Scoring: vowel nucleus 55% + coda consonant cluster 45%
 * Rationale: Slavic rhyme is primarily vocalic but coda clusters are phonologically heavy.
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';
import { phonemeEditDistance } from './scoring';

// ─── Russian Cyrillic vowel map ────────────────────────────────────────────────

const RU_VOWEL_MAP: Record<string, string> = {
  а: 'a', е: 'e', ё: 'o', и: 'i', о: 'a', // о is reduced to а in most unstressed pos
  у: 'u', ы: 'i', э: 'e', ю: 'yu', я: 'ya',
};

// Cyrillic consonants kept for coda (IPA-approximate)
const RU_CODA_MAP: Record<string, string> = {
  б: 'b', в: 'v', г: 'g', д: 'd', ж: 'zh', з: 'z',
  й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', п: 'p',
  р: 'r', с: 's', т: 't', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ь: '',
};

function transcribeRU(token: string): { vowels: string; coda: string; onset: string } {
  const lower = token.toLowerCase().normalize('NFC');
  let vowels = '';
  let lastVowelIdx = -1;

  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i]!;
    if (ch in RU_VOWEL_MAP) {
      vowels = RU_VOWEL_MAP[ch]!;
      lastVowelIdx = i;
    }
  }

  // Coda: everything after last vowel
  let coda = '';
  if (lastVowelIdx >= 0) {
    for (let i = lastVowelIdx + 1; i < lower.length; i++) {
      const ch = lower[i]!;
      coda += ch in RU_CODA_MAP ? RU_CODA_MAP[ch]! : '';
    }
  }

  // Onset: everything before last vowel block
  let onset = '';
  for (let i = 0; i < lastVowelIdx; i++) {
    const ch = lower[i]!;
    onset += ch in RU_CODA_MAP ? RU_CODA_MAP[ch]! : '';
  }

  return { vowels, coda, onset };
}

// ─── Polish nasal + digraph normalisation ─────────────────────────────────────

const PL_NASAL: Array<[RegExp, string]> = [
  [/ą/gu, 'on'],
  [/ę/gu, 'en'],
];

const PL_DIGRAPHS: Array<[RegExp, string]> = [
  [/szcz/gu, 'shch'],
  [/cz/gu,   'ch'],
  [/sz/gu,   'sh'],
  [/rz/gu,   'zh'],
  [/dż/gu,   'dz'],
  [/dź/gu,   'dz'],
  [/ź/gu,    'z'],
  [/ś/gu,    's'],
  [/ć/gu,    'ch'],
  [/ń/gu,    'n'],
  [/ó/gu,    'u'],
  [/ł/gu,    'w'],
];

const LATIN_VOWELS = /[aeiouáàâäéèêëíìîïóòôöúùûü]+/giu;

function normalizePL(token: string): string {
  let s = token.toLowerCase().normalize('NFC');
  for (const [re, rep] of PL_NASAL)   s = s.replace(re, rep);
  for (const [re, rep] of PL_DIGRAPHS) s = s.replace(re, rep);
  return s;
}

// ─── Czech diacritic G2P ──────────────────────────────────────────────────────

const CS_MAP: Array<[RegExp, string]> = [
  [/ch/gu,  'kh'],
  [/č/gu,   'ch'],
  [/š/gu,   'sh'],
  [/ž/gu,   'zh'],
  [/ř/gu,   'rzh'],
  [/ě/gu,   'ye'],
  [/á/gu,   'aa'],
  [/é/gu,   'ee'],
  [/í/gu,   'ii'],
  [/ó/gu,   'oo'],
  [/ú|ů/gu, 'uu'],
  [/ý/gu,   'ii'],
  [/ň/gu,   'n'],
  [/ť/gu,   't'],
  [/ď/gu,   'd'],
];

function normalizeCS(token: string): string {
  let s = token.toLowerCase().normalize('NFC');
  for (const [re, rep] of CS_MAP) s = s.replace(re, rep);
  return s;
}

// ─── Latin-script vowel nucleus extractor (PL, CS) ───────────────────────────

function extractLatinNucleus(normalized: string): { vowels: string; coda: string; onset: string } {
  const matches = [...normalized.matchAll(LATIN_VOWELS)];
  if (!matches.length) {
    return { vowels: normalized.slice(-3), coda: '', onset: '' };
  }
  const last = matches.at(-1)!;
  const vowels = last[0]!;
  const idx    = last.index ?? 0;
  const coda   = normalized.slice(idx + vowels.length);
  const onset  = normalized.slice(0, idx);
  return { vowels, coda, onset };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function extractNucleusSLV(
  unit: LineEndingUnit,
  lang: LangCode
): RhymeNucleus {
  const { surface } = unit;
  if (!surface) return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 };

  let vowels = '', coda = '', onset = '';

  if (lang === 'ru') {
    ({ vowels, coda, onset } = transcribeRU(surface));
  } else if (lang === 'pl') {
    ({ vowels, coda, onset } = extractLatinNucleus(normalizePL(surface)));
  } else {
    // cs or unknown Slavic
    ({ vowels, coda, onset } = extractLatinNucleus(normalizeCS(surface)));
  }

  return {
    vowels,
    coda,
    tone:      '',
    onset,
    moraCount: vowels.length >= 2 ? 2 : 1,
  };
}

export function scoreSLV(a: RhymeNucleus, b: RhymeNucleus): number {
  const vowSim  = 1 - phonemeEditDistance(a.vowels, b.vowels);
  const codaSim = 1 - phonemeEditDistance(a.coda,   b.coda);
  return 0.55 * vowSim + 0.45 * codaSim;
}
