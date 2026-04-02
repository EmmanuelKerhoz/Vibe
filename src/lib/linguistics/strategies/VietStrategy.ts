/**
 * ALGO-VIET — Vietnamese / Khmer strategy.
 *
 * Covers: vi, km.
 * Key traits: strict Vietnamese tone handling, shared vowel+coda rhyme focus,
 *             Khmer non-tonal fallback with complex CV support.
 */

import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable, ToneClass } from '../core/types';
import {
  classifyCoda,
  extractToneFromText,
  splitToneDiacritics,
} from '../utils';

type VietProfile = {
  parseToken: (token: string) => Syllable | null;
  toneWeight: number;
};

const VIETNAMESE_TONE_MAP: Partial<Record<string, ToneClass>> = {
  '\u0300': 'L',
  '\u0301': 'H',
  '\u0303': 'MH',
  '\u0309': 'LH',
  '\u0323': 'ML',
};

const KHMER_CONSONANT_RE = /[\u1780-\u17A2]/u;
const KHMER_VOWEL_RE = /[\u17A3-\u17B3\u17B6-\u17C5]/u;
const KHMER_IGNORABLE_RE = /[\u17C6-\u17D1]/u;
const VIETNAMESE_CODAS = ['ng', 'nh', 'ch', 'c', 'm', 'n', 'p', 't'];
const DEFAULT_VIETNAMESE_TONE: ToneClass = 'M';

const VIET_PROFILES: Record<string, VietProfile> = {
  vi: {
    parseToken: parseVietnameseToken,
    toneWeight: 1.0,
  },
  km: {
    parseToken: parseKhmerToken,
    toneWeight: 0.0,
  },
};

export class VietStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-VIET' as const;

  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 1.0,
    weight: 0.0,
    codaClass: 0.4,
    threshold: 0.75,
  };

  normalize(text: string, _lang: string): string {
    return text.normalize('NFC').toLowerCase().trim()
      .replace(/[^\p{L}\p{M}\p{Script=Khmer}\s'-]/gu, '');
  }

  g2p(normalized: string, _lang: string): string {
    return normalized;
  }

  syllabify(ipa: string, lang: string): Syllable[] {
    const profile = resolveVietProfile(lang);
    const syllables = ipa.split(/\s+/u).filter(Boolean).flatMap((token) => {
      const syllable = profile.parseToken(token);
      return syllable ? [syllable] : [];
    });

    if (syllables.length > 0) {
      syllables[syllables.length - 1]!.stressed = true;
    }

    return syllables;
  }

  extractRN(syllables: Syllable[], _lang: string): RhymeNucleus {
    const last = syllables[syllables.length - 1];
    const nucleus = last?.nucleus ?? '';
    const coda = last?.coda ?? '';
    const toneClass = last?.tone ?? null;

    return {
      nucleus,
      coda,
      toneClass,
      weight: null,
      codaClass: classifyCoda(coda),
      raw: [nucleus, coda, toneClass].filter(Boolean).join(':'),
    };
  }

  score(rn1: RhymeNucleus, rn2: RhymeNucleus, weights?: Partial<MatchingWeights>): number {
    const toneWeight = rn1.toneClass === null && rn2.toneClass === null ? 0 : (weights?.tone ?? this.defaultWeights.tone);
    return featureWeightedScore(rn1, rn2, {
      ...this.defaultWeights,
      ...weights,
      tone: toneWeight,
    });
  }
}

function resolveVietProfile(lang: string): VietProfile {
  return VIET_PROFILES[lang.toLowerCase()] ?? VIET_PROFILES.vi!;
}

function parseVietnameseToken(token: string): Syllable | null {
  const original = token.normalize('NFC');
  const base = splitToneDiacritics(original).base.toLowerCase();
  const letters = [...base];
  const vowelIndex = letters.findIndex((char) => /[aăâeêioôơuưy]/u.test(char));

  if (vowelIndex < 0) {
    return null;
  }

  const coda = detectVietnameseCoda(base);
  const codaLength = [...coda].length;
  const onsetLength = vowelIndex;
  const originalLetters = [...original];
  const vowelEnd = codaLength > 0 ? originalLetters.length - codaLength : originalLetters.length;
  const nucleus = originalLetters.slice(onsetLength, vowelEnd).join('');
  const tone = extractToneFromText(original, VIETNAMESE_TONE_MAP) ?? DEFAULT_VIETNAMESE_TONE;

  return {
    onset: base.slice(0, onsetLength),
    nucleus,
    coda,
    tone,
    weight: null,
    stressed: false,
    template: coda ? 'CVC' : 'CV',
  };
}

function parseKhmerToken(token: string): Syllable | null {
  const letters = [...token.normalize('NFC')].filter((char) => !KHMER_IGNORABLE_RE.test(char));
  const vowelIndices = letters
    .map((char, index) => (KHMER_VOWEL_RE.test(char) ? index : -1))
    .filter((index) => index >= 0);
  const consonantIndices = letters
    .map((char, index) => (KHMER_CONSONANT_RE.test(char) ? index : -1))
    .filter((index) => index >= 0);

  if (consonantIndices.length === 0) {
    return null;
  }

  const firstVowelIndex = vowelIndices[0] ?? consonantIndices[0]! + 1;
  const lastVowelIndex = vowelIndices[vowelIndices.length - 1] ?? firstVowelIndex - 1;
  const codaStart = consonantIndices.find((index) => index > lastVowelIndex) ?? letters.length;
  const onset = letters.slice(0, firstVowelIndex).filter((char) => KHMER_CONSONANT_RE.test(char)).join('');
  const nucleus = letters.slice(firstVowelIndex, codaStart).join('') || 'ə';
  const coda = letters.slice(codaStart).filter((char) => KHMER_CONSONANT_RE.test(char)).join('');

  return {
    onset,
    nucleus,
    coda,
    tone: null,
    weight: null,
    stressed: false,
    template: coda ? 'CVC' : 'CV',
  };
}

function detectVietnameseCoda(token: string): string {
  return VIETNAMESE_CODAS.find((candidate) => token.endsWith(candidate)) ?? '';
}
