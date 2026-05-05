import { getAlgoFamily, isTonalLanguage } from '../constants/langFamilyMap';
import type { Section, SongVersion } from '../types';
import type { SimilarityMatch, SimilaritySectionMatch } from './similarityUtils';
import { normalizeText } from './similarityUtils';

type WordMatch = {
  lastWord: string;
  normalizedWord: string;
  wordStart: number;
};

type VowelSpan = { start: number; end: number };

type RhymeCandidate = {
  normalizedSuffix: string;
};

/**
 * Full IPA vowel inventory covering Latin, Germanic umlauts, Slavic, Uralic,
 * Austronesian, Dravidian and Sinitic vowel characters encountered after NFD
 * normalization. Extending beyond 'aeiouy' fixes getVowelGroups for
 * ALGO-GER, ALGO-FIN, ALGO-DRV, ALGO-AUS, ALGO-SLV, ALGO-SIN, ALGO-KOR.
 */
const VOWELS = new Set([
  // Basic Latin
  'a', 'e', 'i', 'o', 'u', 'y',
  // IPA close / mid vowels
  'ɑ', 'ɒ', 'ɔ', 'ɛ', 'œ', 'ø', 'ɪ', 'ʊ', 'ʌ', 'ə', 'ɨ', 'ɵ', 'ɜ', 'ɞ', 'ɐ', 'ʉ', 'ɯ', 'ɤ',
  // Germanic / Uralic umlauts (post-NFD base chars)
  'ä', 'ö', 'ü', 'å',
  // Scandinavian / Uralic
  'æ', 'ø',
  // Slavic / IIR
  'ы', 'э', 'я', 'ю', 'е', 'ё', 'и',
  // Dravidian vowel letters (Tamil, Kannada, Malayalam — post-transliteration)
  'ā', 'ī', 'ū', 'ṛ', 'ḷ', 'ē', 'ō', 'ai', 'au',
]);

const isVowel = (ch: string) => VOWELS.has(ch);

/**
 * Strip Unicode accents and lowercase — with optional tonal preservation.
 * For tonal languages (KWA, CRV families), tone diacritics are preserved.
 * @param s - The string to normalize
 * @param langCode - Optional language code for tonal language detection
 */
const normalizeWord = (s: string, langCode?: string): string => {
  const normalized = s.normalize('NFD');

  const stripDiacritics = isTonalLanguage(langCode || '')
    ? normalized
    : normalized.replace(/[\u0300-\u036f]/g, '');

  return stripDiacritics.toLowerCase().replace(/[^a-z\u0300-\u036f]/g, '');
};

/**
 * Extract the final word-like token from a lyric line, normalize it for
 * comparisons, and keep the original start offset so UI highlighting can be
 * mapped back onto the untouched line text.
 * @param text - The text to extract from
 * @param langCode - Optional language code for tonal preservation
 */
const extractLastWord = (text: string, langCode?: string): WordMatch | null => {
  const trimmedText = text.trimEnd().replace(/[^\p{L}\p{N}]+$/u, '');
  if (!trimmedText) return null;

  const lastWordMatch = /[\p{L}\p{N}]+$/u.exec(trimmedText);
  if (!lastWordMatch) return null;

  const lastWord = lastWordMatch[0];
  const normalizedWord = normalizeWord(lastWord, langCode);
  if (!normalizedWord) return null;

  return {
    lastWord,
    normalizedWord,
    wordStart: lastWordMatch.index,
  };
};

/**
 * Identify contiguous vowel groups inside a normalized word. These spans act
 * as the candidate starting points for rime comparisons and fallback splits.
 * Uses the extended IPA VOWELS set to correctly handle non-Latin families.
 */
const getVowelGroups = (normalizedWord: string): VowelSpan[] => {
  const vowelGroups: VowelSpan[] = [];
  const chars = [...normalizedWord];
  let i = 0;
  while (i < chars.length) {
    if (isVowel(chars[i]!)) {
      const start = i;
      while (i < chars.length && isVowel(chars[i]!)) i++;
      vowelGroups.push({ start, end: i });
    } else {
      i++;
    }
  }
  return vowelGroups;
};

