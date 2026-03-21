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
    const onsetStart = i === 0 ? 0 : syllables[syllables.length - 1]!.onset.length +
      syllables[syllables.length - 1]!.nucleus.length +
      syllables[syllables.length - 1]!.coda.length;
    const onset = chars.slice(onsetStart, nucleusStart).join('');

    // Extract nucleus (vowel sequence with diacritics)
    let nucleusEnd = nucleusStart + 1;
    while (nucleusEnd < chars.length && (isIPAVowel(chars[nucleusEnd]!) || /[\u0300-\u036f]/.test(chars[nucleusEnd]!))) {
      nucleusEnd++;
    }
    const nucleus = chars.slice(nucleusStart, nucleusEnd).join('');

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

    const coda = chars.slice(nucleusEnd, codaEnd).join('');

    // Check for stress mark (ˈ or ˌ) in onset or before
    const stress = onset.includes('ˈ') || (i > 0 && chars[nucleusStart - 1] === 'ˈ');

    syllables.push({
      onset: onset.replace(/[ˈˌ]/g, ''),
      nucleus,
      coda,
      stress,
    });
  }

  return syllables;
};

/**
 * Syllabify IPA string for Germanic languages (ALGO-GER)
 * Similar to Romance but with more complex codas (CVCC structure)
 */
const syllabifyGermanic = (ipa: string): IPASyllable[] => {
  // Germanic allows more complex codas, but basic structure is similar to Romance
  return syllabifyRomance(ipa);
};

/**
 * Syllabify IPA string for Kwa languages (ALGO-KWA)
 * CV structure with tone, coda is rare/non-rhyme-relevant
 */
const syllabifyKwa = (ipa: string): IPASyllable[] => {
  const syllables: IPASyllable[] = [];
  const nuclei = findVowelNuclei(ipa);
  const chars = Array.from(ipa);

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
    const onsetStart = i === 0 ? 0 : syllables[syllables.length - 1]!.onset.length +
      syllables[syllables.length - 1]!.nucleus.length +
      syllables[syllables.length - 1]!.coda.length;
    const onset = chars.slice(onsetStart, nucleusStart).join('');

    // Extract nucleus with tone diacritics
    let nucleusEnd = nucleusStart + 1;
    while (nucleusEnd < chars.length && (isIPAVowel(chars[nucleusEnd]!) || /[\u0300-\u036f]/.test(chars[nucleusEnd]!))) {
      nucleusEnd++;
    }
    const nucleus = chars.slice(nucleusStart, nucleusEnd).join('');

    // Extract tone
    const tone = extractTone(nucleus);

    // Coda is minimal in Kwa languages (CV structure)
    // But if present, extract up to next nucleus
    const codaEnd = nextNucleusStart ?? chars.length;
    const coda = chars.slice(nucleusEnd, codaEnd).join('');

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
    const onsetStart = i === 0 ? 0 : syllables[syllables.length - 1]!.onset.length +
      syllables[syllables.length - 1]!.nucleus.length +
      syllables[syllables.length - 1]!.coda.length;
    const onset = chars.slice(onsetStart, nucleusStart).join('');

    // Extract nucleus with tone diacritics
    let nucleusEnd = nucleusStart + 1;
    while (nucleusEnd < chars.length && (isIPAVowel(chars[nucleusEnd]!) || /[\u0300-\u036f]/.test(chars[nucleusEnd]!))) {
      nucleusEnd++;
    }
    const nucleus = chars.slice(nucleusStart, nucleusEnd).join('');

    // Extract tone
    const tone = extractTone(nucleus);

    // Extract coda (important for CRV weight distinction)
    let codaEnd = nextNucleusStart ?? chars.length;
    // Assign one consonant to coda, rest to next onset
    if (nextNucleusStart !== undefined && codaEnd > nucleusEnd + 1) {
      codaEnd = nucleusEnd + 1;
    }
    const coda = chars.slice(nucleusEnd, codaEnd).join('');

    // Determine syllable weight (bimoraic)
    // Heavy: CVC or CVV (long vowel)
    // Light: CV
    const weight = coda.length > 0 || nucleus.length > 1 ? 'heavy' : 'light';

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
 * Syllabify IPA string for Sinitic languages (ALGO-SIN)
 * Simple: 1 character = 1 syllable with tone
 */
const syllabifySinitic = (ipa: string): IPASyllable[] => {
  // Sinitic syllabification is typically at character level
  // For IPA, we treat each CV(C) unit as a syllable
  return syllabifyRomance(ipa); // Basic fallback
};

/**
 * Syllabify IPA string for Japanese (ALGO-JAP)
 * Moraic structure: each mora is a timing unit
 */
const syllabifyJapanese = (ipa: string): IPASyllable[] => {
  // Japanese uses moraic timing, not syllabic
  // For simplicity, treat CV units as syllables
  return syllabifyRomance(ipa); // Basic fallback
};

/**
 * Generic fallback syllabification
 * Simple CV parsing
 */
const syllabifyFallback = (ipa: string): IPASyllable[] => {
  return syllabifyRomance(ipa);
};

/**
 * Main syllabification dispatcher based on language family
 * Implements Step 3 of the IPA pipeline
 */
export const syllabifyIPA = (ipa: string, family: AlgoFamily): IPASyllable[] => {
  if (!ipa || !ipa.trim()) return [];

  // Remove IPA slashes if present
  const cleanIPA = ipa.replace(/^\/|\/$/g, '').trim();

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

  // Find stressed syllable (or default to last syllable)
  let stressedIndex = syllables.findIndex(s => s.stress);
  if (stressedIndex === -1) {
    stressedIndex = syllables.length - 1; // Default: last syllable
  }

  const stressedSyllable = syllables[stressedIndex]!;

  // Family-specific RN extraction
  switch (family) {
    case 'ALGO-KWA':
      // KWA: nucleus + tone only (no coda)
      return stressedSyllable.nucleus + (stressedSyllable.tone || '');

    case 'ALGO-CRV':
      // CRV: nucleus + coda + tone, weight matters
      return stressedSyllable.nucleus + stressedSyllable.coda + (stressedSyllable.tone || '');

    default:
      // Standard: nucleus + coda + all following syllables
      let rn = stressedSyllable.nucleus + stressedSyllable.coda;

      // Add all following syllables
      for (let i = stressedIndex + 1; i < syllables.length; i++) {
        const syl = syllables[i]!;
        rn += syl.onset + syl.nucleus + syl.coda;
      }

      return rn;
  }
};
