/**
 * IPA-based syllabification utilities
 * Implements Step 3 of the phonemic pipeline: phonemic syllabification
 * Based on docs_fusion_optimal.md specification
 */

import type { AlgoFamily } from '../constants/langFamilyMap';
import type { Syllable } from './phonemizeClient';
import { isIPAVowel, extractTone } from './ipaUtils';

/**
 * Syllable with IPA components
 */
export interface IPASyllable {
  onset: string;
  nucleus: string;
  coda: string;
  tone?: string;
  stress?: boolean;
  weight?: 'light' | 'heavy';
}

/**
 * Find vowel nuclei in IPA string
 * Returns indices of vowel sequences
 */
const findVowelNuclei = (ipa: string): number[] => {
  const indices: number[] = [];
  const chars = Array.from(ipa);

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]!;
    if (isIPAVowel(char)) {
      if (i === 0 || !isIPAVowel(chars[i - 1]!)) {
        indices.push(i);
      }
    }
  }

  return indices;
};

// ─── MOP onset table (FR/ES/IT/PT) ─────────────────────────────────────────────
//
// Maximal Onset Principle: assign the largest sequence of inter-syllabic
// consonants that forms a *legal onset* in FR/ES/IT/PT to the next
// syllable's onset. The remaining consonants become the current coda.
//
// Coverage:
//   Stop + liquid  : bl, br, cl, cr, dr, fl, fr, gl, gr, kl, kr, pl, pr, tl, tr, vl, vr
//   Fricative + liquid : sl (not sr in FR/IT), zl, xl
//   Nasal + liquid : (not legal in Romance — intentionally absent)
//   Single consonants : all consonants are legal onsets.
//
// Source: Selkirk (1982), Clements & Keyser (1983), Dell & Vergnaud (1984).

const ROMANCE_LEGAL_ONSETS: ReadonlySet<string> = new Set([
  'bl', 'br',
  'cl', 'cr',
  'dr',
  'fl', 'fr',
  'gl', 'gr',
  'kl', 'kr',
  'pl', 'pr',
  'tl', 'tr',
  'vl', 'vr',
  'sl', 'zl',
  'xl',
  'sk', 'sp', 'st',   // Spanish/Italian allow these as word-initial onsets
]);

/**
 * Given an inter-syllabic consonant cluster (IPA string between two nuclei),
 * return the split index: consonants[0..splitIdx) go to the current coda,
 * consonants[splitIdx..end) go to the next onset.
 *
 * Implements MOP with legal-onset lookup instead of 50/50 split.
 */
function romanceMOPSplit(cluster: string): number {
  const chars = Array.from(cluster);
  const n = chars.length;

  if (n === 0) return 0;
  if (n === 1) return 0; // Single consonant → fully to next onset

  // Try largest onset first (up to 3 chars), shrink until legal or single.
  // The split index is cluster.length - onsetLength.
  for (let onsetLen = Math.min(n, 3); onsetLen >= 2; onsetLen--) {
    const candidate = chars.slice(n - onsetLen).join('');
    if (ROMANCE_LEGAL_ONSETS.has(candidate)) {
      return n - onsetLen; // everything before candidate → coda
    }
  }

  // No legal multi-consonant onset found → assign all to next onset (single onset)
  return n - 1;
}

/**
 * Syllabify IPA string for Romance languages (ALGO-ROM)
 * Uses MOP with legal-onset table for FR/ES/IT/PT.
 */
const syllabifyRomance = (ipa: string): IPASyllable[] => {
  const syllables: IPASyllable[] = [];
  const nuclei = findVowelNuclei(ipa);
  const chars = Array.from(ipa);
  let cursor = 0;

  if (nuclei.length === 0) {
    return [{ onset: ipa, nucleus: '', coda: '' }];
  }

  for (let i = 0; i < nuclei.length; i++) {
    const nucleusStart = nuclei[i]!;
    const nextNucleusStart = nuclei[i + 1];

    const onset = chars.slice(cursor, nucleusStart).join('');
    cursor = nucleusStart;

    let nucleusEnd = cursor + 1;
    while (
      nucleusEnd < chars.length &&
      (isIPAVowel(chars[nucleusEnd]!) || /[\u0300-\u036f\u02d0]/.test(chars[nucleusEnd]!))
    ) {
      nucleusEnd++;
    }
    const nucleus = chars.slice(cursor, nucleusEnd).join('');
    cursor = nucleusEnd;

    let codaEnd = nextNucleusStart ?? chars.length;

    if (nextNucleusStart !== undefined) {
      const consonantCluster = chars.slice(nucleusEnd, nextNucleusStart).join('');
      const splitIdx = romanceMOPSplit(consonantCluster);
      codaEnd = nucleusEnd + splitIdx;
    }

    const coda = chars.slice(cursor, codaEnd).join('');
    cursor = codaEnd;

    const stress =
      onset.includes('\u02c8') || (i > 0 && chars[nucleusStart - 1] === '\u02c8');

    syllables.push({
      onset: onset.replace(/[\u02c8\u02cc]/g, ''),
      nucleus,
      coda,
      stress,
    });
  }

  return syllables;
};

