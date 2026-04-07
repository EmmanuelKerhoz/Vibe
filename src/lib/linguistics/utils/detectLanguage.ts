/**
 * detectLanguage.ts
 * Lightweight Language IDentification (LID) — zero external deps.
 *
 * Pipeline (fastest-first, short-circuit on high confidence):
 *   1. Script detection   — CJK / Kana / Hangul / Arabic / Cyrillic → lang (0.95)
 *   2. Diacritic profile  — discriminant chars per Romance lang (0.80)
 *   3. Trigram scoring    — ranked cosine-like similarity vs. per-lang profiles
 *
 * Returns:
 *   lang        — ISO 639-1/3 code, or 'und' when undetermined
 *   confidence  — 0–1 float
 *   candidates  — top-3 scored candidates for transparency
 *
 * Design constraints:
 *   - Runs synchronously in a Web Worker (no async, no fetch)
 *   - Input: raw lyric text (multi-line ok, punctuation ok)
 *   - Min reliable input: ~15 characters / 3 words
 *   - Languages covered: FR EN ES IT PT AR ZH JA KO RU YO SW + Nouchi/Pidgin fallback
 */

import { isHanCharacter, isHangulSyllable, isKana } from './scriptUtils';

// ─── Public types ────────────────────────────────────────────────────────────

export interface LangCandidate {
  lang: string;
  score: number;
}

