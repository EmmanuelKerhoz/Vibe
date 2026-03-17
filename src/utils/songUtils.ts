import type { Section } from '../types';

export const getSectionText = (section: Section): string =>
  section.lines.map(l => l.text).join('\n');

export const getSongText = (song: Section[]): string =>
  song.map(getSectionText).join('\n\n');

export const getSectionColor = (name: string) => {
  const n = (name ?? '').toLowerCase();
  if (n.includes('pre-chorus') || n.includes('prechorus')) return 'bg-orange-500/10 border-orange-500/20 text-orange-500';
  if (n.includes('chorus')) return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
  if (n.includes('verse')) return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500';
  if (n.includes('bridge') || n.includes('breakdown')) return 'bg-violet-500/10 border-violet-500/20 text-violet-500';
  if (n.includes('intro') || n.includes('outro')) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
  return 'bg-zinc-800/50 border-white/10 text-zinc-400';
};

export const getSectionTextColor = (name: string) => {
  const n = (name ?? '').toLowerCase();
  if (n.includes('pre-chorus') || n.includes('prechorus')) return 'text-orange-500';
  if (n.includes('chorus')) return 'text-amber-500';
  if (n.includes('verse')) return 'text-cyan-400';
  if (n.includes('bridge') || n.includes('breakdown')) return 'text-violet-500';
  if (n.includes('intro') || n.includes('outro')) return 'text-emerald-500';
  return 'text-zinc-600 dark:text-zinc-400';
};

export const getSectionColorHex = (name: string): string => {
  const n = (name ?? '').toLowerCase();
  if (n.includes('pre-chorus') || n.includes('prechorus')) return '#f97316';
  if (n.includes('chorus')) return '#f59e0b';
  if (n.includes('verse')) return '#06b6d4';
  if (n.includes('bridge') || n.includes('breakdown')) return '#a78bfa';
  if (n.includes('intro') || n.includes('outro')) return '#10b981';
  return '#71717a';
};

export const getSectionDotColor = (name: string) => {
  const n = (name ?? '').toLowerCase();
  if (n.includes('pre-chorus') || n.includes('prechorus')) return 'bg-orange-500';
  if (n.includes('chorus')) return 'bg-amber-500';
  if (n.includes('verse')) return 'bg-cyan-500';
  if (n.includes('bridge') || n.includes('breakdown')) return 'bg-violet-500';
  if (n.includes('intro') || n.includes('outro')) return 'bg-emerald-500';
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
  return upper[lineIndex % upper.length] ?? null;
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
 * Strip Unicode accents and lowercase — language-agnostic.
 */
const normalizeWord = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');

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
 */
const extractLastWord = (text: string): WordMatch | null => {
  const trimmedText = text.trimEnd().replace(/[^\p{L}\p{N}]+$/u, '');
  if (!trimmedText) return null;

  const lastWordMatch = /[\p{L}\p{N}]+$/u.exec(trimmedText);
  if (!lastWordMatch) return null;

  const lastWord = lastWordMatch[0];
  const normalizedWord = normalizeWord(lastWord);
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
  if (suffix.length <= 3) return suffix;
  return suffix.replace(/[sx]$/, '');
};

const getRhymeCandidates = (text: string): RhymeCandidate[] => {
  const word = extractLastWord(text);
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
 */
const findBestSharedRhymeSuffix = (a: string, b: string): string | null => {
  const aCandidates = getRhymeCandidates(a);
  const bCandidates = getRhymeCandidates(b);
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
const splitLineAtNormalizedSuffix = (text: string, normalizedSuffix: string): { before: string; rhyme: string } | null => {
  const word = extractLastWord(text);
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
const getFallbackRhymingSuffix = (text: string): { before: string; rhyme: string } | null => {
  const word = extractLastWord(text);
  if (!word) return null;

  const vowelGroups = getVowelGroups(word.normalizedWord);
  if (vowelGroups.length === 0) {
    return {
      before: text.slice(0, word.wordStart),
      rhyme: text.slice(word.wordStart),
    };
  }

  return splitLineAtNormalizedSuffix(text, word.normalizedWord.slice(vowelGroups[vowelGroups.length - 1]!.start));
};

export const splitRhymingSuffix = (text: string, peerLines: string[] = []): { before: string; rhyme: string } | null => {
  let bestSuffix: string | null = null;

  for (const peerLine of peerLines) {
    const sharedSuffix = findBestSharedRhymeSuffix(text, peerLine);
    if (sharedSuffix && (!bestSuffix || sharedSuffix.length > bestSuffix.length)) {
      bestSuffix = sharedSuffix;
    }
  }

  if (bestSuffix) {
    const split = splitLineAtNormalizedSuffix(text, bestSuffix);
    if (split) return split;
  }

  return getFallbackRhymingSuffix(text);
};

/**
 * Two lines rhyme when they share a strong enough rime suffix derived from
 * vowel-group candidates. This keeps scheme detection aligned with the same
 * rime logic used by the UI highlight overlay. Exact one-vowel matches are
 * allowed for short words such as "zéro" / "ego", while longer matches use a
 * suffix overlap.
 */
const rhymesLines = (a: string, b: string): boolean => findBestSharedRhymeSuffix(a, b) !== null;

/**
 * Client-side rhyme scheme detector — fallback when the AI returns FREE.
 */
export function detectRhymeSchemeLocally(lines: string[]): string | null {
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
      if (rhymesLines(lyricLines[i]!, lyricLines[j]!)) {
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
      if (letters[k] === null && rhymesLines(lyricLines[i]!, lyricLines[k]!)) {
        letters[k] = letters[i]!;
      }
    }
  }

  const letterCounts: Record<string, number> = {};
  for (const l of letters) {
    if (l) letterCounts[l] = (letterCounts[l] ?? 0) + 1;
  }
  const rhymingLines = Object.values(letterCounts).filter(c => c >= 2).reduce((a, b) => a + b, 0);

  if (rhymingLines === 0) return null;

  const raw = letters.map(l => l ?? 'X').join('');

  const KNOWN: Record<string, string> = {
    AABB: 'AABB', ABAB: 'ABAB', ABCB: 'ABCB', AAAA: 'AAAA',
    AABBA: 'AABBA', AAABBB: 'AAABBB', AABBCC: 'AABBCC',
    ABABAB: 'ABABAB', ABCABC: 'ABCABC', AABCCB: 'AABCCB', ABACBC: 'ABACBC',
    ABBA: 'ABBA', ABAC: 'ABAC', AAAB: 'AAAB', ABBB: 'ABBB',
    AABBAA: 'AABBAA', ABABCC: 'ABABCC',
  };

  return KNOWN[raw] ?? raw;
}

export { DEFAULT_STRUCTURE, MUSICAL_INSTRUCTIONS } from '../constants/editor';

export const cleanSectionName = (name: string) => {
  if (!name) return '';
  return name.replace(/[\[\]\*]/g, '').trim();
};

export const countSyllables = (text: string) => {
  if (!text) return 0;
  const word = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;
  const syllables = word
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '')
    .match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
};