/**
 * Keep short endings intact, but normalise common trailing plural markers on
 * longer endings so pairs like "certitudes"/"servitude" and
 * "possessifs"/"adjectif" can still converge on the same rime family.
 *
 * Canonical vowel-sequence substitutions (e.g. "an/en/am" → "an") are
 * Romance-specific orthographic conventions and are therefore gated on
 * ALGO-ROM. For all other families the raw suffix is returned as-is,
 * letting the IPA pipeline handle phonemic equivalence.
 *
 * When langCode is absent the Romance rules apply as a safe default,
 * preserving existing behaviour for callers that don't pass a language.
 */
const canonicalizeRhymeSuffix = (suffix: string, langCode?: string): string => {
  const s = suffix.length <= 3 ? suffix : suffix.replace(/[sx]$/, '');

  const family = langCode ? getAlgoFamily(langCode) : undefined;
  const isRomance = !family || family === 'ALGO-ROM';

  if (isRomance) {
    if (/^oi/.test(s)) return 'oi';
    if (/^(?:an|en|am|em)/.test(s)) return 'an';
    if (/^(?:in|ain|ein|im|yn|ym)/.test(s)) return 'in';
    if (/^(?:on|om)/.test(s)) return 'on';
    if (/^(?:un|um)/.test(s)) return 'un';
    if (/^(?:eu|oeu|oe)/.test(s)) return 'eu';
    if (/^ou/.test(s)) return 'ou';
    if (/^(?:au|eau)/.test(s)) return 'au';
  }

  return s;
};

const getRhymeCandidates = (text: string, langCode?: string): RhymeCandidate[] => {
  const word = extractLastWord(text, langCode);
  if (!word) return [];

  const vowelGroups = getVowelGroups(word.normalizedWord);
  if (vowelGroups.length === 0) {
    return [{
      normalizedSuffix: canonicalizeRhymeSuffix(word.normalizedWord, langCode),
    }];
  }

  return vowelGroups.map(({ start }) => ({
    normalizedSuffix: canonicalizeRhymeSuffix(word.normalizedWord.slice(start), langCode),
  }));
};

/**
 * Compare two normalized suffixes from right to left and return the longest
 * suffix they share verbatim.
 */
const getLongestCommonSuffix = (a: string, b: string): string => {
  let sharedLength = 0;
  while (
    sharedLength < a.length
    && sharedLength < b.length
    && a[a.length - 1 - sharedLength] === b[b.length - 1 - sharedLength]
  ) {
    sharedLength++;
  }
  return sharedLength > 0 ? a.slice(a.length - sharedLength) : '';
};

/**
 * Require at least 2 shared characters for general rhyme matching, but allow
 * exact one-vowel matches for short endings such as "zéro"/"ego" so we do not
 * discard valid monosyllabic vowel rhymes.
 */
const isSharedRhymeStrongEnough = (suffix: string, exactMatch: boolean): boolean =>
  suffix.length >= 2 || (exactMatch && suffix.length === 1 && isVowel(suffix));

/**
 * Compare every vowel-group-based candidate suffix from two lines and keep the
 * longest shared rime that is strong enough to count as an actual rhyme.
 * @param a - First line text
 * @param b - Second line text
 * @param langCode - Optional language code for tonal preservation
 */
const findBestSharedRhymeSuffix = (a: string, b: string, langCode?: string): string | null => {
  const aCandidates = getRhymeCandidates(a, langCode);
  const bCandidates = getRhymeCandidates(b, langCode);
  let bestMatch = '';

  for (const aCandidate of aCandidates) {
    for (const bCandidate of bCandidates) {
      const exactMatch = aCandidate.normalizedSuffix === bCandidate.normalizedSuffix;
      const sharedSuffix = exactMatch
        ? aCandidate.normalizedSuffix
        : getLongestCommonSuffix(aCandidate.normalizedSuffix, bCandidate.normalizedSuffix);
      if (!isSharedRhymeStrongEnough(sharedSuffix, exactMatch)) continue;
      if (sharedSuffix.length > bestMatch.length) bestMatch = sharedSuffix;
    }
  }

  return bestMatch || null;
};