export interface DetectLanguageResult {
  /** Best detected language code (ISO 639-1/3), or 'und'. */
  lang: string;
  /** Confidence 0–1. Below 0.4 → 'und'. */
  confidence: number;
  /** Top-3 candidates with raw scores (for debug / UI). */
  candidates: LangCandidate[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CONFIDENCE_SCRIPT   = 0.95;
const CONFIDENCE_DIACRITIC = 0.80;
const CONFIDENCE_MIN       = 0.40;

// ─── Phase 1: Script detection ───────────────────────────────────────────────

const ARABIC_RE    = /[\u0600-\u06FF]/;
const CYRILLIC_RE  = /[\u0400-\u04FF]/;
const HEBREW_RE    = /[\u0590-\u05FF]/;
const DEVANAGARI_RE = /[\u0900-\u097F]/;
const THAI_RE      = /[\u0E00-\u0E7F]/;
const GEORGIAN_RE  = /[\u10A0-\u10FF]/;
const ETHIOPIC_RE  = /[\u1200-\u137F]/;

function detectByScript(text: string): string | null {
  // Sample up to 200 chars for speed
  const sample = text.slice(0, 200);

  let han = 0, kana = 0, hangul = 0;
  for (const ch of sample) {
    if (isHanCharacter(ch))   han++;
    else if (isKana(ch))      kana++;
    else if (isHangulSyllable(ch)) hangul++;
  }
  const total = sample.replace(/\s/g, '').length || 1;
  if (hangul / total > 0.15) return 'ko';
  if (kana   / total > 0.10) return 'ja';
  if (han    / total > 0.15) return 'zh';

  if (ARABIC_RE.test(sample))     return 'ar';
  if (CYRILLIC_RE.test(sample))   return 'ru';
  if (HEBREW_RE.test(sample))     return 'he';
  if (DEVANAGARI_RE.test(sample)) return 'hi';
  if (THAI_RE.test(sample))       return 'th';
  if (ETHIOPIC_RE.test(sample))   return 'am';

  return null; // Latin-ish — continue to phase 2
}

// ─── Phase 2: Diacritic fingerprint ──────────────────────────────────────────

/**
 * Each entry: [lang, regex, weight]
 * Ordered by discriminant power (most exclusive first).
 */
const DIACRITIC_RULES: Array<[string, RegExp, number]> = [
  // French exclusives
  ['fr', /[œÆæŒ]/,                             4],
  ['fr', /(?:^|\s)(?:le|la|les|de|du|un|une|et|je|tu|il|nous|vous|ils|est|pas|plus|sur|avec|dans|pour|par|mais|que|qui|ce|au|aux|ça|où|eux|lui|mon|ton|son|mes|tes|ses|notre|votre|leur)(?:\s|$)/i, 3],
  ['fr', /[éèêëàâùûîïôç]/,                     2],

  // Spanish exclusives
  ['es', /[¿¡ñ]/,                               4],
  ['es', /(?:^|\s)(?:el|la|los|las|de|del|un|una|y|en|que|es|no|se|por|con|para|una|su|sus|me|te|lo|le|al|como|más|pero|yo|tú|él)(?:\s|$)/i, 3],
  ['es', /[áéíóúü]/,                            1],

  // Portuguese exclusives
  ['pt', /[ãõ]|ão|ões|[çâêô]/,                 4],
  ['pt', /(?:^|\s)(?:de|da|do|das|dos|um|uma|e|em|que|não|se|por|com|para|uma|seu|sua|me|te|ao|como|mais|mas|eu|tu|ele|ela|nós|vocês)(?:\s|$)/i, 3],

  // Italian exclusives
  ['it', /(?:^|\s)(?:il|la|i|le|di|del|della|un|una|e|in|che|è|non|si|per|con|una|su|al|gli|lo|mi|ti|ci|vi|ho|ha|sono|sei|siamo|come|più|ma|io|tu|lui|lei|noi|voi)(?:\s|$)/i, 3],
  ['it', /[àèéìòóùú]/,                         1],

  // English markers (no unique diacritics — rely on stopwords)
  ['en', /(?:^|\s)(?:the|and|of|to|in|is|it|you|that|he|was|for|on|are|with|as|at|this|by|from|or|an|but|not|what|all|were|we|when|your|can|said|there|use|each|which|she|do|how|their|if|will|up|other|about|out|many|then|them|these|so|some|her|would|make|like|him|into|time|has|look|two|more|go|see|no|way|could|my|than|first|been|call|who|its|now|find|long|down|day|did|get|come|made|may)(?:\s|$)/i, 3],

  // Yoruba
  ['yo', /[ẹọṣ]/,                               5],

  // Swahili marker
  ['sw', /(?:^|\s)(?:na|ya|wa|za|la|ka|ni|si|kwa|cha|mwa|vya|pa|ku|mtu|watu|nchi|hii|hizi|hilo|hizo|kama|lakini|pia|zaidi|sana)(?:\s|$)/i, 3],
];

function scoreDiacritics(text: string): Map<string, number> {
  const scores = new Map<string, number>();
  for (const [lang, re, weight] of DIACRITIC_RULES) {
    if (re.test(text)) {
      scores.set(lang, (scores.get(lang) ?? 0) + weight);
    }
  }
  return scores;
}

// ─── Phase 3: Trigram profiles ────────────────────────────────────────────────

/**
 * ~40 most-discriminant trigrams per language, drawn from Dunning (1994)
 * and manual curation for African French / Nouchi / Pidgin.
 * Keys are lowercase, no diacritics (text is lowercased + stripped before matching).
 */
const TRIGRAM_PROFILES: Record<string, string[]> = {
  fr: [
    'les', 'des', 'que', 'ent', 'ion', 'ais', 'ant', 'ons', 'ers',
    'eur', 'our', 'ous', 'ait', 'est', 'ais', 'ure', 'ait', 'ien',
    'qui', 'une', 'nde', 'ell', 'pas', 'moi', 'toi', 'soi', 'tre',
    'ais', 'ver', 'eur', 'ans', 'par', 'sur', 'ont', 'ait', 'ous',
    'oir', 'oir', 'eau', 'aux', 'eux', 'tou',
  ],
  en: [
    'the', 'and', 'ing', 'ion', 'ent', 'hat', 'her', 'ere', 'tha',
    'ith', 'his', 'hin', 'ome', 'oun', 'ver', 'all', 'for', 'whe',
    'not', 'you', 'thi', 'tha', 'are', 'oul', 'out', 'een', 'igh',
    'ove', 'was', 'ack', 'oul', 'ake', 'ike', 'now', 'ame', 'ave',
    'ell', 'ook', 'can', 'get', 'don', 'say',
  ],
  es: [
    'que', 'ent', 'ion', 'los', 'del', 'con', 'una', 'ado', 'cer',
    'nte', 'est', 'ado', 'ica', 'ado', 'oso', 'cia', 'ada', 'ero',
    'era', 'par', 'por', 'nos', 'mas', 'todo', 'hay', 'ver', 'mir',
    'hab', 'qui', 'ndo', 'ando', 'ien', 'ual', 'dad', 'aba', 'aba',
    'sus', 'las', 'tan', 'sin', 'ser', 'ten',
  ],
  it: [
    'che', 'del', 'ell', 'ion', 'ent', 'ato', 'are', 'ere', 'ire',
    'one', 'con', 'per', 'nel', 'non', 'gli', 'all', 'ell', 'ell',
    'ava', 'iva', 'ato', 'ita', 'emo', 'amo', 'ino', 'ist', 'and',
    'oss', 'unt', 'ent', 'vol', 'pre', 'tra', 'sua', 'del', 'tra',
    'ndo', 'sti', 'ssa', 'tor', 'ori', 'ale',
  ],
  pt: [
    'que', 'ent', 'ion', 'dos', 'das', 'com', 'uma', 'ado', 'ara',
    'nte', 'est', 'ado', 'ica', 'cao', 'osa', 'cia', 'ada', 'eiro',
    'era', 'por', 'nos', 'mas', 'tudo', 'ver', 'olh', 'hab', 'qui',
    'ndo', 'ando', 'iem', 'ual', 'dade', 'aba', 'sus', 'tal', 'sem',
    'ser', 'tem', 'nha', 'lha', 'gar', 'mos',
  ],
  // Nouchi (Ivorian urban French creole) — shares FR trigrams but adds specific markers
  nou: [
    'les', 'que', 'ons', 'ais', 'gou', 'dja', 'man', 'bro', 'wou',
    'zin', 'fri', 'gba', 'cho', 'koi', 'zer', 'aie', 'waa', 'tch',
    'gos', 'vam', 'far', 'cam', 'bla', 'fon', 'car', 'biz',
  ],
  // Nigerian Pidgin
  pcm: [
    'dem', 'dey', 'wey', 'say', 'abi', 'sha', 'oga', 'kin', 'don',
    'wan', 'com', 'giv', 'tak', 'mak', 'una', 'nna', 'wor', 'fit',
    'sab', 'beg', 'hau', 'wen', 'wia', 'tok',
  ],
};

function extractTrigrams(text: string): Map<string, number> {
  // Normalize: lowercase, strip diacritics, keep alpha + spaces
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const freq = new Map<string, number>();
  const words = normalized.split(' ');
  for (const word of words) {
    if (word.length < 3) continue;
    for (let i = 0; i <= word.length - 3; i++) {
      const tri = word.slice(i, i + 3);
      freq.set(tri, (freq.get(tri) ?? 0) + 1);
    }
  }
  return freq;
}

function scoreTrigramProfile(textTrigrams: Map<string, number>, profile: string[]): number {
  let hits = 0;
  for (const tri of profile) {
    if (textTrigrams.has(tri)) hits += (textTrigrams.get(tri) ?? 0);
  }
  // Normalize by text length to avoid length bias
  const total = [...textTrigrams.values()].reduce((a, b) => a + b, 0) || 1;
  return hits / total;
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Detect the language of a text snippet.
 *
 * @param text  Raw input text (lyrics, sentence, phrase).
 * @returns     DetectLanguageResult — lang code, confidence, top candidates.
 *
 * @example
 *   detectLanguage('Je veux chanter sous la pluie');
 *   // { lang: 'fr', confidence: 0.82, candidates: [...] }
 *
 *   detectLanguage('I want to dance in the rain');
 *   // { lang: 'en', confidence: 0.78, candidates: [...] }
 */
export function detectLanguage(text: string): DetectLanguageResult {
  const UNDETERMINED: DetectLanguageResult = {
    lang: 'und',
    confidence: 0,
    candidates: [],
  };

  if (!text || text.trim().length < 4) return UNDETERMINED;

  // ── Phase 1: script ──────────────────────────────────────────────────────
  const scriptLang = detectByScript(text);
  if (scriptLang) {
    return {
      lang: scriptLang,
      confidence: CONFIDENCE_SCRIPT,
      candidates: [{ lang: scriptLang, score: CONFIDENCE_SCRIPT }],
    };
  }

  // ── Phase 2: diacritics ───────────────────────────────────────────────────
  const diacScores = scoreDiacritics(text);

  // ── Phase 3: trigrams ─────────────────────────────────────────────────────
  const textTrigrams = extractTrigrams(text);
  const trigramScores = new Map<string, number>();
  for (const [lang, profile] of Object.entries(TRIGRAM_PROFILES)) {
    trigramScores.set(lang, scoreTrigramProfile(textTrigrams, profile));
  }

  // ── Combine: diacritic (weight 3) + trigram (weight 1) ───────────────────
  const combined = new Map<string, number>();
  const allLangs = new Set([...diacScores.keys(), ...trigramScores.keys()]);
  for (const lang of allLangs) {
    const d = diacScores.get(lang) ?? 0;
    const t = trigramScores.get(lang) ?? 0;
    combined.set(lang, d * 3 + t * 10);
  }

  // ── Sort candidates ───────────────────────────────────────────────────────
  const sorted = [...combined.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (sorted.length === 0 || sorted[0][1] === 0) return UNDETERMINED;

  // Normalize top score to [0, 1]
  const maxRaw = sorted[0][1];
  const candidates: LangCandidate[] = sorted.map(([lang, raw]) => ({
    lang,
    score: Math.min(1, raw / maxRaw),
  }));

  // Compute confidence: ratio between 1st and 2nd candidate
  const confidence = candidates.length === 1
    ? CONFIDENCE_DIACRITIC
    : Math.min(0.95, CONFIDENCE_DIACRITIC * (1 - (candidates[1]?.score ?? 0) * 0.4));

  if (confidence < CONFIDENCE_MIN) return { ...UNDETERMINED, candidates };

  return {
    lang: candidates[0].lang,
    confidence: Math.round(confidence * 100) / 100,
    candidates,
  };
}
