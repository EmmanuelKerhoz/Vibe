import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable } from '../core/types';

const AUST_VOWEL_RE = /[aeiouəéèê]/i;
const AUST_PREFIXES: Record<string, readonly string[]> = {
  id: ['meng', 'meny', 'men', 'mem', 'me', 'ber', 'per', 'pe', 'di', 'ke', 'se', 'ter'],
  ms: ['ber', 'per', 'pe', 'di', 'ke', 'se', 'ter', 'me'],
  tl: ['mag', 'nag', 'pag', 'ma', 'na', 'ka', 'pa', 'i'],
  jv: ['ng', 'ny', 'di', 'ke', 'se', 'pa', 'ka'],
};
const AUST_INFIXES: Record<string, readonly string[]> = {
  tl: ['um', 'in'],
};

export class AustronesianStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-AUS' as const;

  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 0.0,
    weight: 0.0,
    codaClass: 0.0,
    threshold: 0.75,
  };

  normalize(text: string, _lang: string): string {
    return text.normalize('NFC').toLowerCase().trim().replace(/[^\p{L}\p{M}\s'-]/gu, '');
  }

  g2p(normalized: string, lang: string): string {
    return normalized
      .split(/\s+/u)
      .filter(Boolean)
      .map((word) => stripAustronesianAffixes(word, lang))
      .join(' ');
  }

  syllabify(ipa: string, _lang: string): Syllable[] {
    const syllables = ipa.split(/\s+/u).filter(Boolean).flatMap(buildAustronesianSyllables);

    if (syllables.length > 0) {
      syllables[syllables.length - 1]!.stressed = true;
    }

    return syllables;
  }

  extractRN(syllables: Syllable[], _lang: string): RhymeNucleus {
    const openSyllable = [...syllables].reverse().find((syllable) => syllable.coda.length === 0)
      ?? syllables[syllables.length - 1];

    return {
      nucleus: openSyllable?.nucleus ?? '',
      coda: '',
      toneClass: null,
      weight: null,
      codaClass: null,
      raw: [openSyllable?.onset ?? '', openSyllable?.nucleus ?? ''].filter(Boolean).join(''),
    };
  }

  score(rn1: RhymeNucleus, rn2: RhymeNucleus, weights?: Partial<MatchingWeights>): number {
    return featureWeightedScore(rn1, rn2, { ...this.defaultWeights, ...weights });
  }
}

function stripAustronesianAffixes(word: string, lang: string): string {
  const lowered = word.normalize('NFC').toLowerCase();
  const withoutPrefix = stripLongestPrefix(lowered, AUST_PREFIXES[lang.toLowerCase()] ?? []);
  return stripInfixes(withoutPrefix, AUST_INFIXES[lang.toLowerCase()] ?? []);
}

function stripLongestPrefix(word: string, prefixes: readonly string[]): string {
  const prefix = [...prefixes].sort((left, right) => right.length - left.length)
    .find((candidate) => word.startsWith(candidate) && hasCoreStem(word.slice(candidate.length)));
  return prefix ? word.slice(prefix.length) : word;
}

function stripInfixes(word: string, infixes: readonly string[]): string {
  let stem = word;

  for (const infix of infixes) {
    if (stem.startsWith(infix) && hasCoreStem(stem.slice(infix.length))) {
      return stem.slice(infix.length);
    }

    if (stem.length <= 1) {
      continue;
    }

    const insertionIndex = AUST_VOWEL_RE.test(stem[0] ?? '') ? 0 : 1;
    if (stem.slice(insertionIndex, insertionIndex + infix.length) === infix) {
      const candidate = `${stem.slice(0, insertionIndex)}${stem.slice(insertionIndex + infix.length)}`;
      if (hasCoreStem(candidate)) {
        stem = candidate;
      }
    }
  }

  return stem;
}

function hasCoreStem(value: string): boolean {
  return value.length >= 2 && AUST_VOWEL_RE.test(value);
}

function buildAustronesianSyllables(word: string): Syllable[] {
  const chars = [...word];
  const syllables: Syllable[] = [];
  let index = 0;

  while (index < chars.length) {
    let onset = '';
    let nucleus = '';
    let coda = '';

    while (index < chars.length) {
      const current = chars[index];
      if (current === undefined || AUST_VOWEL_RE.test(current)) {
        break;
      }
      onset += current;
      index += 1;
    }

    const current = chars[index];
    if (current !== undefined && AUST_VOWEL_RE.test(current)) {
      nucleus = current;
      index += 1;
    }

    const codaStart = index;
    while (index < chars.length && !AUST_VOWEL_RE.test(chars[index]!)) {
      index += 1;
    }

    if (index < chars.length && index - codaStart > 0) {
      coda = chars.slice(codaStart, index - 1).join('');
      index -= 1;
    } else {
      coda = chars.slice(codaStart, index).join('');
    }

    if (nucleus) {
      syllables.push({
        onset,
        nucleus,
        coda,
        tone: null,
        weight: null,
        stressed: false,
        template: coda ? 'CVC' : 'CV',
      });
    }
  }

  return syllables;
}
