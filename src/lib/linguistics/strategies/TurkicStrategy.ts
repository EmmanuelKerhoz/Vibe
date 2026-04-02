import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable } from '../core/types';
import { classifyCoda, stripAgglutinativeSuffixes } from '../utils';

const TURKIC_VOWELS = ['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü', 'ə'] as const;
const FRONT_VOWELS = new Set(['e', 'i', 'ö', 'ü', 'ə']);
const BACK_VOWELS = new Set(['a', 'ı', 'o', 'u']);
const VOWEL_RE = /[aeıioöuüə]/i;
const CYRILLIC_TURKIC_MAP: Record<string, string> = {
  а: 'a', ә: 'ə', б: 'b', в: 'v', г: 'g', ғ: 'ğ', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z',
  и: 'i', й: 'y', к: 'k', қ: 'q', л: 'l', м: 'm', н: 'n', ң: 'ñ', о: 'o', ө: 'ö', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ұ: 'u', ү: 'ü', ф: 'f', х: 'h', ҳ: 'h', ц: 'ts', ч: 'ch',
  ш: 'sh', щ: 'sh', ы: 'ı', і: 'i', э: 'e', ю: 'yu', я: 'ya', ъ: '', ь: '', ё: 'yo',
};

export class TurkicStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-TRK' as const;

  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 0.0,
    weight: 0.0,
    codaClass: 0.5,
    threshold: 0.75,
  };

  normalize(text: string, lang: string): string {
    const normalized = transliterateTurkicScripts(text.normalize('NFC').toLowerCase().trim(), lang);
    return normalized.replace(/[^\p{L}\p{M}\s'-]/gu, '');
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
    const syllables = words.flatMap((word) => buildSyllables(word, classifyTurkicHarmony(word)));

    if (syllables.length > 0) {
      syllables[syllables.length - 1]!.stressed = true;
    }

    return syllables;
  }

  extractRN(syllables: Syllable[], _lang: string): RhymeNucleus {
    const primary = [...syllables].reverse().find(syllable => syllable.stressed) ?? syllables[syllables.length - 1];
    const harmony = primary?.template?.split(':')[0] ?? 'back';
    const nucleus = primary ? `${harmony}:${primary.nucleus}` : '';
    const coda = primary?.coda ?? '';

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

function transliterateTurkicScripts(text: string, lang: string): string {
  if (lang !== 'kk' && lang !== 'uz') {
    return text.replace(/o‘|oʻ/g, 'o').replace(/g‘|gʻ/g, 'ğ');
  }

  return [...text].map((char) => CYRILLIC_TURKIC_MAP[char] ?? char).join('')
    .replace(/o‘|oʻ/g, 'o')
    .replace(/g‘|gʻ/g, 'ğ');
}

function classifyTurkicHarmony(word: string): 'front' | 'back' {
  const vowels = [...word].filter(char => TURKIC_VOWELS.includes(char as typeof TURKIC_VOWELS[number]));
  const anchor = [...vowels].reverse().find(vowel => FRONT_VOWELS.has(vowel) || BACK_VOWELS.has(vowel));
  return anchor && FRONT_VOWELS.has(anchor) ? 'front' : 'back';
}

function buildSyllables(word: string, harmony: 'front' | 'back'): Syllable[] {
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
