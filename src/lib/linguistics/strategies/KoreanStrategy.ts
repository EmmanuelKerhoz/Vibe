import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable } from '../core/types';
import { classifyCoda, isHangulSyllable } from '../utils';

const HANGUL_BASE = 0xac00;
const HANGUL_ONSET_DIVISOR = 588;
const HANGUL_NUCLEUS_DIVISOR = 28;

const HANGUL_ONSETS = ['g', 'g', 'n', 'd', 'd', 'r', 'm', 'b', 'b', 's', 's', '', 'j', 'j', 'ch', 'k', 't', 'p', 'h'] as const;
const HANGUL_NUCLEI = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'] as const;
const HANGUL_CODAS = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'p', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 'ng', 't', 't', 'k', 't', 'p', 't'] as const;

export class KoreanStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-KOR' as const;

  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 0.0,
    weight: 0.0,
    codaClass: 1.0,
    threshold: 0.75,
  };

  normalize(text: string, _lang: string): string {
    return text.normalize('NFC').toLowerCase().trim()
      .replace(/[^\p{L}\p{M}\p{Script=Hangul}\s'-]/gu, '');
  }

  g2p(normalized: string, _lang: string): string {
    return normalized
      .split(/\s+/u)
      .filter(Boolean)
      .flatMap((token) => transliterateKoreanWord(token))
      .join(' ');
  }

  syllabify(ipa: string, _lang: string): Syllable[] {
    const syllables = ipa.split(/\s+/u).filter(Boolean).map(parseKoreanSyllableToken);

    if (syllables.length > 0) {
      syllables[syllables.length - 1]!.stressed = true;
    }

    return syllables;
  }

  extractRN(syllables: Syllable[], _lang: string): RhymeNucleus {
    const last = syllables[syllables.length - 1];
    const coda = last?.coda ?? '';

    return {
      nucleus: last?.nucleus ?? '',
      coda,
      toneClass: null,
      weight: null,
      codaClass: classifyCoda(coda),
      raw: [last?.nucleus ?? '', coda].filter(Boolean).join(':'),
    };
  }

  score(rn1: RhymeNucleus, rn2: RhymeNucleus, weights?: Partial<MatchingWeights>): number {
    return featureWeightedScore(rn1, rn2, { ...this.defaultWeights, ...weights });
  }
}

function transliterateKoreanWord(word: string): string[] {
  const syllables: string[] = [];

  for (const char of word) {
    if (!isHangulSyllable(char)) {
      syllables.push(`:${char}:`);
      continue;
    }

    const { onset, nucleus, coda } = decomposeHangulSyllable(char);
    syllables.push(`${onset}:${nucleus}:${coda}`);
  }

  return syllables;
}

function parseKoreanSyllableToken(token: string): Syllable {
  const [onset = '', nucleus = token, coda = ''] = token.split(':');

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

function decomposeHangulSyllable(char: string): { onset: string; nucleus: string; coda: string } {
  const codePoint = char.codePointAt(0);
  if (codePoint === undefined) {
    return {
      onset: '',
      nucleus: char,
      coda: '',
    };
  }

  const hangulOffset = codePoint - HANGUL_BASE;
  const onsetIndex = Math.floor(hangulOffset / HANGUL_ONSET_DIVISOR);
  const nucleusIndex = Math.floor((hangulOffset % HANGUL_ONSET_DIVISOR) / HANGUL_NUCLEUS_DIVISOR);
  const codaIndex = hangulOffset % HANGUL_NUCLEUS_DIVISOR;

  return {
    onset: HANGUL_ONSETS[onsetIndex] ?? '',
    nucleus: HANGUL_NUCLEI[nucleusIndex] ?? char,
    coda: HANGUL_CODAS[codaIndex] ?? '',
  };
}
