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
  weight?: 'light' | 'heavy'; // For CRV family (bimoraic weight)
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
      // Only record the start of each vowel sequence
      if (i === 0 || !isIPAVowel(chars[i - 1]!)) {
        indices.push(i);
      }
    }
  }

  return indices;
};

/**
 * Syllabify IPA string for Romance languages (ALGO-ROM)
 * Complex onset/coda rules, stress-sensitive
 */
const syllabifyRomance = (ipa: string): IPASyllable[] => {
  const syllables: IPASyllable[] = [];
  const nuclei = findVowelNuclei(ipa);
  const chars = Array.from(ipa);
  let cursor = 0;

  if (nuclei.length === 0) {
    // No vowels - treat entire string as onset
    return [{
      onset: ipa,
      nucleus: '',
      coda: '',
    }];
  }

  for (let i = 0; i < nuclei.length; i++) {
    const nucleusStart = nuclei[i]!;
    const nextNucleusStart = nuclei[i + 1];

    // Extract onset (consonants before nucleus)
    const onset = chars.slice(cursor, nucleusStart).join('');
    cursor = nucleusStart;

    // Extract nucleus (vowel sequence with diacritics)
    let nucleusEnd = cursor + 1;
    while (nucleusEnd < chars.length && (isIPAVowel(chars[nucleusEnd]!) || /[\u0300-\u036f\u02d0]/.test(chars[nucleusEnd]!))) {
      nucleusEnd++;
    }
    const nucleus = chars.slice(cursor, nucleusEnd).join('');
    cursor = nucleusEnd;

    // Extract coda (consonants after nucleus, up to next nucleus)
    let codaEnd = nextNucleusStart ?? chars.length;

    // Apply maximal onset principle: assign consonants to next syllable's onset if possible
    if (nextNucleusStart !== undefined) {
      const consonantCluster = chars.slice(nucleusEnd, nextNucleusStart).join('');
      // Simple rule: if there are multiple consonants, split in the middle
      // More complex rules would check for valid onset clusters
      const splitPoint = Math.floor(consonantCluster.length / 2);
      codaEnd = nucleusEnd + splitPoint;
    }

    const coda = chars.slice(cursor, codaEnd).join('');
    cursor = codaEnd;

    // Check for stress mark (\u02c8 or \u02cc) in onset or before
    const stress = onset.includes('\u02c8') || (i > 0 && chars[nucleusStart - 1] === '\u02c8');

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
 * Preserves complex CVCC codas (strengths, crafts, texts) that the Romance
 * MOP 50/50 split would incorrectly distribute to the next onset.
 * Stress marks (\u02c8) are detected and stripped; unstressed syllables
 * default to stress=false.
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

    // Nucleus + length mark / diacritics
    let nucleusEnd = cursor + 1;
    while (
      nucleusEnd < chars.length &&
      (isIPAVowel(chars[nucleusEnd]!) || /[\u0300-\u036f\u02d0]/.test(chars[nucleusEnd]!))
    ) {
      nucleusEnd++;
    }
    const nucleus = chars.slice(cursor, nucleusEnd).join('');
    cursor = nucleusEnd;

    // Germanic codas: assign ALL inter-syllabic consonants to current coda
    // (maximise coda, not onset — inverse of Romance MOP).
    // Exception: leave at least one consonant for the next syllable's onset
    // when a following nucleus exists.
    let codaEnd = nextNucleusStart ?? chars.length;
    if (nextNucleusStart !== undefined && codaEnd > nucleusEnd) {
      // Keep exactly one consonant for next onset
      codaEnd = Math.max(nucleusEnd, codaEnd - 1);
    }
    const coda = chars.slice(cursor, codaEnd).join('');
    cursor = codaEnd;

    const stress = onset.includes('\u02c8') || (i > 0 && chars[nucleusStart - 1] === '\u02c8');

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
 * CV structure with tone, coda is rare/non-rhyme-relevant
 */
const syllabifyKwa = (ipa: string): IPASyllable[] => {
  const syllables: IPASyllable[] = [];
  const nuclei = findVowelNuclei(ipa);
  const chars = Array.from(ipa);
  let cursor = 0;

  if (nuclei.length === 0) {
    return [{
      onset: ipa,
      nucleus: '',
      coda: '',
    }];
  }

  for (let i = 0; i < nuclei.length; i++) {
    const nucleusStart = nuclei[i]!;
    const nextNucleusStart = nuclei[i + 1];

    // Extract onset
    const onset = chars.slice(cursor, nucleusStart).join('');
    cursor = nucleusStart;

    // Extract nucleus with tone diacritics
    let nucleusEnd = cursor + 1;
    while (nucleusEnd < chars.length && (isIPAVowel(chars[nucleusEnd]!) || /[\u0300-\u036f\u02d0]/.test(chars[nucleusEnd]!))) {
      nucleusEnd++;
    }
    const nucleus = chars.slice(cursor, nucleusEnd).join('');
    cursor = nucleusEnd;

    // Extract tone with post-voiced depression context
    const tone = extractTone(nucleus, onset);

    // Coda is minimal in Kwa languages (CV structure)
    const codaEnd = nextNucleusStart ?? chars.length;
    const coda = chars.slice(cursor, codaEnd).join('');
    cursor = codaEnd;

    syllables.push({
      onset,
      nucleus,
      coda,
      tone,
    });
  }

  return syllables;
};

/**
 * Syllabify IPA string for Cross River/Chadic languages (ALGO-CRV)
 * CVC structure with tone and syllable weight (light/heavy)
 */
const syllabifyCRV = (ipa: string): IPASyllable[] => {
  const syllables: IPASyllable[] = [];
  const nuclei = findVowelNuclei(ipa);
  const chars = Array.from(ipa);
  let cursor = 0;

  if (nuclei.length === 0) {
    return [{
      onset: ipa,
      nucleus: '',
      coda: '',
    }];
  }

  for (let i = 0; i < nuclei.length; i++) {
    const nucleusStart = nuclei[i]!;
    const nextNucleusStart = nuclei[i + 1];

    // Extract onset
    const onset = chars.slice(cursor, nucleusStart).join('');
    cursor = nucleusStart;

    // Extract nucleus with tone diacritics
    let nucleusEnd = cursor + 1;
    while (nucleusEnd < chars.length && (isIPAVowel(chars[nucleusEnd]!) || /[\u0300-\u036f\u02d0]/.test(chars[nucleusEnd]!))) {
      nucleusEnd++;
    }
    const nucleus = chars.slice(cursor, nucleusEnd).join('');
    cursor = nucleusEnd;

    // Extract coda (important for CRV weight distinction)
    let codaEnd = nextNucleusStart ?? chars.length;
    // Assign one consonant to coda, rest to next onset
    if (nextNucleusStart !== undefined && codaEnd > nucleusEnd + 1) {
      codaEnd = nucleusEnd + 1;
    }
    const coda = chars.slice(cursor, codaEnd).join('');
    cursor = codaEnd;

    // Determine syllable weight (bimoraic)
    const hasLongVowel = nucleus.includes('\u02d0');
    const weight = coda.length > 0 || hasLongVowel || nucleus.length > 1 ? 'heavy' : 'light';

    let tone = extractTone(nucleus, onset);

    // HL contour rule: Heavy syllables with H tone
    if (tone === 'H' && weight === 'heavy') {
      tone = 'HL';
    }

    syllables.push({
      onset,
      nucleus,
      coda,
      tone,
      weight,
    });
  }

  return syllables;
};

/**
 * ALGO-SIN: delegates to Romance syllabification as a temporary fallback.
 * Sinitic languages (Mandarin, Cantonese) require tone-based syllabification.
 * TODO: implement dedicated ALGO-SIN handler.
 */
const syllabifySinitic = (ipa: string): IPASyllable[] => {
  return syllabifyRomance(ipa);
};

/**
 * ALGO-JAP: delegates to Romance syllabification as a temporary fallback.
 * Japanese moraic timing requires a dedicated mora-based handler.
 * TODO: implement dedicated ALGO-JAP handler.
 */
const syllabifyJapanese = (ipa: string): IPASyllable[] => {
  return syllabifyRomance(ipa);
};

/**
 * Generic fallback syllabification
 */
const syllabifyFallback = (ipa: string): IPASyllable[] => {
  return syllabifyRomance(ipa);
};

/**
 * Main syllabification dispatcher based on language family
 */
export const syllabifyIPA = (ipa: string, family: AlgoFamily): IPASyllable[] => {
  if (!ipa || !ipa.trim()) return [];

  const cleanIPA = ipa.replace(/^\/|\/$/g, '').replace(/\./g, '').trim();

  switch (family) {
    case 'ALGO-ROM':
      return syllabifyRomance(cleanIPA);
    case 'ALGO-GER':
      return syllabifyGermanic(cleanIPA);
    case 'ALGO-KWA':
      return syllabifyKwa(cleanIPA);
    case 'ALGO-CRV':
      return syllabifyCRV(cleanIPA);
    case 'ALGO-SIN':
      return syllabifySinitic(cleanIPA);
    case 'ALGO-JAP':
      return syllabifyJapanese(cleanIPA);
    default:
      return syllabifyFallback(cleanIPA);
  }
};

/**
 * Convert IPASyllable to Syllable (phonemizeClient format)
 */
export const convertToPhonemeClientSyllable = (ipaSyllable: IPASyllable): Syllable => {
  return {
    onset: ipaSyllable.onset,
    nucleus: ipaSyllable.nucleus,
    coda: ipaSyllable.coda,
    tone: ipaSyllable.tone,
    stress: ipaSyllable.stress,
  };
};

/**
 * Extract rhyme nucleus from syllables (Step 4)
 * RN = (Nₖ, Cₖ, Sₖ₊₁, …, Sₙ)
 * Where k is the stressed/main syllable
 */
export const extractRhymeNucleus = (
  syllables: IPASyllable[],
  family: AlgoFamily
): string => {
  if (syllables.length === 0) return '';

  // Find stressed syllable.
  // For ALGO-GER (EN especially), falling back to the LAST syllable when no
  // stress mark is present produces incorrect rhyme extraction (e.g.
  // "beautiful" would rhyme on "-ful" instead of "beau-").
  // Instead, fall back to the FIRST syllable for Germanic (most common EN
  // stress position for uninflected content words), and keep last-syllable
  // fallback only for non-Germanic families where final stress is typical.
  let stressedIndex = syllables.findIndex(s => s.stress);

  if (stressedIndex === -1) {
    if (family === 'ALGO-GER') {
      stressedIndex = 0; // EN/DE default: first syllable
    } else {
      stressedIndex = syllables.length - 1; // FR/other: last syllable
    }
  }

  const stressedSyllable = syllables[stressedIndex]!;

  // Family-specific RN extraction
  switch (family) {
    case 'ALGO-KWA':
      return stressedSyllable.nucleus + (stressedSyllable.tone || '');

    case 'ALGO-CRV':
      return stressedSyllable.nucleus + stressedSyllable.coda + (stressedSyllable.tone || '');

    case 'ALGO-ROM': {
      const workingSyllables: IPASyllable[] = [...syllables];

      if (workingSyllables.length >= 2) {
        const lastSyl = workingSyllables[workingSyllables.length - 1]!;
        const isSchwa = lastSyl.nucleus === '\u0259';

        if (isSchwa) {
          const schwaSyl = workingSyllables.pop()!;
          const exposedIdx = workingSyllables.length - 1;
          const exposed = workingSyllables[exposedIdx]!;

          if (schwaSyl.coda === '') {
            workingSyllables[exposedIdx] = {
              ...exposed,
              coda: exposed.coda + schwaSyl.onset,
            };
          }
        }
      }

      let romStressedIdx = workingSyllables.findIndex(s => s.stress);
      if (romStressedIdx === -1) {
        romStressedIdx = workingSyllables.length - 1;
      }

      const romStressed = workingSyllables[romStressedIdx]!;
      let rn = romStressed.nucleus + romStressed.coda;

      for (let i = romStressedIdx + 1; i < workingSyllables.length; i++) {
        const syl = workingSyllables[i]!;
        rn += syl.onset + syl.nucleus + syl.coda;
      }

      return rn;
    }

    case 'ALGO-GER': {
      let rn = stressedSyllable.nucleus + stressedSyllable.coda;
      for (let i = stressedIndex + 1; i < syllables.length; i++) {
        const syl = syllables[i]!;
        rn += syl.onset + syl.nucleus + syl.coda;
      }
      return rn;
    }

    default: {
      let rn = stressedSyllable.nucleus + stressedSyllable.coda;
      for (let i = stressedIndex + 1; i < syllables.length; i++) {
        const syl = syllables[i]!;
        rn += syl.onset + syl.nucleus + syl.coda;
      }
      return rn;
    }
  }
};