/**
 * Known French vowel digraphs — two-vowel sequences representing a single
 * phoneme. "ie" is intentionally excluded because it is graphemically a
 * hiatus in most contexts (e.g. "miette" where i and e belong to separate
 * syllable nuclei).
 */
const FRENCH_DIGRAPHS = new Set(['ai', 'ei', 'oi', 'ou', 'au', 'eu']);

/**
 * Extend a shared-suffix position backward to include the preceding vowel
 * onset so the UI highlights complete French rimes rather than bare consonant
 * overlaps. For example, shared suffix "te" in "miette" extends to "ette",
 * and in "défaite" extends to "aite" (recognising "ai" as a diphthong).
 */
const extendToVowelOnset = (normalizedWord: string, suffixStart: number): number => {
  if (suffixStart <= 0) return suffixStart;

  let pos = suffixStart;

  if (!isVowel(normalizedWord[pos]!)) {
    while (pos >= 0 && !isVowel(normalizedWord[pos]!)) pos--;
    if (pos < 0) return suffixStart;
  }

  if (pos >= 1 && isVowel(normalizedWord[pos - 1]!)) {
    const digraph = normalizedWord[pos - 1]! + normalizedWord[pos]!;
    if (FRENCH_DIGRAPHS.has(digraph)) {
      return pos - 1;
    }
  }

  return pos;
};

/**
 * Split a line at the start of a normalized suffix found inside its last word,
 * preserving the original spelling and trailing punctuation in the rhyming
 * fragment returned to the UI overlay.
 *
 * For non-tonal languages the highlight is extended backward to include the
 * vowel onset preceding the shared consonant suffix, so that complete rhyming
 * syllables like "ette", "ête", "aite" are marked rather than just the bare
 * consonant overlap ("te").
 */
const splitLineAtNormalizedSuffix = (text: string, normalizedSuffix: string, langCode?: string): { before: string; rhyme: string } | null => {
  const word = extractLastWord(text, langCode);
  if (!word) return null;

  const suffixStart = word.normalizedWord.lastIndexOf(normalizedSuffix);
  if (suffixStart < 0) return null;

  const effectiveStart = isTonalLanguage(langCode || '')
    ? suffixStart
    : extendToVowelOnset(word.normalizedWord, suffixStart);

  const absoluteStart = word.wordStart + effectiveStart;
  return {
    before: text.slice(0, absoluteStart),
    rhyme: text.slice(absoluteStart),
  };
};

/**
 * When no matching peer line is available, fall back to highlighting from the
 * last vowel group of the word so the UI still marks a plausible rhyming tail.
 */
const getFallbackRhymingSuffix = (text: string, langCode?: string): { before: string; rhyme: string } | null => {
  const word = extractLastWord(text, langCode);
  if (!word) return null;

  const vowelGroups = getVowelGroups(word.normalizedWord);
  if (vowelGroups.length === 0) {
    return {
      before: text.slice(0, word.wordStart),
      rhyme: text.slice(word.wordStart),
    };
  }

  return splitLineAtNormalizedSuffix(text, word.normalizedWord.slice(vowelGroups[vowelGroups.length - 1]!.start), langCode);
};

export const splitRhymingSuffix = (text: string, peerLines: string[] = [], langCode?: string): { before: string; rhyme: string } | null => {
  const segment = segmentVerseToRhymingUnit(text, langCode);
  const effectiveText = segment.position === 'enjambed'
    ? text.trimEnd().replace(/\s+\S+$/, '')
    : text;
  let bestSuffix: string | null = null;

  for (const peerLine of peerLines) {
    const peerSegment = segmentVerseToRhymingUnit(peerLine, langCode);
    const sharedSuffix = findBestSharedRhymeSuffix(
      segment.rhymingUnit,
      peerSegment.rhymingUnit,
      langCode,
    );
    if (sharedSuffix && (!bestSuffix || sharedSuffix.length > bestSuffix.length)) {
      bestSuffix = sharedSuffix;
    }
  }

  if (bestSuffix) {
    const split = splitLineAtNormalizedSuffix(effectiveText, bestSuffix, langCode);
    if (split) return split;
  }

  return getFallbackRhymingSuffix(effectiveText, langCode);
};

