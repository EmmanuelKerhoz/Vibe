/**
 * French phonetic syllabification utilities.
 *
 * Implements a rule-based graphemic syllabifier for French that splits words
 * into syllables separated by the interpunct character '·'.
 *
 * Algorithm:
 *  1. Identify vowel nuclei (including French digraphs and nasal vowels).
 *  2. Distribute consonants between nuclei using the Maximum Onset Principle
 *     (MOP): maximise the onset of the following syllable while respecting
 *     French phonotactic constraints.
 *
 * Examples:
 *   bonjour    → bon·jour
 *   liberté    → li·ber·té
 *   problème   → pro·blè·me
 *   comprendre → com·pren·dre
 *   chanson    → chan·son
 *   heureux    → heu·reux
 */

/** Interpunct separator inserted between syllables. */
export const SYLLABLE_SEPARATOR = '·';

/**
 * Consonant clusters that may legitimately start a French syllable (valid medial onsets).
 *
 * We restrict these to the traditional French phonological onset clusters:
 *   - Stop/fricative + liquid (l or r): bl, br, cl, cr, dr, fl, fr, gl, gr, pl, pr, tr, vr
 *   - Digraph consonants that function as a single unit: ch, ph, gn, th
 *   - qu (the 'u' is always silent after 'q'; the cluster acts as a single /k/ onset)
 *
 * Intentionally excluded: st, sp, sc, sk, sm, sn and similar clusters that appear
 * word-initially only in loanwords — they split as VC-CV in medial position (e.g.,
 * "triste" → "tris·te", "spectacle" → "spec·ta·cle").
 */
const VALID_ONSETS_2 = new Set([
  'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'tr', 'vr',
  'ch', 'ph', 'gn', 'th',
  'qu',
]);

const isValidOnset = (cluster: string): boolean => {
  if (cluster.length <= 1) return true;
  if (cluster.length === 2) return VALID_ONSETS_2.has(cluster);
  return false;
};

const VOWEL_CHARS = new Set('aeiouy');
const isVowel = (ch: string | undefined): boolean =>
  ch !== undefined && VOWEL_CHARS.has(ch);

/**
 * Analyse a single normalised (lowercase, diacritics stripped) word and
 * return an array of nucleus start-indices together with their lengths.
 */
const findNuclei = (norm: string): Array<{ start: number; len: number }> => {
  const nuclei: Array<{ start: number; len: number }> = [];
  let i = 0;

  while (i < norm.length) {
    const ch = norm[i]!;

    // Quiescent 'u' in French (silent, not a vowel nucleus):
    //   - After 'q' (always): "que", "qui", "musique", etc.
    //   - After 'g' before 'e' or 'i': "guerre", "guitare", "guichet", etc.
    if (
      ch === 'u' && i > 0 &&
      (norm[i - 1] === 'q' ||
        (norm[i - 1] === 'g' && (norm[i + 1] === 'e' || norm[i + 1] === 'i')))
    ) {
      i++;
      continue;
    }

    if (!isVowel(ch)) {
      i++;
      continue;
    }

    const rest = norm.slice(i);

    // --- Trigraph vowels (longest match first) ---
    if (rest.startsWith('eau') || rest.startsWith('oeu')) {
      nuclei.push({ start: i, len: 3 });
      i += 3;
      continue;
    }

    // --- Nasal trigraphs: ain, aim, ein, eim (always one nucleus) ---
    if (
      (rest.startsWith('ain') || rest.startsWith('aim') ||
       rest.startsWith('ein') || rest.startsWith('eim')) &&
      !isVowel(norm[i + 3])
    ) {
      nuclei.push({ start: i, len: 3 });
      i += 3;
      continue;
    }

    // --- Digraph vowels: ai, ei, au, ou, oi, eu ---
    const di = rest.slice(0, 2);
    if (['ai', 'ei', 'au', 'ou', 'oi', 'eu'].includes(di)) {
      nuclei.push({ start: i, len: 2 });
      i += 2;
      continue;
    }

    // --- Nasal vowel digraphs before a non-vowel (or end of word) ---
    // Applies to: an, en, on, in, un, am, em, im, om, um
    // Condition: next char is 'n' or 'm', char after that is NOT a vowel,
    //            and the nasal consonant is not doubled (bonne → bon·ne not *bo·nne).
    const nextCh = norm[i + 1];
    const afterNextCh = norm[i + 2];
    if (
      ['a', 'e', 'i', 'o', 'u'].includes(ch) &&
      (nextCh === 'n' || nextCh === 'm') &&
      !isVowel(afterNextCh) &&
      nextCh !== afterNextCh // not doubled consonant
    ) {
      nuclei.push({ start: i, len: 2 });
      i += 2;
      continue;
    }

    // --- Single vowel ---
    nuclei.push({ start: i, len: 1 });
    i++;
  }

  return nuclei;
};

