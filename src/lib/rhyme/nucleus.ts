/**
 * Rhyme Engine v3 — Rhyme Nucleus Extraction
 *
 * Morpho-aware suffix stripping for TRK / FIN / HU families.
 * BNT noun-class prefix stripping (min stem guard).
 * Japanese mora-based nucleus (last 2 morae, honorific prefix exclusion).
 */

import type { FamilyId, LangCode, RhymeNucleus } from './types';

const VOWELS_LATIN = new Set('aeiouáéíóúàèìòùâêîôûäëïöüãõåæœøěůýAEIOUÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÄËÏÖÜĂȘ');
const VOWELS_IPA   = new Set('aeiouɑæɐɛɜɪɔʊʌəɹ');
const VOWELS_ALL   = new Set([...VOWELS_LATIN, ...VOWELS_IPA]);
const TONE_DIACRITICS_LATIN: RegExp = /[\u0300-\u0308\u030A-\u036F]/gu;

// ─── TRK morpheme suffixes (sorted longest-first for greedy match) ────────────
const TRK_SUFFIXES = [
  'ların', 'lerin', 'larım', 'lerim', 'larına', 'lerine',
  'lardan', 'lerden', 'lara', 'lere',
  'lar', 'ler', 'nın', 'nin', 'nun', 'nün',
  'dan', 'den', 'tan', 'ten', 'da', 'de', 'ta', 'te',
  'a', 'e', 'ı', 'i', 'u', 'ü',
  'ım', 'im', 'um', 'üm', 'yım', 'yim',
  'ın', 'in', 'un', 'ün',
  'dır', 'dir', 'dur', 'dür', 'tır', 'tir', 'tur', 'tür',
  'mak', 'mek', 'mış', 'miş', 'muş', 'müş',
  'yor', 'yar', 'acak', 'ecek', 'mal', 'mel',
].sort((a, b) => b.length - a.length);

// ─── FIN suffixes (Finnish + Estonian) ───────────────────────────────────────
const FIN_SUFFIXES = [
  'kseen', 'kseesi', 'nsa', 'nsä', 'ansa', 'änsä',
  'llaan', 'llään', 'lleen',
  'ssa', 'ssä', 'sta', 'stä', 'lla', 'llä', 'lta', 'ltä',
  'lle', 'ksi', 'tta', 'ttä', 'na', 'nä', 'ko', 'kö',
  'kin', 'kaan', 'kään', 'han', 'hän',
  'ni', 'si', 'mme', 'nne',
  // Estonian
  'nak', 'nek', 'de', 'tes', 'le', 'lt', 'ga', 'ks',
].sort((a, b) => b.length - a.length);

// ─── HU suffixes (Hungarian — isolated from FIN to avoid false strip) ─────────
const HU_SUFFIXES = [
  'ban', 'ben', 'ból', 'ből', 'hoz', 'hez', 'höz',
  'tól', 'től', 'ról', 'ről', 'nál', 'nél',
  'val', 'vel', 'ra', 're', 'on', 'en', 'ön',
  'ba', 'be', 'ig', 'ért', 'ként', 'ul', 'ül',
  'k', 't', 'm', 'd', 'nk', 'tek', 'ják', 'jék',
].sort((a, b) => b.length - a.length);

function stripMorphoSuffix(token: string, suffixes: string[], minStem = 3): string {
  for (const suf of suffixes) {
    if (token.endsWith(suf) && token.length - suf.length >= minStem) {
      return token.slice(0, token.length - suf.length);
    }
  }
  return token;
}

// ─── BNT noun-class prefixes ─────────────────────────────────────────────────
const BNT_PREFIXES = [
  'mi', 'mu', 'wa', 'ki', 'vi', 'li', 'ma', 'pa', 'ku', 'gu', 'bu', 'lu',
  'zu', 'tu', 'ka', 'zi', 'bi', 'ba', 'di', 'ri', 'si', 'gi', 'ti',
  'm', 'u', 'i', 'n', 'a',
].sort((a, b) => b.length - a.length);

