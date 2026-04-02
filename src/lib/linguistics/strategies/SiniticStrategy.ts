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
  /** Initials sorted longest-first for greedy segmentation. */
  initialsSorted: string[];
  toneDigits: Record<string, ToneClass>;
  diacriticMap: Partial<Record<string, ToneClass>>;
  digitResolver?: (toneDigit: string | null, coda: string) => ToneClass;
};

const HAN_CHAR_RE = /\p{Script=Han}/u;
const LATIN_RE = /[a-z]/i;

function buildProfile(p: Omit<SiniticProfile, 'initialsSorted'>): SiniticProfile {
  return {
    ...p,
    initialsSorted: [...p.initials].sort((a, b) => b.length - a.length),
  };
}

const MANDARIN_PROFILE: SiniticProfile = buildProfile({
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
});

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

const CANTONESE_PROFILE: SiniticProfile = buildProfile({
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
});

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
    // TODO(low-resource/SIN): pass-through — no Han→Pinyin/Jyutping conversion.
    // Pure Han input propagates raw characters and triggers lowResourceFallback.
    // A proper implementation would use CC-CEDICT (zh) or words.hk (yue).
    return normalized;
  }

  syllabify(ipa: string, lang: string): Syllable[] {
    const profile = resolveSiniticProfile(lang);

    // Split on whitespace first, then segment each Latin token into
    // individual Pinyin/Jyutping syllables (handles unspaced input).
    const rawTokens = ipa.split(/\s+/u).filter(Boolean);
    const tokens: string[] = [];
    for (const raw of rawTokens) {
      if (HAN_CHAR_RE.test(raw) && !LATIN_RE.test(raw)) {
        // Pure Han — pass through; handled by lowResourceFallback path below.
        tokens.push(raw);
      } else if (LATIN_RE.test(raw)) {
        // Latin (possibly unspaced Pinyin/Jyutping) — segment.
        tokens.push(...segmentLatinSiniticToken(raw, profile));
      } else {
        tokens.push(raw);
      }
    }

    const syllables = tokens.flatMap((token) => {
      if (HAN_CHAR_RE.test(token) && !LATIN_RE.test(token)) {
        // Raw Han: emit opaque nucleus with lowResourceFallback.
        return [...token]
          .filter((char) => HAN_CHAR_RE.test(char))
          .map<Syllable & { lowResourceFallback: boolean }>((char) => ({
            onset: '',
            nucleus: char,
            coda: '',
            tone: null,
            weight: null,
            stressed: false,
            template: 'CV',
            lowResourceFallback: true,
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

    const lowResourceFallback =
      (last as (Syllable & { lowResourceFallback?: boolean }) | undefined)
        ?.lowResourceFallback === true ||
      (HAN_CHAR_RE.test(nucleus) && coda === '');

    return {
      nucleus,
      coda,
      toneClass,
      weight: null,
      codaClass: classifyCoda(coda),
      raw: [nucleus, coda, toneClass].filter(Boolean).join(':'),
      ...(lowResourceFallback ? { lowResourceFallback: true } : {}),
    };
  }

  score(rn1: RhymeNucleus, rn2: RhymeNucleus, weights?: Partial<MatchingWeights>): number {
    return featureWeightedScore(rn1, rn2, { ...this.defaultWeights, ...weights });
  }
}

// ─── Sinitic profile resolution ─────────────────────────────────────────────────

function resolveSiniticProfile(lang: string): SiniticProfile {
  return SINITIC_PROFILES[lang.toLowerCase()] ?? MANDARIN_PROFILE;
}

// ─── Unspaced Latin token segmentation ─────────────────────────────────────────

/**
 * Greedily segment a single Latin token (potentially unspaced Pinyin or
 * Jyutping) into individual syllable strings.
 *
 * Algorithm:
 *   pos = 0
 *   while pos < token.length:
 *     1. Strip leading tone digits (e.g., the '3' in 'hao3ni3hao3').
 *        Actually: tone digits may be at the END of each syllable, so
 *        we scan forward to find the next syllable boundary.
 *     2. Try each initial in initialsSorted (longest first).
 *        If token[pos..] starts with an initial, record it.
 *     3. Consume the rime: all chars until the next initial or EOS,
 *        excluding a trailing tone digit which belongs to this syllable.
 *     4. Emit (initial + rime) as one token.
 *
 * Boundary detection: after consuming an initial, advance until we find
 * a position where another initial matches — that position is the start
 * of the next syllable.
 *
 * Edge cases:
 *   • Null onset syllables (vowel-initial: an, ou, ai, er) — consume
 *     vowels/non-initial-consonants until an initial boundary.
 *   • Single-syllable tokens: returned as-is (no segmentation needed).
 *   • Apostrophe separators (n’an, xi’an): stripped during normalization;
 *     if present, split on them first.
 */
const TONE_DIGIT_RE = /[1-9]$/;
const VOWEL_RE = /[aeiouüüêîôâ]/i;

function segmentLatinSiniticToken(token: string, profile: SiniticProfile): string[] {
  // If the token contains apostrophes (xi'an style), split on them first.
  const apostropheParts = token.split(/['\u2019]/u).filter(Boolean);
  if (apostropheParts.length > 1) {
    return apostropheParts.flatMap(part => segmentLatinSiniticToken(part, profile));
  }

  const result: string[] = [];
  let pos = 0;
  const initials = profile.initialsSorted;

  while (pos < token.length) {
    // Try to match an initial at current position.
    let initial = '';
    for (const candidate of initials) {
      if (token.startsWith(candidate, pos)) {
        initial = candidate;
        break;
      }
    }

    // Advance past the initial.
    let rimStart = pos + initial.length;

    // Consume the rime: advance until we hit a position where
    // another initial starts (but only after consuming at least one vowel
    // to avoid mis-splitting on consonant clusters like 'ng').
    let end = rimStart;
    let seenVowel = false;

    while (end < token.length) {
      const ch = token[end]!;

      // A tone digit at this position belongs to this syllable.
      if (TONE_DIGIT_RE.test(ch)) {
        end++;
        break;
      }

      if (VOWEL_RE.test(ch)) {
        seenVowel = true;
        end++;
        continue;
      }

      // Consonant: check if it starts a new initial (boundary).
      if (seenVowel) {
        // Check for known initial at this position — if found, stop.
        const nextInitial = initials.find(c => token.startsWith(c, end));
        if (nextInitial) break;
      }

      end++;
    }

    const syllable = token.slice(pos, end);
    if (syllable) result.push(syllable);
    pos = end;
  }

  // Fallback: if segmentation produced nothing, return the token as-is.
  return result.length > 0 ? result : [token];
}

// ─── Romanised syllable parser ────────────────────────────────────────────────

function parseRomanizedSiniticSyllable(token: string, profile: SiniticProfile): Syllable | null {
  const { base: digitless, toneClass: digitTone, toneDigit } = extractToneFromToneDigit(token.normalize('NFD'), profile.toneDigits);
  const { base, toneMark } = splitToneDiacritics(digitless);
  const cleaned = base.replace(/[''-]/gu, '').normalize('NFC');

  if (!cleaned) return null;

  const onset = extractInitial(cleaned, profile.initials);
  const segmentalRime = cleaned.slice(onset.length) || cleaned;
  const coda = extractRomanizedCoda(segmentalRime);
  const nucleus = coda ? segmentalRime.slice(0, -coda.length) : segmentalRime;
  const tone = resolveSiniticTone({ coda, digitTone, profile, toneDigit, toneMark });

  if (!nucleus) return null;

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
  return rime.match(ROMANIZED_CODA_RE)?.[1] ?? '';
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
  if (profile.digitResolver) return profile.digitResolver(toneDigit, coda);
  if (digitTone) return digitTone;
  if (toneMark) return extractToneFromDiacritic(toneMark, profile.diacriticMap);
  return profile.toneDigits['5'] ?? null;
}
