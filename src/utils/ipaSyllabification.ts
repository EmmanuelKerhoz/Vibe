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
    while (nucleusEnd < chars.length && (isIPAVowel(chars[nucleusEnd]!) || /[\u0300-\u036fː]/.test(chars[nucleusEnd]!))) {
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
 * ALGO-GER: delegates to Romance syllabification.
 * Germanic complex codas (CVCC) are handled acceptably by the Romance
 * algorithm for rhyme detection purposes. Revisit if onset cluster
 * accuracy is required.
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
    while (nucleusEnd < chars.length && (isIPAVowel(chars[nucleusEnd]!) || /[\u0300-\u036fː]/.test(chars[nucleusEnd]!))) {
      nucleusEnd++;
    }
    const nucleus = chars.slice(cursor, nucleusEnd).join('');
    cursor = nucleusEnd;

    // Extract tone with post-voiced depression context
    // Pass the onset to detect if it contains voiced consonants (b, d, g, gb, v, z)
    const tone = extractTone(nucleus, onset);

    // Coda is minimal in Kwa languages (CV structure)
    // But if present, extract up to next nucleus
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
    while (nucleusEnd < chars.length && (isIPAVowel(chars[nucleusEnd]!) || /[\u0300-\u036fː]/.test(chars[nucleusEnd]!))) {
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
    // Heavy: CVC or CVː (long vowel)
    // Light: CV
    const hasLongVowel = nucleus.includes('ː');
    const weight = coda.length > 0 || hasLongVowel || nucleus.length > 1 ? 'heavy' : 'light';

    // Extract tone - pass onset for context (though CRV doesn't have post-voiced depression)
    let tone = extractTone(nucleus, onset);

    // Apply HL contour rule: Heavy syllables with H tone → HL contour
    // This is a characteristic of Hausa and related CRV languages
    if (tone === 'H' && weight === 'heavy') {
      tone = 'HL'; // High-Low falling contour on heavy syllables
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
  // Sinitic syllabification is typically at character level
  // For IPA, we treat each CV(C) unit as a syllable
  return syllabifyRomance(ipa); // Basic fallback
};

/**
 * ALGO-JAP: delegates to Romance syllabification as a temporary fallback.
 * Japanese moraic timing requires a dedicated mora-based handler.
 * TODO: implement dedicated ALGO-JAP handler.
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

    case 'ALGO-ROM': {
      // ALGO-ROM (FR, ES, IT, PT, RO, CA):
      // Remove trailing schwa/e-muet syllable (FR-specific silent final -e).
      // After removal, recover the coda that the maximal-onset principle assigned
      // to the schwa syllable's onset rather than the exposed syllable's coda.
      // Guard: if the schwa syllable itself carries a coda (e.g. -er → /tə.ʁ/),
      // the exposed syllable is a legitimate open syllable — keep its empty coda.
      const workingSyllables: IPASyllable[] = [...syllables];

      if (workingSyllables.length >= 2) {
        const lastSyl = workingSyllables[workingSyllables.length - 1]!;
        const isSchwa = lastSyl.nucleus === 'ə' || lastSyl.nucleus === '\u0259';

        if (isSchwa) {
          const schwaSyl = workingSyllables.pop()!;
          const exposedIdx = workingSyllables.length - 1;
          const exposed = workingSyllables[exposedIdx]!;

          // Recover the coda consonant that maximal-onset absorbed into the
          // schwa syllable's onset — but only when the schwa syllable has no
          // coda of its own (which would indicate a legitimate open syllable
          // such as the -er infinitive ending /tə.ʁ/).
          if (schwaSyl.coda === '') {
            workingSyllables[exposedIdx] = {
              ...exposed,
              coda: exposed.coda + schwaSyl.onset,
            };
          }
          // If schwaSyl.coda !== '' (e.g. /tə.ʁ/ for -er), leave exposed as-is.
        }
      }

      // Re-find stressed syllable within the trimmed list (default: last).
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
      // GER (EN, DE, NL, SV, DA, NO): nucleus + full coda + all following syllables.
      // Explicit case (rather than relying on default) so that future Germanic-specific
      // adjustments (e.g. schwa suppression, umlaut weighting) stay isolated from
      // other families handled by the default branch.
      let rn = stressedSyllable.nucleus + stressedSyllable.coda;
      for (let i = stressedIndex + 1; i < syllables.length; i++) {
        const syl = syllables[i]!;
        rn += syl.onset + syl.nucleus + syl.coda;
      }
      return rn;
    }

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
