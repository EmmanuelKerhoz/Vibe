import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable } from '../core/types';
import { classifyCoda, stripAgglutinativeSuffixes } from '../utils';

const FRONT_VOWELS = new Set(['ä', 'ö', 'y', 'ü', 'ő', 'ű']);
const BACK_VOWELS = new Set(['a', 'o', 'u']);
const NEUTRAL_VOWELS = new Set(['e', 'i']);
// Hungarian accented vowels (á é í ó ú and long ő ű) added to base set.
// Without them, words like 'szép' (é) produce no syllables → score 0.
const VOWEL_RE = /[aeiouyäöüőűáéíóú]/i;

export class UralicStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-FIN' as const;

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
      .map(word => stripAgglutinativeSuffixes(word, lang))
      .join(' ');
  }

  syllabify(ipa: string, _lang: string): Syllable[] {
    const words = ipa.split(/\s+/u).filter(Boolean);
    const syllables = words.flatMap((word) => buildSyllables(word, classifyUralicHarmony(word)));

    if (syllables.length > 0) {
      syllables[syllables.length - 1]!.stressed = true;
    }

    return syllables;
  }

  extractRN(syllables: Syllable[], _lang: string): RhymeNucleus {
    const primary = [...syllables].reverse().find(syllable => syllable.stressed) ?? syllables[syllables.length - 1];
    const harmony = primary?.template?.split(':')[0] ?? 'neutral';
    const coda = primary?.coda ?? '';
    const nucleus = primary ? `${harmony}:${primary.nucleus}` : '';

    return {
      nucleus,
      coda,
      toneClass: null,
      weight: null,
      codaClass: classifyCoda(coda),
      raw: [nucleus, coda].filter(Boolean).join(':'),
    };
  }

  score(rn1: RhymeNucleus, rn2: RhymeNucleus, weights?: Partial<MatchingWeights>): number {
    return featureWeightedScore(rn1, rn2, { ...this.defaultWeights, ...weights });
  }
}

function classifyUralicHarmony(word: string): 'front' | 'back' | 'neutral' {
  let hasFront = false;
  let hasBack = false;
  let hasNeutral = false;

  for (const char of word) {
    if (FRONT_VOWELS.has(char)) hasFront = true;
    if (BACK_VOWELS.has(char)) hasBack = true;
    if (NEUTRAL_VOWELS.has(char)) hasNeutral = true;
  }

  if (hasFront) return 'front';
  if (hasBack) return 'back';
  if (hasNeutral) return 'neutral';
  return 'neutral';
}

function buildSyllables(word: string, harmony: 'front' | 'back' | 'neutral'): Syllable[] {
  const chars = [...word];
  const syllables: Syllable[] = [];
  let index = 0;

  while (index < chars.length) {
    let onset = '';
    let nucleus = '';
    let coda = '';

    while (index < chars.length && !VOWEL_RE.test(chars[index]!)) {
      onset += chars[index]!;
      index++;
    }

    if (index < chars.length && VOWEL_RE.test(chars[index]!)) {
      nucleus = chars[index]!;
      index++;
    }

    const codaStart = index;
    while (index < chars.length && !VOWEL_RE.test(chars[index]!)) {
      index++;
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
        template: `${harmony}:${coda ? 'CVC' : 'CV'}`,
      });
    }
  }

  return syllables;
}
