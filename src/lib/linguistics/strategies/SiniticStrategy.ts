/**
 * ALGO-SIN — Sinitic tonal strategy.
 *
 * Covers: zh, yue, wuu.
 * Key traits: tone-sensitive rhyme, Pinyin/Jyutping-like romanisation fallback,
 *             final-based rhyme signatures, medium coda relevance.
 */

import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable, ToneClass } from '../core/types';
import {
  classifyCoda,
  extractToneFromDiacritic,
  extractToneFromToneDigit,
  splitToneDiacritics,
} from '../utils';

type SiniticProfile = {
  initials: string[];
  toneDigits: Record<string, ToneClass>;
  diacriticMap: Partial<Record<string, ToneClass>>;
  digitResolver?: (toneDigit: string | null, coda: string) => ToneClass;
};

const HAN_CHAR_RE = /\p{Script=Han}/u;
const LATIN_RE = /[a-z]/i;

const MANDARIN_PROFILE: SiniticProfile = {
  initials: ['zh', 'ch', 'sh', 'ng', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'w', 'y'],
  toneDigits: {
    '1': 'M',
    '2': 'LH',
    '3': 'L',
    '4': 'HL',
    '5': 'ML',
  },
  diacriticMap: {
    '\u0304': 'M',
    '\u0301': 'LH',
    '\u030C': 'L',
    '\u0300': 'HL',
  },
};

const CANTONESE_TONE_BANDS: Record<string, 'H' | 'M' | 'L'> = {
  '1': 'H',
  '2': 'H',
  '3': 'M',
  '4': 'L',
  '5': 'M',
  '6': 'L',
  '7': 'H',
  '8': 'M',
  '9': 'L',
};

const CANTONESE_ENTERING_TONES: Record<'H' | 'M' | 'L', ToneClass> = {
  H: 'MH',
  M: 'ML',
  L: 'HL',
};

const CANTONESE_NON_ENTERING_TONES: Record<'H' | 'M' | 'L', ToneClass> = {
  H: 'H',
  M: 'M',
  L: 'L',
};

const CANTONESE_PROFILE: SiniticProfile = {
  initials: ['gw', 'kw', 'ng', 'zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'w', 'z', 'c', 's', 'j'],
  toneDigits: {},
  diacriticMap: {
    '\u0301': 'H',
    '\u0304': 'M',
    '\u0300': 'L',
  },
  digitResolver: (toneDigit, coda) => {
    const band = toneDigit ? CANTONESE_TONE_BANDS[toneDigit] ?? 'M' : 'M';
    return isEnteringCoda(coda) || /[789]/u.test(toneDigit ?? '')
      ? CANTONESE_ENTERING_TONES[band]
      : CANTONESE_NON_ENTERING_TONES[band];
  },
};

const SINITIC_PROFILES: Record<string, SiniticProfile> = {
  zh: MANDARIN_PROFILE,
  wuu: MANDARIN_PROFILE,
  yue: CANTONESE_PROFILE,
};

const ROMANIZED_CODA_RE = /(ng|n|m|p|t|k|r)$/u;

export class SiniticStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-SIN' as const;

  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 1.0,
    weight: 0.0,
    codaClass: 0.4,
    threshold: 0.75,
  };

  normalize(text: string, _lang: string): string {
    return text.normalize('NFC').toLowerCase().trim()
      .replace(/[^\p{L}\p{M}\p{N}\p{Script=Han}\s'\-]/gu, '');
  }

  g2p(normalized: string, _lang: string): string {
    return normalized;
  }

  syllabify(ipa: string, lang: string): Syllable[] {
    const profile = resolveSiniticProfile(lang);
    const syllables = tokenizeSinitic(ipa).flatMap((token) => {
      if (HAN_CHAR_RE.test(token) && !LATIN_RE.test(token)) {
        return [...token]
          .filter((char) => HAN_CHAR_RE.test(char))
          .map<Syllable>((char) => ({
            onset: '',
            nucleus: char,
            coda: '',
            tone: null,
            weight: null,
            stressed: false,
            template: 'CV',
          }));
      }

      const syllable = parseRomanizedSiniticSyllable(token, profile);
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
    return featureWeightedScore(rn1, rn2, { ...this.defaultWeights, ...weights });
  }
}

function resolveSiniticProfile(lang: string): SiniticProfile {
  return SINITIC_PROFILES[lang.toLowerCase()] ?? MANDARIN_PROFILE;
}

function tokenizeSinitic(text: string): string[] {
  return text.split(/\s+/u).filter(Boolean);
}

function parseRomanizedSiniticSyllable(token: string, profile: SiniticProfile): Syllable | null {
  const { base: digitless, toneClass: digitTone, toneDigit } = extractToneFromToneDigit(token.normalize('NFD'), profile.toneDigits);
  const { base, toneMark } = splitToneDiacritics(digitless);
  const cleaned = base.replace(/['’-]/gu, '').normalize('NFC');

  if (!cleaned) {
    return null;
  }

  const onset = extractInitial(cleaned, profile.initials);
  const segmentalRime = cleaned.slice(onset.length) || cleaned;
  const coda = extractRomanizedCoda(segmentalRime);
  const nucleus = coda ? segmentalRime.slice(0, -coda.length) : segmentalRime;
  const tone = resolveSiniticTone({
    coda,
    digitTone,
    profile,
    toneDigit,
    toneMark,
  });

  if (!nucleus) {
    return null;
  }

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

function extractInitial(token: string, initials: string[]): string {
  return initials.find((candidate) => token.startsWith(candidate)) ?? '';
}

function extractRomanizedCoda(rime: string): string {
  const match = rime.match(ROMANIZED_CODA_RE);
  return match?.[1] ?? '';
}

function isEnteringCoda(coda: string): boolean {
  return /[ptk]$/u.test(coda);
}

function resolveSiniticTone(params: {
  coda: string;
  digitTone: ToneClass;
  profile: SiniticProfile;
  toneDigit: string | null;
  toneMark: string | null;
}): ToneClass {
  const { coda, digitTone, profile, toneDigit, toneMark } = params;
  if (profile.digitResolver) {
    return profile.digitResolver(toneDigit, coda);
  }
  if (digitTone) {
    return digitTone;
  }
  if (toneMark) {
    return extractToneFromDiacritic(toneMark, profile.diacriticMap);
  }
  return profile.toneDigits['5'] ?? null;
}
