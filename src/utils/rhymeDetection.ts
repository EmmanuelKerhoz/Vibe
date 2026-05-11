import { getAlgoFamily, isTonalLanguage } from '../constants/langFamilyMap';
import type { Section, SongVersion } from '../types';
import type { SimilarityMatch, SimilaritySectionMatch } from './similarityUtils';
import { normalizeText } from './similarityUtils';

type WordMatch = {
  lastWord: string;
  normalizedWord: string;
  wordStart: number;
};

type VowelSpan = { start: number; end: number };

type RhymeCandidate = {
  normalizedSuffix: string;
};

type RhymeMatchOptions = {
  forScheme?: boolean;
};

/**
 * Full IPA vowel inventory covering Latin, Germanic umlauts, Slavic, Uralic,
 * Austronesian, Dravidian and Sinitic vowel characters encountered after NFD
 * normalization. Extending beyond 'aeiouy' fixes getVowelGroups for
 * ALGO-GER, ALGO-FIN, ALGO-DRV, ALGO-AUS, ALGO-SLV, ALGO-SIN, ALGO-KOR.
 */
const VOWELS = new Set([
  // Basic Latin
  'a', 'e', 'i', 'o', 'u', 'y',
  // IPA close / mid vowels
  'ɑ', 'ɒ', 'ɔ', 'ɛ', 'œ', 'ø', 'ɪ', 'ʊ', 'ʌ', 'ə', 'ɨ', 'ɵ', 'ɜ', 'ɞ', 'ɐ', 'ʉ', 'ɯ', 'ɤ',
  // Germanic / Uralic umlauts (post-NFD base chars)
  'ä', 'ö', 'ü', 'å',
  // Scandinavian / Uralic
  'æ', 'ø',
  // Slavic / IIR
  'ы', 'э', 'я', 'ю', 'е', 'ё', 'и',
  // Dravidian vowel letters (Tamil, Kannada, Malayalam — post-transliteration)
  'ā', 'ī', 'ū', 'ṛ', 'ḷ', 'ē', 'ō', 'ai', 'au',
]);

const isVowel = (ch: string) => VOWELS.has(ch);

/**
 * Strip Unicode accents and lowercase — with optional tonal preservation.
 * For tonal languages (KWA, CRV families), tone diacritics are preserved.
 *
 * Latin ligatures (œ, æ) are transliterated to digraphs (oe, ae) BEFORE the
 * `[a-z]` filter so that words like `cœur`, `sœur`, `œuvre`, `æsir` keep
 * their vowel content and the family-specific suffix-canonicalization tables
 * (e.g. Romance `oeu → eu`) can normalize them as expected.
 * Without this step the ligature is silently dropped (`cœur` → `cur`),
 * producing spurious rhyme decisions.
 *
 * @param s - The string to normalize
 * @param langCode - Optional language code for tonal language detection
 */
const normalizeWord = (s: string, langCode?: string): string => {
  const normalized = s.normalize('NFD');

  const stripDiacritics = isTonalLanguage(langCode || '')
    ? normalized
    : normalized.replace(/[\u0300-\u036f]/g, '');

  const transliterated = stripDiacritics
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/ß/g, 'ss');

  return transliterated.replace(/[^a-z\u0300-\u036f]/g, '');
};

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
 * Uses the extended IPA VOWELS set to correctly handle non-Latin families.
 */
const getVowelGroups = (normalizedWord: string): VowelSpan[] => {
  const vowelGroups: VowelSpan[] = [];
  const chars = [...normalizedWord];
  let i = 0;
  while (i < chars.length) {
    if (isVowel(chars[i]!)) {
      const start = i;
      while (i < chars.length && isVowel(chars[i]!)) i++;
      vowelGroups.push({ start, end: i });
    } else {
      i++;
    }
  }
  return vowelGroups;
};

/**
 * Call-site-local memoization helper for getVowelGroups.
 *
 * getVowelGroups is a pure function but may be called 2-3× on the same
 * normalizedWord string within a single scoring cycle (getRhymeCandidates,
 * getLastVowelGroupSuffix, detectInternalRhymeToken).  Strings are not
 * WeakMap-keyable so a Map<string, VowelSpan[]> is used instead.
 *
 * Usage: create one cache per top-level call frame, pass it through.
 * The cache is intentionally NOT module-level to avoid stale state across
 * song-version switches.
 */
const makeMemoizedGetVowelGroups = () => {
  const cache = new Map<string, VowelSpan[]>();
  return (word: string): VowelSpan[] => {
    const cached = cache.get(word);
    if (cached) return cached;
    const result = getVowelGroups(word);
    cache.set(word, result);
    return result;
  };
};

// ─── Per-family phonemic normalization tables ────────────────────────────────
//
// Each table maps a graphemic suffix (after last-vowel-group extraction) to a
// canonical phonemic form.  Entries are matched with String.startsWith so the
// LONGEST key that matches wins — tables are ordered longest-first within each
// family to guarantee greedy matching.
//
// Purpose: collapse graphemic variants that are phonemically identical BEFORE
// the LCS comparison so that isSharedRhymeStrongEnough only needs a simple
// length/vowel guard rather than a family-specific threshold.
//
// Rules applied here are purely suffix-level; they operate on the already-
// extracted last-vowel-group string, not the full word.

type SuffixTable = readonly [string, string][];

