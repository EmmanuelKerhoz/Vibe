/**
 * Token "distinctiveness" scoring. A token (or n-gram) is more distinctive
 * when it is rare across the reference corpus. We use a simple smoothed
 * IDF computed per-corpus so the engine can flag rare repeated phrases
 * with higher confidence and downweight generic clichés.
 */

export interface DistinctivenessIndex {
  readonly idf: ReadonlyMap<string, number>;
  readonly defaultIdf: number;
}

export interface DistinctivenessOptions {
  /** Document frequency map; key = token, value = number of docs containing it. */
  readonly documentFrequency: ReadonlyMap<string, number>;
  readonly totalDocuments: number;
}

/** Build an IDF index from per-token document-frequency counts. */
export const buildDistinctivenessIndex = (
  options: DistinctivenessOptions,
): DistinctivenessIndex => {
  const N = Math.max(1, options.totalDocuments);
  const idf = new Map<string, number>();
  for (const [tok, df] of options.documentFrequency) {
    // Smoothed IDF: log((N + 1) / (df + 1)) + 1
    idf.set(tok, Math.log((N + 1) / (df + 1)) + 1);
  }
  const defaultIdf = Math.log((N + 1) / 1) + 1;
  return { idf, defaultIdf };
};

/** Lookup IDF for a single token. */
export const tokenIdf = (index: DistinctivenessIndex, token: string): number =>
  index.idf.get(token) ?? index.defaultIdf;

/** Average IDF over a phrase — used to rank phrase distinctiveness. */
export const phraseDistinctiveness = (
  index: DistinctivenessIndex,
  tokens: readonly string[],
): number => {
  if (tokens.length === 0) return 0;
  let sum = 0;
  for (const t of tokens) sum += tokenIdf(index, t);
  return sum / tokens.length;
};

/**
 * Heuristic: a phrase is "generic" when its average IDF falls below a
 * configured distinctiveness threshold. Only generic phrases are
 * penalized — never the entire match.
 */
export const isGenericPhrase = (
  index: DistinctivenessIndex,
  tokens: readonly string[],
  distinctiveTokenIDF: number,
): boolean => phraseDistinctiveness(index, tokens) < distinctiveTokenIDF;
