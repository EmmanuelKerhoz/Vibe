/**
 * Rhyme Engine v2 — Dravidian Family Algorithm
 * Languages: TA (Tamil), TE (Telugu), KN (Kannada), ML (Malayalam)
 *
 * Strategy:
 * - TA: Tamil script, retroflex/dental distinction preserved in coda,
 *       long vowel distinction (அ/ஆ, இ/ஈ, etc.) preserved in nucleus
 * - TE: Telugu script, long vowels mapped distinctly, aspirates simplified
 * - KN: Kannada script, same base map as Telugu (high overlap)
 * - ML: Malayalam script, geminate consonants in coda collapsed to single,
 *       chillu letters (standalone consonants) handled
 *
 * Scoring: vowel nucleus 55% + coda 45%
 * Rationale: Dravidian rhyme (especially Tamil etukai/mōnai) is sensitive to
 *            retroflex vs dental distinctions and vowel length.
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';
import { phonemeEditDistance } from './scoring';

// ─── Tamil ───────────────────────────────────────────────────────────────────

const TA_VOWEL_MAP: Record<string, string> = {
  'அ': 'a',  'ஆ': 'aa', 'இ': 'i',  'ஈ': 'ii',
  'உ': 'u',  'ஊ': 'uu', 'எ': 'e',  'ஏ': 'ee',
  'ஐ': 'ai', 'ஒ': 'o',  'ஓ': 'oo', 'ஔ': 'au',
  // matras
  'ா': 'aa', 'ி': 'i',  'ீ': 'ii', 'ு': 'u',
  'ூ': 'uu', 'ெ': 'e',  'ே': 'ee', 'ை': 'ai',
  'ொ': 'o',  'ோ': 'oo', 'ௌ': 'au',
};

const TA_CONSONANT_MAP: Record<string, string> = {
  'க': 'k',  'ங': 'ng', 'ச': 'ch', 'ஞ': 'ny',
  'ட': 'tt', 'ண': 'nn', 'த': 't',  'ந': 'n',
  'ப': 'p',  'ம': 'm',  'ய': 'y',  'ர': 'r',
  'ல': 'l',  'வ': 'v',  'ழ': 'zh', 'ள': 'll',
  'ற': 'rr', 'ன': 'n',  'ஶ': 'sh', 'ஜ': 'j',
  'ஷ': 'sh', 'ஸ': 's',  'ஹ': 'h',
  '்': '',   // pulli (virama)
  'ஃ': 'k',  // aytam — treated as velar fricative
};

function transcribeTA(token: string): { vowels: string; coda: string; onset: string } {
  const chars = [...token.normalize('NFC')];
  let phonemes: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    if (ch in TA_VOWEL_MAP) {
      const m = TA_VOWEL_MAP[ch]!;
      if (m) phonemes.push(m);
    } else if (ch in TA_CONSONANT_MAP) {
      phonemes.push(TA_CONSONANT_MAP[ch]!);
      const next = chars[i + 1];
      const isMatra = next && next in TA_VOWEL_MAP;
      const isPulli = next === '்';
      if (!isMatra && !isPulli) phonemes.push('a');
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

// ─── Telugu / Kannada (shared base) ──────────────────────────────────────────

const TE_VOWEL_MAP: Record<string, string> = {
  'అ': 'a',  'ఆ': 'aa', 'ఇ': 'i',  'ఈ': 'ii',
  'ఉ': 'u',  'ఊ': 'uu', 'ఎ': 'e',  'ఏ': 'ee',
  'ఐ': 'ai', 'ఒ': 'o',  'ఓ': 'oo', 'ఔ': 'au',
  // matras
  'ా': 'aa', 'ి': 'i',  'ీ': 'ii', 'ు': 'u',
  'ూ': 'uu', 'ె': 'e',  'ే': 'ee', 'ై': 'ai',
  'ొ': 'o',  'ో': 'oo', 'ౌ': 'au',
};

const KN_VOWEL_MAP: Record<string, string> = {
  'ಅ': 'a',  'ಆ': 'aa', 'ಇ': 'i',  'ಈ': 'ii',
  'ಉ': 'u',  'ಊ': 'uu', 'ಎ': 'e',  'ಏ': 'ee',
  'ಐ': 'ai', 'ಒ': 'o',  'ಓ': 'oo', 'ಔ': 'au',
  'ಾ': 'aa', 'ಿ': 'i',  'ೀ': 'ii', 'ು': 'u',
  'ೂ': 'uu', 'ೆ': 'e',  'ೇ': 'ee', 'ೈ': 'ai',
  'ೊ': 'o',  'ೋ': 'oo', 'ೌ': 'au',
};

const TE_CONSONANT_MAP: Record<string, string> = {
  'క': 'k',  'ఖ': 'kh', 'గ': 'g',  'ఘ': 'gh', 'ఙ': 'ng',
  'చ': 'ch', 'ఛ': 'chh','జ': 'j',  'ఝ': 'jh', 'ఞ': 'ny',
  'ట': 't',  'ఠ': 'th', 'డ': 'd',  'ఢ': 'dh', 'ణ': 'nn',
  'త': 't',  'థ': 'th', 'ద': 'd',  'ధ': 'dh', 'న': 'n',
  'ప': 'p',  'ఫ': 'ph', 'బ': 'b',  'భ': 'bh', 'మ': 'm',
  'య': 'y',  'ర': 'r',  'ల': 'l',  'వ': 'v',  'శ': 'sh',
  'ష': 'sh', 'స': 's',  'హ': 'h',  'ళ': 'll', 'ఱ': 'rr',
  '్': '',   // virama
  'ం': 'n',  'ః': '',
};

const KN_CONSONANT_MAP: Record<string, string> = {
  'ಕ': 'k',  'ಖ': 'kh', 'ಗ': 'g',  'ಘ': 'gh', 'ಙ': 'ng',
  'ಚ': 'ch', 'ಛ': 'chh','ಜ': 'j',  'ಝ': 'jh', 'ಞ': 'ny',
  'ಟ': 't',  'ಠ': 'th', 'ಡ': 'd',  'ಢ': 'dh', 'ಣ': 'nn',
  'ತ': 't',  'ಥ': 'th', 'ದ': 'd',  'ಧ': 'dh', 'ನ': 'n',
  'ಪ': 'p',  'ಫ': 'ph', 'ಬ': 'b',  'ಭ': 'bh', 'ಮ': 'm',
  'ಯ': 'y',  'ರ': 'r',  'ಲ': 'l',  'ವ': 'v',  'ಶ': 'sh',
  'ಷ': 'sh', 'ಸ': 's',  'ಹ': 'h',  'ಳ': 'll',
  '್': '',   // virama
  'ಂ': 'n',  'ಃ': '',
};

function transcribeTE_KN(
  token: string,
  vowelMap: Record<string, string>,
  consonantMap: Record<string, string>
): { vowels: string; coda: string; onset: string } {
  const chars = [...token.normalize('NFC')];
  let phonemes: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    if (ch in vowelMap) {
      const m = vowelMap[ch]!;
      if (m) phonemes.push(m);
    } else if (ch in consonantMap) {
      const m = consonantMap[ch]!;
      phonemes.push(m);
      const next = chars[i + 1];
      const isMatra = next && next in vowelMap;
      const isVirama = next === '్' || next === '್';
      if (!isMatra && !isVirama && m !== '') phonemes.push('a');
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

// ─── Malayalam ────────────────────────────────────────────────────────────────

const ML_VOWEL_MAP: Record<string, string> = {
  'അ': 'a',  'ആ': 'aa', 'ഇ': 'i',  'ഈ': 'ii',
  'ഉ': 'u',  'ഊ': 'uu', 'എ': 'e',  'ഏ': 'ee',
  'ഐ': 'ai', 'ഒ': 'o',  'ഓ': 'oo', 'ഔ': 'au',
  'ാ': 'aa', 'ി': 'i',  'ീ': 'ii', 'ു': 'u',
  'ൂ': 'uu', 'െ': 'e',  'േ': 'ee', 'ൈ': 'ai',
  'ൊ': 'o',  'ോ': 'oo', 'ൌ': 'au',
};

const ML_CONSONANT_MAP: Record<string, string> = {
  'ക': 'k',  'ഖ': 'kh', 'ഗ': 'g',  'ഘ': 'gh', 'ങ': 'ng',
  'ച': 'ch', 'ഛ': 'chh','ജ': 'j',  'ഝ': 'jh', 'ഞ': 'ny',
  'ട': 't',  'ഠ': 'th', 'ഡ': 'd',  'ഢ': 'dh', 'ണ': 'nn',
  'ത': 't',  'ഥ': 'th', 'ദ': 'd',  'ധ': 'dh', 'ന': 'n',
  'പ': 'p',  'ഫ': 'ph', 'ബ': 'b',  'ഭ': 'bh', 'മ': 'm',
  'യ': 'y',  'ര': 'r',  'ല': 'l',  'വ': 'v',  'ശ': 'sh',
  'ഷ': 'sh', 'സ': 's',  'ഹ': 'h',  'ള': 'll', 'ഴ': 'zh',
  'റ': 'rr',
  '്': '',   // chandrakkala (virama)
  'ം': 'n',  'ഃ': '',
  // Chillu letters (standalone final consonants)
  'ൻ': 'n',  'ർ': 'r',  'ൽ': 'l',  'ൾ': 'll', 'ൺ': 'nn',
};

function transcribeML(token: string): { vowels: string; coda: string; onset: string } {
  const chars = [...token.normalize('NFC')];
  let phonemes: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    if (ch in ML_VOWEL_MAP) {
      const m = ML_VOWEL_MAP[ch]!;
      if (m) phonemes.push(m);
    } else if (ch in ML_CONSONANT_MAP) {
      const m = ML_CONSONANT_MAP[ch]!;
      phonemes.push(m);
      const next = chars[i + 1];
      const isMatra = next && next in ML_VOWEL_MAP;
      const isVirama = next === '്';
      // Collapse geminates: if same phoneme twice, keep once
      if (!isMatra && !isVirama && m !== '') {
        if (phonemes.at(-2) !== m) phonemes.push('a');
      }
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

export function extractNucleusDRA(
  unit: LineEndingUnit,
  lang: LangCode
): RhymeNucleus {
  const { surface } = unit;
  if (!surface) return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 };

  let vowels = '', coda = '', onset = '';

  if (lang === 'ta') {
    ({ vowels, coda, onset } = transcribeTA(surface));
  } else if (lang === 'te') {
    ({ vowels, coda, onset } = transcribeTE_KN(surface, TE_VOWEL_MAP, TE_CONSONANT_MAP));
  } else if (lang === 'kn') {
    ({ vowels, coda, onset } = transcribeTE_KN(surface, KN_VOWEL_MAP, KN_CONSONANT_MAP));
  } else if (lang === 'ml') {
    ({ vowels, coda, onset } = transcribeML(surface));
  } else {
    ({ vowels, coda, onset } = transcribeTA(surface));
  }

  return {
    vowels,
    coda,
    tone:      '',
    onset,
    moraCount: vowels.length >= 2 ? 2 : 1,
  };
}

export function scoreDRA(a: RhymeNucleus, b: RhymeNucleus): number {
  const vowSim  = 1 - phonemeEditDistance(a.vowels, b.vowels);
  const codaSim = 1 - phonemeEditDistance(a.coda,   b.coda);
  return 0.55 * vowSim + 0.45 * codaSim;
}