function stripBNTPrefix(token: string, minStem = 3): string {
  for (const pfx of BNT_PREFIXES) {
    if (token.startsWith(pfx) && token.length - pfx.length >= minStem) {
      return token.slice(pfx.length);
    }
  }
  return token;
}

// ─── Japanese mora extraction ─────────────────────────────────────────────────
const JP_HON_PREFIXES = ['お', 'ご', '御', 'お無', 'ご無'];
const JP_MORA_RE = /[\u3041-\u3096\u30A1-\u30F6\u30F3\u3093\u30C3\u3063\u30FC\u30FC][\u3099\u309A]?/gu;
const JP_LAST_N_MORA = 2;

function extractJapaneseMorae(surface: string, n = JP_LAST_N_MORA): string {
  let s = surface;
  for (const pfx of JP_HON_PREFIXES) {
    if (s.startsWith(pfx) && s.length > pfx.length + 2) { s = s.slice(pfx.length); break; }
  }
  const morae = s.match(JP_MORA_RE) ?? [];
  return morae.slice(-n).join('');
}

// ─── Tone extraction helpers ──────────────────────────────────────────────────
const TONE_MARKS_VI: Record<string, string> = {
  '\u0300': '`', '\u0301': "'", '\u0303': '~', '\u0309': '?', '\u0323': '.',
};

const THAI_TONE_CLASSES: Record<string, string> = {
  '\u0E48': 'L', '\u0E49': 'F', '\u0E4A': 'H', '\u0E4B': 'R',
};

function extractToneVietnamese(syllable: string): string {
  const decomposed = syllable.normalize('NFD');
  for (const [mark, tone] of Object.entries(TONE_MARKS_VI)) {
    if (decomposed.includes(mark)) return tone;
  }
  return '0';
}

function extractToneThai(syllable: string): string {
  for (const [mark, tone] of Object.entries(THAI_TONE_CLASSES)) {
    if (syllable.includes(mark)) return tone;
  }
  return 'M';
}

// ─── IPA parser ───────────────────────────────────────────────────────────────
function parseIPA(ipa: string): RhymeNucleus {
  let vowelStart = -1;
  let vowelEnd = -1;
  for (let i = 0; i < ipa.length; i++) {
    if (VOWELS_ALL.has(ipa[i]!)) {
      if (vowelStart === -1) vowelStart = i;
      vowelEnd = i;
    }
  }
  if (vowelStart === -1) return { vowels: '', coda: '', tone: '', onset: ipa, moraCount: 0 };
  const onset  = ipa.slice(0, vowelStart);
  const vowels = ipa.slice(vowelStart, vowelEnd + 1);
  const coda   = ipa.slice(vowelEnd + 1);
  const toneMatch = coda.match(/[0-9LFHRMrlfhm]$/);
  const tone = toneMatch?.[0] ?? '';
  return { onset, vowels, coda: toneMatch ? coda.slice(0, -1) : coda, tone, moraCount: vowels.length };
}

// ─── Stressed vowel helpers ───────────────────────────────────────────────────
const STRESSED_VOWELS = /[áéíóúàèìòùâêîôûÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛ]/u;

function lastStressedVowelIndex(word: string): number {
  let last = -1;
  for (let i = 0; i < word.length; i++) {
    if (STRESSED_VOWELS.test(word[i]!)) last = i;
  }
  return last;
}

function extractSuffixFromIndex(word: string, idx: number): string {
  if (idx === -1) {
    const m = word.match(/[aeiouàèìòùáéíóúâêîôûäëïöü][^aeiouàèìòùáéíóúâêîôûäëïöü]*$/iu);
    return m?.[0] ?? word.slice(-3);
  }
  return word.slice(idx);
}

// ─── Family-specific nucleus extractors ──────────────────────────────────────

