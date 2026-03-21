import type { Line, Section } from '../types';
import { getSectionFamily } from '../constants/sections';
import { isPureMetaLine } from './metaUtils';
import { countSyllables } from './syllableUtils';
import { isTonalLanguage } from '../constants/langFamilyMap';
import { compareTextsWithIPA } from './ipaPipeline';

// Re-export for backward compatibility
export { countSyllables } from './syllableUtils';

export const getSectionText = (section: Section): string =>
  section.lines.map(l => l.text).join('\n');

export const getSongText = (song: Section[]): string =>
  song.map(getSectionText).join('\n\n');

export const getSectionColor = (name: string) => {
  const family = getSectionFamily(name);
  if (family === 'pre-chorus') return 'bg-orange-500/10 border-orange-500/20 text-orange-500';
  if (family === 'chorus') return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
  if (family === 'verse') return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500';
  if (family === 'contrast') return 'bg-violet-500/10 border-violet-500/20 text-violet-500';
  if (family === 'intro' || family === 'outro') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
  return 'bg-zinc-800/50 border-white/10 text-zinc-400';
};

export const getSectionTextColor = (name: string) => {
  const family = getSectionFamily(name);
  if (family === 'pre-chorus') return 'text-orange-500';
  if (family === 'chorus') return 'text-amber-500';
  if (family === 'verse') return 'text-cyan-400';
  if (family === 'contrast') return 'text-violet-500';
  if (family === 'intro' || family === 'outro') return 'text-emerald-500';
  return 'text-zinc-600 dark:text-zinc-400';
};

export const getSectionColorHex = (name: string): string => {
  const family = getSectionFamily(name);
  if (family === 'pre-chorus') return '#f97316';
  if (family === 'chorus') return '#f59e0b';
  if (family === 'verse') return '#06b6d4';
  if (family === 'contrast') return '#a78bfa';
  if (family === 'intro' || family === 'outro') return '#10b981';
  return '#71717a';
};

export const getSectionDotColor = (name: string) => {
  const family = getSectionFamily(name);
  if (family === 'pre-chorus') return 'bg-orange-500';
  if (family === 'chorus') return 'bg-amber-500';
  if (family === 'verse') return 'bg-cyan-500';
  if (family === 'contrast') return 'bg-violet-500';
  if (family === 'intro' || family === 'outro') return 'bg-emerald-500';
  return 'bg-zinc-500';
};

export function getSchemeLetterForLine(section: Section, lineIndex: number, rhymeScheme: string): string | null;
export function getSchemeLetterForLine(scheme: string | undefined, lineIndex: number): string | null;
export function getSchemeLetterForLine(
  sectionOrScheme: Section | string | undefined,
  lineIndex: number,
  rhymeScheme?: string,
): string | null {
  let scheme: string | undefined;
  if (typeof sectionOrScheme === 'object' && sectionOrScheme !== null) {
    scheme = rhymeScheme;
  } else {
    scheme = sectionOrScheme;
  }
  if (!scheme || typeof scheme !== 'string') return null;
  if (scheme.toUpperCase() === 'FREE') return null;
  const upper = scheme.toUpperCase();
  if (upper.length === 0) return null;
  const letter = upper[lineIndex % upper.length] ?? null;
  return letter === 'X' ? null : letter;
}

export const getRhymeColor = (rhyme: string | null | undefined): string => {
  if (!rhyme || typeof rhyme !== 'string') return 'bg-white/5 text-zinc-500 border-white/10';
  const r = rhyme.toUpperCase();
  if (r === 'A') return 'bg-blue-500/15 text-blue-500 border-blue-500/20';
  if (r === 'B') return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20';
  if (r === 'C') return 'bg-amber-500/15 text-amber-500 border-amber-500/20';
  if (r === 'D') return 'bg-purple-500/15 text-purple-500 border-purple-500/20';
  if (r === 'E') return 'bg-pink-500/15 text-pink-500 border-pink-500/20';
  if (r === 'F') return 'bg-cyan-500/15 text-cyan-500 border-cyan-500/20';
  if (r === 'G') return 'bg-rose-500/15 text-rose-500 border-rose-500/20';
  if (r === 'H') return 'bg-indigo-500/15 text-indigo-500 border-indigo-500/20';
  return 'bg-white/5 text-zinc-500 border-white/10';
};

