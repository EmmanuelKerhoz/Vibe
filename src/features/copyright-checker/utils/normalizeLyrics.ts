import type { CheckerConfig, LanguageCode, LyricDocumentBase, SemanticChunk } from '../domain/types';
import { DEFAULT_CHECKER_CONFIG } from '../domain/config';

/** Result of running the normalization pipeline on a raw lyric block. */
export interface NormalizedLyrics {
  readonly normalizedText: string;
  readonly lines: readonly string[];
  readonly tokens: readonly string[];
  readonly lineTokens: readonly (readonly string[])[];
}

/**
 * Strip combining diacritics. Used by `stripDiacritics` config option to
 * fold accented characters to ASCII equivalents (NFKD then drop marks).
 */
const stripCombiningMarks = (input: string): string =>
  input.normalize('NFKD').replace(/\p{M}+/gu, '');

/** Punctuation we treat as token separators (kept generic, Unicode-aware). */
const PUNCTUATION_SPLIT_RE = /[^\p{L}\p{N}'’\-]+/gu;

/** Strip leading/trailing apostrophes and hyphens left after splitting. */
const TRIM_TOKEN_NOISE_RE = /^[-'’]+|[-'’]+$/g;

const LINE_SPLIT_RE = /\r?\n/;

/**
 * Pluggable stemmer hook. The default is a no-op identity to avoid
 * over-normalizing distinctive lyric structure (per spec).
 */
export type StemmerFn = (token: string, language?: LanguageCode) => string;
export const identityStemmer: StemmerFn = (token) => token;

const lowerLocale = (s: string, lang?: LanguageCode): string =>
  lang ? s.toLocaleLowerCase(lang) : s.toLowerCase();

const tokenizeLine = (
  line: string,
  config: CheckerConfig['normalization'],
  language: LanguageCode | undefined,
  stem: StemmerFn,
): string[] => {
  const folded = config.stripDiacritics ? stripCombiningMarks(line) : line;
  const lowered = lowerLocale(folded, language);
  const stop: ReadonlySet<string> =
    (language ? config.stopwords.get(language) : undefined) ?? new Set<string>();
  const out: string[] = [];
  for (const raw of lowered.split(PUNCTUATION_SPLIT_RE)) {
    const tok = raw.replace(TRIM_TOKEN_NOISE_RE, '');
    if (tok.length < config.minTokenLength) continue;
    if (stop.has(tok)) continue;
    out.push(stem(tok, language));
  }
  return out;
};

/**
 * Run the normalization pipeline on raw lyric text. Preserves line
 * boundaries (we never collapse line breaks) so structural matchers can
 * reason about repeated hooks/refrains.
 */
export const normalizeLyrics = (
  raw: string,
  options?: {
    readonly language?: LanguageCode;
    readonly config?: CheckerConfig;
    readonly stemmer?: StemmerFn;
  },
): NormalizedLyrics => {
  const config = options?.config ?? DEFAULT_CHECKER_CONFIG;
  const stemmer = options?.stemmer ?? identityStemmer;
  const language = options?.language;

  const rawLines = raw.split(LINE_SPLIT_RE);
  const lines: string[] = [];
  const lineTokens: string[][] = [];
  const tokens: string[] = [];
  for (const rawLine of rawLines) {
    const collapsed = rawLine.replace(/\s+/g, ' ').trim();
    lines.push(collapsed);
    const lt = tokenizeLine(collapsed, config.normalization, language, stemmer);
    lineTokens.push(lt);
    for (const t of lt) tokens.push(t);
  }
  // Trim leading/trailing pure-empty lines but preserve internal empties
  // (they often carry structural information in lyrics).
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start] === '') start += 1;
  while (end > start && lines[end - 1] === '') end -= 1;
  const trimmedLines = lines.slice(start, end);
  const trimmedLineTokens = lineTokens.slice(start, end);

  return {
    normalizedText: trimmedLines.join('\n'),
    lines: trimmedLines,
    tokens,
    lineTokens: trimmedLineTokens,
  };
};

/**
 * Group adjacent lines into chunks suitable for semantic similarity. The
 * grouping is line-aware so chunk coordinates can be mapped back to the UI.
 */
export const buildSemanticChunks = (
  lines: readonly string[],
  groupSize = 4,
): SemanticChunk[] => {
  if (groupSize <= 0) throw new Error('groupSize must be > 0');
  const chunks: SemanticChunk[] = [];
  for (let i = 0; i < lines.length; i += groupSize) {
    const slice = lines.slice(i, i + groupSize);
    const text = slice.join('\n').trim();
    if (text.length === 0) continue;
    chunks.push({
      chunkId: `chunk-${i}`,
      startLine: i,
      endLine: Math.min(i + groupSize - 1, lines.length - 1),
      text,
    });
  }
  return chunks;
};

/** Build a normalized {@link LyricDocumentBase}-compatible payload. */
export const buildNormalizedDocumentFields = (
  raw: string,
  options?: {
    readonly language?: LanguageCode;
    readonly config?: CheckerConfig;
    readonly stemmer?: StemmerFn;
    readonly chunkSize?: number;
  },
): Pick<LyricDocumentBase, 'normalizedText' | 'tokens' | 'lines' | 'lineTokens' | 'chunks'> => {
  const norm = normalizeLyrics(raw, options);
  return {
    normalizedText: norm.normalizedText,
    tokens: norm.tokens,
    lines: norm.lines,
    lineTokens: norm.lineTokens,
    chunks: buildSemanticChunks(norm.lines, options?.chunkSize ?? 4),
  };
};