/**
 * Two lines rhyme when they share a strong enough rime suffix derived from
 * vowel-group candidates. This keeps scheme detection aligned with the same
 * rime logic used by the UI highlight overlay. Exact one-vowel matches are
 * allowed for short words such as "zéro" / "ego", while longer matches use a
 * suffix overlap.
 */
export const doLinesRhymeGraphemic = (a: string, b: string, langCode?: string): boolean => {
  const segA = segmentVerseToRhymingUnit(a, langCode);
  const segB = segmentVerseToRhymingUnit(b, langCode);
  return findBestSharedRhymeSuffix(segA.rhymingUnit, segB.rhymingUnit, langCode) !== null;
};

// ─── Step-0: verse segmentation ──────────────────────────────────────────────

/**
 * Type of rhyme position within a line.
 * - 'end'      : classical end-of-line rhyme (default)
 * - 'internal' : rhyming unit found mid-line (caesura / internal rhyme)
 * - 'enjambed' : last token is syntactically incomplete (enjambement detected
 *                heuristically via trailing connector words)
 */
export type RhymePosition = 'end' | 'internal' | 'enjambed';

/**
 * Result of segmenting a verse line into its rhyming unit.
 * `rhymingUnit` is the normalized token passed to the IPA/graphemic pipeline.
 * `position` describes the structural role of that unit within the line.
 * `syllableIndex`, when present, indicates which syllable of the last word
 * carries the rhyme (0-based from the end, so 0 = final syllable). It is
 * only provided when a meaningful syllable-level rhyme position is known.
 */
export type VerseRhymingSegment = {
  rhymingUnit: string;
  position: RhymePosition;
  originalText: string;
  syllableIndex?: number;
};

/**
 * Connector words that suggest a line is syntactically incomplete
 * (enjambement). Checked against the normalized last token.
 * Covers the most frequent Romance + Germanic cases.
 */
const ENJAMBMENT_CONNECTORS = new Set([
  // French
  'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car', 'que', 'qui', 'dont',
  'de', 'du', 'des', 'le', 'la', 'les', 'un', 'une', 'en', 'dans', 'par',
  'pour', 'sur', 'sous', 'avec', 'sans', 'vers', 'comme',
  // English
  'and', 'or', 'but', 'so', 'yet', 'nor', 'for', 'the', 'a', 'an',
  'of', 'in', 'on', 'at', 'to', 'by', 'from', 'with', 'into', 'like',
  // Spanish / Italian / Portuguese
  'y', 'e', 'o', 'pero', 'sino', 'porque', 'con', 'sin', 'por',
  // German / Dutch
  'und', 'oder', 'aber', 'weil', 'mit', 'ohne', 'von', 'en', 'maar', 'van',
  // Yoruba (ALGO-BNT)
  'ati', 'àti', 'àti', 'tabi', 'tàbí', 'tàbí', 'nitori', 'bi', 'ti', 'ni', 'si', 'fun',
  // Swahili (ALGO-BNT)
  'na', 'ya', 'wa', 'za', 'la', 'kwa', 'bila', 'hadi', 'au',
  // Dioula / Bambara (ALGO-KWA)
  'ani', 'walima', 'nka', 'fo', 'kɔ',
  // Baoulé (ALGO-KWA)
  'mɔ', 'kɛ', 'yɛ',
  // Ewe / Mina (ALGO-KWA)
  'kple', 'eye', 'ke', 'ne', 'le',
  // Lingala (ALGO-BNT)
  'mpe', 'to', 'kasi', 'po',
  // Nigerian Pidgin / Nouchi (ALGO-CRE)
  'pis', 'kon', 'sof', 'den', 'dem', 'wit',
  // Bekwarra / Ijaw (ALGO-CRV)
  'ma', 'be',
]);

