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

type RhymeMatchOptions = {
  forScheme?: boolean;
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
 */
const extractLastWord = (text: string, langCode?: string): WordMatch | null => {
  const trimmedText = text.trimEnd().replace(/[^\p{L}\p{N}]+$/u, '');
  if (!trimmedText) return null;
  const lastWordMatch = /[\p{L}\p{N}]+$/u.exec(trimmedText);
  if (!lastWordMatch) return null;
  const lastWord = lastWordMatch[0];
  const normalizedWord = normalizeWord(lastWord, langCode);
  if (!normalizedWord) return null;
  return { lastWord, normalizedWord, wordStart: lastWordMatch.index };
};

/**
 * Identify contiguous vowel groups inside a normalized word.
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
 * Canonicalize a Romance rhyme suffix to a phonemic equivalence class.
 *
 * CHANGED from previous version:
 * - Removed `ace/asse → 'as'`: those two endings don't rhyme with each other
 *   cross-word (e.g. "espace" vs "passe") and merging them caused false
 *   AABB groupings when the actual rhyme families were distinct.
 * - Each nasal/vowel cluster is kept as a separate canonical form so that
 *   suffix-overlap matching can still pair words within the same class
 *   (e.g. "balance"/"chance" → both → 'an') without bleeding across classes.
 * - Non-Romance families pass through unchanged; the IPA pipeline handles
 *   their phonemic equivalences.
 *
 * When langCode is absent the Romance rules apply as a safe default,
 * preserving existing behaviour for callers that don't pass a language.
 */
const canonicalizeRhymeSuffix = (suffix: string, langCode?: string): string => {
  const s = suffix.length <= 3 ? suffix : suffix.replace(/[sx]$/, '');

  const family = langCode ? getAlgoFamily(langCode) : undefined;
  const isRomance = !family || family === 'ALGO-ROM';

  if (isRomance) {
    // Nasal vowels — kept separate so cross-class bleeding is prevented
    if (/^(?:an|en|am|em)/.test(s)) return 'an';
    if (/^(?:in|ain|ein|im|yn|ym)/.test(s)) return 'in';
    if (/^(?:on|om)/.test(s)) return 'on';
    if (/^(?:un|um)/.test(s)) return 'un';
    // Oral vowel digraphs
    if (/^oi/.test(s)) return 'oi';
    if (/^(?:eu|oeu|oe)/.test(s)) return 'eu';
    if (/^ou/.test(s)) return 'ou';
    if (/^(?:au|eau)/.test(s)) return 'au';
    // NOTE: ace/asse merger intentionally removed — they represent different
    // phoneme sequences ([as] vs [as(ə)]) and should not be coerced into the
    // same bucket. Suffix-overlap via getLongestCommonSuffix already handles
    // near-identical endings naturally.
  }

  return s;
};

/**
 * Return the canonicalized suffix starting from the last vowel group of a
 * normalized word.
 */
const getLastVowelGroupSuffix = (normalizedWord: string, langCode?: string): string => {
  const vowelGroups = getVowelGroups(normalizedWord);
  return vowelGroups.length > 0
    ? canonicalizeRhymeSuffix(normalizedWord.slice(vowelGroups[vowelGroups.length - 1]!.start), langCode)
    : canonicalizeRhymeSuffix(normalizedWord, langCode);
};

const getRhymeCandidates = (text: string, langCode?: string): RhymeCandidate[] => {
  const word = extractLastWord(text, langCode);
  if (!word) return [];
  const vowelGroups = getVowelGroups(word.normalizedWord);
  if (vowelGroups.length === 0) {
    return [{ normalizedSuffix: canonicalizeRhymeSuffix(word.normalizedWord, langCode) }];
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
 * Determine whether a shared suffix is strong enough to count as a rhyme.
 *
 * Rules (in order):
 * 1. For scheme detection in Romance languages: require >= 3 shared chars.
 *    This prevents single-vowel (`e`, `a`) and two-char consonant-final
 *    overlaps (`ce`/`ge`, `se`/`ze`) from creating spurious rhyme families
 *    across phonetically unrelated endings like -espace/-visage.
 * 2. For non-scheme (highlight) mode: >= 2 chars suffices as before.
 * 3. Single-vowel exact match allowed for monosyllabic words ("zéro"/"ego"),
 *    but mute-e is still blocked for Romance scheme detection.
 */
const isSharedRhymeStrongEnough = (
  suffix: string,
  exactMatch: boolean,
  langCode?: string,
  options?: RhymeMatchOptions,
): boolean => {
  const family = langCode ? getAlgoFamily(langCode) : undefined;
  const isRomance = !family || family === 'ALGO-ROM';

  // Scheme detection: stricter minimum to avoid cross-family false positives
  if (options?.forScheme && isRomance) {
    if (suffix.length >= 3) return true;
    // Allow exact canonical matches of length 2 for closed nasal/oral classes
    // (e.g. 'an', 'in', 'on', 'un', 'ou', 'oi', 'eu', 'au') but block raw
    // two-char overlaps like 'ce', 'se', 'ge' that appear across distinct endings.
    const CANONICAL_DIGRAPHS = new Set(['an', 'in', 'on', 'un', 'ou', 'oi', 'eu', 'au']);
    if (exactMatch && suffix.length === 2 && CANONICAL_DIGRAPHS.has(suffix)) return true;
    // Block mute-e single-vowel exact match
    if (exactMatch && suffix.length === 1 && isVowel(suffix) && suffix !== 'e') return true;
    return false;
  }

  // Non-scheme or non-Romance: original behaviour
  if (suffix.length >= 2) return true;
  if (!(exactMatch && suffix.length === 1 && isVowel(suffix))) return false;
  if (options?.forScheme && suffix === 'e') return false;
  return true;
};

/**
 * Compare every vowel-group-based candidate suffix from two lines and keep the
 * longest shared rime that is strong enough to count as an actual rhyme.
 */
const findBestSharedRhymeSuffix = (
  a: string,
  b: string,
  langCode?: string,
  options?: RhymeMatchOptions,
): string | null => {
  const aCandidates = getRhymeCandidates(a, langCode);
  const bCandidates = getRhymeCandidates(b, langCode);
  let bestMatch = '';

  for (const aCandidate of aCandidates) {
    for (const bCandidate of bCandidates) {
      const exactMatch = aCandidate.normalizedSuffix === bCandidate.normalizedSuffix;
      const sharedSuffix = exactMatch
        ? aCandidate.normalizedSuffix
        : getLongestCommonSuffix(aCandidate.normalizedSuffix, bCandidate.normalizedSuffix);
      if (!isSharedRhymeStrongEnough(sharedSuffix, exactMatch, langCode, options)) continue;
      if (sharedSuffix.length > bestMatch.length) bestMatch = sharedSuffix;
    }
  }

  return bestMatch || null;
};

/**
 * Known French vowel digraphs — two-vowel sequences representing a single
 * phoneme.
 */
const FRENCH_DIGRAPHS = new Set(['ai', 'ei', 'oi', 'ou', 'au', 'eu']);

/**
 * Extend a shared-suffix position backward to include the preceding vowel
 * onset so the UI highlights complete French rimes.
 */
const extendToVowelOnset = (normalizedWord: string, suffixStart: number): number => {
  if (suffixStart <= 0) return suffixStart;
  let pos = suffixStart;
  if (!isVowel(normalizedWord[pos]!)) {
    while (pos > 0 && !isVowel(normalizedWord[pos]!)) pos--;
    if (!isVowel(normalizedWord[pos]!)) return suffixStart;
  }
  if (pos >= 1 && isVowel(normalizedWord[pos - 1]!)) {
    const digraph = normalizedWord[pos - 1]! + normalizedWord[pos]!;
    if (FRENCH_DIGRAPHS.has(digraph)) return pos - 1;
  }
  return pos;
};

/**
 * Split a line at the start of a normalized suffix found inside its last word.
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
 * Fallback: highlight from the last vowel group of the word.
 */
const getFallbackRhymingSuffix = (text: string, langCode?: string): { before: string; rhyme: string } | null => {
  const word = extractLastWord(text, langCode);
  if (!word) return null;
  const suffix = getLastVowelGroupSuffix(word.normalizedWord, langCode);
  if (!suffix) {
    return { before: text.slice(0, word.wordStart), rhyme: text.slice(word.wordStart) };
  }
  return splitLineAtNormalizedSuffix(text, suffix, langCode);
};

const removeTrailingToken = (text: string): string => text.trimEnd().replace(/\s+\S+$/, '');

export const splitRhymingSuffix = (text: string, peerLines: string[] = [], langCode?: string): { before: string; rhyme: string } | null => {
  const segment = segmentVerseToRhymingUnit(text, langCode);
  const effectiveText = segment.position === 'enjambed' ? removeTrailingToken(text) : text;
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

export const doLinesRhymeGraphemic = (
  a: string,
  b: string,
  langCode?: string,
  options?: RhymeMatchOptions,
): boolean => {
  const segA = segmentVerseToRhymingUnit(a, langCode);
  const segB = segmentVerseToRhymingUnit(b, langCode);
  return findBestSharedRhymeSuffix(segA.rhymingUnit, segB.rhymingUnit, langCode, options) !== null;
};

// ─── Step-0: verse segmentation ──────────────────────────────────────────────

export type RhymePosition = 'end' | 'internal' | 'enjambed';

export type VerseRhymingSegment = {
  rhymingUnit: string;
  position: RhymePosition;
  originalText: string;
  syllableIndex?: number;
};

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
  'ati', 'àti', 'tabi', 'tàbí', 'nitori', 'bi', 'ti', 'ni', 'si', 'fun',
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

const isEnjambmentConnector = (normalizedToken: string): boolean =>
  ENJAMBMENT_CONNECTORS.has(normalizedToken) || ENJAMBMENT_CONNECTORS.has(normalizedToken.normalize('NFC'));

const AGGLUTINATIVE_FAMILIES = new Set(['ALGO-TRK', 'ALGO-FIN', 'ALGO-KOR']);

const detectInternalRhymeToken = (tokens: string[], lastWord: string, langCode?: string): string | null => {
  if (tokens.length < 2) return null;
  const lwSuffix = getLastVowelGroupSuffix(lastWord, langCode);
  if (!lwSuffix || lwSuffix.length < 2) return null;
  const candidates = tokens.slice(0, -1);
  for (const token of candidates) {
    const normalized = normalizeWord(token, langCode);
    if (!normalized) continue;
    const suffix = getLastVowelGroupSuffix(normalized, langCode);
    if (!suffix) continue;
    const shared = suffix.startsWith(lwSuffix)
      ? lwSuffix
      : lwSuffix.startsWith(suffix)
        ? suffix
        : null;
    if (shared && shared.length >= 2) return token;
  }
  return null;
};

export const segmentVerseToRhymingUnit = (line: string, langCode?: string): VerseRhymingSegment => {
  const family = langCode ? getAlgoFamily(langCode) : undefined;
  const stripped = line.trimEnd().replace(/[^\p{L}\p{N}\s]+$/u, '').trim();
  const tokens = stripped.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return { rhymingUnit: '', position: 'end', originalText: line };
  }

  if (family && AGGLUTINATIVE_FAMILIES.has(family)) {
    const lastToken = tokens[tokens.length - 1]!;
    const normalized = normalizeWord(lastToken, langCode);
    const vowelGroups = getVowelGroups(normalized);
    const rhymingUnit = vowelGroups.length > 0
      ? normalized.slice(vowelGroups[vowelGroups.length - 1]!.start)
      : (normalized || lastToken);
    return { rhymingUnit, position: 'end', originalText: line };
  }

  const lastToken = tokens[tokens.length - 1]!;
  const lastNormalized = normalizeWord(lastToken, langCode);
  if (isEnjambmentConnector(lastNormalized) && tokens.length >= 2) {
    const contentToken = tokens[tokens.length - 2]!;
    const contentNormalized = normalizeWord(contentToken, langCode);
    return { rhymingUnit: contentNormalized, position: 'enjambed', originalText: line };
  }

  const wordMatch = extractLastWord(stripped, langCode);
  if (wordMatch) {
    const internalToken = detectInternalRhymeToken(tokens, wordMatch.normalizedWord, langCode);
    if (internalToken) {
      return { rhymingUnit: wordMatch.normalizedWord, position: 'internal', originalText: line };
    }
  }

  const rhymingUnit = wordMatch ? wordMatch.normalizedWord : lastNormalized;
  return { rhymingUnit, position: 'end', originalText: line };
};

// ─── Similarity / song-level exports (unchanged) ─────────────────────────────

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

const getSharedKeywords = (currentTokens: string[], candidateSong: Section[]) => {
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
      return { name: section.name, score: sectionScore };
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