/**
 * Given a consonant cluster between two vowel nuclei, return how many
 * characters of the cluster belong to the coda of the preceding syllable.
 * The remaining characters form the onset of the following syllable (MOP).
 */
const codaLength = (cluster: string): number => {
  if (cluster.length === 0) return 0;
  if (cluster.length === 1) return 0; // single consonant → onset of next syllable

  // Try the longest valid onset from the right end of the cluster
  for (let onsetLen = Math.min(cluster.length, 3); onsetLen >= 1; onsetLen--) {
    const candidate = cluster.slice(cluster.length - onsetLen);
    if (isValidOnset(candidate)) {
      return cluster.length - onsetLen;
    }
  }

  // Fallback: last consonant goes to next syllable
  return cluster.length - 1;
};

/**
 * Split a single French word into syllables joined by '·'.
 *
 * The input word may contain uppercase letters and diacritics; the output
 * preserves the original characters and casing.
 *
 * @param word  A single word (no spaces).
 * @returns     The word with '·' inserted at syllable boundaries.
 */
export const syllabifyFrenchWord = (word: string): string => {
  if (!word || word.length <= 1) return word;

  // Build a normalised version (lowercase, no diacritics) to drive the analysis.
  // NFD decomposition separates base letters from combining marks; removing the
  // combining marks yields a plain ASCII-like string of the same length as the
  // original, so character positions map 1-to-1.
  const norm = word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const nuclei = findNuclei(norm);

  if (nuclei.length <= 1) return word; // monosyllable or no vowel

  // Compute syllable boundary positions in the normalised (= original) string
  const boundaries: number[] = [];

  for (let n = 0; n < nuclei.length - 1; n++) {
    const currentEnd = nuclei[n]!.start + nuclei[n]!.len;
    const nextStart = nuclei[n + 1]!.start;

    const cluster = norm.slice(currentEnd, nextStart);

    if (cluster.length === 0) {
      // Hiatus: two vowel nuclei with nothing between them → boundary between them
      boundaries.push(nextStart);
    } else {
      const coda = codaLength(cluster);
      boundaries.push(currentEnd + coda);
    }
  }

  // Insert '·' at the boundary positions (positions are in the original word)
  const unique = [...new Set(boundaries)].sort((a, b) => a - b);
  let result = '';
  let prev = 0;
  for (const pos of unique) {
    if (pos > prev && pos < word.length) {
      result += word.slice(prev, pos) + SYLLABLE_SEPARATOR;
      prev = pos;
    }
  }
  result += word.slice(prev);

  return result;
};

/**
 * Apply French syllabification to a full line of text, preserving all
 * non-alphabetic characters (spaces, punctuation, apostrophes, etc.).
 *
 * @param line  A line of French lyrics.
 * @returns     The line with '·' inserted at syllable boundaries inside words.
 */
export const syllabifyLineFrench = (line: string): string =>
  line.replace(/\p{L}+/gu, (word) => syllabifyFrenchWord(word));