/**
 * Families with agglutinative morphology where the last word of a line may
 * carry multiple candidate stress positions. For these families, we pick the
 * last stressed syllable (approximated as the last vowel-group boundary).
 */
const AGGLUTINATIVE_FAMILIES = new Set(['ALGO-TRK', 'ALGO-FIN', 'ALGO-KOR']);

/**
 * Detect whether a line contains an internal rhyme by scanning for a
 * repeated rhyme suffix pattern before the final word.
 *
 * Strategy: derive the last-vowel-group suffix for each candidate token and
 * for the end word, then check whether one suffix is a prefix of the other
 * (which handles trailing silent consonants, e.g. "nuit" suffix "uit" matches
 * "lui" suffix "ui" because "uit" starts with "ui"). The shared nucleus must
 * be at least 2 characters to avoid false positives on common single-vowel
 * endings like "e".
 *
 * Returns the mid-line token that mirrors the end rhyme, or null if none.
 */
const detectInternalRhymeToken = (tokens: string[], lastWord: string, langCode?: string): string | null => {
  if (tokens.length < 2) return null;

  // Derive last-vowel-group suffix for the end word.
  const lwVowelGroups = getVowelGroups(lastWord);
  const lwLastVG = lwVowelGroups.length > 0 ? lwVowelGroups[lwVowelGroups.length - 1]! : null;
  const lwSuffix = lwLastVG !== null
    ? canonicalizeRhymeSuffix(lastWord.slice(lwLastVG.start), langCode)
    : canonicalizeRhymeSuffix(lastWord, langCode);

  // A single-character nucleus is too common to be a meaningful internal rhyme.
  if (!lwSuffix || lwSuffix.length < 2) return null;

  const candidates = tokens.slice(0, -1);
  for (const token of candidates) {
    const normalized = normalizeWord(token, langCode);
    if (!normalized) continue;

    const vowelGroups = getVowelGroups(normalized);
    const lastVG = vowelGroups.length > 0 ? vowelGroups[vowelGroups.length - 1]! : null;
    const suffix = lastVG !== null
      ? canonicalizeRhymeSuffix(normalized.slice(lastVG.start), langCode)
      : canonicalizeRhymeSuffix(normalized, langCode);

    if (!suffix) continue;

    // One suffix must be a leading prefix of the other so that "uit"/"ui"
    // (nuit/lui) and "oir"/"oir" (soir/avoir) both match, while "e"/"are"
    // (marche/encore) do not. Require >= 2 shared characters.
    const shared = suffix.startsWith(lwSuffix)
      ? lwSuffix
      : lwSuffix.startsWith(suffix)
        ? suffix
        : null;

    if (shared && shared.length >= 2) return token;
  }
  return null;
};

/**
 * Step-0 of the rhyme pipeline: segment a raw verse line into its rhyming
 * unit before passing to G2P / IPA scoring.
 *
 * Rules applied in order:
 * 1. Strip trailing punctuation; tokenize on whitespace.
 * 2. For agglutinative families (TRK/FIN/KOR): take the last word, extract
 *    its last stressed syllable (last vowel-group), use that as rhymingUnit.
 * 3. Enjambement heuristic: if the last normalized token is a known connector
 *    word, mark position as 'enjambed' and use the penultimate content word.
 * 4. Internal rhyme detection: check whether any pre-final token shares the
 *    end-rhyme suffix. If found, mark position as 'internal'.
 * 5. Default: last word of line → position 'end'.
 *
 * Tonal languages (KWA/CRV/BNT/SIN/TAI/VIET): extractLastWord is called
 * without diacritic stripping so tone marks are preserved in rhymingUnit.
 *
 * @param line       Raw verse line text
 * @param langCode   ISO 639 code; undefined → ALGO-ROM rules
 * @returns          VerseRhymingSegment ready for pipeline step 1
 */
