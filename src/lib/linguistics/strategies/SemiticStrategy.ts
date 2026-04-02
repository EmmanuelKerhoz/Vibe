/**
 * ALGO-SEM — Semitic languages strategy.
 *
 * Covers: ar (Arabic), he (Hebrew), am (Amharic).
 * Key traits: triconsonantal root structure, vocalic scheme extraction,
 *             hamza normalisation, matres lectionis, RTL-safe Unicode.
 *
 * NOTE — Amharic (am) low-resource path:
 *   Amharic uses Ethiopic Fidel script (U+1200–U+137F). The current Arabic/Hebrew
 *   vowel detectors (AR_LONG_VOWEL_RE, HE_VOWEL_RE) never match Fidel characters,
 *   producing an empty syllable array and a silent analysis failure.
 *   Until a dedicated Amharic G2P is implemented, the strategy emits a structured
 *   TODO sentinel syllable with lowResourceFallback: true so the pipeline degrades
 *   gracefully instead of returning an empty/misleading result.
 *   TODO(am): replace sentinel with eSpeak-NG 'am' voice or a Fidel → IPA table.
 */

import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable } from '../core/types';
import { classifyCoda, normalizeHamza, stripTashkeel, hasTashkeel, HEBREW_MATRES } from '../utils';

/** Arabic vowel diacritics (short vowels). */
const AR_SHORT_VOWELS: Record<string, string> = {
  '\u064E': 'a',  // fathah
  '\u064F': 'u',  // dammah
  '\u0650': 'i',  // kasrah
};

/** Arabic long vowels (orthographic). */
const AR_LONG_VOWEL_RE = /[اوي]/;

/** Hebrew vowels (basic orthographic). */
const HE_VOWEL_RE = /[אהעוי]/;

/** Latin/IPA vowel pattern (does NOT match Ethiopic — intentional). */
const GENERAL_VOWEL_RE = /[aeiouyəɛɔɪʊäüöàáèéìíòóùú]/i;

/** Ethiopic Fidel block — U+1200–U+137F. */
const AMHARIC_FIDEL_RE = /[\u1200-\u137F]/;

/** Combined vowel detection: Arabic, Hebrew, or general. */
function isVowelChar(ch: string, lang: string): boolean {
  if (lang === 'ar') return AR_LONG_VOWEL_RE.test(ch);
  if (lang === 'he') return HE_VOWEL_RE.test(ch) || HEBREW_MATRES.has(ch);
  return GENERAL_VOWEL_RE.test(ch);
}

/** Detect if character is a Hebrew mater lectionis (long vowel). */
function isLongVowel(ch: string, lang: string): boolean {
  if (lang === 'he') return HEBREW_MATRES.has(ch);
  if (lang === 'ar') return AR_LONG_VOWEL_RE.test(ch);
  return false;
}

/** Return true if text contains Ethiopic Fidel characters. */
function isAmharicScript(text: string): boolean {
  return AMHARIC_FIDEL_RE.test(text);
}

export class SemiticStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-SEM' as const;

  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 0.0,       // non-tonal family
    weight: 0.0,
    codaClass: 0.5,  // medium coda relevance
    threshold: 0.75,
  };

  // ─── Step 1: Normalisation ──────────────────────────────────────────────────

  normalize(text: string, lang: string): string {
    let t = text.normalize('NFC').trim();

    if (lang === 'ar') {
      t = normalizeHamza(t);
      if (!hasTashkeel(t)) {
        t = stripTashkeel(t);
      }
    }

    t = t.replace(/[^\p{L}\p{M}\s]/gu, '');
    return t;
  }

  // ─── Step 2: G2P ───────────────────────────────────────────────────────────

  g2p(normalized: string, lang: string): string {
    if (lang === 'ar' && hasTashkeel(normalized)) {
      let result = '';
      for (const ch of normalized) {
        const mapped = AR_SHORT_VOWELS[ch];
        result += mapped ?? ch;
      }
      return result;
    }
    return normalized;
  }

  // ─── Step 3: Syllabification ────────────────────────────────────────────────

  syllabify(ipa: string, lang: string): Syllable[] {
    // Amharic low-resource sentinel: Fidel script is not handled by the
    // Arabic/Hebrew vowel detectors. Emit a single opaque syllable so that
    // analyze() and extractRN() receive a non-empty array and can surface
    // the lowResourceFallback flag to the UI consumer.
    if (lang === 'am' || isAmharicScript(ipa)) {
      return [{
        onset: '',
        nucleus: ipa.trim(),
        coda: '',
        tone: null,
        weight: null,
        stressed: true,
        template: 'TODO:am',
      }];
    }

    const chars = [...ipa.replace(/\s+/g, ' ')];
    const syllables: Syllable[] = [];
    let i = 0;

    while (i < chars.length) {
      if (/\s/.test(chars[i]!)) { i++; continue; }

      let onset = '';
      let nucleus = '';
      let coda = '';

      while (i < chars.length && !isVowelChar(chars[i]!, lang) && !/\s/.test(chars[i]!)) {
        onset += chars[i];
        i++;
      }

      if (i < chars.length && isVowelChar(chars[i]!, lang)) {
        nucleus = chars[i]!;
        i++;
      }

      const codaStart = i;
      while (i < chars.length && !isVowelChar(chars[i]!, lang) && !/\s/.test(chars[i]!)) {
        i++;
      }
      if (i < chars.length && isVowelChar(chars[i]!, lang) && i - codaStart > 0) {
        coda = chars.slice(codaStart, i - 1).join('');
        i = i - 1;
      } else {
        coda = chars.slice(codaStart, i).join('');
      }

      if (nucleus) {
        syllables.push({
          onset,
          nucleus,
          coda,
          tone: null,
          weight: isLongVowel(nucleus, lang) ? 'heavy' : null,
          stressed: false,
        });
      }
    }

    if (syllables.length > 0) {
      syllables[syllables.length - 1]!.stressed = true;
    }

    return syllables;
  }

  // ─── Step 4: Rhyme Nucleus extraction ───────────────────────────────────────

  extractRN(syllables: Syllable[], lang: string): RhymeNucleus {
    // Amharic sentinel: propagate lowResourceFallback to the RhymeNucleus.
    if (lang === 'am' || syllables.some(s => s.template === 'TODO:am')) {
      const raw = syllables.map(s => s.nucleus).join('');
      return {
        nucleus: raw,
        coda: '',
        toneClass: null,
        weight: null,
        codaClass: null,
        raw,
        lowResourceFallback: true,
      };
    }

    let idx = -1;
    for (let k = syllables.length - 1; k >= 0; k--) {
      if (syllables[k]!.weight === 'heavy') {
        idx = k;
        break;
      }
    }
    if (idx < 0) idx = Math.max(0, syllables.length - 1);

    const tail = syllables.slice(idx);
    const raw = tail.map(s => `${s.nucleus}${s.coda}`).join('');
    const primary = tail[0];

    return {
      nucleus: primary?.nucleus ?? '',
      coda: primary?.coda ?? '',
      toneClass: null,
      weight: primary?.weight ?? null,
      codaClass: classifyCoda(primary?.coda ?? ''),
      raw,
    };
  }

  // ─── Step 5: Scoring ───────────────────────────────────────────────────────

  score(rn1: RhymeNucleus, rn2: RhymeNucleus, weights?: Partial<MatchingWeights>): number {
    return featureWeightedScore(rn1, rn2, { ...this.defaultWeights, ...weights });
  }
}
