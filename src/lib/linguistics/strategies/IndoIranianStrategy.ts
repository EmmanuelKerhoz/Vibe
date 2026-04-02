import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable } from '../core/types';
import { classifyCoda, stripAgglutinativeSuffixes } from '../utils';

type BrahmicProfile = {
  independentVowels: Record<string, string>;
  vowelSigns: Record<string, string>;
  consonants: Record<string, string>;
  virama: string;
  finals?: Record<string, string>;
};

const IIR_VOWELS = ['ai', 'au', 'ā', 'ī', 'ū', 'e', 'o', 'a', 'i', 'u'] as const;

/**
 * Languages for which aspirated–plain pairs are phonologically equivalent
 * for rime purposes (voiced/voiceless aspirates rhyme with their plain
 * counterparts in Hindi, Bengali, Punjabi poetry).
 * Arabic-script IIR languages (ur, fa) are explicitly excluded:
 * their 'kh'/'gh'/'sh' clusters represent distinct phonemes (/x/, /ɣ/, /ʃ/).
 */
const BRAHMIC_ASPIRATION_LANGS = new Set(['hi', 'bn', 'pa', 'mr', 'gu', 'ne', 'or', 'sa']);

const DEVANAGARI_PROFILE: BrahmicProfile = {
  independentVowels: { 'अ': 'a', 'आ': 'ā', 'इ': 'i', 'ई': 'ī', 'उ': 'u', 'ऊ': 'ū', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'ऋ': 'ri' },
  vowelSigns: { 'ा': 'ā', 'ि': 'i', 'ी': 'ī', 'ु': 'u', 'ू': 'ū', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ृ': 'ri' },
  consonants: { 'क': 'k', 'ख': 'k', 'ग': 'g', 'घ': 'g', 'ङ': 'n', 'च': 'c', 'छ': 'c', 'ज': 'j', 'झ': 'j', 'ञ': 'n', 'ट': 't', 'ठ': 't', 'ड': 'd', 'ढ': 'd', 'ण': 'n', 'त': 't', 'थ': 't', 'द': 'd', 'ध': 'd', 'न': 'n', 'प': 'p', 'फ': 'p', 'ब': 'b', 'भ': 'b', 'म': 'm', 'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 's', 'ष': 's', 'स': 's', 'ह': 'h' },
  virama: '्',
  finals: { 'ं': 'n', 'ँ': 'n', 'ः': 'h' },
};

const BENGALI_PROFILE: BrahmicProfile = {
  independentVowels: { 'অ': 'a', 'আ': 'ā', 'ই': 'i', 'ঈ': 'ī', 'উ': 'u', 'ঊ': 'ū', 'এ': 'e', 'ঐ': 'ai', 'ও': 'o', 'ঔ': 'au' },
  vowelSigns: { 'া': 'ā', 'ি': 'i', 'ী': 'ī', 'ু': 'u', 'ূ': 'ū', 'ে': 'e', 'ৈ': 'ai', 'ো': 'o', 'ৌ': 'au' },
  consonants: { 'ক': 'k', 'খ': 'k', 'গ': 'g', 'ঘ': 'g', 'ঙ': 'n', 'চ': 'c', 'ছ': 'c', 'জ': 'j', 'ঝ': 'j', 'ঞ': 'n', 'ট': 't', 'ঠ': 't', 'ড': 'd', 'ঢ': 'd', 'ণ': 'n', 'ত': 't', 'থ': 't', 'দ': 'd', 'ধ': 'd', 'ন': 'n', 'প': 'p', 'ফ': 'p', 'ব': 'b', 'ভ': 'b', 'ম': 'm', 'য': 'y', 'র': 'r', 'ল': 'l', 'শ': 's', 'ষ': 's', 'স': 's', 'হ': 'h', 'ড়': 'd', 'ঢ়': 'd' },
  virama: '্',
  finals: { 'ং': 'n', 'ঁ': 'n', 'ঃ': 'h' },
};

const GURMUKHI_PROFILE: BrahmicProfile = {
  independentVowels: { 'ਅ': 'a', 'ਆ': 'ā', 'ਇ': 'i', 'ਈ': 'ī', 'ਉ': 'u', 'ਊ': 'ū', 'ਏ': 'e', 'ਐ': 'ai', 'ਓ': 'o', 'ਔ': 'au' },
  vowelSigns: { 'ਾ': 'ā', 'ਿ': 'i', 'ੀ': 'ī', 'ੁ': 'u', 'ੂ': 'ū', 'ੇ': 'e', 'ੈ': 'ai', 'ੋ': 'o', 'ੌ': 'au' },
  consonants: { 'ਕ': 'k', 'ਖ': 'k', 'ਗ': 'g', 'ਘ': 'g', 'ਙ': 'n', 'ਚ': 'c', 'ਛ': 'c', 'ਜ': 'j', 'ਝ': 'j', 'ਞ': 'n', 'ਟ': 't', 'ਠ': 't', 'ਡ': 'd', 'ਢ': 'd', 'ਣ': 'n', 'ਤ': 't', 'ਥ': 't', 'ਦ': 'd', 'ਧ': 'd', 'ਨ': 'n', 'ਪ': 'p', 'ਫ': 'p', 'ਬ': 'b', 'ਭ': 'b', 'ਮ': 'm', 'ਯ': 'y', 'ਰ': 'r', 'ਲ': 'l', 'ਵ': 'v', 'ਸ': 's', 'ਹ': 'h', 'ਸ਼': 's', 'ੜ': 'r' },
  virama: '੍',
  finals: { 'ਂ': 'n', 'ਁ': 'n', 'ਃ': 'h' },
};

const ARABIC_IIR_MAP: Record<string, string> = {
  'ا': 'ā', 'آ': 'ā', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ٹ': 't', 'ث': 's', 'ج': 'j', 'چ': 'c',
  'ح': 'h', 'خ': 'k', 'د': 'd', 'ڈ': 'd', 'ذ': 'd', 'ر': 'r', 'ڑ': 'r', 'ز': 'z', 'ژ': 'j',
  'س': 's', 'ش': 's', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'd', 'ع': '', 'غ': 'g', 'ف': 'f',
  'ق': 'k', 'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ں': 'n', 'و': 'ū', 'ہ': 'h',
  'ھ': '', 'ء': '', 'ی': 'ī', 'ے': 'e', 'ۓ': 'e', 'ئ': 'ī', 'ؤ': 'ū', 'َ': 'a', 'ِ': 'i',
  'ُ': 'u', 'ً': 'a', 'ٍ': 'i', 'ٌ': 'u', 'ٰ': 'ā', 'ْ': '', 'ّ': '',
};

const BRAHMIC_PROFILES: Record<string, BrahmicProfile> = {
  hi: DEVANAGARI_PROFILE,
  bn: BENGALI_PROFILE,
  pa: GURMUKHI_PROFILE,
};

export class IndoIranianStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-IIR' as const;

  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 0.0,
    weight: 0.0,
    codaClass: 0.5,
    threshold: 0.75,
  };

  normalize(text: string, _lang: string): string {
    return text.normalize('NFC').toLowerCase().trim().replace(/[^\p{L}\p{M}\s'-]/gu, '');
  }

  g2p(normalized: string, lang: string): string {
    return normalized
      .split(/\s+/u)
      .filter(Boolean)
      .map((word) => normalizeAspiration(
        stripAgglutinativeSuffixes(transliterateIndoIranianWord(word, lang), lang),
        lang,
      ))
      .join(' ');
  }

  syllabify(ipa: string, _lang: string): Syllable[] {
    const syllables = ipa.split(/\s+/u).filter(Boolean).flatMap(buildIIRSyllables);

    if (syllables.length > 0) {
      syllables[syllables.length - 1]!.stressed = true;
    }

    return syllables;
  }

  extractRN(syllables: Syllable[], _lang: string): RhymeNucleus {
    const primary = [...syllables].reverse().find(syllable => /[āīū]/.test(syllable.nucleus))
      ?? syllables[syllables.length - 1];
    const coda = primary?.coda ?? '';

    return {
      nucleus: primary?.nucleus ?? '',
      coda,
      toneClass: null,
      weight: null,
      codaClass: classifyCoda(coda),
      raw: [primary?.nucleus ?? '', coda].filter(Boolean).join(':'),
    };
  }

  score(rn1: RhymeNucleus, rn2: RhymeNucleus, weights?: Partial<MatchingWeights>): number {
    return featureWeightedScore(rn1, rn2, { ...this.defaultWeights, ...weights });
  }
}

function transliterateIndoIranianWord(word: string, lang: string): string {
  if (lang === 'ur' || lang === 'fa') {
    return [...word].map(char => ARABIC_IIR_MAP[char] ?? char).join('');
  }

  const profile = BRAHMIC_PROFILES[lang.toLowerCase()];
  if (!profile) return word;

  return applyFinalSchwaDeletion(transliterateAbugida(word, profile));
}

/**
 * Collapse aspirated consonant pairs to their plain equivalents for rime
 * comparison purposes.
 *
 * ONLY applied to Brahmic-script IIR languages (hi, bn, pa, etc.) where
 * aspirated/plain pairs (k/kh, g/gh, c/ch, j/jh, t/th, d/dh, p/ph, b/bh)
 * are phonologically equivalent for rhyme matching.
 *
 * NOT applied to ur/fa: their ARABIC_IIR_MAP already maps Arabic consonants
 * to Latin approximations where 'kh' = /x/ (خ), 'gh' = /ɣ/ (غ), 'sh' = /ʃ/ (ش)
 * — collapsing these would create false rhyme pairs.
 */
function normalizeAspiration(word: string, lang: string): string {
  if (!BRAHMIC_ASPIRATION_LANGS.has(lang)) return word;

  return word
    .replace(/chh/g, 'c')
    .replace(/kh/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/ch/g, 'c')
    .replace(/jh/g, 'j')
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/ph/g, 'p')
    .replace(/bh/g, 'b');
}

function applyFinalSchwaDeletion(word: string): string {
  return word.replace(/([bcdfghjklmnpqrstvwxyz])a$/i, '$1');
}

function buildIIRSyllables(word: string): Syllable[] {
  const syllables: Syllable[] = [];
  let index = 0;

  while (index < word.length) {
    let onset = '';
    let nucleus = '';
    let coda = '';

    while (index < word.length && !startsWithIIRVowel(word, index)) {
      onset += word[index]!;
      index++;
    }

    const vowel = matchIIRVowel(word, index);
    if (vowel) {
      nucleus = vowel;
      index += vowel.length;
    }

    const codaStart = index;
    while (index < word.length && !startsWithIIRVowel(word, index)) {
      index++;
    }

    if (index < word.length && index - codaStart > 1) {
      coda = word.slice(codaStart, index - 1);
      index -= 1;
    } else {
      coda = word.slice(codaStart, index);
    }

    if (nucleus) {
      syllables.push({ onset, nucleus, coda, tone: null, weight: null, stressed: false, template: coda ? 'CVC' : 'CV' });
    }
  }

  return syllables;
}

function transliterateAbugida(word: string, profile: BrahmicProfile): string {
  let result = '';

  for (let index = 0; index < word.length; index++) {
    const char = word[index]!;

    if (/\s/u.test(char)) { result += char; continue; }

    if (profile.independentVowels[char]) {
      result += profile.independentVowels[char]!;
      continue;
    }

    if (profile.finals?.[char]) {
      result += profile.finals[char]!;
      continue;
    }

    if (profile.consonants[char]) {
      const base = profile.consonants[char]!;
      const next = word[index + 1];
      if (next === profile.virama) { result += base; index += 1; continue; }
      if (next && profile.vowelSigns[next]) { result += `${base}${profile.vowelSigns[next]!}`; index += 1; continue; }
      result += `${base}a`;
      continue;
    }

    result += char;
  }

  return result;
}

function startsWithIIRVowel(word: string, index: number): boolean {
  return IIR_VOWELS.some(vowel => word.startsWith(vowel, index));
}

function matchIIRVowel(word: string, index: number): string | null {
  return IIR_VOWELS.find(vowel => word.startsWith(vowel, index)) ?? null;
}
