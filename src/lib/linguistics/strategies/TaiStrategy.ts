/**
 * ALGO-TAI — Tai-Kadai tonal strategy.
 *
 * Covers: th, lo.
 * Key traits: Thai/Lao tone class heuristics, common IPA-like rime normalisation,
 *             tone-sensitive vowel+coda rhyme, medium coda relevance.
 */

import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable, ToneClass } from '../core/types';
import { classifyCoda, TAI_TONE_MARK_RE } from '../utils';

type ConsonantClass = 'high' | 'mid' | 'low';

type TaiProfile = {
  consonantClass: Record<string, ConsonantClass>;
  vowelSigns: Set<string>;
  vowelMap: Record<string, string>;
  onsetMap: Record<string, string>;
  codaMap: Record<string, string>;
  toneMap: Record<ConsonantClass, Record<string, ToneClass>>;
  cleanupRe: RegExp;
};

const THAI_PROFILE: TaiProfile = {
  consonantClass: {
    ข: 'high', ฃ: 'high', ฉ: 'high', ฐ: 'high', ถ: 'high', ผ: 'high', ฝ: 'high', ศ: 'high', ษ: 'high', ส: 'high', ห: 'high',
    ก: 'mid', จ: 'mid', ฎ: 'mid', ฏ: 'mid', ด: 'mid', ต: 'mid', บ: 'mid', ป: 'mid', อ: 'mid',
    ค: 'low', ฆ: 'low', ง: 'low', ช: 'low', ซ: 'low', ฌ: 'low', ญ: 'low', ฑ: 'low', ฒ: 'low', ณ: 'low', ท: 'low', ธ: 'low', น: 'low',
    พ: 'low', ฟ: 'low', ภ: 'low', ม: 'low', ย: 'low', ร: 'low', ล: 'low', ว: 'low', ฮ: 'low',
  },
  vowelSigns: new Set(['ะ', 'ั', 'า', 'ำ', 'ิ', 'ี', 'ึ', 'ื', 'ุ', 'ู', 'เ', 'แ', 'โ', 'ไ', 'ใ', '็', 'ๅ', 'ฤ', 'ฦ']),
  vowelMap: {
    'ำ': 'am',
    'ไ': 'aj',
    'ใ': 'aj',
    'เ': 'e',
    'แ': 'ɛ',
    'โ': 'o',
    'ะ': 'a',
    'ั': 'a',
    'า': 'aː',
    'ิ': 'i',
    'ี': 'iː',
    'ึ': 'ɯ',
    'ื': 'ɯː',
    'ุ': 'u',
    'ู': 'uː',
    '็': 'e',
    'ๅ': 'aː',
    'ฤ': 'ɯ',
    'ฦ': 'lɯ',
  },
  onsetMap: {
    ก: 'k', ข: 'kʰ', ค: 'kʰ', ง: 'ŋ', จ: 'tɕ', ฉ: 'tɕʰ', ช: 'tɕʰ', ซ: 's', ญ: 'j', ด: 'd', ต: 't', ถ: 'tʰ',
    ท: 'tʰ', น: 'n', บ: 'b', ป: 'p', ผ: 'pʰ', พ: 'pʰ', ฝ: 'f', ฟ: 'f', ม: 'm', ย: 'j', ร: 'r', ล: 'l', ว: 'w',
    ศ: 's', ษ: 's', ส: 's', ห: 'h', ฮ: 'h', อ: 'ʔ',
  },
  codaMap: {
    ก: 'k', ข: 'k', ค: 'k', ด: 't', ต: 't', บ: 'p', ป: 'p', ม: 'm', น: 'n', ง: 'ŋ', ย: 'j', ว: 'w', ร: 'n', ล: 'n',
  },
  toneMap: {
    high: { '': 'LH', '่': 'L', '้': 'HL', '๊': 'H', '๋': 'LH' },
    mid: { '': 'M', '่': 'L', '้': 'HL', '๊': 'H', '๋': 'LH' },
    low: { '': 'M', '่': 'HL', '้': 'H', '๊': 'H', '๋': 'LH' },
  },
  cleanupRe: /[็์]/gu,
};

const LAO_PROFILE: TaiProfile = {
  consonantClass: {
    ຂ: 'high', ສ: 'high', ຖ: 'high', ຜ: 'high', ຝ: 'high', ຫ: 'high',
    ກ: 'mid', ຈ: 'mid', ດ: 'mid', ຕ: 'mid', ບ: 'mid', ປ: 'mid', ອ: 'mid',
    ຄ: 'low', ງ: 'low', ຊ: 'low', ຍ: 'low', ທ: 'low', ນ: 'low', ພ: 'low', ຟ: 'low', ມ: 'low', ຣ: 'low', ລ: 'low', ວ: 'low', ຮ: 'low',
  },
  vowelSigns: new Set(['ະ', 'ັ', 'າ', 'ຳ', 'ິ', 'ີ', 'ຶ', 'ື', 'ຸ', 'ູ', 'ເ', 'ແ', 'ໂ', 'ໄ', 'ໃ', 'ົ', 'ໍ']),
  vowelMap: {
    'ຳ': 'am',
    'ໄ': 'aj',
    'ໃ': 'aj',
    'ເ': 'e',
    'ແ': 'ɛ',
    'ໂ': 'o',
    'ະ': 'a',
    'ັ': 'a',
    'າ': 'aː',
    'ິ': 'i',
    'ີ': 'iː',
    'ຶ': 'ɯ',
    'ື': 'ɯː',
    'ຸ': 'u',
    'ູ': 'uː',
    'ົ': 'o',
    'ໍ': 'ɔ',
  },
  onsetMap: {
    ກ: 'k', ຂ: 'kʰ', ຄ: 'kʰ', ງ: 'ŋ', ຈ: 'tɕ', ຊ: 's', ຍ: 'j', ດ: 'd', ຕ: 't', ຖ: 'tʰ',
    ທ: 'tʰ', ນ: 'n', ບ: 'b', ປ: 'p', ຜ: 'pʰ', ພ: 'pʰ', ຝ: 'f', ຟ: 'f', ມ: 'm', ຣ: 'r', ລ: 'l',
    ວ: 'w', ສ: 's', ຫ: 'h', ຮ: 'h', ອ: 'ʔ',
  },
  codaMap: {
    ກ: 'k', ດ: 't', ຕ: 't', ບ: 'p', ປ: 'p', ມ: 'm', ນ: 'n', ງ: 'ŋ', ຍ: 'j', ວ: 'w', ຣ: 'n', ລ: 'n',
  },
  toneMap: {
    high: { '': 'LH', '່': 'L', '້': 'HL', '໊': 'H', '໋': 'LH' },
    mid: { '': 'M', '່': 'L', '້': 'HL', '໊': 'H', '໋': 'LH' },
    low: { '': 'M', '່': 'HL', '້': 'H', '໊': 'H', '໋': 'LH' },
  },
  cleanupRe: /[ົ໌]/gu,
};

