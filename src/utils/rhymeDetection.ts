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

const VOWELS = new Set([
  'a', 'e', 'i', 'o', 'u', 'y',
  '\u0251', '\u0252', '\u0254', '\u025b', '\u0153', '\u00f8', '\u026a', '\u028a', '\u028c', '\u0259', '\u0268', '\u0275', '\u025c', '\u025e', '\u0250', '\u0289', '\u026f', '\u0264',
  '\u00e4', '\u00f6', '\u00fc', '\u00e5',
  '\u00e6', '\u00f8',
  '\u044b', '\u044d', '\u044f', '\u044e', '\u0435', '\u0451', '\u0438',
  '\u0101', '\u012b', '\u016b', '\u1e5b', '\u1e37', '\u0113', '\u014d', 'ai', 'au',
]);

const isVowel = (ch: string) => VOWELS.has(ch);

const normalizeWord = (s: string, langCode?: string): string => {
  const normalized = s.normalize('NFD');
  const stripDiacritics = isTonalLanguage(langCode || '')
    ? normalized
    : normalized.replace(/[\u0300-\u036f]/g, '');
  return stripDiacritics.toLowerCase().replace(/[^a-z\u0300-\u036f]/g, '');
};

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
    return [{ normalizedSuffix: canonicalizeRhymeSuffix(word.normalizedWord, langCode) }];
  }
  return vowelGroups.map(({ start }) => ({
    normalizedSuffix: canonicalizeRhymeSuffix(word.normalizedWord.slice(start), langCode),
  }));
};

const getLongestCommonSuffix = (a: string, b: string): string => {
  let sharedLength = 0;
  while (
    sharedLength < a.length &&
    sharedLength < b.length &&
    a[a.length - 1 - sharedLength] === b[b.length - 1 - sharedLength]
  ) {
    sharedLength++;
  }
  return sharedLength > 0 ? a.slice(a.length - sharedLength) : '';
};

const isSharedRhymeStrongEnough = (suffix: string, exactMatch: boolean): boolean =>
  suffix.length >= 2 || (exactMatch && suffix.length === 1 && isVowel(suffix));

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

const FRENCH_DIGRAPHS = new Set(['ai', 'ei', 'oi', 'ou', 'au', 'eu']);

const extendToVowelOnset = (normalizedWord: string, suffixStart: number): number => {
  if (suffixStart <= 0) return suffixStart;
  let pos = suffixStart;
  if (!isVowel(normalizedWord[pos]!)) {
    while (pos >= 0 && !isVowel(normalizedWord[pos]!)) pos--;
    if (pos < 0) return suffixStart;
  }
  if (pos >= 1 && isVowel(normalizedWord[pos - 1]!)) {
    const digraph = normalizedWord[pos - 1]! + normalizedWord[pos]!;
    if (FRENCH_DIGRAPHS.has(digraph)) return pos - 1;
  }
  return pos;
};

const splitLineAtNormalizedSuffix = (
  text: string,
  normalizedSuffix: string,
  langCode?: string,
): { before: string; rhyme: string } | null => {
  const word = extractLastWord(text, langCode);
  if (!word) return null;
  const suffixStart = word.normalizedWord.lastIndexOf(normalizedSuffix);
  if (suffixStart < 0) return null;
  const effectiveStart = isTonalLanguage(langCode || '')
    ? suffixStart
    : extendToVowelOnset(word.normalizedWord, suffixStart);
  const absoluteStart = word.wordStart + effectiveStart;
  return { before: text.slice(0, absoluteStart), rhyme: text.slice(absoluteStart) };
};

const getFallbackRhymingSuffix = (
  text: string,
  langCode?: string,
): { before: string; rhyme: string } | null => {
  const word = extractLastWord(text, langCode);
  if (!word) return null;
  const vowelGroups = getVowelGroups(word.normalizedWord);
  if (vowelGroups.length === 0) {
    return { before: text.slice(0, word.wordStart), rhyme: text.slice(word.wordStart) };
  }
  return splitLineAtNormalizedSuffix(
    text,
    word.normalizedWord.slice(vowelGroups[vowelGroups.length - 1]!.start),
    langCode,
  );
};

// ─── Step-0: verse segmentation ───────────────────────────────────────────────

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
  'y', 'e', 'o', 'pero', 'sino', 'porque', 'que', 'con', 'sin', 'por',
  // German / Dutch
  'und', 'oder', 'aber', 'weil', 'mit', 'ohne', 'von', 'en', 'maar', 'van',
  // Yoruba (ALGO-BNT)
  'ati', '\u00e0ti', 'tabi', 't\u00e0b\u00ed', 'nitori', 'bi', 'ti', 'ni', 'si', 'fun',
  // Swahili (ALGO-BNT)
  'na', 'ya', 'wa', 'za', 'la', 'kwa', 'bila', 'hadi', 'au',
  // Dioula / Bambara (ALGO-KWA)
  'ni', 'ka', 'ani', 'walima', 'nka', 'fo', 'k\u0254',
  // Baoul\u00e9 (ALGO-KWA)
  'm\u0254', 'k\u025b', 'y\u025b',
  // Ewe / Mina (ALGO-KWA)
  'kple', 'eye', 'ke', 'ne', 'le',
  // Lingala (ALGO-BNT)
  'mpe', 'to', 'kasi', 'po', 'na',
  // Nigerian Pidgin / Nouchi (ALGO-CRE)
  'pis', 'kon', 'sof', 'den', 'dem', 'wit', 'fo',
  // Bekwarra / Ijaw (ALGO-CRV)
  'ma', 'be', 'ke',
]);

