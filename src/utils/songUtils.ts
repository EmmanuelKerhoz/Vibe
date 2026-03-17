import type { Section } from '../types';

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

/**
 * Universal phonetic rhyme key — v3.6.9
 *
 * Extracts the LAST vowel nucleus + trailing consonants from the last word
 * of a lyric line. This mirrors how human ears perceive rhyme across all
 * Latin-script languages:
 *   FR: ruban→an, dedans→an, lame→ame, amour→our, couteau→eau, scintille→ille
 *   EN: night→ight, love→ove, falling→ing, moon→oon
 *   ES: corazón→on, amor→or, vida→ida
 *   IT: cuore→ore, amore→ore  ← correctly identified as rhyme
 *
 * Algorithm:
 * 1. Strip trailing punctuation, extract last word.
 * 2. Normalize (NFD accent strip, lowercase, alpha only).
 * 3. Find the index of the LAST vowel character.
 * 4. rhymeKey = norm.slice(lastVowelIndex)  — the vowel + all following consonants.
 * 5. Guard: if result is a single char (bare vowel), take last 2 chars instead
 *    to avoid over-grouping (e.g. words ending in isolated 'a' or 'e').
 */
const vocalicRhymeKey = (line: string): string => {
  const stripped = line.trimEnd().replace(/[^\p{L}\p{N}]+$/u, '');
  const lastWord = stripped.match(/[\p{L}\p{N}]+$/u)?.[0] ?? '';
  const norm = normalizeWord(lastWord);
  if (norm.length < 2) return norm;

  const VOWELS = 'aeiouy';
  let lastVowelIdx = -1;
  for (let i = norm.length - 1; i >= 0; i--) {
    if (VOWELS.includes(norm[i]!)) { lastVowelIdx = i; break; }
  }

  if (lastVowelIdx === -1) {
    // All consonants (rare): fall back to last 2 chars
    return norm.slice(-2);
  }

  const key = norm.slice(lastVowelIdx);
  // Single bare vowel at end (e.g. "ma", "la" → key="a"): extend one char back
  if (key.length === 1 && lastVowelIdx > 0) {
    return norm.slice(lastVowelIdx - 1);
  }
  return key;
};

/**
 * Client-side rhyme scheme detector — fallback when the AI returns FREE.
 *
 * v3.6.9: replaced fixed-suffix rhymeKey with universal vocalicRhymeKey().
 * rhymes() is now a simple key equality check — the phonetic extraction
 * already encodes the rhyme sound, no further slicing needed.
 */
export function detectRhymeSchemeLocally(lines: string[]): string | null {
  const lyricLines = lines.filter(l => l.trim().length > 0);
  const n = lyricLines.length;
  if (n < 2) return null;

  const keys = lyricLines.map(vocalicRhymeKey);

  const rhymes = (a: string, b: string): boolean => {
    if (!a || !b) return false;
    if (a === b) return true;
    // Allow 1-char tolerance for very short keys (monosyllabic words)
    if (a.length === 1 || b.length === 1) return a.slice(-2) === b.slice(-2);
    return false;
  };

  const letters: (string | null)[] = new Array(n).fill(null);
  let nextLetter = 0;
  const LETTERS = 'ABCDEFGH';

  for (let i = 0; i < n; i++) {
    if (letters[i] !== null) continue;
    let matchedLetter: string | null = null;
    for (let j = 0; j < i; j++) {
      if (rhymes(keys[i]!, keys[j]!)) {
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
      if (letters[k] === null && rhymes(keys[i]!, keys[k]!)) {
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
  const word = text.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  const syllables = word
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '')
    .match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
};
