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
 * Client-side rhyme scheme detector — fallback when the AI returns FREE.
 *
 * Threshold: dès qu'UNE paire de lignes rime (confidence > 0), on sort de FREE.
 * Le schème résultant peut être partiellement libre (ex. ABCDEE) — c'est correct.
 */
export function detectRhymeSchemeLocally(lines: string[]): string | null {
  const lyricLines = lines.filter(l => l.trim().length > 0);
  const n = lyricLines.length;
  if (n < 2) return null;

  const normalize = (s: string): string =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');

  const rhymeKey = (line: string): string => {
    const stripped = line.trimEnd().replace(/[^\p{L}\p{N}]+$/u, '');
    const lastWord = stripped.match(/[\p{L}\p{N}]+$/u)?.[0] ?? '';
    const norm = normalize(lastWord);
    if (norm.length < 2) return norm;
    return norm.slice(-3);
  };

  const keys = lyricLines.map(rhymeKey);

  const rhymes = (a: string, b: string): boolean => {
    if (!a || !b) return false;
    if (a === b) return true;
    return a.slice(-2) === b.slice(-2);
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

  // Exit FREE as soon as at least one rhyming pair is found
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
