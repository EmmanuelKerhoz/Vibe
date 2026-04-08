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
import { categorizeScore } from '../core/PhonologicalStrategy';
import type { RhymeType } from '../core/types';
import { resolveLang } from '../lid/detectLanguage';
import { registerLexicon, getLexiconSize, getLexiconIndex } from './PhonemeStore';

// Re-export so existing call-sites (initLexicons, tests) keep working.
export { registerLexicon, getLexiconSize };

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
  /** Resolved language code (useful when lang was 'auto'). */
  detectedLang: string;
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

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * Suggest words that rhyme with `word` in `lang`.
 *
 * @param word      Input word (orthographic).
 * @param lang      ISO 639-1/3 language code, or 'auto' for automatic detection.
 *                  Defaults to 'auto'.
 * @param options   Optional tuning parameters.
 * @returns         Sorted suggestions (score DESC) + metadata.
 */
export function suggestRhymes(
  word: string,
  lang: string = 'auto',
  options: SuggestRhymesOptions = {},
): SuggestRhymesResult {
  const resolvedLang = resolveLang(word, lang);

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
    detectedLang: resolvedLang,
  };

  // ── Step 1: analyse the input word ──────────────────────────────────────
  let inputResult;
  try {
    inputResult = PhonologicalRegistry.analyze(word.trim(), resolvedLang);
  } catch {
    return EMPTY;
  }
  if (!inputResult) return EMPTY;

  const inputRN = inputResult.rhymeNucleus;
  const inputKey = inputRN.raw.toLowerCase();

  // ── Step 2: check lexicon availability ───────────────────────────────────
  const index = getLexiconIndex(resolvedLang);
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

    for (const candidate of words) {
      if (excludeInput && candidate.toLowerCase() === normalizedInput) continue;

      let pairScore = 0;
      try {
        const pairResult = PhonologicalRegistry.compare(candidate, word, resolvedLang);
        pairScore = pairResult?.score ?? 0;
      } catch {
        continue;
      }

      if (pairScore < minScore) continue;

      suggestions.push({
        word: candidate,
        score: pairScore,
        rhymeType: categorizeScore(pairScore),
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
    detectedLang: resolvedLang,
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function shareNucleusVowel(a: string, b: string): boolean {
  const IPA_VOWELS = 'aeiouɑɛɔɪʊəɐɵæœøɯɤɶãẽĩõũ';
  const aVowels = new Set([...a].filter(c => IPA_VOWELS.includes(c)));
  return [...b].some(c => aVowels.has(c));
}