export const getRhymeTextColor = (rhyme: string | null | undefined): string | null => {
  if (!rhyme || typeof rhyme !== 'string') return null;
  const r = rhyme.toUpperCase();
  if (r === 'A') return '#3b82f6';
  if (r === 'B') return '#10b981';
  if (r === 'C') return '#f59e0b';
  if (r === 'D') return '#a855f7';
  if (r === 'E') return '#ec4899';
  if (r === 'F') return '#06b6d4';
  if (r === 'G') return '#f43f5e';
  if (r === 'H') return '#6366f1';
  return null;
};

/**
 * Strip Unicode accents and lowercase — with optional tonal preservation.
 * For tonal languages (KWA, CRV families), tone diacritics are preserved.
 * @param s - The string to normalize
 * @param langCode - Optional language code for tonal language detection
 */
const normalizeWord = (s: string, langCode?: string): string => {
  const normalized = s.normalize('NFD');

  // For tonal languages, we preserve tone diacritics during normalization
  // This is a simplified approach - full implementation would handle tone more precisely
  const stripDiacritics = isTonalLanguage(langCode || '')
    ? normalized // Keep all diacritics for tonal languages for now
    : normalized.replace(/[\u0300-\u036f]/g, '');

  return stripDiacritics.toLowerCase().replace(/[^a-z\u0300-\u036f]/g, '');
};

type WordMatch = {
  lastWord: string;
  normalizedWord: string;
  wordStart: number;
};

type VowelSpan = { start: number; end: number };

type RhymeCandidate = {
  normalizedSuffix: string;
};

const VOWELS = 'aeiouy';

const isVowel = (ch: string) => VOWELS.includes(ch);

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
 */