export const segmentVerseToRhymingUnit = (line: string, langCode?: string): VerseRhymingSegment => {
  const family = langCode ? getAlgoFamily(langCode) : undefined;

  // Tokenize: strip trailing punctuation then split on whitespace
  const stripped = line.trimEnd().replace(/[^\p{L}\p{N}\s]+$/u, '').trim();
  const tokens = stripped.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return { rhymingUnit: '', position: 'end', originalText: line };
  }

  // ── Agglutinative: pick last stressed syllable of last word ──────────────
  if (family && AGGLUTINATIVE_FAMILIES.has(family)) {
    const lastToken = tokens[tokens.length - 1]!;
    const normalized = normalizeWord(lastToken, langCode);
    const vowelGroups = getVowelGroups(normalized);
    // For non-Latin scripts (e.g. Hangul) normalizeWord may strip everything;
    // fall back to the original token so rhymingUnit is never empty.
    const rhymingUnit = vowelGroups.length > 0
      ? normalized.slice(vowelGroups[vowelGroups.length - 1]!.start)
      : (normalized || lastToken);
    return {
      rhymingUnit,
      position: 'end',
      originalText: line,
    };
  }

  // ── Enjambement heuristic ─────────────────────────────────────────────────
  const lastToken = tokens[tokens.length - 1]!;
  const lastNormalized = normalizeWord(lastToken, langCode);
  if (ENJAMBMENT_CONNECTORS.has(lastNormalized) && tokens.length >= 2) {
    const contentToken = tokens[tokens.length - 2]!;
    const contentNormalized = normalizeWord(contentToken, langCode);
    return {
      rhymingUnit: contentNormalized,
      position: 'enjambed',
      originalText: line,
    };
  }

  // ── Internal rhyme detection ──────────────────────────────────────────────
  const wordMatch = extractLastWord(stripped, langCode);
  if (wordMatch) {
    const internalToken = detectInternalRhymeToken(tokens, wordMatch.normalizedWord, langCode);
    if (internalToken) {
      return {
        rhymingUnit: wordMatch.normalizedWord,
        position: 'internal',
        originalText: line,
      };
    }
  }

  // ── Default: end rhyme ────────────────────────────────────────────────────
  const rhymingUnit = wordMatch ? wordMatch.normalizedWord : lastNormalized;
  return {
    rhymingUnit,
    position: 'end',
    originalText: line,
  };
};

// ─── Existing exports unchanged below ────────────────────────────────────────

const tokenize = (text: string) =>
  normalizeText(text)
    .split(' ')
    .map(token => token.trim())
    .filter(token => token.length > 2);

const getSongLines = (song: Section[]) =>
  song
    .flatMap(section => (section.lines ?? []).map(line => normalizeText(line.text ?? '')))
    .filter(Boolean);

const getSongTokens = (song: Section[]) => getSongLines(song).flatMap(tokenize);

const ratio = (intersection: number, union: number) => (union > 0 ? intersection / union : 0);

const getSetOverlapRatio = (left: string[], right: string[]) => {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersection = [...leftSet].filter(value => rightSet.has(value)).length;
  const union = new Set([...leftSet, ...rightSet]).size;
  return ratio(intersection, union);
};

const getSharedKeywords = (
  currentTokens: string[],
  candidateSong: Section[],
) => {
  const currentCounts = new Map<string, number>();
  const candidateCounts = new Map<string, number>();

  for (const token of currentTokens) {
    currentCounts.set(token, (currentCounts.get(token) || 0) + 1);
  }

  for (const token of getSongTokens(candidateSong)) {
    candidateCounts.set(token, (candidateCounts.get(token) || 0) + 1);
  }

  return [...currentCounts.entries()]
    .filter(([token]) => candidateCounts.has(token))
    .map(([token, count]) => ({
      token,
      weight: count + (candidateCounts.get(token) || 0),
    }))
    .sort((a, b) => b.weight - a.weight || a.token.localeCompare(b.token))
    .slice(0, 5)
    .map(item => item.token);
};