/**
 * ALGO-GER: dedicated Germanic syllabification.
 * Preserves complex CVCC codas (strengths, crafts, texts).
 */
const syllabifyGermanic = (ipa: string): IPASyllable[] => {
  const syllables: IPASyllable[] = [];
  const nuclei = findVowelNuclei(ipa);
  const chars = Array.from(ipa);
  let cursor = 0;

  if (nuclei.length === 0) {
    return [{ onset: ipa, nucleus: '', coda: '' }];
  }

  for (let i = 0; i < nuclei.length; i++) {
    const nucleusStart = nuclei[i]!;
    const nextNucleusStart = nuclei[i + 1];

    const onset = chars.slice(cursor, nucleusStart).join('');
    cursor = nucleusStart;

    let nucleusEnd = cursor + 1;
    while (
      nucleusEnd < chars.length &&
      (isIPAVowel(chars[nucleusEnd]!) || /[\u0300-\u036f\u02d0]/.test(chars[nucleusEnd]!))
    ) {
      nucleusEnd++;
    }
    const nucleus = chars.slice(cursor, nucleusEnd).join('');
    cursor = nucleusEnd;

    let codaEnd = nextNucleusStart ?? chars.length;
    if (nextNucleusStart !== undefined && codaEnd > nucleusEnd) {
      codaEnd = Math.max(nucleusEnd, codaEnd - 1);
    }
    const coda = chars.slice(cursor, codaEnd).join('');
    cursor = codaEnd;

    const stress =
      onset.includes('\u02c8') || (i > 0 && chars[nucleusStart - 1] === '\u02c8');

    syllables.push({
      onset: onset.replace(/[\u02c8\u02cc]/g, ''),
      nucleus,
      coda,
      stress,
    });
  }

  return syllables;
};

/**
 * Syllabify IPA string for Kwa languages (ALGO-KWA)
 */
const syllabifyKwa = (ipa: string): IPASyllable[] => {
  const syllables: IPASyllable[] = [];
  const nuclei = findVowelNuclei(ipa);
  const chars = Array.from(ipa);
  let cursor = 0;

  if (nuclei.length === 0) {
    return [{ onset: ipa, nucleus: '', coda: '' }];
  }

  for (let i = 0; i < nuclei.length; i++) {
    const nucleusStart = nuclei[i]!;
    const nextNucleusStart = nuclei[i + 1];

    const onset = chars.slice(cursor, nucleusStart).join('');
    cursor = nucleusStart;

    let nucleusEnd = cursor + 1;
    while (
      nucleusEnd < chars.length &&
      (isIPAVowel(chars[nucleusEnd]!) || /[\u0300-\u036f\u02d0]/.test(chars[nucleusEnd]!))
    ) {
      nucleusEnd++;
    }
    const nucleus = chars.slice(cursor, nucleusEnd).join('');
    cursor = nucleusEnd;

    const toneValue = extractTone(nucleus, onset);

    const codaEnd = nextNucleusStart ?? chars.length;
    const coda = chars.slice(cursor, codaEnd).join('');
    cursor = codaEnd;

    // Conditional spread: omit tone key when undefined to satisfy
    // exactOptionalPropertyTypes (IPASyllable.tone?: string excludes undefined).
    syllables.push({
      onset,
      nucleus,
      coda,
      ...(toneValue !== undefined && { tone: toneValue }),
    });
  }

  return syllables;
};

/**
 * Syllabify IPA string for Cross River/Chadic languages (ALGO-CRV)
 */
const syllabifyCRV = (ipa: string): IPASyllable[] => {
  const syllables: IPASyllable[] = [];
  const nuclei = findVowelNuclei(ipa);
  const chars = Array.from(ipa);
  let cursor = 0;

  if (nuclei.length === 0) {
    return [{ onset: ipa, nucleus: '', coda: '' }];
  }

  for (let i = 0; i < nuclei.length; i++) {
    const nucleusStart = nuclei[i]!;
    const nextNucleusStart = nuclei[i + 1];

    const onset = chars.slice(cursor, nucleusStart).join('');
    cursor = nucleusStart;

    let nucleusEnd = cursor + 1;
    while (
      nucleusEnd < chars.length &&
      (isIPAVowel(chars[nucleusEnd]!) || /[\u0300-\u036f\u02d0]/.test(chars[nucleusEnd]!))
    ) {
      nucleusEnd++;
    }
    const nucleus = chars.slice(cursor, nucleusEnd).join('');
    cursor = nucleusEnd;

    let codaEnd = nextNucleusStart ?? chars.length;
    if (nextNucleusStart !== undefined && codaEnd > nucleusEnd + 1) {
      codaEnd = nucleusEnd + 1;
    }
    const coda = chars.slice(cursor, codaEnd).join('');
    cursor = codaEnd;

    const hasLongVowel = nucleus.includes('\u02d0');
    const weight = coda.length > 0 || hasLongVowel || nucleus.length > 1 ? 'heavy' : 'light';

    let toneValue = extractTone(nucleus, onset);
    if (toneValue === 'H' && weight === 'heavy') toneValue = 'HL';

    // Conditional spread: omit tone key when undefined to satisfy
    // exactOptionalPropertyTypes (IPASyllable.tone?: string excludes undefined).
    syllables.push({
      onset,
      nucleus,
      coda,
      weight,
      ...(toneValue !== undefined && { tone: toneValue }),
    });
  }

  return syllables;
};

