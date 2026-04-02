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

const DRAVIDIAN_VOWELS = ['ai', 'au', 'ā', 'ī', 'ū', 'ē', 'ō', 'a', 'e', 'i', 'o', 'u'] as const;
const DRAVIDIAN_VOWEL_RE = /a|e|i|o|u|ā|ī|ū|ē|ō/;

const TAMIL_PROFILE: BrahmicProfile = {
  independentVowels: { 'அ': 'a', 'ஆ': 'ā', 'இ': 'i', 'ஈ': 'ī', 'உ': 'u', 'ஊ': 'ū', 'எ': 'e', 'ஏ': 'ē', 'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'ō', 'ஔ': 'au' },
  vowelSigns: { 'ா': 'ā', 'ி': 'i', 'ீ': 'ī', 'ு': 'u', 'ூ': 'ū', 'ெ': 'e', 'ே': 'ē', 'ை': 'ai', 'ொ': 'o', 'ோ': 'ō', 'ௌ': 'au' },
  consonants: { 'க': 'k', 'ங': 'n', 'ச': 'c', 'ஜ': 'j', 'ஞ': 'n', 'ட': 't', 'ண': 'n', 'த': 't', 'ந': 'n', 'ப': 'p', 'ம': 'm', 'ய': 'y', 'ர': 'r', 'ல': 'l', 'வ': 'v', 'ழ': 'l', 'ள': 'l', 'ற': 'r', 'ன': 'n' },
  virama: '்',
  finals: { 'ஂ': 'm', 'ஃ': 'h' },
};

const TELUGU_PROFILE: BrahmicProfile = {
  independentVowels: { 'అ': 'a', 'ఆ': 'ā', 'ఇ': 'i', 'ఈ': 'ī', 'ఉ': 'u', 'ఊ': 'ū', 'ఎ': 'e', 'ఏ': 'ē', 'ఐ': 'ai', 'ఒ': 'o', 'ఓ': 'ō', 'ఔ': 'au' },
  vowelSigns: { 'ా': 'ā', 'ి': 'i', 'ీ': 'ī', 'ు': 'u', 'ూ': 'ū', 'ె': 'e', 'ే': 'ē', 'ై': 'ai', 'ొ': 'o', 'ో': 'ō', 'ౌ': 'au' },
  consonants: { 'క': 'k', 'ఖ': 'k', 'గ': 'g', 'ఘ': 'g', 'ఙ': 'n', 'చ': 'c', 'ఛ': 'c', 'జ': 'j', 'ఝ': 'j', 'ఞ': 'n', 'ట': 't', 'ఠ': 't', 'డ': 'd', 'ఢ': 'd', 'ణ': 'n', 'త': 't', 'థ': 't', 'ద': 'd', 'ధ': 'd', 'న': 'n', 'ప': 'p', 'ఫ': 'p', 'బ': 'b', 'భ': 'b', 'మ': 'm', 'య': 'y', 'ర': 'r', 'ల': 'l', 'వ': 'v', 'శ': 's', 'ష': 's', 'స': 's', 'హ': 'h', 'ళ': 'l', 'ఱ': 'r' },
  virama: '్',
  finals: { 'ం': 'm', 'ః': 'h' },
};

const KANNADA_PROFILE: BrahmicProfile = {
  independentVowels: { 'ಅ': 'a', 'ಆ': 'ā', 'ಇ': 'i', 'ಈ': 'ī', 'ಉ': 'u', 'ಊ': 'ū', 'ಎ': 'e', 'ಏ': 'ē', 'ಐ': 'ai', 'ಒ': 'o', 'ಓ': 'ō', 'ಔ': 'au' },
  vowelSigns: { 'ಾ': 'ā', 'ಿ': 'i', 'ೀ': 'ī', 'ು': 'u', 'ೂ': 'ū', 'ೆ': 'e', 'ೇ': 'ē', 'ೈ': 'ai', 'ೊ': 'o', 'ೋ': 'ō', 'ೌ': 'au' },
  consonants: { 'ಕ': 'k', 'ಖ': 'k', 'ಗ': 'g', 'ಘ': 'g', 'ಙ': 'n', 'ಚ': 'c', 'ಛ': 'c', 'ಜ': 'j', 'ಝ': 'j', 'ಞ': 'n', 'ಟ': 't', 'ಠ': 't', 'ಡ': 'd', 'ಢ': 'd', 'ಣ': 'n', 'ತ': 't', 'ಥ': 't', 'ದ': 'd', 'ಧ': 'd', 'ನ': 'n', 'ಪ': 'p', 'ಫ': 'p', 'ಬ': 'b', 'ಭ': 'b', 'ಮ': 'm', 'ಯ': 'y', 'ರ': 'r', 'ಲ': 'l', 'ವ': 'v', 'ಶ': 's', 'ಷ': 's', 'ಸ': 's', 'ಹ': 'h', 'ಳ': 'l', 'ಱ': 'r' },
  virama: '್',
  finals: { 'ಂ': 'm', 'ಃ': 'h' },
};

const MALAYALAM_PROFILE: BrahmicProfile = {
  independentVowels: { 'അ': 'a', 'ആ': 'ā', 'ഇ': 'i', 'ഈ': 'ī', 'ഉ': 'u', 'ഊ': 'ū', 'എ': 'e', 'ഏ': 'ē', 'ഐ': 'ai', 'ഒ': 'o', 'ഓ': 'ō', 'ഔ': 'au' },
  vowelSigns: { 'ാ': 'ā', 'ി': 'i', 'ീ': 'ī', 'ു': 'u', 'ൂ': 'ū', 'െ': 'e', 'േ': 'ē', 'ൈ': 'ai', 'ൊ': 'o', 'ോ': 'ō', 'ൌ': 'au' },
  consonants: { 'ക': 'k', 'ഖ': 'k', 'ഗ': 'g', 'ഘ': 'g', 'ങ': 'n', 'ച': 'c', 'ഛ': 'c', 'ജ': 'j', 'ഝ': 'j', 'ഞ': 'n', 'ട': 't', 'ഠ': 't', 'ഡ': 'd', 'ഢ': 'd', 'ണ': 'n', 'ത': 't', 'ഥ': 't', 'ദ': 'd', 'ധ': 'd', 'ന': 'n', 'പ': 'p', 'ഫ': 'p', 'ബ': 'b', 'ഭ': 'b', 'മ': 'm', 'യ': 'y', 'ര': 'r', 'ല': 'l', 'വ': 'v', 'ശ': 's', 'ഷ': 's', 'സ': 's', 'ഹ': 'h', 'ള': 'l', 'ഴ': 'l', 'റ': 'r' },
  virama: '്',
  finals: { 'ം': 'm', 'ഃ': 'h' },
};

const DRAVIDIAN_PROFILES: Record<string, BrahmicProfile> = {
  ta: TAMIL_PROFILE,
  te: TELUGU_PROFILE,
  kn: KANNADA_PROFILE,
  ml: MALAYALAM_PROFILE,
};

export class DravidianStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-DRV' as const;

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
      .map((word) => normalizeRetroflexes(stripAgglutinativeSuffixes(transliterateDravidianWord(word, lang), lang)))
      .join(' ');
  }

  syllabify(ipa: string, _lang: string): Syllable[] {
    const syllables = ipa.split(/\s+/u).filter(Boolean).flatMap(buildDravidianSyllables);

    if (syllables.length > 0) {
      syllables[syllables.length - 1]!.stressed = true;
    }

    return syllables;
  }

  extractRN(syllables: Syllable[], _lang: string): RhymeNucleus {
    const primary = findLastHeavySyllable(syllables) ?? syllables[syllables.length - 1];
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

function transliterateDravidianWord(word: string, lang: string): string {
  const profile = DRAVIDIAN_PROFILES[lang.toLowerCase()];
  if (!profile) return word;
  return transliterateAbugida(word, profile);
}

function normalizeRetroflexes(word: string): string {
  return word.replace(/[ṭṯ]/g, 't').replace(/[ḍ]/g, 'd').replace(/[ṇ]/g, 'n');
}

function buildDravidianSyllables(word: string): Syllable[] {
  const syllables: Syllable[] = [];
  let index = 0;

  while (index < word.length) {
    let onset = '';
    let nucleus = '';
    let coda = '';

    while (index < word.length && !startsWithVowel(word, index)) {
      onset += word[index]!;
      index++;
    }

    const vowel = matchVowel(word, index);
    if (vowel) {
      nucleus = vowel;
      index += vowel.length;
    }

    const codaStart = index;
    while (index < word.length && !startsWithVowel(word, index)) {
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

function findLastHeavySyllable(syllables: Syllable[]): Syllable | undefined {
  return [...syllables].reverse().find(syllable => isLongVowel(syllable.nucleus) || syllable.coda.length > 0);
}

function transliterateAbugida(word: string, profile: BrahmicProfile): string {
  let result = '';

  for (let index = 0; index < word.length; index++) {
    const char = word[index]!;

    if (/\s/u.test(char)) {
      result += char;
      continue;
    }

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
      if (next === profile.virama) {
        result += base;
        index += 1;
        continue;
      }
      if (next && profile.vowelSigns[next]) {
        result += `${base}${profile.vowelSigns[next]!}`;
        index += 1;
        continue;
      }
      result += `${base}a`;
      continue;
    }

    result += char;
  }

  return result;
}

function startsWithVowel(word: string, index: number): boolean {
  return DRAVIDIAN_VOWELS.some(vowel => word.startsWith(vowel, index)) || DRAVIDIAN_VOWEL_RE.test(word[index] ?? '');
}

function matchVowel(word: string, index: number): string | null {
  return DRAVIDIAN_VOWELS.find(vowel => word.startsWith(vowel, index)) ?? null;
}

function isLongVowel(vowel: string): boolean {
  return vowel.length > 1 || /[āīūēō]/.test(vowel);
}