function nucleusROM(surface: string, lang: LangCode): RhymeNucleus {
  let s = surface.toLowerCase();
  if (lang === 'fr') s = s.replace(/(?<=[aeiouàâéèêëîïôùûü])(nt|s)?$/u, '').replace(/e(nt|s)?$/, '');
  return parseIPA(extractSuffixFromIndex(s, lastStressedVowelIndex(s)));
}

function nucleusGER(surface: string, lang: LangCode): RhymeNucleus {
  let s = surface.toLowerCase();
  if (lang === 'de') s = s.replace(/[bdgvz]$/u, m => ({ b: 'p', d: 't', g: 'k', v: 'f', z: 's' }[m] ?? m));
  return parseIPA(extractSuffixFromIndex(s, lastStressedVowelIndex(s)));
}

function nucleusTRK(surface: string): RhymeNucleus {
  const stripped = stripMorphoSuffix(surface.toLowerCase(), TRK_SUFFIXES);
  const idx = lastStressedVowelIndex(stripped) !== -1
    ? lastStressedVowelIndex(stripped)
    : stripped.search(/[aeiouıiuü]/iu);
  return parseIPA(extractSuffixFromIndex(stripped, idx));
}

function nucleusFIN(surface: string, lang: LangCode): RhymeNucleus {
  const suffixes = lang === 'hu' ? HU_SUFFIXES : FIN_SUFFIXES;
  const stripped = stripMorphoSuffix(surface.toLowerCase(), suffixes);
  const m = stripped.match(/([aeiouäöüy]{1,2})[^aeiouäöüy]*$/iu);
  if (!m) return parseIPA(stripped.slice(-3));
  return parseIPA(stripped.slice(stripped.lastIndexOf(m[1]!)));
}

function nucleusBNT(surface: string): RhymeNucleus {
  const deprefixed = stripBNTPrefix(surface.toLowerCase(), 3);
  const m = deprefixed.match(/[aeiou][^aeiou]*$/iu);
  return parseIPA(m ? m[0] : deprefixed.slice(-3));
}

function nucleusCJK(surface: string, lang: LangCode): RhymeNucleus {
  if (lang === 'ja') {
    const morae = extractJapaneseMorae(surface);
    return { vowels: morae, coda: '', tone: '', onset: '', moraCount: morae.length };
  }
  const last = [...surface].at(-1) ?? '';
  const tone = last.match(/[0-9]/) ? last : '';
  return { vowels: tone ? surface.slice(0, -1) : surface, coda: '', tone, onset: '', moraCount: 1 };
}

function nucleusTAI(surface: string): RhymeNucleus {
  const tone = extractToneThai(surface);
  const stripped = surface.replace(/[\u0E48-\u0E4B]/gu, '');
  const m = stripped.match(/[\u0E40-\u0E44]?[\u0E01-\u0E2E][\u0E30-\u0E3A\u0E40-\u0E44\u0E4E]?[\u0E01-\u0E2E]?$/u);
  return { vowels: m?.[0] ?? stripped.slice(-2), coda: '', tone, onset: '', moraCount: 1 };
}

function nucleusVIET(surface: string, lang: LangCode): RhymeNucleus {
  if (lang !== 'vi') {
    const m = surface.match(/[aeiouảạàáâãă][^aeiouảạàáâãă]*$/iu);
    return parseIPA(m ? m[0] : surface.slice(-3));
  }
  const tone = extractToneVietnamese(surface);
  const decomposed = surface.normalize('NFD').replace(TONE_DIACRITICS_LATIN, '').normalize('NFC');
  const m = decomposed.match(/[aeiouảạàáâãă][^aeiouảạàáâãă]*$/iu);
  return { ...(m ? parseIPA(m[0]) : parseIPA(decomposed.slice(-3))), tone };
}

function nucleusSEM(surface: string): RhymeNucleus {
  const m = surface.match(/[\u0600-\u06FF\u0590-\u05FF][^\u0600-\u06FF\u0590-\u05FF]*$/u);
  if (!m) return parseIPA(surface.slice(-4));
  return { vowels: m[0], coda: '', tone: '', onset: '', moraCount: 1 };
}