const getMatchedSections = (currentSong: Section[], candidateSong: Section[]) => {
  const candidateByName = new Map(
    candidateSong.map(section => [normalizeText(section.name), section] as const),
  );

  return currentSong
    .map((section) => {
      const candidateSection = candidateByName.get(normalizeText(section.name));
      if (!candidateSection) return null;

      const sectionScore = Math.round(
        getSetOverlapRatio(
          (section.lines ?? []).map(line => normalizeText(line.text ?? '')).filter(Boolean),
          (candidateSection.lines ?? []).map(line => normalizeText(line.text ?? '')).filter(Boolean),
        ) * 100,
      );

      if (sectionScore === 0) return null;

      return {
        name: section.name,
        score: sectionScore,
      };
    })
    .filter((section): section is SimilaritySectionMatch => section !== null)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
};

const calculateSimilarity = (
  currentLines: string[],
  currentTokens: string[],
  candidateSong: Section[],
  currentSong: Section[],
) => {
  const candidateLines = getSongLines(candidateSong);
  const candidateTokens = getSongTokens(candidateSong);
  const currentSections = currentSong.map(section => normalizeText(section.name));
  const candidateSections = candidateSong.map(section => normalizeText(section.name));

  const lineScore = getSetOverlapRatio(currentLines, candidateLines);
  const tokenScore = getSetOverlapRatio(currentTokens, candidateTokens);
  const structureScore = getSetOverlapRatio(currentSections, candidateSections);

  return Math.round((tokenScore * 0.6 + lineScore * 0.3 + structureScore * 0.1) * 100);
};

/**
 * Section-level lyric similarity and rhyme metadata live here.
 * For IPA phoneme distance/scoring, use ipaUtils.ts through ipaPipeline.ts.
 */
export const calculateSimilarityWithMetadata = (
  currentSong: Section[],
  candidateSong: Section[],
): Omit<SimilarityMatch, 'versionId' | 'versionName' | 'title' | 'timestamp'> => {
  const currentTokens = getSongTokens(currentSong);
  const currentLines = getSongLines(currentSong);
  const candidateTokens = getSongTokens(candidateSong);
  const candidateTokenSet = new Set(candidateTokens);
  const candidateLines = getSongLines(candidateSong);
  const candidateLineSet = new Set(candidateLines);

  const sharedWords = new Set(currentTokens.filter(token => candidateTokenSet.has(token))).size;
  const sharedLines = new Set(currentLines.filter(line => candidateLineSet.has(line))).size;

  return {
    score: calculateSimilarity(currentLines, currentTokens, candidateSong, currentSong),
    sharedWords,
    sharedLines,
    sharedKeywords: getSharedKeywords(currentTokens, candidateSong),
    matchedSections: getMatchedSections(currentSong, candidateSong).slice(0, 3),
  };
};

export const getTopSimilarSongMatches = (
  currentSong: Section[],
  versions: SongVersion[],
  _threshold = 0,
  limit = 3,
): SimilarityMatch[] => {
  if (currentSong.length === 0) return [];

  const currentTokens = getSongTokens(currentSong);
  const currentLines = getSongLines(currentSong);

  return versions
    .filter(version => (version.song ?? []).length > 0)
    .map((version) => {
      const candidateTokens = getSongTokens(version.song);
      const candidateTokenSet = new Set(candidateTokens);
      const candidateLines = getSongLines(version.song);
      const candidateLineSet = new Set(candidateLines);

      const sharedWords = new Set(currentTokens.filter(token => candidateTokenSet.has(token))).size;
      const sharedLines = new Set(currentLines.filter(line => candidateLineSet.has(line))).size;

      return {
        versionId: version.id,
        versionName: version.name,
        title: version.title,
        timestamp: version.timestamp,
        score: calculateSimilarity(currentLines, currentTokens, version.song, currentSong),
        sharedWords,
        sharedLines,
        sharedKeywords: getSharedKeywords(currentTokens, version.song),
        matchedSections: getMatchedSections(currentSong, version.song).slice(0, 3),
        method: 'graphemic' as const,
      };
    })
    .sort((a, b) => b.score - a.score || b.timestamp - a.timestamp)
    .slice(0, limit);
};
