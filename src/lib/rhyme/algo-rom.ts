/**
 * Rhyme Engine v2 — Romance Family Algorithm
 * Languages: FR, ES, IT, PT
 * Strategy: rule-based G2P + silent-e handling + mute final consonants (FR)
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';

// ─── French mute final consonants ────────────────────────────────────────────

// In French, these word-final consonants are typically silent
const FR_MUTE_FINALS = /[bcdghlpqrst]+$/i;

// French e muet (schwa) — word-final silent e (masculine/feminine rhyme parity)
const FR_SILENT_E = /e$/i;

// ─── Vowel extraction (language-aware) ───────────────────────────────────────

const VOWEL_RE = /[aeiouáàâäéèêëíìîïóòôöúùûüýÿæœ]+/giu;

function extractVowelNucleus(token: string, lang: LangCode): string {
  let normalized = token.toLowerCase().normalize('NFC');

  if (lang === 'fr') {
    // Strip silent final consonants and e muet before vowel extraction
    normalized = normalized.replace(FR_MUTE_FINALS, '');
    normalized = normalized.replace(FR_SILENT_E, '');
  }

  // Find the last vowel cluster = the rhyming nucleus
  const matches = normalized.match(VOWEL_RE);
  if (!matches) return normalized.slice(-3); // graphemic fallback
  return matches.at(-1) ?? '';
}

// ─── Coda extraction ─────────────────────────────────────────────────────────

function extractCoda(token: string, lang: LangCode): string {
  let normalized = token.toLowerCase().normalize('NFC');

  if (lang === 'fr') {
    normalized = normalized.replace(FR_MUTE_FINALS, '');
    normalized = normalized.replace(FR_SILENT_E, '');
  }

  // After last vowel cluster, take remaining consonants
  const lastVowelMatch = [...normalized.matchAll(VOWEL_RE)].at(-1);
  if (!lastVowelMatch || lastVowelMatch.index === undefined) return '';
  return normalized.slice(lastVowelMatch.index + lastVowelMatch[0].length);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function extractNucleusROM(
  unit: LineEndingUnit,
  lang: LangCode
): RhymeNucleus {
  const { surface } = unit;

  if (!surface) {
    return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 };
  }

  const vowels = extractVowelNucleus(surface, lang);
  const coda   = extractCoda(surface, lang);

  // Onset: everything before the last vowel cluster
  const lastVowelMatch = [...surface.toLowerCase().matchAll(VOWEL_RE)].at(-1);
  const onset = lastVowelMatch?.index !== undefined
    ? surface.slice(0, lastVowelMatch.index).toLowerCase()
    : '';

  return {
    vowels,
    coda,
    tone:      '',
    onset,
    moraCount: vowels.length >= 2 ? 2 : 1,
  };
}
