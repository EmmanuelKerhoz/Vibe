/**
 * lidSpanDetector.ts
 * Step 3 — Token-level Language ID for code-switched / diglossic verses.
 * Covers 5 priority diglossic pairs + generic Unicode-block fallback.
 * Returns per-token langcodes for downstream routing to the correct RhymeAlgo.
 */

import type { LangFamily } from './morphoNucleus';

export interface TokenLang {
  token: string;
  langcode: string;
  family: LangFamily;
  confidence: number; // 0–1
}

export interface SpanDetectionResult {
  tokens: TokenLang[];
  dominantLang: string;
  isMixed: boolean;
}

// ── Script / Unicode-block signatures ───────────────────────────────────────

const SCRIPT_RANGES: Array<{ re: RegExp; langcode: string; family: LangFamily }> = [
  { re: /[\u0600-\u06FF]/, langcode: 'ar', family: 'SEM' },
  { re: /[\u0590-\u05FF]/, langcode: 'he', family: 'SEM' },
  { re: /[\u0900-\u097F]/, langcode: 'hi', family: 'IND' },
  { re: /[\u0E00-\u0E7F]/, langcode: 'th', family: 'TAI' },
  { re: /[\u3040-\u309F\u30A0-\u30FF]/, langcode: 'ja', family: 'JAP' },
  { re: /[\uAC00-\uD7AF]/, langcode: 'ko', family: 'KOR' },
  { re: /[\u4E00-\u9FFF]/, langcode: 'zh', family: 'SIN' },
  { re: /[\u1E00-\u1EFF]/, langcode: 'vi', family: 'DEFAULT' },
];

// ── Diglossic lexical word-lists (high-frequency markers only) ───────────────
// These are NOT exhaustive — they serve as tiebreakers when script is ambiguous.

const LEXICAL_MARKERS: Record<string, { words: Set<string>; family: LangFamily }> = {
  fr: {
    words: new Set([
      'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en',
      'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
      'est', 'sont', 'pas', 'plus', 'sur', 'dans', 'avec', 'pour',
    ]),
    family: 'ROM',
  },
  en: {
    words: new Set([
      'the', 'a', 'an', 'of', 'to', 'in', 'is', 'it', 'you', 'that',
      'he', 'was', 'for', 'on', 'are', 'with', 'as', 'at', 'be',
    ]),
    family: 'GER',
  },
  // Dioula / Bambara (latin script, West Africa)
  dyu: {
    words: new Set([
      'ni', 'ka', 'ko', 'ye', 'di', 'kɛ', 'bɛ', 'tɛ', 'nɔ', 'sɔ',
      'min', 'fɔ', 'dɔ', 'la', 'an', 'aw', 'u', 'o',
    ]),
    family: 'KWA',
  },
  bam: {
    words: new Set([
      'ni', 'ka', 'ye', 'ko', 'kɛ', 'bɛ', 'tɛ', 'nɔ', 'sɔ',
      'jɛ', 'fɔ', 'dɔ', 'la', 'an', 'aw', 'u', 'o', 'i',
    ]),
    family: 'KWA',
  },
  yo: {
    words: new Set([
      'ni', 'ti', 'si', 'fi', 'bi', 'ri', 'yi', 'je', 'lo', 'wa',
      'mo', 'o', 'a', 'e', 'ó', 'à', 'ẹ', 'ọ', 'ṣe', 'wọn',
    ]),
    family: 'KWA',
  },
  ha: {
    words: new Set([
      'da', 'na', 'ya', 'ta', 'su', 'mu', 'ka', 'ba', 'ne', 'ce',
      'shi', 'ita', 'mai', 'sai', 'don', 'wai', 'ga',
    ]),
    family: 'CRV',
  },
};

// ── Detection logic ──────────────────────────────────────────────────────────

function detectTokenLang(token: string): TokenLang {
  const lower = token.toLowerCase();

  // 1. Script-based (high confidence)
  for (const { re, langcode, family } of SCRIPT_RANGES) {
    if (re.test(token)) {
      return { token, langcode, family, confidence: 0.95 };
    }
  }

  // 2. Lexical marker match
  for (const [langcode, { words, family }] of Object.entries(LEXICAL_MARKERS)) {
    if (words.has(lower)) {
      return { token, langcode, family, confidence: 0.75 };
    }
  }

  // 3. Heuristic: presence of tone diacritics → Vietnamese / Yoruba / Ewe
  if (/[àáâãäåèéêëìíîïòóôõöùúûüýÿ]/i.test(token)) {
    // Prefer 'vi' if multiple stacked diacritics
    if (/[\u1EA0-\u1EF9]/u.test(token)) {
      return { token, langcode: 'vi', family: 'DEFAULT', confidence: 0.65 };
    }
    return { token, langcode: 'yo', family: 'KWA', confidence: 0.5 };
  }

  // 4. Default: Latin → assume dominant lang (caller resolves)
  return { token, langcode: 'UNKNOWN', family: 'DEFAULT', confidence: 0.3 };
}

export function detectSpanLangs(
  tokens: string[],
  defaultLangcode = 'fr'
): SpanDetectionResult {
  const detected = tokens.map(detectTokenLang);

  // Resolve UNKNOWN tokens to defaultLangcode
  const resolved = detected.map(t =>
    t.langcode === 'UNKNOWN'
      ? {
          ...t,
          langcode: defaultLangcode,
          family: (LEXICAL_MARKERS[defaultLangcode]?.family ?? 'DEFAULT') as LangFamily,
          confidence: 0.4,
        }
      : t
  );

  // Dominant lang = highest token count
  const counts: Record<string, number> = {};
  for (const t of resolved) counts[t.langcode] = (counts[t.langcode] ?? 0) + 1;
  const dominantLang = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? defaultLangcode;
  const isMixed = Object.keys(counts).length > 1;

  return { tokens: resolved, dominantLang, isMixed };
}

export function detectCodeSwitch(text: string, defaultLangcode = 'fr'): {
  detectedLang: string;
  isMixed: boolean;
  confidence: number;
} | null {
  const tokens = text
    .split(/\s+/)
    .map(t => t.trim())
    .filter(Boolean);

  if (!tokens.length) return null;

  const res = detectSpanLangs(tokens, defaultLangcode);
  const confidence = res.tokens.length > 0
    ? res.tokens.reduce((acc, t) => acc + (t.confidence ?? 0), 0) / res.tokens.length
    : 0;

  return {
    detectedLang: res.dominantLang,
    isMixed: res.isMixed,
    confidence,
  };
}
