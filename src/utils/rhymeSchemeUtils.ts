import { doLinesRhymeGraphemic } from './rhymeDetection';
import type { LocalRhymePairAnalysis } from './songRhymeAnalysis';

export const RHYME_SCHEME_LETTERS = 'ABCDEFGH';

export const finalizeDetectedRhymeScheme = (letters: (string | null)[]): string | null => {
  const letterCounts: Record<string, number> = {};
  for (const letter of letters) {
    if (letter) letterCounts[letter] = (letterCounts[letter] ?? 0) + 1;
  }

  const counts = new Map<string, number>(Object.entries(letterCounts));
  const remap = new Map<string, string>();
  let remapIndex = 0;
  const finalLetters = letters.map((letter) => {
    if (!letter || (counts.get(letter) ?? 0) < 2) return null;
    if (!remap.has(letter)) {
      remap.set(letter, RHYME_SCHEME_LETTERS[remapIndex] ?? String.fromCharCode(65 + remapIndex));
      remapIndex++;
    }
    return remap.get(letter)!;
  });

  if (!finalLetters.some(Boolean)) return null;
  return finalLetters.map(letter => letter ?? 'X').join('');
};

/**
 * Reconstruit le schéma de rimes depuis les paires IPA déjà calculées.
 * Évite tout second appel pipeline — les données sont consommées telles quelles.
 * @param lineCount - Nombre total de lignes de la section
 * @param pairs - Paires IPA issues de analyzeSongRhymes
 * @param threshold - Score minimum (0-100) pour qu'une paire compte comme rime
 */
export const detectRhymeSchemeFromIPAPairs = (
  lineCount: number,
  pairs: LocalRhymePairAnalysis[],
  threshold = 60,
): string | null => {
  if (lineCount < 2) return null;

  const pairMap = new Set<string>();
  for (const pair of pairs) {
    if (pair.confidenceScore >= threshold) {
      pairMap.add(`${pair.lineIndexes[0]}-${pair.lineIndexes[1]}`);
    }
  }

  const rhymes = (i: number, j: number): boolean =>
    pairMap.has(`${Math.min(i, j)}-${Math.max(i, j)}`);

  const letters: (string | null)[] = new Array(lineCount).fill(null);
  let nextLetter = 0;

  for (let i = 0; i < lineCount; i++) {
    if (letters[i] !== null) continue;
    let matchedLetter: string | null = null;
    for (let j = 0; j < i; j++) {
      if (rhymes(j, i)) {
        matchedLetter = letters[j];
        break;
      }
    }
    if (matchedLetter) {
      letters[i] = matchedLetter;
    } else {
      letters[i] = RHYME_SCHEME_LETTERS[nextLetter] ?? String.fromCharCode(65 + nextLetter);
      nextLetter++;
    }
    for (let k = i + 1; k < lineCount; k++) {
      if (letters[k] === null && rhymes(i, k)) {
        letters[k] = letters[i];
      }
    }
  }

  return finalizeDetectedRhymeScheme(letters);
};

/**
 * Client-side rhyme scheme detector — fallback when the AI returns FREE.
 * @param lines - Array of line texts to analyze
 * @param langCode - Optional language code for tonal preservation
 * @deprecated Use ipaPipeline.ts for async IPA-based rhyme scheme detection.
 */
export const detectRhymeSchemeLocally = (lines: string[], langCode?: string): string | null => {
  const lyricLines = lines.filter(line => line.trim().length > 0);
  const n = lyricLines.length;
  if (n < 2) return null;

  const letters: (string | null)[] = new Array(n).fill(null);
  let nextLetter = 0;

  for (let i = 0; i < n; i++) {
    if (letters[i] !== null) continue;
    let matchedLetter: string | null = null;
    for (let j = 0; j < i; j++) {
      if (doLinesRhymeGraphemic(lyricLines[i]!, lyricLines[j]!, langCode)) {
        matchedLetter = letters[j]!;
        break;
      }
    }
    if (matchedLetter) {
      letters[i] = matchedLetter;
    } else {
      letters[i] = RHYME_SCHEME_LETTERS[nextLetter] ?? String.fromCharCode(65 + nextLetter);
      nextLetter++;
    }
    for (let k = i + 1; k < n; k++) {
      if (letters[k] === null && doLinesRhymeGraphemic(lyricLines[i]!, lyricLines[k]!, langCode)) {
        letters[k] = letters[i]!;
      }
    }
  }

  return finalizeDetectedRhymeScheme(letters);
};
