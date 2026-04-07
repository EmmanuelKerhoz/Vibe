/**
 * suggestRhymes.ts
 * Returns candidate words that rhyme with a given input word.
 *
 * Architecture:
 *   word → G2P(lang) → RN  →  PhonemeIndex lookup  →  scored candidates
 *
 * The PhonemeIndex is a per-language inverted map:
 *   Map<lang, Map<RN_key, string[]>>
 * built lazily on first call per language from the bundled lexicon.
 *
 * For languages without a bundled lexicon (lowResourceFallback),
 * the function returns an empty array and sets `usedFallback: true`.
 * A cosine-embedding fallback is planned for Phase 2.
 *
 * docs_fusion_optimal.md §4 (RN extraction) + §5 (similarity)
 */

import { PhonologicalRegistry } from '../core/Registry';
import type { RhymeType } from '../core/types';

// ─── Public types ────────────────────────────────────────────────────────────

export interface RhymeSuggestion {
  word: string;
  /** Similarity score 0–1 against the input word's RN. */
  score: number;
  /** Rhyme quality classification. */
  rhymeType: RhymeType;
  /** String representation of the candidate's RN (for display/debug). */
  rhymeNucleus: string;
}

export interface SuggestRhymesResult {
  suggestions: RhymeSuggestion[];
  /** True when the PhonemeIndex had no entries for the language. */
  usedFallback: boolean;
  /** Input word's RN key (for transparency). */
  inputNucleus: string;
}

export interface SuggestRhymesOptions {
  /** Maximum number of suggestions to return. Default: 10. */
  n?: number;
  /** Minimum similarity score to include a candidate. Default: 0.65. */
  minScore?: number;
  /** Include near-rhymes (score < 1.0). Default: true. */
  allowNearRhyme?: boolean;
  /** Exclude the input word itself from results. Default: true. */
  excludeInput?: boolean;
}

// ─── PhonemeIndex ─────────────────────────────────────────────────────────────

/**
 * In-memory inverted index: lang → rnKey → word[]
 *
 * Populated by registerLexicon() at app startup (or lazily per lang).
 * The rnKey is the `raw` field of RhymeNucleus — the full trailing IPA string
 * normalised to lowercase, which provides the best cross-word grouping.
 */
const phonemeIndex = new Map<string, Map<string, string[]>>();

/**
 * Register a lexicon for a language.
 * Call once per language at app startup before any suggestRhymes() call.
 *
 * @param lang    ISO 639-1/3 language code.
 * @param entries Array of [word, rnKey] pairs.
 *
 * @example
 *   registerLexicon('fr', frLexicon);
 *   // where frLexicon: Array<[word: string, rnKey: string]>
 */
export function registerLexicon(
  lang: string,
  entries: ReadonlyArray<readonly [string, string]>,
): void {
  const index = new Map<string, string[]>();
  for (const [word, rnKey] of entries) {
    const bucket = index.get(rnKey);
    if (bucket) {
      bucket.push(word);
    } else {
      index.set(rnKey, [word]);
    }
  }
  phonemeIndex.set(lang, index);
}

/**
 * Expose the index size for a language — useful for health checks.
 */
export function getLexiconSize(lang: string): number {
  return phonemeIndex.get(lang)?.size ?? 0;
}

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * Suggest words that rhyme with `word` in `lang`.
 *
 * @param word      Input word (orthographic).
 * @param lang      ISO 639-1/3 language code.
 * @param options   Optional tuning parameters.
 * @returns         Sorted suggestions (score DESC) + metadata.
 */
export function suggestRhymes(
  word: string,
  lang: string,
  options: SuggestRhymesOptions = {},
): SuggestRhymesResult {
  const {
    n = 10,
    minScore = 0.65,
    allowNearRhyme = true,
    excludeInput = true,
  } = options;

  const EMPTY: SuggestRhymesResult = {
    suggestions: [],
    usedFallback: true,
    inputNucleus: '',
  };

  // ── Step 1: analyse the input word ──────────────────────────────────────
  let inputResult;
  try {
    inputResult = PhonologicalRegistry.analyze(word.trim(), lang);
  } catch {
    return EMPTY;
  }
  if (!inputResult) return EMPTY;

  const inputRN = inputResult.rhymeNucleus;
  const inputKey = inputRN.raw.toLowerCase();

  // ── Step 2: check lexicon availability ───────────────────────────────────
  const index = phonemeIndex.get(lang);
  if (!index || index.size === 0) {
    return { ...EMPTY, inputNucleus: inputKey };
  }

  // ── Step 3: collect candidates ───────────────────────────────────────────
  const normalizedInput = word.trim().toLowerCase();
  const suggestions: RhymeSuggestion[] = [];

  for (const [rnKey, words] of index) {
    // Fast exact-match path: same RN key → perfect rhyme, score 1.0
    if (rnKey === inputKey) {
      for (const candidate of words) {
        if (excludeInput && candidate.toLowerCase() === normalizedInput) continue;
        suggestions.push({
          word: candidate,
          score: 1.0,
          rhymeType: 'rich',
          rhymeNucleus: rnKey,
        });
      }
      continue;
    }

    if (!allowNearRhyme) continue;

    // Near-rhyme path: score via Registry.compare()
    // Only attempt if RN keys share at least the nucleus vowel (cheap guard)
    if (!shareNucleusVowel(inputKey, rnKey)) continue;

    let pairScore = 0;
    try {
      const pairResult = PhonologicalRegistry.compare(
        words[0] ?? '',
        word,
        lang,
      );
      pairScore = pairResult?.score ?? 0;
    } catch {
      continue;
    }

    if (pairScore < minScore) continue;

    const rhymeType = classifyScore(pairScore);
    for (const candidate of words) {
      if (excludeInput && candidate.toLowerCase() === normalizedInput) continue;
      suggestions.push({
        word: candidate,
        score: pairScore,
        rhymeType,
        rhymeNucleus: rnKey,
      });
    }
  }

  // ── Step 4: sort + truncate ──────────────────────────────────────────────
  suggestions.sort((a, b) => b.score - a.score);

  return {
    suggestions: suggestions.slice(0, n),
    usedFallback: false,
    inputNucleus: inputKey,
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Cheap guard: two RN keys share a nucleus vowel character.
 * Avoids running Registry.compare() on unrelated RN pairs.
 */
function shareNucleusVowel(a: string, b: string): boolean {
  const IPA_VOWELS = 'aeiouɑɛɔɪʊəɐɵæœøɯɤɶãẽĩõũ';
  const aVowels = new Set([...a].filter(c => IPA_VOWELS.includes(c)));
  return [...b].some(c => aVowels.has(c));
}

/** Map a similarity score to a RhymeType. */
function classifyScore(score: number): RhymeType {
  if (score >= 0.95) return 'rich';
  if (score >= 0.75) return 'sufficient';
  if (score >= 0.50) return 'assonance';
  if (score >= 0.25) return 'weak';
  return 'none';
}