/** ALGO-ROM: French / Spanish / Italian / Portuguese / Romanian / Catalan */
const ROM_SUFFIX_TABLE: SuffixTable = [
  // Longest patterns first
  ['uitte', 'ui'],
  ['oire',  'oir'],
  ['eure',  'eur'],
  ['ielle', 'iel'],
  ['elle',  'el'],
  ['ette',  'ete'],
  ['tion',  'sion'],
  ['asse',  'as'],
  ['ace',   'as'],
  ['ain',   'in'],
  ['ein',   'in'],
  ['uit',   'ui'],
  ['oir',   'oir'],
  ['iel',   'iel'],
  ['eur',   'eur'],
  ['ete',   'ete'],
  ['ete',   'ete'],
];

/** ALGO-GER: English / German / Dutch / Scandinavian */
const GER_SUFFIX_TABLE: SuffixTable = [
  ['ight',  'ait'],
  ['tion',  'shun'],
  ['sion',  'shun'],
  ['ough',  'of'],
  ['ite',   'ait'],
  ['ey',    'ay'],
  ['ai',    'ay'],
  ['ay',    'ay'],
  ['ee',    'ee'],
  ['ea',    'ee'],
  ['ow',    'ow'],
  ['oe',    'ow'],
];

/** ALGO-SLV: Russian / Polish / Czech / Slovak / Ukrainian / Bulgarian / Serbian / Croatian */
const SLV_SUFFIX_TABLE: SuffixTable = [
  ['ить',   'ит'],
  ['ыть',   'ит'],
  ['ий',    'и'],
  ['ый',    'и'],
  ['ей',    'ой'],
];

/** ALGO-FIN: Finnish / Estonian / Hungarian — long vowels and geminate consonants */
const FIN_SUFFIX_TABLE: SuffixTable = [
  ['aa', 'a'],
  ['ee', 'e'],
  ['ii', 'i'],
  ['oo', 'o'],
  ['uu', 'u'],
  ['ll', 'l'],
  ['nn', 'n'],
  ['ss', 's'],
  ['tt', 't'],
];

/** ALGO-KWA: Baoulé / Ewe / Dioula / Mina — long vowels (tone marks preserved upstream) */
const KWA_SUFFIX_TABLE: SuffixTable = [
  ['aa', 'a'],
  ['ee', 'e'],
  ['ii', 'i'],
  ['oo', 'o'],
  ['uu', 'u'],
];

/** ALGO-BNT: Swahili / Yoruba / Zulu / Xhosa / Bantu — long vowels */
const BNT_SUFFIX_TABLE: SuffixTable = [
  ['aa', 'a'],
  ['ee', 'e'],
  ['ii', 'i'],
  ['oo', 'o'],
  ['uu', 'u'],
];

/**
 * ALGO-IIR: Hindi / Urdu / Bengali / Punjabi / Farsi / Sanskrit
 * Long vowels and aspirated consonant digraphs.
 */
const IIR_SUFFIX_TABLE: SuffixTable = [
  ['ph',  'f'],
  ['bh',  'b'],
  ['th',  't'],
  ['dh',  'd'],
  ['sh',  's'],
  ['jh',  'j'],
  ['ā',   'a'],
  ['ī',   'i'],
  ['ū',   'u'],
  ['ṛ',   'ri'],
];

/** ALGO-DRV: Tamil / Telugu / Kannada / Malayalam — long vowels + diphthong collapse */
const DRV_SUFFIX_TABLE: SuffixTable = [
  ['ai',  'e'],
  ['au',  'o'],
  ['ā',   'a'],
  ['ī',   'i'],
  ['ū',   'u'],
];

/**
 * ALGO-TRK: Turkish / Uzbek / Kazakh / Azerbaijani
 * Vowel harmony: collapse back/front vowel pairs for scheme comparison.
 * ı/i → i, ü/u → u, ö/o → o  (front form used as canonical)
 */
const TRK_SUFFIX_TABLE: SuffixTable = [
  ['ı',   'i'],
  ['ü',   'u'],
  ['ö',   'o'],
];

/**
 * ALGO-AUS: Indonesian / Malay / Tagalog / Javanese
 * Final h is often silent; ng is a single phoneme.
 */
const AUS_SUFFIX_TABLE: SuffixTable = [
  ['ngg', 'ng'],
  ['ng',  'ng'],
  ['h',   ''],
];

/** Map each family to its normalization table (undefined → no normalization) */
const FAMILY_SUFFIX_TABLES: Partial<Record<string, SuffixTable>> = {
  'ALGO-ROM': ROM_SUFFIX_TABLE,
  'ALGO-GER': GER_SUFFIX_TABLE,
  'ALGO-SLV': SLV_SUFFIX_TABLE,
  'ALGO-FIN': FIN_SUFFIX_TABLE,
  'ALGO-KWA': KWA_SUFFIX_TABLE,
  'ALGO-BNT': BNT_SUFFIX_TABLE,
  'ALGO-IIR': IIR_SUFFIX_TABLE,
  'ALGO-DRV': DRV_SUFFIX_TABLE,
  'ALGO-TRK': TRK_SUFFIX_TABLE,
  'ALGO-AUS': AUS_SUFFIX_TABLE,
};

/**
 * Apply the family-specific phonemic normalization table to a suffix.
 * The table is scanned in declaration order (longest patterns first);
 * the first matching key wins and the replacement is prepended to the
 * remainder so that only the matched prefix is substituted.
 *
 * Example (ROM):
 *   'asse' → matches 'asse'→'as'  ✓
 *   'ace'  → matches 'ace' →'as'  ✓
 *   'oir'  → matches 'oir' →'oir' (identity, kept for exact-match path)
 */
const applyFamilySuffixNorm = (suffix: string, table: SuffixTable): string => {
  for (const [from, to] of table) {
    if (suffix.startsWith(from)) {
      return to + suffix.slice(from.length);
    }
  }
  return suffix;
};

