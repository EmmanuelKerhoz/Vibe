/**
 * Rhyme Engine v2 — Creole / Pidgin Family Algorithm (CRE)
 * Languages: nou (Nouméa Creole), pcm (Nigerian Pidgin English), cfg (Cabo Verde Kriolu)
 *
 * Strategy:
 *  - ROM-derived G2P (creoles lexified on Romance/English bases)
 *  - Nasalization handling: final nasal vowels (ã, õ, ẽ, in, on, an → Ṽ)
 *  - Elision: schwa/final-e dropping (shared with FR)
 *  - PCM: simplify consonant clusters (nd→n, mb→m, ng→ŋ)
 *  - cfg: portuguese-style nasal digraphs (nh, lh)
 *  - Tone field always empty (creoles in scope are non-tonal)
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';

const VOWEL_RE = /[aeiouáàâäãéèêëẽíìîïóòôöõúùûüý]+/giu;

// Creole nasal vowel clusters → canonical nasal token
const NASAL_MAP: [RegExp, string][] = [
  [/an(?=[^aeiou]|$)/gi, 'ã'],
  [/on(?=[^aeiou]|$)/gi, 'õ'],
  [/en(?=[^aeiou]|$)/gi, 'ẽ'],
  [/in(?=[^aeiou]|$)/gi, 'ĩ'],
  [/un(?=[^aeiou]|$)/gi, 'ũ'],
];

// PCM consonant cluster simplification
const PCM_CLUSTERS: [RegExp, string][] = [
  [/nd/gi, 'n'],
  [/mb/gi, 'm'],
  [/ng(?=[aeiou])/gi, 'ŋ'],
  [/nk/gi, 'ŋ'],
];

// cfg / nou: lh → ʎ, nh → ɲ (phoneme proxies for scoring)
const CFG_DIGRAPHS: [RegExp, string][] = [
  [/lh/gi, 'ʎ'],
  [/nh/gi, 'ɲ'],
];

function normalizeCreole(token: string, lang: LangCode): string {
  let s = token.toLowerCase().normalize('NFC');

  if (lang === 'cfg' || lang === 'nou') {
    for (const [re, rep] of CFG_DIGRAPHS) s = s.replace(re, rep);
  }
  if (lang === 'pcm') {
    for (const [re, rep] of PCM_CLUSTERS) s = s.replace(re, rep);
  }

  // Nasal collapsing (all CRE langs)
  for (const [re, rep] of NASAL_MAP) s = s.replace(re, rep);

  // Strip silent final consonants (inherited from ROM/FR base)
  s = s.replace(/[bcdghlpqrst]+$/i, '');
  // Strip final schwa
  s = s.replace(/e$/i, '');

  return s;
}

function extractVowelNucleus(token: string, lang: LangCode): string {
  const normalized = normalizeCreole(token, lang);
  const matches = normalized.match(VOWEL_RE);
  if (!matches) return normalized.slice(-3);
  return matches.at(-1) ?? '';
}

function extractCoda(token: string, lang: LangCode): string {
  const normalized = normalizeCreole(token, lang);
  const lastVowelMatch = [...normalized.matchAll(VOWEL_RE)].at(-1);
  if (!lastVowelMatch || lastVowelMatch.index === undefined) return '';
  return normalized.slice(lastVowelMatch.index + lastVowelMatch[0].length);
}

export function extractNucleusCRE(
  unit: LineEndingUnit,
  lang: LangCode
): RhymeNucleus {
  const { surface } = unit;
  if (!surface) {
    return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 };
  }

  const vowels = extractVowelNucleus(surface, lang);
  const coda   = extractCoda(surface, lang);

  const normalized = normalizeCreole(surface, lang);
  const lastVowelMatch = [...normalized.matchAll(VOWEL_RE)].at(-1);
  const onset = lastVowelMatch?.index !== undefined
    ? normalized.slice(0, lastVowelMatch.index)
    : '';

  return {
    vowels,
    coda,
    tone:      '',
    onset,
    moraCount: vowels.length >= 2 ? 2 : 1,
  };
}

export function scoreCRE(
  nA: RhymeNucleus,
  nB: RhymeNucleus
): number {
  // Same formula as ROM: 60% vowel nucleus + 40% coda
  const vowelSim = nA.vowels === nB.vowels ? 1
    : nA.vowels && nB.vowels && nA.vowels[0] === nB.vowels[0] ? 0.5
    : 0;
  const codaSim  = nA.coda === nB.coda ? 1
    : nA.coda === '' && nB.coda === '' ? 1
    : 0;
  return 0.6 * vowelSim + 0.4 * codaSim;
}