function nucleusSLV(surface: string): RhymeNucleus {
  const s = surface.toLowerCase();
  return parseIPA(extractSuffixFromIndex(s, lastStressedVowelIndex(s)));
}

function nucleusKWA(surface: string, lang: LangCode): RhymeNucleus {
  const tone = (lang === 'ew' || lang === 'mi') ? extractToneVietnamese(surface) : '';
  const s = surface.normalize('NFD').replace(TONE_DIACRITICS_LATIN, '').normalize('NFC').toLowerCase();
  const m = s.match(/[aeiouɛɔ][^aeiouɛɔ]*$/iu);
  return { ...(m ? parseIPA(m[0]) : parseIPA(s.slice(-3))), tone };
}

function nucleusCRV(surface: string, lang: LangCode): RhymeNucleus {
  const tone = (lang === 'ha') ? extractToneVietnamese(surface) : '';
  const s = surface.normalize('NFD').replace(TONE_DIACRITICS_LATIN, '').normalize('NFC').toLowerCase();
  const m = s.match(/[aeiouɛɔ][^aeiouɛɔ]*$/iu);
  return { ...(m ? parseIPA(m[0]) : parseIPA(s.slice(-3))), tone };
}

function nucleusYRB(surface: string): RhymeNucleus {
  const tone = extractToneVietnamese(surface);
  const s = surface.normalize('NFD').replace(TONE_DIACRITICS_LATIN, '').normalize('NFC').toLowerCase();
  const m = s.match(/[aeiouọẹ][^aeiouọẹ]*$/iu);
  return { ...(m ? parseIPA(m[0]) : parseIPA(s.slice(-3))), tone };
}

function nucleusIIR(surface: string): RhymeNucleus {
  const s = surface.normalize('NFD').replace(/[\u0300-\u036F]/gu, '').normalize('NFC').toLowerCase();
  const m = s.match(/[aeiouāīūẹ][^aeiouāīūẹ]*$/iu);
  return parseIPA(m ? m[0] : s.slice(-3));
}

function nucleusAUS(surface: string): RhymeNucleus {
  const m = surface.toLowerCase().match(/[aeiou][^aeiou]*$/iu);
  return parseIPA(m ? m[0] : surface.slice(-3));
}

function nucleusDRA(surface: string): RhymeNucleus {
  const s = surface.normalize('NFD').replace(/[\u0300-\u036F]/gu, '').normalize('NFC').toLowerCase();
  const m = s.match(/[aeiouāīū][^aeiouāīū]*$/iu);
  return parseIPA(m ? m[0] : s.slice(-3));
}

function nucleusCRE(surface: string): RhymeNucleus {
  const m = surface.toLowerCase().match(/[aeiou][^aeiou]*$/iu);
  return parseIPA(m ? m[0] : surface.slice(-3));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function extractNucleus(surface: string, family: FamilyId, lang: LangCode): RhymeNucleus {
  switch (family) {
    case 'ROM':      return nucleusROM(surface, lang);
    case 'GER':      return nucleusGER(surface, lang);
    case 'SLV':      return nucleusSLV(surface);
    case 'TRK':      return nucleusTRK(surface);
    case 'FIN':      return nucleusFIN(surface, lang);
    case 'BNT':      return nucleusBNT(surface);
    case 'CJK':      return nucleusCJK(surface, lang);
    case 'TAI':      return nucleusTAI(surface);
    case 'VIET':     return nucleusVIET(surface, lang);
    case 'SEM':      return nucleusSEM(surface);
    case 'KWA':      return nucleusKWA(surface, lang);
    case 'CRV':      return nucleusCRV(surface, lang);
    case 'YRB':      return nucleusYRB(surface);
    case 'IIR':      return nucleusIIR(surface);
    case 'AUS':      return nucleusAUS(surface);
    case 'DRA':      return nucleusDRA(surface);
    case 'CRE':      return nucleusCRE(surface);
    case 'FALLBACK':
    default:         return parseIPA(surface.slice(-4));
  }
}