/**
 * Romance vowel-sequence canonical mergers (orthographic, longest-first).
 * Each entry maps a leading vowel pattern to its canonical 2-char digraph.
 *
 * Two output forms are emitted from canonicalizeRhymeSuffix when a pattern
 * matches:
 *   - the bare canonical digraph alone (e.g. "ent" → "an")
 *     → handles silent-final-consonant words (vent, temps, sans → /ɑ̃/)
 *   - the canonical digraph PLUS the remaining coda (e.g. "ent" → "ant")
 *     → handles voiced-coda words where the coda IS pronounced
 *       (eur/oeur/ueur → /œʁ/, ant/ent → distinguish from vent)
 *
 * Without the bare-digraph form, vent/temps would no longer rhyme.
 * Without the coda-preserving form, lueur/cœur cannot rhyme because both
 * collapse to "eu" and the shared /ʁ/ coda is lost.
 */
const ROMANCE_VOWEL_MERGERS: Array<[re: RegExp, canon: string]> = [
  [/^oi/, 'oi'],
  [/^(?:an|en|am|em)/, 'an'],
  [/^(?:ain|ein|in|im|yn|ym)/, 'in'],
  [/^(?:on|om)/, 'on'],
  [/^(?:un|um)/, 'un'],
  [/^(?:oeu|eu|oe|ueu)/, 'eu'],
  [/^ou/, 'ou'],
  [/^(?:eau|au)/, 'au'],
];

/**
 * Keep short endings intact, but normalise common trailing plural markers on
 * longer endings so pairs like "certitudes"/"servitude" and
 * "possessifs"/"adjectif" can still converge on the same rime family.
 *
 * Then apply the per-family phonemic normalization table (if any) so that
 * graphemic variants that are phonemically identical (e.g. "ace"/"asse" in
 * French, "ight"/"ite" in English) share the same canonical form before the
 * LCS comparison.
 *
 * Canonical vowel-sequence substitutions (e.g. "an/en/am" → "an") are
 * Romance-specific orthographic conventions gated on ALGO-ROM.  For all
 * other families the nasal/oral vowel normalization is omitted and handled
 * by the per-family table instead.
 *
 * When langCode is absent the Romance rules apply as a safe default,
 * preserving existing behaviour for callers that do not pass a language.
 * This is an explicit design choice — not an oversight — so that legacy call
 * sites (e.g. highlight path) remain correct without requiring migration.
 * New call sites should always pass langCode for deterministic behaviour.
 *
 * Returns one or more canonical forms.  Multiple forms are emitted for
 * Romance vowel patterns so that BOTH silent-final-consonant rhymes
 * (vent/an → "an") AND voiced-coda rhymes (lueur/cœur → "eur") are
 * detected by the downstream LCS comparison.
 */
const canonicalizeRhymeSuffix = (suffix: string, langCode?: string): string[] => {
  // Strip trailing plural / verbal -s and orthographic -x.
  // The previous threshold of `length <= 3` meant suffixes like "ifs" (from
  // possessifs) were never stripped to "if", so they could not match the
  // singular "if" (adjectif).  Lowering the guard to `length <= 2` keeps
  // canonical 2-char digraphs (us, as, es) intact while stripping plural -s
  // on every longer suffix.
  const s = suffix.length <= 2 ? suffix : suffix.replace(/[sx]$/, '');

  const family = langCode ? getAlgoFamily(langCode) : undefined;
  const isRomance = !family || family === 'ALGO-ROM';

  if (isRomance) {
    for (const [re, canon] of ROMANCE_VOWEL_MERGERS) {
      const match = re.exec(s);
      if (match) {
        const rest = s.slice(match[0].length);
        // Emit both bare-digraph (silent-final convention) and digraph+coda
        // (voiced-coda convention).  Deduplicated when rest is empty.
        return rest ? [canon, canon + rest] : [canon];
      }
    }
  }

  // Apply per-family phonemic suffix normalization table.
  const familyKey = family ?? 'ALGO-ROM';
  const table = FAMILY_SUFFIX_TABLES[familyKey];
  if (table) {
    return [applyFamilySuffixNorm(s, table)];
  }

  return [s];
};

/**
 * Return the first canonicalized suffix starting from the last vowel group of
 * a normalized word.  Used by the highlight fallback path where a single
 * representative suffix is needed for `lastIndexOf` mapping back to original
 * source positions.  When canonicalizeRhymeSuffix emits multiple forms the
 * first (most-canonical, coda-stripped) is returned for stability.
 *
 * Uses Array.at(-1) instead of a non-null assertion so the function is safe
 * to call in any context, not just after an external length guard.
 *
 * Accepts an optional memoized getter to avoid redundant getVowelGroups calls
 * when invoked from within a scored section cycle.
 */
const getLastVowelGroupSuffix = (
  normalizedWord: string,
  langCode?: string,
  memoGet: (w: string) => VowelSpan[] = getVowelGroups,
): string => {
  const vowelGroups = memoGet(normalizedWord);
  const last = vowelGroups.at(-1);
  const tail = last ? normalizedWord.slice(last.start) : normalizedWord;
  return canonicalizeRhymeSuffix(tail, langCode)[0] ?? tail;
};