/**
 * ALGO-SIN: delegates to Romance syllabification as a temporary fallback.
 * TODO: implement dedicated ALGO-SIN handler.
 */
const syllabifySinitic = (ipa: string): IPASyllable[] => syllabifyRomance(ipa);

/**
 * ALGO-JAP: delegates to Romance syllabification as a temporary fallback.
 * TODO: implement dedicated ALGO-JAP handler.
 */
const syllabifyJapanese = (ipa: string): IPASyllable[] => syllabifyRomance(ipa);

const syllabifyFallback = (ipa: string): IPASyllable[] => syllabifyRomance(ipa);

/**
 * Main syllabification dispatcher based on language family
 */
export const syllabifyIPA = (ipa: string, family: AlgoFamily): IPASyllable[] => {
  if (!ipa || !ipa.trim()) return [];

  const cleanIPA = ipa.replace(/^\/|\/$/g, '').replace(/\./g, '').trim();

  switch (family) {
    case 'ALGO-ROM': return syllabifyRomance(cleanIPA);
    case 'ALGO-GER': return syllabifyGermanic(cleanIPA);
    case 'ALGO-KWA': return syllabifyKwa(cleanIPA);
    case 'ALGO-CRV': return syllabifyCRV(cleanIPA);
    case 'ALGO-SIN': return syllabifySinitic(cleanIPA);
    case 'ALGO-JAP': return syllabifyJapanese(cleanIPA);
    default:         return syllabifyFallback(cleanIPA);
  }
};

/**
 * Convert IPASyllable to Syllable (phonemizeClient format)
 * Uses conditional spread to satisfy exactOptionalPropertyTypes:
 * optional props (tone, stress) are omitted entirely when undefined.
 */
export const convertToPhonemeClientSyllable = (ipaSyllable: IPASyllable): Syllable => ({
  onset: ipaSyllable.onset,
  nucleus: ipaSyllable.nucleus,
  coda: ipaSyllable.coda,
  ...(ipaSyllable.tone !== undefined && { tone: ipaSyllable.tone }),
  ...(ipaSyllable.stress !== undefined && { stress: ipaSyllable.stress }),
});

/**
 * Extract rhyme nucleus from syllables (Step 4)
 * RN = (Nₖ, Cₖ, Sₖ₊₁, …, Sₙ)
 * Where k is the stressed/main syllable
 */
export const extractRhymeNucleus = (
  syllables: IPASyllable[],
  family: AlgoFamily,
): string => {
  if (syllables.length === 0) return '';

  let stressedIndex = syllables.findIndex(s => s.stress);

  if (stressedIndex === -1) {
    stressedIndex = family === 'ALGO-GER' ? 0 : syllables.length - 1;
  }

  const stressedSyllable = syllables[stressedIndex]!;

  switch (family) {
    case 'ALGO-KWA':
      return stressedSyllable.nucleus + (stressedSyllable.tone || '');

    case 'ALGO-CRV':
      return stressedSyllable.nucleus + stressedSyllable.coda + (stressedSyllable.tone || '');

    case 'ALGO-ROM': {
      const working: IPASyllable[] = [...syllables];

      if (working.length >= 2) {
        const last = working[working.length - 1]!;
        const isSchwa = last.nucleus === '\u0259';

        if (isSchwa) {
          const schwa = working.pop()!;
          const exposedIdx = working.length - 1;
          const exposed = working[exposedIdx]!;
          if (schwa.coda === '') {
            working[exposedIdx] = { ...exposed, coda: exposed.coda + schwa.onset };
          }
        }
      }

      let romIdx = working.findIndex(s => s.stress);
      if (romIdx === -1) romIdx = working.length - 1;

      const romS = working[romIdx]!;
      let rn = romS.nucleus + romS.coda;
      for (let i = romIdx + 1; i < working.length; i++) {
        const s = working[i]!;
        rn += s.onset + s.nucleus + s.coda;
      }
      return rn;
    }

    default: {
      let rn = stressedSyllable.nucleus + stressedSyllable.coda;
      for (let i = stressedIndex + 1; i < syllables.length; i++) {
        const s = syllables[i]!;
        rn += s.onset + s.nucleus + s.coda;
      }
      return rn;
    }
  }
};