const getVowelGroups = (normalizedWord: string): VowelSpan[] => {
  const vowelGroups: VowelSpan[] = [];
  let i = 0;
  while (i < normalizedWord.length) {
    if (isVowel(normalizedWord[i]!)) {
      const start = i;
      while (i < normalizedWord.length && isVowel(normalizedWord[i]!)) i++;
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
 */
const canonicalizeRhymeSuffix = (suffix: string): string => {
  const s = suffix.length <= 3 ? suffix : suffix.replace(/[sx]$/, '');
  if (/^oi/.test(s)) return 'oi';
  if (/^(?:an|en|am|em)/.test(s)) return 'an';
  if (/^(?:in|ain|ein|im|yn|ym)/.test(s)) return 'in';
  if (/^(?:on|om)/.test(s)) return 'on';
  if (/^(?:un|um)/.test(s)) return 'un';
  if (/^(?:eu|oeu|oe)/.test(s)) return 'eu';
  if (/^ou/.test(s)) return 'ou';
  if (/^(?:au|eau)/.test(s)) return 'au';
  return s;
};

const getRhymeCandidates = (text: string, langCode?: string): RhymeCandidate[] => {
  const word = extractLastWord(text, langCode);
  if (!word) return [];

  const vowelGroups = getVowelGroups(word.normalizedWord);
  if (vowelGroups.length === 0) {
    return [{
      normalizedSuffix: canonicalizeRhymeSuffix(word.normalizedWord),
    }];
  }

  return vowelGroups.map(({ start }) => ({
    normalizedSuffix: canonicalizeRhymeSuffix(word.normalizedWord.slice(start)),
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
  suffix.length >= 2 || (exactMatch && suffix.length === 1 && /^[aeiouy]$/.test(suffix));

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
 * Split a line at the start of a normalized suffix found inside its last word,
 * preserving the original spelling and trailing punctuation in the rhyming
 * fragment returned to the UI overlay.
 */
const splitLineAtNormalizedSuffix = (text: string, normalizedSuffix: string, langCode?: string): { before: string; rhyme: string } | null => {
  const word = extractLastWord(text, langCode);
  if (!word) return null;

  const suffixStart = word.normalizedWord.lastIndexOf(normalizedSuffix);
  if (suffixStart < 0) return null;

  const absoluteStart = word.wordStart + suffixStart;
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
  let bestSuffix: string | null = null;

  for (const peerLine of peerLines) {
    const sharedSuffix = findBestSharedRhymeSuffix(text, peerLine, langCode);
    if (sharedSuffix && (!bestSuffix || sharedSuffix.length > bestSuffix.length)) {
      bestSuffix = sharedSuffix;
    }
  }

  if (bestSuffix) {
    const split = splitLineAtNormalizedSuffix(text, bestSuffix, langCode);
    if (split) return split;
  }

  return getFallbackRhymingSuffix(text, langCode);
};

/**
 * Two lines rhyme when they share a strong enough rime suffix derived from
 * vowel-group candidates. This keeps scheme detection aligned with the same
 * rime logic used by the UI highlight overlay. Exact one-vowel matches are
 * allowed for short words such as "zéro" / "ego", while longer matches use a
 * suffix overlap.
 */
const rhymesLines = (a: string, b: string, langCode?: string): boolean => findBestSharedRhymeSuffix(a, b, langCode) !== null;

/**
 * IPA-based rhyme detection for two lines
 * Uses the full phonemic pipeline with feature-weighted distance
 * @param a - First line text
 * @param b - Second line text
 * @param langCode - Language code for IPA processing
 * @param threshold - Similarity threshold (default 0.75)
 * @returns Promise<boolean> indicating if lines rhyme
 */
const rhymesLinesIPA = async (a: string, b: string, langCode: string, threshold = 0.75): Promise<boolean> => {
  try {
    const similarity = await compareTextsWithIPA(a, b, langCode);
    return similarity.score >= threshold;
  } catch (error) {
    // Fallback to graphemic if IPA fails
    console.debug('IPA rhyme detection failed, falling back to graphemic:', error);
    return rhymesLines(a, b, langCode);
  }
};

/**
 * Client-side rhyme scheme detector — fallback when the AI returns FREE.
 * @param lines - Array of line texts to analyze
 * @param langCode - Optional language code for tonal preservation
 */
export function detectRhymeSchemeLocally(lines: string[], langCode?: string): string | null {
  const lyricLines = lines.filter(l => l.trim().length > 0);
  const n = lyricLines.length;
  if (n < 2) return null;

  const letters: (string | null)[] = new Array(n).fill(null);
  let nextLetter = 0;
  const LETTERS = 'ABCDEFGH';

  for (let i = 0; i < n; i++) {
    if (letters[i] !== null) continue;
    let matchedLetter: string | null = null;
    for (let j = 0; j < i; j++) {
      if (rhymesLines(lyricLines[i]!, lyricLines[j]!, langCode)) {
        matchedLetter = letters[j]!;
        break;
      }
    }
    if (matchedLetter) {
      letters[i] = matchedLetter;
      } else {
        letters[i] = LETTERS[nextLetter] ?? String.fromCharCode(65 + nextLetter);
        nextLetter++;
      }
    for (let k = i + 1; k < n; k++) {
      if (letters[k] === null && rhymesLines(lyricLines[i]!, lyricLines[k]!, langCode)) {
        letters[k] = letters[i]!;
      }
    }
  }

  const letterCounts: Record<string, number> = {};
  for (const l of letters) {
    if (l) letterCounts[l] = (letterCounts[l] ?? 0) + 1;
  }

  const counts = new Map<string, number>(Object.entries(letterCounts));
  const remap = new Map<string, string>();
  let remapIndex = 0;
  const finalLetters = letters.map((letter) => {
    if (!letter || (counts.get(letter) ?? 0) < 2) return null;
    if (!remap.has(letter)) {
      remap.set(letter, LETTERS[remapIndex] ?? String.fromCharCode(65 + remapIndex));
      remapIndex++;
    }
    return remap.get(letter)!;
  });
  if (!finalLetters.some(Boolean)) return null;
  return finalLetters.map(l => l ?? 'X').join('');
}

/**
 * IPA-based rhyme scheme detector (experimental)
 * Uses phonemic similarity instead of graphemic matching
 * @param lines - Array of line texts to analyze
 * @param langCode - Language code (required for IPA processing)
 * @param threshold - Similarity threshold (default 0.75)
 * @returns Promise<string | null> - The detected rhyme scheme
 */
export async function detectRhymeSchemeLocallyIPA(
  lines: string[],
  langCode: string,
  threshold = 0.75
): Promise<string | null> {
  const lyricLines = lines.filter(l => l.trim().length > 0);
  const n = lyricLines.length;
  if (n < 2) return null;

  const letters: (string | null)[] = new Array(n).fill(null);
  let nextLetter = 0;
  const LETTERS = 'ABCDEFGH';

  for (let i = 0; i < n; i++) {
    if (letters[i] !== null) continue;
    let matchedLetter: string | null = null;
    for (let j = 0; j < i; j++) {
      if (await rhymesLinesIPA(lyricLines[i]!, lyricLines[j]!, langCode, threshold)) {
        matchedLetter = letters[j]!;
        break;
      }
    }
    if (matchedLetter) {
      letters[i] = matchedLetter;
    } else {
      letters[i] = LETTERS[nextLetter] ?? String.fromCharCode(65 + nextLetter);
      nextLetter++;
    }
    for (let k = i + 1; k < n; k++) {
      if (letters[k] === null && await rhymesLinesIPA(lyricLines[i]!, lyricLines[k]!, langCode, threshold)) {
        letters[k] = letters[i]!;
      }
    }
  }

  const letterCounts: Record<string, number> = {};
  for (const l of letters) {
    if (l) letterCounts[l] = (letterCounts[l] ?? 0) + 1;
  }

  const counts = new Map<string, number>(Object.entries(letterCounts));
  const remap = new Map<string, string>();
  let remapIndex = 0;
  const finalLetters = letters.map((letter) => {
    if (!letter || (counts.get(letter) ?? 0) < 2) return null;
    if (!remap.has(letter)) {
      remap.set(letter, LETTERS[remapIndex] ?? String.fromCharCode(65 + remapIndex));
      remapIndex++;
    }
    return remap.get(letter)!;
  });
  if (!finalLetters.some(Boolean)) return null;
  return finalLetters.map(l => l ?? 'X').join('');
}

export { DEFAULT_STRUCTURE, MUSICAL_INSTRUCTIONS } from '../constants/editor';

export const cleanSectionName = (name: string) => {
  if (!name) return '';
  return name.replace(/[\[\]\*]/g, '').trim();
};

const computeLineSyllables = (text: string): number =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .reduce((acc, word) => acc + countSyllables(word), 0);

export const normalizeLoadedLine = (line: Record<string, unknown>): Line => {
  const text = typeof line['text'] === 'string' ? line['text'] : '';
  const isMeta = typeof line['isMeta'] === 'boolean' ? line['isMeta'] : isPureMetaLine(text.trim());
  const rawSyllables = typeof line['syllables'] === 'number'
    ? line['syllables']
    : typeof line['syllables'] === 'string'
      ? Number(line['syllables'])
      : NaN;
  const canUseStoredSyllables = Number.isFinite(rawSyllables)
    && (rawSyllables > 0 || isMeta || text.trim().length === 0);
  const syllables = canUseStoredSyllables
    ? rawSyllables
    : (!isMeta && text.trim().length > 0 ? computeLineSyllables(text) : 0);

  return {
    id: typeof line['id'] === 'string' ? line['id'] : '',
    text,
    rhymingSyllables: typeof line['rhymingSyllables'] === 'string' ? line['rhymingSyllables'] : '',
    rhyme: typeof line['rhyme'] === 'string' ? line['rhyme'] : '',
    syllables,
    concept: typeof line['concept'] === 'string' ? line['concept'] : 'New line',
    isMeta,
    isManual: typeof line['isManual'] === 'boolean' ? line['isManual'] : false,
  };
};

export const normalizeLoadedSection = (section: Record<string, unknown>): Section => {
  const lines = Array.isArray(section['lines'])
    ? (section['lines'] as Record<string, unknown>[]).map(normalizeLoadedLine)
    : [];
  const storedScheme = typeof section['rhymeScheme'] === 'string' ? section['rhymeScheme'].trim() : '';
  const lyricTexts = lines.filter(line => !line.isMeta && line.text.trim().length > 0).map(line => line.text);
  const langCode = typeof section['language'] === 'string' ? section['language'] : undefined;
  const detectedScheme = (storedScheme.length === 0 || storedScheme.toUpperCase() === 'FREE')
    ? detectRhymeSchemeLocally(lyricTexts, langCode) ?? undefined
    : undefined;

  return {
    id: typeof section['id'] === 'string' ? section['id'] : '',
    name: cleanSectionName(typeof section['name'] === 'string' ? section['name'] : ''),
    rhymeScheme: detectedScheme ?? (storedScheme || undefined),
    targetSyllables: typeof section['targetSyllables'] === 'number' ? section['targetSyllables'] : undefined,
    mood: typeof section['mood'] === 'string' ? section['mood'] : '',
    preInstructions: Array.isArray(section['preInstructions']) ? (section['preInstructions'] as string[]) : [],
    postInstructions: Array.isArray(section['postInstructions']) ? (section['postInstructions'] as string[]) : [],
    language: typeof section['language'] === 'string' ? section['language'] : undefined,
    lines,
  };
};