/**
 * Build the candidate suffix list for a line.
 *
 * Each vowel group inside the last word produces one or more canonical
 * candidate suffixes (canonicalizeRhymeSuffix may emit multiple forms — see
 * its docstring).
 *
 * `forScheme: true` restricts candidates to the LAST vowel group only, which
 * corresponds to the actual end-rime.  This prevents internal-syllable
 * false positives in scheme detection (e.g. without it, "c**on**naissance"
 * matches "vibrati**on**" via the internal `on` syllable, producing
 * over-merged schemes like AAAABB instead of AABBCC).
 *
 * Romance mute-final-e exception: when the last vowel group of a Romance word
 * is a bare `e` (the orthographic e-muet, e.g. "connaissance", "effervescence"),
 * the previous vowel group is used instead — that is the actual stressed
 * rime nucleus (e.g. "ance" / "ence" → both canonicalize to "an"/"ance").
 *
 * Highlight mode (forScheme: false / undefined) keeps every vowel group as a
 * candidate so the UI overlay can find the longest shared substring across
 * peer lines, including partial-rime / assonance overlaps.
 *
 * Accepts an optional memoized getter to avoid redundant getVowelGroups calls
 * when invoked from within a scored section cycle.
 */
const getRhymeCandidates = (
  text: string,
  langCode?: string,
  options?: RhymeMatchOptions,
  memoGet: (w: string) => VowelSpan[] = getVowelGroups,
): RhymeCandidate[] => {
  const word = extractLastWord(text, langCode);
  if (!word) return [];

  const vowelGroups = memoGet(word.normalizedWord);
  if (vowelGroups.length === 0) {
    return canonicalizeRhymeSuffix(word.normalizedWord, langCode)
      .map(normalizedSuffix => ({ normalizedSuffix }));
  }

  let groupsToUse = vowelGroups;
  if (options?.forScheme) {
    // Default to the LAST vowel group as the rime nucleus.
    let pickIndex = vowelGroups.length - 1;

    // Romance silent-final tail: when the last vowel group is a bare `e`
    // followed by nothing or only `s` (mute -e or -es plural), the actual
    // rime nucleus is the PREVIOUS vowel group.  Without this, words like
    // "connaissance"/"effervescence" (last vg is silent -e) and
    // "certitudes"/"servitude" (last vg is silent -e with plural -s)
    // would all collapse to suffix "e"/"es" and never match each other.
    const family = langCode ? getAlgoFamily(langCode) : undefined;
    const isRomance = !family || family === 'ALGO-ROM';
    if (isRomance && pickIndex > 0) {
      const last = vowelGroups[pickIndex]!;
      const tail = word.normalizedWord.slice(last.end);
      const isSilentFinal =
        last.end - last.start === 1
        && word.normalizedWord[last.start] === 'e'
        && /^s?$/.test(tail);
      if (isSilentFinal) pickIndex--;
    }

    groupsToUse = [vowelGroups[pickIndex]!];
  }

  return groupsToUse.flatMap(({ start }) =>
    canonicalizeRhymeSuffix(word.normalizedWord.slice(start), langCode)
      .map(normalizedSuffix => ({ normalizedSuffix })),
  );
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
 * Canonical digraphs per family — used by isSharedRhymeStrongEnough for the
 * exact-match single-vowel fallback in scheme mode.
 *
 * These are the 2-char forms that remain after canonicalizeRhymeSuffix — i.e.
 * the canonical output of the normalization table, not raw graphemes.
 */
const CANONICAL_DIGRAPHS_BY_FAMILY: Partial<Record<string, Set<string>>> = {
  'ALGO-ROM': new Set(['an', 'in', 'on', 'un', 'ou', 'oi', 'eu', 'au', 'ui', 'ie', 'el', 'al', 'il']),
  'ALGO-GER': new Set(['ay', 'ee', 'ow', 'ow', 'ai', 'oi', 'oo']),
  'ALGO-SLV': new Set(['ой', 'ей', 'ий', 'ый', 'ый']),
  'ALGO-FIN': new Set(['an', 'en', 'in', 'on', 'un', 'ai', 'oi', 'ui']),
  'ALGO-KWA': new Set(['an', 'on', 'in', 'un', 'en']),
  'ALGO-BNT': new Set(['an', 'on', 'in', 'un', 'en']),
  'ALGO-IIR': new Set(['an', 'in', 'un', 'ai', 'au', 'ri']),
  'ALGO-DRV': new Set(['an', 'in', 'un', 'ai', 'au', 'en', 'on']),
  'ALGO-TRK': new Set(['an', 'in', 'on', 'un', 'en']),
  'ALGO-AUS': new Set(['an', 'in', 'on', 'un', 'ng', 'ay', 'ai']),
};

/**
 * Determine whether a shared suffix is phonemically significant enough to
 * count as a rhyme match.
 *
 * For scheme detection (forScheme=true):
 * - After per-family phonemic normalization in canonicalizeRhymeSuffix, a
 *   2-char shared suffix is already a meaningful phonemic unit. The previous
 *   >=3 guard was introduced to block spurious 1-char 'e' matches but was
 *   too aggressive — it also blocked legitimate 2-char rimes like 'ui', 'ie',
 *   'el', 'ay', 'ee', etc.
 * - New rule: >= 2 chars accepted universally.
 * - Exact 1-char vowel match accepted if the vowel is not mute-e (Romance).
 * - The old CANONICAL_DIGRAPHS whitelist is retained for the 1-char exact
 *   match fallback path only (not needed for 2-char threshold).
 *
 * For highlight mode (forScheme=false): unchanged — >= 2 chars accepted.
 */
const isSharedRhymeStrongEnough = (
  suffix: string,
  exactMatch: boolean,
  langCode?: string,
  options?: RhymeMatchOptions,
): boolean => {
  const family = langCode ? getAlgoFamily(langCode) : undefined;
  const isRomance = !family || family === 'ALGO-ROM';
  const familyKey = family ?? 'ALGO-ROM';

  // 2+ char shared suffix is always a meaningful phonemic unit after normalization.
  if (suffix.length >= 2) return true;

  // Single-char exact match: accept open vowels, block mute-e for Romance.
  if (exactMatch && suffix.length === 1 && isVowel(suffix)) {
    if (options?.forScheme && isRomance && suffix === 'e') return false;
    return true;
  }

  // Exact match on a canonical 2-char digraph (post-normalization) is unambiguous.
  // This path is reached only when suffix.length < 2, so it handles edge cases
  // where normalization produced a 1-char result that is part of a known pair.
  const digraphs = CANONICAL_DIGRAPHS_BY_FAMILY[familyKey];
  if (exactMatch && digraphs?.has(suffix)) return true;

  return false;
};

/**
 * Compare every vowel-group-based candidate suffix from two lines and keep the
 * longest shared rime that is strong enough to count as an actual rhyme.
 *
 * A shared memoized vowel-group getter is created once per call so that
 * getRhymeCandidates does not recompute getVowelGroups for repeated words.
 *
 * @param a - First line text
 * @param b - Second line text
 * @param langCode - Optional language code for tonal preservation
 */
const findBestSharedRhymeSuffix = (
  a: string,
  b: string,
  langCode?: string,
  options?: RhymeMatchOptions,
): string | null => {
  const memoGet = makeMemoizedGetVowelGroups();
  const aCandidates = getRhymeCandidates(a, langCode, options, memoGet);
  const bCandidates = getRhymeCandidates(b, langCode, options, memoGet);
  let bestMatch = '';

  for (const aCandidate of aCandidates) {
    for (const bCandidate of bCandidates) {
      const exactMatch = aCandidate.normalizedSuffix === bCandidate.normalizedSuffix;
      const sharedSuffix = exactMatch
        ? aCandidate.normalizedSuffix
        : getLongestCommonSuffix(aCandidate.normalizedSuffix, bCandidate.normalizedSuffix);
      if (!isSharedRhymeStrongEnough(sharedSuffix, exactMatch, langCode, options)) continue;
      if (sharedSuffix.length > bestMatch.length) bestMatch = sharedSuffix;
    }
  }

  return bestMatch || null;
};

/**
 * Known French vowel digraphs — two-vowel sequences representing a single
 * phoneme. "ie" is intentionally excluded because it is graphemically a
 * hiatus in most contexts (e.g. "miette" where i and e belong to separate
 * syllable nuclei).
 */
const FRENCH_DIGRAPHS = new Set(['ai', 'ei', 'oi', 'ou', 'au', 'eu']);

/**
 * Extend a shared-suffix position backward to include the preceding vowel
 * onset so the UI highlights complete French rimes rather than bare consonant
 * overlaps. For example, shared suffix "te" in "miette" extends to "ette",
 * and in "défaite" extends to "aite" (recognising "ai" as a diphthong).
 *
 * The loop bound is `pos > 0` (not `pos >= 0`) to guarantee that
 * normalizedWord[pos] is always a valid in-bounds access.
 */
const extendToVowelOnset = (normalizedWord: string, suffixStart: number): number => {
  if (suffixStart <= 0) return suffixStart;

  let pos = suffixStart;

  if (!isVowel(normalizedWord[pos]!)) {
    while (pos > 0 && !isVowel(normalizedWord[pos]!)) pos--;
    // pos === 0: check the first character; if still not a vowel, no onset found
    if (!isVowel(normalizedWord[pos]!)) return suffixStart;
  }

  if (pos >= 1 && isVowel(normalizedWord[pos - 1]!)) {
    const digraph = normalizedWord[pos - 1]! + normalizedWord[pos]!;
    if (FRENCH_DIGRAPHS.has(digraph)) {
      return pos - 1;
    }
  }

  return pos;
};

/**
 * Split a line at the start of a normalized suffix found inside its last word,
 * preserving the original spelling and trailing punctuation in the rhyming
 * fragment returned to the UI overlay.
 *
 * For non-tonal languages the highlight is extended backward to include the
 * vowel onset preceding the shared consonant suffix, so that complete rhyming
 * syllables like "ette", "ête", "aite" are marked rather than just the bare
 * consonant overlap ("te").
 */
const splitLineAtNormalizedSuffix = (text: string, normalizedSuffix: string, langCode?: string): { before: string; rhyme: string } | null => {
  const word = extractLastWord(text, langCode);
  if (!word) return null;

  const suffixStart = word.normalizedWord.lastIndexOf(normalizedSuffix);
  if (suffixStart < 0) return null;

  const effectiveStart = isTonalLanguage(langCode || '')
    ? suffixStart
    : extendToVowelOnset(word.normalizedWord, suffixStart);

  const absoluteStart = word.wordStart + effectiveStart;
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

  const suffix = getLastVowelGroupSuffix(word.normalizedWord, langCode);
  if (!suffix) {
    return {
      before: text.slice(0, word.wordStart),
      rhyme: text.slice(word.wordStart),
    };
  }

  return splitLineAtNormalizedSuffix(text, suffix, langCode);
};

/**
 * Remove the last whitespace-separated token from a line after segmentation has
 * classified that token as an enjambment connector, so suffix highlighting maps
 * against the preceding content word rather than the connector.
 * The pattern matches the final whitespace sequence plus the final non-space
 * token, preserving the rest of the line exactly as authored.
 */
const removeTrailingToken = (text: string): string => text.trimEnd().replace(/\s+\S+$/, '');

export const splitRhymingSuffix = (text: string, peerLines: string[] = [], langCode?: string): { before: string; rhyme: string } | null => {
  const segment = segmentVerseToRhymingUnit(text, langCode);
  const effectiveText = segment.position === 'enjambed'
    ? removeTrailingToken(text)
    : text;
  let bestSuffix: string | null = null;

  for (const peerLine of peerLines) {
    const peerSegment = segmentVerseToRhymingUnit(peerLine, langCode);
    const sharedSuffix = findBestSharedRhymeSuffix(
      segment.rhymingUnit,
      peerSegment.rhymingUnit,
      langCode,
    );
    if (sharedSuffix && (!bestSuffix || sharedSuffix.length > bestSuffix.length)) {
      bestSuffix = sharedSuffix;
    }
  }

  if (bestSuffix) {
    const split = splitLineAtNormalizedSuffix(effectiveText, bestSuffix, langCode);
    if (split) return split;
  }

  return getFallbackRhymingSuffix(effectiveText, langCode);
};

/**
 * Two lines rhyme when they share a strong enough rime suffix derived from
 * vowel-group candidates. This keeps scheme detection aligned with the same
 * rime logic used by the UI highlight overlay. Exact one-vowel matches are
 * allowed for short words such as "zéro" / "ego", while longer matches use a
 * suffix overlap.
 */
export const doLinesRhymeGraphemic = (
  a: string,
  b: string,
  langCode?: string,
  options?: RhymeMatchOptions,
): boolean => {
  const segA = segmentVerseToRhymingUnit(a, langCode);
  const segB = segmentVerseToRhymingUnit(b, langCode);
  return findBestSharedRhymeSuffix(segA.rhymingUnit, segB.rhymingUnit, langCode, options) !== null;
};

// ─── Step-0: verse segmentation ──────────────────────────────────────────────

/**
 * Type of rhyme position within a line.
 * - 'end'      : classical end-of-line rhyme (default)
 * - 'internal' : rhyming unit found mid-line (caesura / internal rhyme)
 * - 'enjambed' : last token is syntactically incomplete (enjambement detected
 *                heuristically via trailing connector words)
 */
export type RhymePosition = 'end' | 'internal' | 'enjambed';

/**
 * Result of segmenting a verse line into its rhyming unit.
 * `rhymingUnit` is the normalized token passed to the IPA/graphemic pipeline.
 * `position` describes the structural role of that unit within the line.
 * `syllableIndex`, when present, indicates which syllable of the last word
 * carries the rhyme (0-based from the end, so 0 = final syllable). It is
 * only provided when a meaningful syllable-level rhyme position is known.
 */
export type VerseRhymingSegment = {
  rhymingUnit: string;
  position: RhymePosition;
  originalText: string;
  syllableIndex?: number;
  /** Original last word before normalization (for UI highlight mapping) */
  lastWord?: string;
};

/**
 * Connector words that suggest a line is syntactically incomplete
 * (enjambement). Checked against the normalized last token.
 * Covers the most frequent Romance + Germanic cases.
 */
const ENJAMBMENT_CONNECTORS = new Set([
  // French
  'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car', 'que', 'qui', 'dont',
  'de', 'du', 'des', 'le', 'la', 'les', 'un', 'une', 'en', 'par',
  'pour', 'sur', 'sous', 'avec', 'sans', 'vers', 'comme',
  // English
  'and', 'or', 'but', 'so', 'yet', 'nor', 'for', 'the', 'a', 'an',
  'of', 'in', 'on', 'at', 'to', 'by', 'from', 'with', 'into', 'like',
  // Spanish / Italian / Portuguese
  'y', 'e', 'o', 'pero', 'sino', 'porque', 'con', 'sin', 'por',
  // German / Dutch
  'und', 'oder', 'aber', 'weil', 'mit', 'ohne', 'von', 'en', 'maar', 'van',
  // Yoruba (ALGO-BNT)
  'ati', 'àti', 'tabi', 'tàbí', 'nitori', 'bi', 'ti', 'ni', 'si', 'fun',
  // Swahili (ALGO-BNT)
  'na', 'ya', 'wa', 'za', 'la', 'kwa', 'bila', 'hadi', 'au',
  // Dioula / Bambara (ALGO-KWA)
  'ani', 'walima', 'nka', 'fo', 'kɔ',
  // Baoulé (ALGO-KWA)
  'mɔ', 'kɛ', 'yɛ',
  // Ewe / Mina (ALGO-KWA)
  'kple', 'eye', 'ke', 'ne', 'le',
  // Lingala (ALGO-BNT)
  'mpe', 'to', 'kasi', 'po',
  // Nigerian Pidgin / Nouchi (ALGO-CRE)
  'pis', 'kon', 'sof', 'den', 'dem', 'wit',
  // Bekwarra / Ijaw (ALGO-CRV)
  'ma', 'be',
]);

/**
 * Check connector words in their current Unicode form and in NFC so tonal
 * connector spellings match whether they arrive precomposed or decomposed.
 */
const isEnjambmentConnector = (normalizedToken: string): boolean =>
  ENJAMBMENT_CONNECTORS.has(normalizedToken) || ENJAMBMENT_CONNECTORS.has(normalizedToken.normalize('NFC'));

/**
 * Families with agglutinative morphology where the last word of a line may
 * carry multiple candidate stress positions. For these families, we pick the
 * last stressed syllable (approximated as the last vowel-group boundary).
 */
const AGGLUTINATIVE_FAMILIES = new Set(['ALGO-TRK', 'ALGO-FIN', 'ALGO-KOR']);

/**
 * Detect whether a line contains an internal rhyme by scanning for a
 * repeated rhyme suffix pattern before the final word.
 *
 * Strategy: derive the last-vowel-group suffix for each candidate token and
 * for the end word, then check whether one suffix is a prefix of the other
 * (which handles trailing silent consonants, e.g. "nuit" suffix "uit" matches
 * "lui" suffix "ui" because "uit" starts with "ui"). The shared nucleus must
 * be at least 2 characters to avoid false positives on common single-vowel
 * endings like "e".
 *
 * Returns the normalized mid-line token that mirrors the end rhyme, or null if none.
 */
const detectInternalRhymeToken = (tokens: string[], lastWord: string, langCode?: string): string | null => {
  if (tokens.length < 2) return null;

  const memoGet = makeMemoizedGetVowelGroups();
  const lwSuffix = getLastVowelGroupSuffix(lastWord, langCode, memoGet);

  // A single-character nucleus and Romance mute-final "-es" are too common to
  // be meaningful internal rhymes, and they cause false positives such as
  // "ces" being selected as the rhyming unit for "certitudes".
  if (!lwSuffix || lwSuffix.length < 2 || lwSuffix === 'es') return null;

  const candidates = tokens.slice(0, -1);
  for (const token of candidates) {
    const normalized = normalizeWord(token, langCode);
    if (!normalized) continue;

    const suffix = getLastVowelGroupSuffix(normalized, langCode, memoGet);
    if (!suffix) continue;

    // One suffix must be a leading prefix of the other so that "uit"/"ui"
    // (nuit/lui) and "oir"/"oir" (soir/avoir) both match, while "e"/"are"
    // (marche/encore) do not. Require >= 2 shared characters.
    const shared = suffix.startsWith(lwSuffix)
      ? lwSuffix
      : lwSuffix.startsWith(suffix)
        ? suffix
        : null;

    if (shared && shared.length >= 2) return normalized;
  }
  return null;
};

/**
 * Step-0 of the rhyme pipeline: segment a raw verse line into its rhyming
 * unit before passing to G2P / IPA scoring.
 *
 * Rules applied in order:
 * 1. Strip trailing punctuation; tokenize on whitespace.
 * 2. For agglutinative families (TRK/FIN/KOR): take the last word, extract
 *    its last stressed syllable (last vowel-group), use that as rhymingUnit.
 * 3. Enjambement heuristic: if the last normalized token is a known connector
 *    word, mark position as 'enjambed' and use the penultimate content word.
 * 4. Internal rhyme detection: check whether any pre-final token shares the
 *    end-rhyme suffix. If found, mark position as 'internal'.
 * 5. Default: last word of line → position 'end'.
 *
 * Tonal languages (KWA/CRV/BNT/SIN/TAI/VIET): extractLastWord is called
 * without diacritic stripping so tone marks are preserved in rhymingUnit.
 *
 * @param line       Raw verse line text
 * @param langCode   ISO 639 code; undefined → ALGO-ROM rules
 * @returns          VerseRhymingSegment ready for pipeline step 1
 */
export const segmentVerseToRhymingUnit = (line: string, langCode?: string): VerseRhymingSegment => {
  const family = langCode ? getAlgoFamily(langCode) : undefined;

  // Tokenize: strip trailing punctuation then split on whitespace
  const stripped = line.trimEnd().replace(/[^\p{L}\p{N}\s]+$/u, '').trim();
  const tokens = stripped.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return { rhymingUnit: '', position: 'end', originalText: line };
  }

  // ── Agglutinative: pick last stressed syllable of last word ──────────────
  if (family && AGGLUTINATIVE_FAMILIES.has(family)) {
    const lastToken = tokens[tokens.length - 1]!;
    const normalized = normalizeWord(lastToken, langCode);
    const vowelGroups = getVowelGroups(normalized);
    // For non-Latin scripts (e.g. Hangul) normalizeWord may strip everything;
    // fall back to the original token so rhymingUnit is never empty.
    const rhymingUnit = vowelGroups.length > 0
      ? normalized.slice(vowelGroups[vowelGroups.length - 1]!.start)
      : (normalized || lastToken);
    return {
      rhymingUnit,
      position: 'end',
      originalText: line,
    };
  }

  // ── Enjambement heuristic ─────────────────────────────────────────────────
  const lastToken = tokens[tokens.length - 1]!;
  const lastNormalized = normalizeWord(lastToken, langCode);
  if (isEnjambmentConnector(lastNormalized) && tokens.length >= 2) {
    const contentToken = tokens[tokens.length - 2]!;
    const contentNormalized = normalizeWord(contentToken, langCode);
    // Enjambed content is returned for display/highlight matching, so compose
    // tonal marks back to NFC; default tonal end-rhymes keep NFD for analysis.
    return {
      rhymingUnit: isTonalLanguage(langCode || '') ? contentNormalized.normalize('NFC') : contentNormalized,
      position: 'enjambed',
      originalText: line,
    };
  }

  // ── Internal rhyme detection ──────────────────────────────────────────────
  const wordMatch = extractLastWord(stripped, langCode);
  if (wordMatch) {
    const internalToken = detectInternalRhymeToken(tokens, wordMatch.normalizedWord, langCode);
    if (internalToken) {
      return {
        rhymingUnit: internalToken,
        position: 'internal',
        originalText: line,
        lastWord: wordMatch.lastWord,
      };
    }
  }

  // ── Default: end rhyme ────────────────────────────────────────────────────
  const rhymingUnit = wordMatch ? wordMatch.normalizedWord : lastNormalized;
  const segment: VerseRhymingSegment = {
    rhymingUnit,
    position: 'end',
    originalText: line,
  };
  if (wordMatch) segment.lastWord = wordMatch.lastWord;
  return segment;
};

