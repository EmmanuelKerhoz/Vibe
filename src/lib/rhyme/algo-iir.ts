/**
 * Rhyme Engine v2 — Indo-Iranian Family Algorithm
 * Languages: HI (Hindi), UR (Urdu), BN (Bengali), FA (Persian), PA (Punjabi)
 *
 * Strategy:
 * - HI: Devanagari vowel matras + inherent 'a', schwa deletion rule on penultimate
 * - UR: Perso-Arabic script, vowel letters (ا و ی) + harakat when present
 * - BN: Bengali script vowel map, final hasanta strips inherent vowel
 * - FA: Perso-Arabic, long vowels (آ ا و ی), short vowels ignored (unwritten)
 * - PA: Gurmukhi vowel matras, tonal distinction collapsed (not phonemic for rhyme)
 *
 * Scoring: vowel nucleus 70% + coda consonant 30%
 * Rationale: Hindi/Urdu poetry (ghazal, nazm) is vowel-rhyme dominant;
 *            coda matching is secondary but distinguishes perfect rhyme.
 *            Weight 0.7/0.3 ensures different vowel nuclei (aa vs a) produce
 *            a structurally robust score gap over coda variation.
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';
import { phonemeEditDistance } from './scoring';

// ─── Devanagari (HI, PA base) ────────────────────────────────────────────────

const DEVA_VOWEL_MAP: Record<string, string> = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ii', 'उ': 'u', 'ऊ': 'uu',
  'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'ऋ': 'ri',
  // matras
  'ा': 'aa', 'ि': 'i', 'ी': 'ii', 'ु': 'u', 'ू': 'uu',
  'े': 'e',  'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ृ': 'ri',
};

// Matras (dependent vowel signs) — used to detect & cancel preceding inherent 'a'
const DEVA_MATRAS = new Set([
  'ा', 'ि', 'ी', 'ु', 'ू', 'े', 'ै', 'ो', 'ौ', 'ृ',
]);

const DEVA_CONSONANT_MAP: Record<string, string> = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh',
  'ष': 'sh', 'स': 's', 'ह': 'h',
  'ं': 'n', // anusvara
  '्': '',  // halant/virama strips inherent vowel
  'ः': '',  // visarga
};

function transcribeDEVA(token: string): { vowels: string; coda: string; onset: string } {
  const chars = [...token.normalize('NFC')];
  const phonemes: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    if (DEVA_MATRAS.has(ch)) {
      // Matra: cancel the spurious inherent 'a' pushed by the preceding consonant,
      // then push the actual matra vowel.
      if (phonemes.at(-1) === 'a') phonemes.pop();
      phonemes.push(DEVA_VOWEL_MAP[ch]!);
    } else if (ch in DEVA_VOWEL_MAP) {
      phonemes.push(DEVA_VOWEL_MAP[ch]!);
    } else if (ch in DEVA_CONSONANT_MAP) {
      const mapped = DEVA_CONSONANT_MAP[ch]!;
      phonemes.push(mapped);
      // Add inherent 'a' unless next char is matra, halant, or end
      const next = chars[i + 1];
      const isHalant = next === '्';
      if (!DEVA_MATRAS.has(next ?? '') && !isHalant && mapped !== '') {
        phonemes.push('a');
      }
    }
  }

  // Find last vowel sequence
  const str = phonemes.join('');
  const vowelMatch = [...str.matchAll(/[aeiou]+/g)];
  if (!vowelMatch.length) return { vowels: str.slice(-2), coda: '', onset: '' };
  const last = vowelMatch.at(-1)!;
  const idx = last.index ?? 0;
  return {
    vowels: last[0]!,
    coda:   str.slice(idx + last[0]!.length),
    onset:  str.slice(0, idx),
  };
}

// ─── Perso-Arabic (UR, FA) ────────────────────────────────────────────────────

const PERSO_LONG_VOWEL: Record<string, string> = {
  'ا': 'aa', 'آ': 'aa', 'و': 'u', 'ی': 'i', 'ے': 'e',
};

const PERSO_CONSONANT: Record<string, string> = {
  'ب': 'b', 'پ': 'p', 'ت': 't', 'ٹ': 't', 'ث': 's',
  'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd',
  'ڈ': 'd', 'ذ': 'z', 'ر': 'r', 'ڑ': 'r', 'ز': 'z',
  'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'z',
  'ط': 't', 'ظ': 'z', 'ع': '', 'غ': 'gh', 'ف': 'f',
  'ق': 'q', 'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm',
  'ن': 'n', 'ں': 'n', 'ہ': 'h', 'ھ': 'h', 'ء': '',
  'ی': 'y',
};

function transcribePERSO(token: string): { vowels: string; coda: string; onset: string } {
  const chars = [...token.normalize('NFC')];
  const phonemes: string[] = [];

  for (const ch of chars) {
    if (ch in PERSO_LONG_VOWEL) {
      phonemes.push(PERSO_LONG_VOWEL[ch]!);
    } else if (ch in PERSO_CONSONANT) {
      const m = PERSO_CONSONANT[ch]!;
      if (m) phonemes.push(m);
    }
    // short vowel diacritics (rarely written) ignored
  }

  const str = phonemes.join('');
  const vowelMatch = [...str.matchAll(/[aeiou]+/g)];
  if (!vowelMatch.length) return { vowels: str.slice(-2), coda: '', onset: '' };
  const last = vowelMatch.at(-1)!;
  const idx = last.index ?? 0;
  return {
    vowels: last[0]!,
    coda:   str.slice(idx + last[0]!.length),
    onset:  str.slice(0, idx),
  };
}

// ─── Bengali script ───────────────────────────────────────────────────────────

const BN_VOWEL_MAP: Record<string, string> = {
  'অ': 'o', 'আ': 'aa', 'ই': 'i', 'ঈ': 'ii', 'উ': 'u', 'ঊ': 'uu',
  'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
  'া': 'aa', 'ি': 'i', 'ী': 'ii', 'ু': 'u', 'ূ': 'uu',
  'ে': 'e',  'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
  '্': '',   // hasanta
};

const BN_MATRAS = new Set([
  'া', 'ি', 'ী', 'ু', 'ূ', 'ে', 'ৈ', 'ো', 'ৌ',
]);

const BN_CONSONANT_MAP: Record<string, string> = {
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'ny',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
  'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh',
  'স': 's', 'হ': 'h', 'ড়': 'r', 'ঢ়': 'rh',
  'ং': 'ng', 'ঃ': '', 'ঁ': 'n',
};

function transcribeBN(token: string): { vowels: string; coda: string; onset: string } {
  const chars = [...token.normalize('NFC')];
  const phonemes: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    if (BN_MATRAS.has(ch)) {
      // Cancel spurious inherent 'o' from preceding consonant
      if (phonemes.at(-1) === 'o') phonemes.pop();
      const m = BN_VOWEL_MAP[ch]!;
      if (m) phonemes.push(m);
    } else if (ch in BN_VOWEL_MAP) {
      const m = BN_VOWEL_MAP[ch]!;
      if (m) phonemes.push(m);
    } else if (ch in BN_CONSONANT_MAP) {
      phonemes.push(BN_CONSONANT_MAP[ch]!);
      const next = chars[i + 1];
      if (!BN_MATRAS.has(next ?? '')) phonemes.push('o'); // inherent vowel in Bengali is 'o'
    }
  }

  const str = phonemes.join('');
  const vowelMatch = [...str.matchAll(/[aeiou]+/g)];
  if (!vowelMatch.length) return { vowels: str.slice(-2), coda: '', onset: '' };
  const last = vowelMatch.at(-1)!;
  const idx = last.index ?? 0;
  return {
    vowels: last[0]!,
    coda:   str.slice(idx + last[0]!.length),
    onset:  str.slice(0, idx),
  };
}

// ─── Gurmukhi (PA) ────────────────────────────────────────────────────────────
// Punjabi tones (3) are collapsed — not relevant for written rhyme detection

const GU_VOWEL_MAP: Record<string, string> = {
  'ਅ': 'a', 'ਆ': 'aa', 'ਇ': 'i', 'ਈ': 'ii', 'ਉ': 'u', 'ਊ': 'uu',
  'ਏ': 'e', 'ਐ': 'ai', 'ਓ': 'o', 'ਔ': 'au',
  'ਾ': 'aa', 'ਿ': 'i', 'ੀ': 'ii', 'ੁ': 'u', 'ੂ': 'uu',
  'ੇ': 'e',  'ੈ': 'ai', 'ੋ': 'o', 'ੌ': 'au',
  '੍': '',   // virama
};

const GU_MATRAS = new Set([
  'ਾ', 'ਿ', 'ੀ', 'ੁ', 'ੂ', 'ੇ', 'ੈ', 'ੋ', 'ੌ',
]);

const GU_CONSONANT_MAP: Record<string, string> = {
  'ਕ': 'k', 'ਖ': 'kh', 'ਗ': 'g', 'ਘ': 'gh', 'ਙ': 'ng',
  'ਚ': 'ch', 'ਛ': 'chh', 'ਜ': 'j', 'ਝ': 'jh', 'ਞ': 'ny',
  'ਟ': 't', 'ਠ': 'th', 'ਡ': 'd', 'ਢ': 'dh', 'ਣ': 'n',
  'ਤ': 't', 'ਥ': 'th', 'ਦ': 'd', 'ਧ': 'dh', 'ਨ': 'n',
  'ਪ': 'p', 'ਫ': 'ph', 'ਬ': 'b', 'ਭ': 'bh', 'ਮ': 'm',
  'ਯ': 'y', 'ਰ': 'r', 'ਲ': 'l', 'ਵ': 'v', 'ਸ਼': 'sh',
  'ਸ': 's', 'ਹ': 'h',
  'ਂ': 'n', 'ਃ': '',
};

function transcribeGU(token: string): { vowels: string; coda: string; onset: string } {
  const chars = [...token.normalize('NFC')];
  const phonemes: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    if (GU_MATRAS.has(ch)) {
      // Cancel spurious inherent 'a' from preceding consonant
      if (phonemes.at(-1) === 'a') phonemes.pop();
      const m = GU_VOWEL_MAP[ch]!;
      if (m) phonemes.push(m);
    } else if (ch in GU_VOWEL_MAP) {
      const m = GU_VOWEL_MAP[ch]!;
      if (m) phonemes.push(m);
    } else if (ch in GU_CONSONANT_MAP) {
      phonemes.push(GU_CONSONANT_MAP[ch]!);
      const next = chars[i + 1];
      if (!GU_MATRAS.has(next ?? '')) phonemes.push('a');
    }
  }

  const str = phonemes.join('');
  const vowelMatch = [...str.matchAll(/[aeiou]+/g)];
  if (!vowelMatch.length) return { vowels: str.slice(-2), coda: '', onset: '' };
  const last = vowelMatch.at(-1)!;
  const idx = last.index ?? 0;
  return {
    vowels: last[0]!,
    coda:   str.slice(idx + last[0]!.length),
    onset:  str.slice(0, idx),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function extractNucleusIIR(
  unit: LineEndingUnit,
  lang: LangCode
): RhymeNucleus {
  const { surface } = unit;
  if (!surface) return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 };

  let vowels = '', coda = '', onset = '';

  if (lang === 'hi') {
    ({ vowels, coda, onset } = transcribeDEVA(surface));
  } else if (lang === 'ur' || lang === 'fa') {
    ({ vowels, coda, onset } = transcribePERSO(surface));
  } else if (lang === 'bn') {
    ({ vowels, coda, onset } = transcribeBN(surface));
  } else if (lang === 'pa') {
    ({ vowels, coda, onset } = transcribeGU(surface));
  } else {
    // Fallback: treat as Devanagari
    ({ vowels, coda, onset } = transcribeDEVA(surface));
  }

  return {
    vowels,
    coda,
    tone:      '',
    onset,
    moraCount: vowels.length >= 2 ? 2 : 1,
  };
}

export function scoreIIR(a: RhymeNucleus, b: RhymeNucleus): number {
  const vowSim  = 1 - phonemeEditDistance(a.vowels, b.vowels);
  const codaSim = 1 - phonemeEditDistance(a.coda,   b.coda);
  return 0.7 * vowSim + 0.3 * codaSim;
}
