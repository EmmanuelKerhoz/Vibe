/**
 * detectLanguage.ts
 * Lightweight Language Identification (LID) for the linguistics engine.
 *
 * Two-stage pipeline — no external dependencies, offline, < 3 KB:
 *
 *   Stage 1 — Script detector
 *     Unicode range matching resolves ~80% of cases unambiguously
 *     (Cyrillic → ru, CJK → zh/ja/ko, Arabic → ar, Devanagari → hi, etc.).
 *
 *   Stage 2 — Word-pilot detector
 *     For Latin-script text, a small set of high-frequency, language-exclusive
 *     words scores each candidate language. Highest score wins.
 *     Covered: fr, en, es, it, pt, de, nl, sw, yo, ha, id, tr, fi, hu, vi, th.
 *
 * @param text  Raw text (lyric, word, or sentence). May be mixed-script.
 * @returns     ISO 639-1/3 language code, or DEFAULT_LANG if detection fails.
 *
 * Confidence is intentionally NOT exposed in the public API — callers receive
 * a code and use it; the Registry's ALGO-ROBUST fallback handles residual errors.
 */

// ─── Constants ──────────────────────────────────────────────────────────────

/** Returned when detection fails or text is too short. */
export const DEFAULT_LANG = 'fr';

/** Minimum token count for word-pilot scoring to be trusted. */
const MIN_TOKENS = 3;

// ─── Stage 1: Script Detector ───────────────────────────────────────────────

/**
 * Unicode range → language code.
 * Checked in order; first match wins.
 * Ranges cover the primary script for each language family.
 */
const SCRIPT_RULES: Array<{ pattern: RegExp; lang: string }> = [
  // Cyrillic
  { pattern: /[\u0400-\u04FF]/, lang: 'ru' },
  // Arabic / Farsi
  { pattern: /[\u0600-\u06FF]/, lang: 'ar' },
  // Hebrew
  { pattern: /[\u0590-\u05FF]/, lang: 'he' },
  // Devanagari (Hindi / Sanskrit)
  { pattern: /[\u0900-\u097F]/, lang: 'hi' },
  // Bengali
  { pattern: /[\u0980-\u09FF]/, lang: 'bn' },
  // Tamil
  { pattern: /[\u0B80-\u0BFF]/, lang: 'ta' },
  // Telugu
  { pattern: /[\u0C00-\u0C7F]/, lang: 'te' },
  // Kannada
  { pattern: /[\u0C80-\u0CFF]/, lang: 'kn' },
  // Malayalam
  { pattern: /[\u0D00-\u0D7F]/, lang: 'ml' },
  // Thai
  { pattern: /[\u0E00-\u0E7F]/, lang: 'th' },
  // CJK Unified Ideographs — Japanese wins over Chinese when kana present
  { pattern: /[\u3040-\u30FF]/, lang: 'ja' },   // Hiragana / Katakana (unambiguous)
  { pattern: /[\uAC00-\uD7AF]/, lang: 'ko' },   // Hangul
  { pattern: /[\u4E00-\u9FFF]/, lang: 'zh' },   // CJK (Chinese fallback)
  // Ethiopic (Amharic)
  { pattern: /[\u1200-\u137F]/, lang: 'am' },
  // Georgian
  { pattern: /[\u10A0-\u10FF]/, lang: 'ka' },
];

/**
 * Returns a language code if the text's dominant script is non-Latin,
 * or undefined if Latin (requires Stage 2).
 */
function detectByScript(text: string): string | undefined {
  for (const { pattern, lang } of SCRIPT_RULES) {
    if (pattern.test(text)) return lang;
  }
  return undefined;
}

// ─── Stage 2: Word-Pilot Detector ────────────────────────────────────────────

/**
 * Pilot word lists — high-frequency, exclusive to the target language.
 * Selection criteria:
 *   - Top-100 most frequent words in the language
 *   - NOT shared with other languages in this list (no 'de', 'la', 'le')
 *   - Short (≤6 chars) for fast matching
 *   - Grammatical words (articles, prepositions, pronouns) preferred
 *
 * Scores: each matched word adds +2. Multi-word match adds +3.
 * Tie: DEFAULT_LANG wins.
 */