// ─── Existing exports unchanged below ────────────────────────────────────────

const tokenize = (text: string) =>
  normalizeText(text)
    .split(' ')
    .map(token => token.trim())
    .filter(token => token.length > 2);

const getSongLines = (song: Section[]) =>
  song
    .flatMap(section => (section.lines ?? []).map(line => normalizeText(line.text ?? '')))
    .filter(Boolean);

const getSongTokens = (song: Section[]) => getSongLines(song).flatMap(tokenize);

const ratio = (intersection: number, union: number) => (union > 0 ? intersection / union : 0);

const getSetOverlapRatio = (left: string[], right: string[]) => {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersection = [...leftSet].filter(value => rightSet.has(value)).length;
  const union = new Set([...leftSet, ...rightSet]).size;
  return ratio(intersection, union);
};

const getSharedKeywords = (
  currentTokens: string[],
  candidateSong: Section[],
) => {
  const currentCounts = new Map<string, number>();
  const candidateCounts = new Map<string, number>();

  for (const token of currentTokens) {
    currentCounts.set(token, (currentCounts.get(token) || 0) + 1);
  }

  for (const token of getSongTokens(candidateSong)) {
    candidateCounts.set(token, (candidateCounts.get(token) || 0) + 1);
  }

  return [...currentCounts.entries()]
    .filter(([token]) => candidateCounts.has(token))
    .map(([token, count]) => ({
      token,
      weight: count + (candidateCounts.get(token) || 0),
    }))
    .sort((a, b) => b.weight - a.weight || a.token.localeCompare(b.token))
    .slice(0, 5)
    .map(item => item.token);
};