const AGGLUTINATIVE_FAMILIES = new Set(['ALGO-TRK', 'ALGO-FIN', 'ALGO-KOR']);

const detectInternalRhymeToken = (
  tokens: string[],
  lastWord: string,
  langCode?: string,
): string | null => {
  if (tokens.length < 2) return null;
  const lwVowelGroups = getVowelGroups(lastWord);
  const lwLastVG = lwVowelGroups.length > 0 ? lwVowelGroups[lwVowelGroups.length - 1]! : null;
  const lwSuffix =
    lwLastVG !== null
      ? canonicalizeRhymeSuffix(lastWord.slice(lwLastVG.start), langCode)
      : canonicalizeRhymeSuffix(lastWord, langCode);
  if (!lwSuffix || lwSuffix.length < 2) return null;
  const candidates = tokens.slice(0, -1);
  for (const token of candidates) {
    const normalized = normalizeWord(token, langCode);
    if (!normalized) continue;
    const vowelGroups = getVowelGroups(normalized);
    const lastVG = vowelGroups.length > 0 ? vowelGroups[vowelGroups.length - 1]! : null;
    const suffix =
      lastVG !== null
        ? canonicalizeRhymeSuffix(normalized.slice(lastVG.start), langCode)
        : canonicalizeRhymeSuffix(normalized, langCode);
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

export const segmentVerseToRhymingUnit = (
  line: string,
  langCode?: string,
): VerseRhymingSegment => {
  const family = langCode ? getAlgoFamily(langCode) : undefined;
  const stripped = line.trimEnd().replace(/[^\p{L}\p{N}\s]+$/u, '').trim();
  const tokens = stripped.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return { rhymingUnit: '', position: 'end', originalText: line };
  }
  // Agglutinative: last stressed syllable
  if (family && AGGLUTINATIVE_FAMILIES.has(family)) {
    const lastToken = tokens[tokens.length - 1]!;
    const normalized = normalizeWord(lastToken, langCode);
    const vowelGroups = getVowelGroups(normalized);
    const rhymingUnit =
      vowelGroups.length > 0
        ? normalized.slice(vowelGroups[vowelGroups.length - 1]!.start)
        : normalized || lastToken;
    return { rhymingUnit, position: 'end', originalText: line };
  }
  // Enjambement
  const lastToken = tokens[tokens.length - 1]!;
  const lastNormalized = normalizeWord(lastToken, langCode);
  if (ENJAMBMENT_CONNECTORS.has(lastNormalized) && tokens.length >= 2) {
    const contentToken = tokens[tokens.length - 2]!;
    return {
      rhymingUnit: normalizeWord(contentToken, langCode),
      position: 'enjambed',
      originalText: line,
    };
  }
  // Internal rhyme
  const wordMatch = extractLastWord(stripped, langCode);
  if (wordMatch) {
    const internalToken = detectInternalRhymeToken(tokens, wordMatch.normalizedWord, langCode);
    if (internalToken) {
      return { rhymingUnit: wordMatch.normalizedWord, position: 'internal', originalText: line };
    }
  }
  // Default: end rhyme
  const rhymingUnit = wordMatch ? wordMatch.normalizedWord : lastNormalized;
  return { rhymingUnit, position: 'end', originalText: line };
};

/**
 * Split a line at the start of a rhyming suffix.
 *
 * FIX (enjambed): when Step-0 detects an enjambed line, the trailing connector
 * token is stripped from `text` before calling splitLineAtNormalizedSuffix so
 * the highlight targets the content word, not the connector.
 */
export const splitRhymingSuffix = (
  text: string,
  peerLines: string[] = [],
  langCode?: string,
): { before: string; rhyme: string } | null => {
  const segment = segmentVerseToRhymingUnit(text, langCode);

  // FIX: for enjambed lines, strip the trailing connector so the split
  // operates on the text up to (and including) the content word.
  const effectiveText =
    segment.position === 'enjambed'
      ? text.trimEnd().replace(/\s+\S+$/, '') // strip last token (the connector)
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

export const doLinesRhymeGraphemic = (a: string, b: string, langCode?: string): boolean => {
  const segA = segmentVerseToRhymingUnit(a, langCode);
  const segB = segmentVerseToRhymingUnit(b, langCode);
  return findBestSharedRhymeSuffix(segA.rhymingUnit, segB.rhymingUnit, langCode) !== null;
};

// ─── Similarity / song-level utilities ────────────────────────────────────────

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
    .map(([token, count]) => ({ token, weight: count + (candidateCounts.get(token) || 0) }))
    .sort((a, b) => b.weight - a.weight || a.token.localeCompare(b.token))
    .slice(0, 5)
    .map(item => item.token);
};

const getMatchedSections = (currentSong: Section[], candidateSong: Section[]) => {
  const candidateByName = new Map(
    candidateSong.map(section => [normalizeText(section.name), section] as const),
  );
  return currentSong
    .map(section => {
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
  _threshold = 0,
  limit = 3,
): SimilarityMatch[] => {
  if (currentSong.length === 0) return [];
  const currentTokens = getSongTokens(currentSong);
  const currentLines = getSongLines(currentSong);
  return versions
    .filter(version => (version.song ?? []).length > 0)
    .map(version => {
      const candidateTokens = getSongTokens(version.song);
      const candidateTokenSet = new Set(candidateTokens);
      const candidateLines = getSongLines(version.song);
      const candidateLineSet = new Set(candidateLines);
      const sharedWords = new Set(
        currentTokens.filter(token => candidateTokenSet.has(token)),
      ).size;
      const sharedLines = new Set(
        currentLines.filter(line => candidateLineSet.has(line)),
      ).size;
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
