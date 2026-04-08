/**
 * PhonemeStore.ts
 * Singleton in-memory inverted index: lang → rnKey → word[]
 *
 * Extracted from suggestRhymes.ts so that both suggestRhymes.ts and
 * initLexicons.ts import the SAME Map instance regardless of how Vitest
 * (or any bundler) resolves module identity.
 *
 * Rules:
 *   - Zero imports from the linguistics core (no circular deps).
 *   - Pure data store: no phonological logic.
 *   - registerLexicon() is idempotent by replacement.
 */

/** Inverted index: lang → rnKey → word[] */
const phonemeIndex = new Map<string, Map<string, string[]>>();

/**
 * Register (or replace) a lexicon for a language.
 * Rebuilds the per-language bucket atomically.
 *
 * @param lang    ISO 639-1/3 language code.
 * @param entries Array of [word, rnKey] pairs.
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
 * Return the number of distinct RN keys registered for a language.
 * Returns 0 if the language has no lexicon.
 */
export function getLexiconSize(lang: string): number {
  return phonemeIndex.get(lang)?.size ?? 0;
}

/**
 * Return the full inverted index for a language, or undefined.
 * Used by suggestRhymes to iterate candidates.
 */
export function getLexiconIndex(lang: string): Map<string, string[]> | undefined {
  return phonemeIndex.get(lang);
}
