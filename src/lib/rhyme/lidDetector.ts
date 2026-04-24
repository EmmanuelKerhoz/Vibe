/**
 * Rhyme Engine v3 — Language Identification & Code-Switching Detector
 *
 * Lightweight span-level LID for the diglossia pairs most common in the
 * Vibe lyricist context (FR+African, EN+African, FR+AR).
 */

import type { LangCode } from './types';

export interface LIDSpan {
  lang: LangCode;
  start: number;
  end: number;
  confidence: number;
}

type CSEntry = {
  primary: LangCode;
  secondary: LangCode;
  grams: string[];
  stopwords: string[];
};

const CS_REGISTRY: CSEntry[] = [
  {
    primary: 'fr', secondary: 'di',
    grams: ['ani', 'bla', 'nko', 'olo', 'aba', 'nna'],
    stopwords: ['ka', 'ni', 'ye', 'ko', 'la', 'ma', 'do', 'sigi', 'tuma', 'bɛ', 'den'],
  },
  {
    primary: 'fr', secondary: 'ba',
    grams: ['kɔ', 'ɛ', 'mɔ', 'nna', 'aba', 'ami'],
    stopwords: ['ɔ', 'mɛ', 'mɔ', 'yɛ', 'wɔ', 'kɛ', 'nna', 'mma', 'kaa'],
  },
  {
    primary: 'en', secondary: 'yo',
    grams: ['ọ', 'ẹ', 'gb', 'kp', 'ìn', 'àn', 'ẹn'],
    stopwords: ['ni', 'ko', 'ti', 'mo', 'wa', 'mi', 'ọ', 'fun', 'naa'],
  },
  {
    primary: 'en', secondary: 'ha',
    grams: ['ƙa', 'ɗa', 'ts', 'sh', 'ana', 'ake'],
    stopwords: ['da', 'na', 'ba', 'ne', 'ce', 'ni', 'su', 'ya', 'sai', 'kuma', 'amma'],
  },
  {
    primary: 'fr', secondary: 'ar',
    grams: ['\u0627', '\u0644', '\u0646', '\u0645', '\u0648'],
    stopwords: ['\u0641\u064A', '\u0645\u0646', '\u0625\u0644\u0649', '\u0648\u0627\u0644'],
  },
  {
    primary: 'en', secondary: 'sw',
    grams: ['aka', 'kwa', 'ndi', 'nia', 'cha', 'mwa'],
    stopwords: ['na', 'ya', 'wa', 'ni', 'kwa', 'pia', 'sana', 'lakini'],
  },
  {
    primary: 'fr', secondary: 'ew',
    grams: ['xɔ', 'ɖe', 'wo', 'tsi', 'ŋu', 'lɔ'],
    stopwords: ['le', 'ɖe', 'la', 'ne', 'be', 'nu', 'ame', 'wò'],
  },
  {
    primary: 'en', secondary: 'pcm',
    grams: ['abi', 'sha', 'dem', 'una', 'abeg', 'wey'],
    stopwords: ['na', 'de', 'dey', 'no', 'abi', 'sha', 'sabi', 'oyibo', 'wahala'],
  },
];

const CS_CONFIDENCE_THRESHOLD = 0.55;

function tokenAffinityScore(token: string, entry: CSEntry): number {
  const t = token.toLowerCase();
  if (entry.stopwords.includes(t)) return 0.85;
  const hits = entry.grams.filter(g => t.includes(g)).length;
  if (hits === 0) return 0;
  return Math.min(0.4 + hits * 0.15, 0.80);
}

export function detectCodeSwitching(tokens: string[], primaryLang: LangCode): LIDSpan[] {
  const spans: LIDSpan[] = [];
  const candidates = CS_REGISTRY.filter(e => e.primary === primaryLang);
  if (candidates.length === 0) return spans;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (token.length < 2) continue;
    let bestEntry: CSEntry | null = null;
    let bestScore = 0;
    for (const entry of candidates) {
      const score = tokenAffinityScore(token, entry);
      if (score > bestScore) { bestScore = score; bestEntry = entry; }
    }
    if (bestEntry && bestScore >= CS_CONFIDENCE_THRESHOLD) {
      spans.push({ lang: bestEntry.secondary, start: i, end: i, confidence: bestScore });
    }
  }
  return spans;
}

export function mergeAdjacentSpans(spans: LIDSpan[]): LIDSpan[] {
  if (spans.length === 0) return [];
  const merged: LIDSpan[] = [{ ...spans[0]! }];
  for (let i = 1; i < spans.length; i++) {
    const prev = merged[merged.length - 1]!;
    const cur = spans[i]!;
    if (cur.lang === prev.lang && cur.start === prev.end + 1) {
      prev.end = cur.end;
      prev.confidence = Math.max(prev.confidence, cur.confidence);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}