const getMatchedSections = (currentSong: Section[], candidateSong: Section[]) => {
  const candidateByName = new Map(
    candidateSong.map(section => [normalizeText(section.name), section] as const),
  );

  return currentSong
    .map((section) => {
      const candidateSection = candidateByName.get(normalizeText(section.name));
      if (!candidateSection) return null;

      const sectionScore = Math.round(
        getSetOverlapRatio(
          (section.lines ?? []).map(line => normalizeText(line.text ?? '')).filter(Boolean),
          (candidateSection.lines ?? []).map(line => normalizeText(line.text ?? '')).filter(Boolean),
        ) * 100,
      );

      if (sectionScore === 0) return null;

      return {
        name: section.name,
        score: sectionScore,
      };
    })
    .filter((section): section is SimilaritySectionMatch => section !== null)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
};

const calculateSimilarity = (
  currentLines: string[],
  currentTokens: string[],
  candidateSong: Section[],
  currentSong: Section[],
) => {
  const candidateLines = getSongLines(candidateSong);
  const candidateTokens = getSongTokens(candidateSong);
  const currentSections = currentSong.map(section => normalizeText(section.name));
  const candidateSections = candidateSong.map(section => normalizeText(section.name));

  const lineScore = getSetOverlapRatio(currentLines, candidateLines);
  const tokenScore = getSetOverlapRatio(currentTokens, candidateTokens);
  const structureScore = getSetOverlapRatio(currentSections, candidateSections);

  return Math.round((tokenScore * 0.6 + lineScore * 0.3 + structureScore * 0.1) * 100);
};