const WORD_PILOTS: Record<string, string[]> = {
  fr: [
    'je', 'tu', 'nous', 'vous', 'dans', 'avec', 'sur', 'cette',
    'mais', 'donc', 'quand', 'comme', 'très', 'plus', 'aussi',
    'pour', 'les', 'des', 'une', 'mon', 'ton', 'son', 'mes',
    'est', 'était', 'être', 'avoir', 'fait', 'dire', 'savoir',
    'toujours', 'jamais', 'encore', 'peut', 'tout',
  ],
  en: [
    'the', 'and', 'that', 'this', 'with', 'from', 'they', 'have',
    'been', 'will', 'would', 'could', 'should', 'their', 'there',
    'when', 'what', 'which', 'your', 'you',
  ],
  es: [
    'que', 'una', 'por', 'con', 'para', 'pero', 'como', 'más',
    'todo', 'este', 'esta', 'tiene', 'cuando', 'desde', 'hasta',
    'porque', 'también', 'bien', 'entre', 'puede',
  ],
  it: [
    'che', 'una', 'per', 'con', 'sono', 'come', 'anche', 'tutto',
    'questo', 'questa', 'quando', 'perché', 'loro', 'bene', 'può',
    'siamo', 'vuole', 'sapere',
  ],
  pt: [
    'que', 'uma', 'por', 'com', 'para', 'mas', 'como', 'tudo',
    'este', 'esta', 'quando', 'porque', 'também', 'bem', 'pode',
    'são', 'está', 'esse',
  ],
  de: [
    'der', 'die', 'das', 'und', 'ist', 'ein', 'eine', 'nicht',
    'mit', 'von', 'sich', 'auch', 'auf', 'bei', 'nach', 'war',
    'wird', 'ich', 'du', 'wir', 'ihr', 'sie',
  ],
  nl: [
    'het', 'een', 'niet', 'van', 'zijn', 'ook', 'dat', 'met',
    'voor', 'door', 'bij', 'maar', 'nog', 'wel', 'wordt',
  ],
  sw: [
    'na', 'ya', 'wa', 'kwa', 'ni', 'hii', 'hilo', 'hiyo',
    'sana', 'pia', 'bali', 'lakini', 'kwamba',
  ],
  yo: [
    'ti', 'ni', 'naa', 'ati', 'fun', 'lati', 'ojo', 'omo',
    'ilu', 'ile', 'agba',
  ],
  ha: [
    'da', 'ne', 'ce', 'na', 'kuma', 'amma', 'don', 'daga',
    'cikin', 'gare',
  ],
  id: [
    'yang', 'dan', 'ini', 'itu', 'dari', 'dengan', 'untuk', 'tidak',
    'ada', 'juga', 'bisa', 'akan',
  ],
  tr: [
    'bir', 'bu', 'ile', 'için', 'olan', 'ben', 'sen', 'biz',
    'gibi', 'değil', 'daha', 'çok',
  ],
  fi: [
    'on', 'ja', 'ei', 'en', 'olla', 'hän', 'se', 'tämä',
    'sitten', 'myös', 'kaikki', 'niin',
  ],
  hu: [
    'és', 'az', 'egy', 'nem', 'van', 'meg', 'már', 'csak',
    'hogy', 'mint', 'de', 'pedig',
  ],
  vi: [
    'và', 'của', 'có', 'là', 'cho', 'trong', 'đó', 'với',
    'được', 'không', 'này', 'một',
  ],
};

/** Tokenise to lowercase words, stripping punctuation. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\s'-]/gu, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);
}

/**
 * Score each candidate language against the token list.
 * Returns the language with the highest score, or undefined if no signal.
 */
function detectByWordPilots(tokens: string[]): string | undefined {
  const tokenSet = new Set(tokens);
  const scores: Record<string, number> = {};

  for (const [lang, pilots] of Object.entries(WORD_PILOTS)) {
    let score = 0;
    for (const pilot of pilots) {
      if (tokenSet.has(pilot)) score += 2;
    }
    if (score > 0) scores[lang] = score;
  }

  if (Object.keys(scores).length === 0) return undefined;

  // Sort by score descending; DEFAULT_LANG wins ties
  const sorted = Object.entries(scores).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0] === DEFAULT_LANG ? -1 : 1;
  });

  return sorted[0]![0];
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Detect the language of a text snippet.
 *
 * @param text  Raw text (lyric line, block, or single word).
 * @returns     ISO 639-1/3 code (e.g. 'fr', 'en', 'ar').
 *              Falls back to DEFAULT_LANG ('fr') when detection is uncertain.
 */
export function detectLanguage(text: string): string {
  if (!text || text.trim().length === 0) return DEFAULT_LANG;

  // Stage 1: non-Latin scripts resolved immediately
  const byScript = detectByScript(text);
  if (byScript) return byScript;

  // Stage 2: Latin-script word pilots
  const tokens = tokenize(text);
  if (tokens.length < MIN_TOKENS) return DEFAULT_LANG;

  return detectByWordPilots(tokens) ?? DEFAULT_LANG;
}

/**
 * Resolve 'auto' to a detected language code, or pass through any explicit code.
 * Convenience wrapper used by suggestRhymes() and detectRhymeScheme().
 *
 * @param text      Text to analyse if lang === 'auto'.
 * @param lang      Language code or 'auto'.
 * @returns         Resolved ISO 639-1/3 code.
 */
export function resolveLang(text: string, lang: string): string {
  return lang === 'auto' ? detectLanguage(text) : lang;
}