const TAI_PROFILES: Record<string, TaiProfile> = {
  th: THAI_PROFILE,
  lo: LAO_PROFILE,
};

const LATIN_VOWEL_RE = /[aeiouəɛɯɔ]/i;

export class TaiStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-TAI' as const;

  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 0.9,
    weight: 0.0,
    codaClass: 0.4,
    threshold: 0.75,
  };

  normalize(text: string, _lang: string): string {
    return text.normalize('NFC').trim()
      .replace(/[^\p{L}\p{M}\p{Script=Thai}\p{Script=Lao}\s'-]/gu, '');
  }

  g2p(normalized: string, _lang: string): string {
    // Stub: G2P not yet implemented — grapheme-only analysis.
    // TODO: tonal G2P for Thai (th) / Lao (lo). Tone diacritics are captured
    // from orthography in syllabify(), but phonological values are not mapped.
    return normalized;
  }

  syllabify(ipa: string, lang: string): Syllable[] {
    const profile = resolveTaiProfile(lang);
    const syllables = ipa.split(/\s+/u).filter(Boolean).flatMap((token) => {
      const syllable = LATIN_VOWEL_RE.test(token)
        ? parseLatinTaiSyllable(token)
        : parseTaiScriptSyllable(token, profile);
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
      // G2P is a stub — tonal analysis is graphemic only; flag consumers.
      lowResourceFallback: true,
    };
  }

  score(rn1: RhymeNucleus, rn2: RhymeNucleus, weights?: Partial<MatchingWeights>): number {
    return featureWeightedScore(rn1, rn2, { ...this.defaultWeights, ...weights });
  }
}

function resolveTaiProfile(lang: string): TaiProfile {
  return TAI_PROFILES[lang.toLowerCase()] ?? THAI_PROFILE;
}

function parseTaiScriptSyllable(token: string, profile: TaiProfile): Syllable | null {
  const toneMark = [...token].find((char) => TAI_TONE_MARK_RE.test(char)) ?? '';
  const cleaned = token.replace(TAI_TONE_MARK_RE, '').replace(profile.cleanupRe, '');
  const letters = [...cleaned];
  const consonantPositions = letters
    .map((char, index) => (profile.consonantClass[char] ? index : -1))
    .filter((index) => index >= 0);

  if (consonantPositions.length === 0) {
    return null;
  }

  const initialIndex = consonantPositions[0]!;
  const initialChar = letters[initialIndex]!;
  const onset = profile.onsetMap[initialChar] ?? initialChar;
  const codaIndex = consonantPositions.length > 1 ? consonantPositions[consonantPositions.length - 1]! : -1;
  const codaChar = codaIndex > initialIndex ? letters[codaIndex] ?? '' : '';
  const coda = profile.codaMap[codaChar] ?? '';
  const nucleusChars = letters.filter((char) => profile.vowelSigns.has(char));
  const vowelKey = nucleusChars.join('');
  const nucleus = vowelKey ? mapTaiVowel(vowelKey, profile.vowelMap) : 'a';
  const initialClass = profile.consonantClass[initialChar] ?? 'mid';
  const tone = profile.toneMap[initialClass][toneMark] ?? profile.toneMap[initialClass][''] ?? null;

  return {
    onset,
    nucleus,
    coda,
    tone,
    weight: null,
    stressed: false,
    template: coda ? 'CVC' : 'CV',
  };
}

function parseLatinTaiSyllable(token: string): Syllable | null {
  const cleaned = token.normalize('NFC').toLowerCase().replace(/[^a-zəɛɯɔ'-]/gu, '');
  if (!cleaned) {
    return null;
  }

  const vowelIndex = [...cleaned].findIndex((char) => LATIN_VOWEL_RE.test(char));
  if (vowelIndex < 0) {
    return null;
  }

  const onset = cleaned.slice(0, vowelIndex);
  const remainder = cleaned.slice(vowelIndex);
  const codaMatch = remainder.match(/(ng|m|n|p|t|k|w|j)$/u);
  const coda = codaMatch?.[1] ?? '';
  const nucleus = coda ? remainder.slice(0, -coda.length) : remainder;

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

function mapTaiVowel(vowelKey: string, vowelMap: Record<string, string>): string {
  const candidates = Object.keys(vowelMap).sort((a, b) => b.length - a.length);
  const match = candidates.find((candidate) => vowelKey.includes(candidate));
  return match ? vowelMap[match]! : vowelMap[vowelKey] ?? 'a';
}