/**
 * Section-level lyric similarity and rhyme metadata live here.
 * For IPA phoneme distance/scoring, use ipaUtils.ts through ipaPipeline.ts.
 */
export const calculateSimilarityWithMetadata = (
  currentSong: Section[],
  candidateSong: Section[],
): Omit<SimilarityMatch, 'versionId' | 'versionName' | 'title' | 'timestamp'> => {
  const currentTokens = getSongTokens(currentSong);
  const currentLines = getSongLines(currentSong);
  const candidateTokens = getSongTokens(candidateSong);
  const candidateTokenSet = new Set(candidateTokens);
  const candidateLines = getSongLines(candidateSong);
  const candidateLineSet = new Set(candidateLines);

  const sharedWords = new Set(currentTokens.filter(token => candidateTokenSet.has(token))).size;
  const sharedLines = new Set(currentLines.filter(line => candidateLineSet.has(line))).size;

  return {
    score: calculateSimilarity(currentLines, currentTokens, candidateSong, currentSong),
    sharedWords,
    sharedLines,
    sharedKeywords: getSharedKeywords(currentTokens, candidateSong),
    matchedSections: getMatchedSections(currentSong, candidateSong).slice(0, 3),
  };
};

export const getTopSimilarSongMatches = (
  currentSong: Section[],
  versions: SongVersion[],
  limit = 3,
): SimilarityMatch[] => {
  if (currentSong.length === 0) return [];

  const currentTokens = getSongTokens(currentSong);
  const currentLines = getSongLines(currentSong);

  return versions
    .filter(version => (version.song ?? []).length > 0)
    .map((version) => {
      const candidateTokens = getSongTokens(version.song);
      const candidateTokenSet = new Set(candidateTokens);
      const candidateLines = getSongLines(version.song);
      const candidateLineSet = new Set(candidateLines);

      const sharedWords = new Set(currentTokens.filter(token => candidateTokenSet.has(token))).size;
      const sharedLines = new Set(currentLines.filter(line => candidateLineSet.has(line))).size;

      return {
        versionId: version.id,
        versionName: version.name,
        title: version.title,
        timestamp: version.timestamp,
        score: calculateSimilarity(currentLines, currentTokens, version.song, currentSong),
        sharedWords,
        sharedLines,
        sharedKeywords: getSharedKeywords(currentTokens, version.song),
        matchedSections: getMatchedSections(currentSong, version.song).slice(0, 3),
        method: 'graphemic' as const,
      };
    })
    .sort((a, b) => b.score - a.score || b.timestamp - a.timestamp)
    .slice(0, limit);
};

export type { RhymeMatchOptions };
