/**
 * Rhyme Engine v2 — SEA + CJK Family Algorithms
 * Languages: TH (Thai), VI (Vietnamese), KM (Khmer) → SEA
 *            ZH (Mandarin), JA (Japanese), KO (Korean) → CJK
 *
 * SEA Strategy:
 * - TH: Thai script tone class detection (5 tones mapped to H/MH/M/ML/L),
 *       vowel nucleus from Unicode block \u0E40-\u0E44 (leading vowels) +
 *       \u0E30-\u0E39 (following vowels), final consonant as coda.
 * - VI: Latin-based, tone mark extraction (6 tones → H/MH/M/ML/L/F),
 *       vowel cluster + coda from last syllable.
 * - KM: Khmer script graphemic syllable; vowel diacritic cluster as nucleus,
 *       final consonant as coda. Tone proxied as '' (Khmer is not tonal).
 *
 * CJK Strategy:
 * - ZH: Pinyin-level graphemic proxy; each character treated as 1 mora.
 *       Last character surface form used; no G2P (requires external dict).
 * - JA: Last mora — if hiragana/katakana detected, extract final kana char.
 *       Kanji → graphemic fallback.
 * - KO: Hangul jamo decomposition: extract nucleus vowel (jung-seong) +
 *       coda consonant (jong-seong) from last syllable block.
 *
 * Scoring SEA:  vowel 40% + coda 20% + tone 40%
 * Scoring CJK:  graphemic character identity 100% (no phonological inference)
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';
import { phonemeEditDistance, toneDistance } from './scoring';

// ─── Thai ─────────────────────────────────────────────────────────────────────

// Thai tone marks (mai ek, mai tho, mai tri, mai jattawa)
const TH_TONE_MARKS: Record<string, string> = {
  '\u0E48': 'L',   // mai ek ่
  '\u0E49': 'ML',  // mai tho ้
  '\u0E4A': 'H',   // mai tri ๊
  '\u0E4B': 'MH',  // mai jattawa ๋
};

// Thai leading vowels (appear before consonant visually)
const TH_LEADING_VOWELS = /[\u0E40-\u0E44]/u;
// Thai following vowels / vowel diacritics
const TH_FOLLOWING_VOWELS = /[\u0E30-\u0E39\u0E45]/gu;

function extractTH(surface: string): { vowels: string; coda: string; tone: string } {
  let tone = 'M'; // default mid tone
  for (const [mark, t] of Object.entries(TH_TONE_MARKS)) {
    if (surface.includes(mark)) { tone = t; break; }
  }

  const followingMatches = surface.match(TH_FOLLOWING_VOWELS);
  const leadingMatch     = surface.match(TH_LEADING_VOWELS);
  const vowels = [
    ...(leadingMatch  ? [leadingMatch[0]!]    : []),
    ...(followingMatches ?? []),
  ].join('');

  // Last Thai consonant class (rough coda)
  const thChars = [...surface].filter(ch => {
    const cp = ch.codePointAt(0) ?? 0;
    return cp >= 0x0E01 && cp <= 0x0E2E; // Thai consonants
  });
  const coda = thChars.at(-1) ?? '';

  return { vowels: vowels || surface.slice(-2), coda, tone };
}

// ─── Vietnamese ───────────────────────────────────────────────────────────────

// Vietnamese tone diacritics → tone class
const VI_TONE_MAP: Array<[RegExp, string]> = [
  [/[àằầẩẫảãạặậ]/u, 'L'],   // huyền / nặng
  [/[áắấẩẫảãạặậ]/u, 'H'],   // sắc
  [/[ảằầẩẫảãạặậ]/u, 'MH'],  // hỏi
  [/[ãắấẩẫảãạặậ]/u, 'ML'],  // ngã
  [/[ạặậ]/u,         'F'],   // nặng / falling-checked
];

// Simpler: detect tone by NFD decomposition — combining marks
function extractVITone(surface: string): string {
  const nfd = surface.normalize('NFD');
  if (/\u0300/.test(nfd)) return 'L';  // grave = huyền
  if (/\u0301/.test(nfd)) return 'H';  // acute = sắc
  if (/\u0309/.test(nfd)) return 'MH'; // hook above = hỏi
  if (/\u0303/.test(nfd)) return 'ML'; // tilde = ngã
  if (/\u0323/.test(nfd)) return 'F';  // dot below = nặng
  return 'M'; // ngang (flat)
}

const LATIN_VOWELS_SEA = /[aăâeêioôơuưy]+/giu;

function extractVI(surface: string): { vowels: string; coda: string; tone: string } {
  const tone    = extractVITone(surface);
  const lower   = surface.toLowerCase().normalize('NFC');
  const matches = [...lower.matchAll(LATIN_VOWELS_SEA)];
  const last    = matches.at(-1);
  const vowels  = last?.[0] ?? lower.slice(-2);
  const idx     = last?.index ?? lower.length - 2;
  const coda    = lower.slice(idx + (last?.[0]?.length ?? 0));
  return { vowels, coda, tone };
}

// ─── Khmer ─────────────────────────────────────────────────────────────────────

// Khmer vowel diacritics range \u17B6-\u17D3
const KM_VOWELS = /[\u17B6-\u17C5]/gu;
// Khmer final consonants (subscript form cluster)
const KM_FINAL_CONSONANTS = /[\u1780-\u17A2][\u17D2][\u1780-\u17A2]/gu;

function extractKM(surface: string): { vowels: string; coda: string; tone: string } {
  const vowelMatches = surface.match(KM_VOWELS);
  const vowels = vowelMatches?.join('') ?? surface.slice(-2);
  // Khmer subscript coeng + consonant as coda
  const finalMatch = surface.match(KM_FINAL_CONSONANTS);
  const coda = finalMatch?.at(-1) ?? '';
  return { vowels, coda, tone: '' }; // Khmer: not tonal
}

// ─── Korean (Hangul jamo decomposition) ───────────────────────────────────────

// Hangul syllable block: U+AC00 – U+D7A3
function decomposeHangul(ch: string): { cho: string; jung: string; jong: string } | null {
  const cp = ch.codePointAt(0);
  if (cp === undefined || cp < 0xAC00 || cp > 0xD7A3) return null;
  const offset = cp - 0xAC00;
  const jong = offset % 28;
  const jung = Math.floor(offset / 28) % 21;
  const cho  = Math.floor(offset / 28 / 21);
  return {
    cho:  String.fromCodePoint(0x1100 + cho),
    jung: String.fromCodePoint(0x1161 + jung),
    jong: jong > 0 ? String.fromCodePoint(0x11A7 + jong) : '',
  };
}

function extractKO(surface: string): { vowels: string; coda: string } {
  const chars = [...surface];
  for (let i = chars.length - 1; i >= 0; i--) {
    const decomposed = decomposeHangul(chars[i]!);
    if (decomposed) {
      return { vowels: decomposed.jung, coda: decomposed.jong };
    }
  }
  return { vowels: surface.slice(-2), coda: '' };
}

// ─── Japanese (kana last mora) ─────────────────────────────────────────────────

// Hiragana \u3041-\u3096, Katakana \u30A1-\u30F6
const JA_KANA = /[\u3041-\u3096\u30A1-\u30F6]/gu;

function extractJA(surface: string): { vowels: string; coda: string } {
  const kanaMatches = surface.match(JA_KANA);
  if (kanaMatches?.length) {
    // Last kana = last mora
    const lastKana = kanaMatches.at(-1)!;
    return { vowels: lastKana, coda: '' };
  }
  // Kanji or mixed: graphemic last 2 chars
  return { vowels: surface.slice(-2), coda: '' };
}

// ─── Chinese (graphemic last character) ───────────────────────────────────────

function extractZH(surface: string): { vowels: string; coda: string } {
  // No G2P without a dictionary — use last CJK character as proxy
  const cjkMatches = surface.match(/[\u4E00-\u9FFF\u3400-\u4DBF]/gu);
  const last = cjkMatches?.at(-1) ?? surface.slice(-1);
  return { vowels: last, coda: '' };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function extractNucleusSEA(
  unit: LineEndingUnit,
  lang: LangCode
): RhymeNucleus {
  const { surface } = unit;
  if (!surface) return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 };

  let vowels = '', coda = '', tone = '';

  switch (lang) {
    case 'th': { const r = extractTH(surface);    vowels = r.vowels; coda = r.coda; tone = r.tone; break; }
    case 'vi': { const r = extractVI(surface);    vowels = r.vowels; coda = r.coda; tone = r.tone; break; }
    case 'km': { const r = extractKM(surface);    vowels = r.vowels; coda = r.coda; tone = r.tone; break; }
    default:   { vowels = surface.slice(-2); coda = ''; tone = ''; break; }
  }

  return { vowels, coda, tone, onset: '', moraCount: vowels.length >= 2 ? 2 : 1 };
}

export function extractNucleusCJK(
  unit: LineEndingUnit,
  lang: LangCode
): RhymeNucleus {
  const { surface } = unit;
  if (!surface) return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 };

  let vowels = '', coda = '';

  switch (lang) {
    case 'zh': { const r = extractZH(surface); vowels = r.vowels; coda = r.coda; break; }
    case 'ja': { const r = extractJA(surface); vowels = r.vowels; coda = r.coda; break; }
    case 'ko': { const r = extractKO(surface); vowels = r.vowels; coda = r.coda; break; }
    default:   { vowels = surface.slice(-2); coda = ''; break; }
  }

  return { vowels, coda, tone: '', onset: '', moraCount: 1 };
}

/**
 * SEA scoring: vowel 40% + coda 20% + tone 40%
 * Rationale: tonal languages require strong tone weight;
 * KM (non-tonal) automatically gets 40% neutral tone score via toneDistance('', '').
 */
export function scoreSEA(a: RhymeNucleus, b: RhymeNucleus): number {
  const vowSim  = 1 - phonemeEditDistance(a.vowels, b.vowels);
  const codaSim = 1 - phonemeEditDistance(a.coda,   b.coda);
  const toneSim = toneDistance(a.tone || undefined, b.tone || undefined);
  return 0.40 * vowSim + 0.20 * codaSim + 0.40 * toneSim;
}

/**
 * CJK scoring: pure graphemic identity on the nucleus character.
 * Two lines rhyme perfectly only if the last CJK character or kana mora is identical.
 * No partial credit — Mandarin homophones require a dictionary we don't have.
 */
export function scoreCJK(a: RhymeNucleus, b: RhymeNucleus): number {
  if (!a.vowels || !b.vowels) return 0;
  if (a.vowels === b.vowels) return 1;
  // Partial: fallback PED on the graphemic proxy
  const sim = 1 - phonemeEditDistance(a.vowels, b.vowels);
  return sim * 0.6; // penalised — CJK graphemic ≠ phonetic similarity
}
