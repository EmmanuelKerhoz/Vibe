/**
 * ALGO-SEM — Semitic languages strategy.
 *
 * Covers: ar (Arabic), he (Hebrew), am (Amharic).
 * Key traits: triconsonantal root structure, vocalic scheme extraction,
 *             hamza normalisation, matres lectionis, RTL-safe Unicode.
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

/** Latin/IPA/Amharic vowel pattern. */
const GENERAL_VOWEL_RE = /[aeiouyəɛɔɪʊäüöàáèéìíòóùú]/i;

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
    // Work on NFC-normalised Unicode — never reverse RTL strings
    let t = text.normalize('NFC').trim();

    if (lang === 'ar') {
      t = normalizeHamza(t);
      // Keep tashkeel if present (exploit short vowels); strip if absent
      if (!hasTashkeel(t)) {
        t = stripTashkeel(t);
      }
    }

    // Remove non-phonemic punctuation (preserve Arabic/Hebrew script + diacritics)
    t = t.replace(/[^\p{L}\p{M}\s]/gu, '');
    return t;
  }

  // ─── Step 2: G2P ───────────────────────────────────────────────────────────

  g2p(normalized: string, lang: string): string {
    // For Arabic with tashkeel, expand short vowels to explicit characters
    if (lang === 'ar' && hasTashkeel(normalized)) {
      let result = '';
      for (const ch of normalized) {
        const mapped = AR_SHORT_VOWELS[ch];
        if (mapped) {
          result += mapped;
        } else {
          result += ch;
        }
      }
      return result;
    }
    // Stub: in production, delegate to eSpeak-NG / Epitran.
    return normalized;
  }

  // ─── Step 3: Syllabification ────────────────────────────────────────────────

  syllabify(ipa: string, lang: string): Syllable[] {
    const chars = [...ipa.replace(/\s+/g, ' ')];
    const syllables: Syllable[] = [];
    let i = 0;

    while (i < chars.length) {
      if (/\s/.test(chars[i]!)) { i++; continue; }

      let onset = '';
      let nucleus = '';
      let coda = '';

      // Consume onset consonants
      while (i < chars.length && !isVowelChar(chars[i]!, lang) && !/\s/.test(chars[i]!)) {
        onset += chars[i];
        i++;
      }

      // Consume nucleus vowel
      if (i < chars.length && isVowelChar(chars[i]!, lang)) {
        nucleus = chars[i]!;
        i++;
      }

      // Peek ahead for coda: consume consonants until next vowel or space
      const codaStart = i;
      while (i < chars.length && !isVowelChar(chars[i]!, lang) && !/\s/.test(chars[i]!)) {
        i++;
      }
      // If there are more vowels ahead, keep last consonant as onset of next syllable
      if (i < chars.length && isVowelChar(chars[i]!, lang) && i - codaStart > 0) {
        coda = ipa.slice(codaStart, i - 1);
        i = i - 1; // give back last consonant as next onset
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

    // Default stress: ultima (last syllable) for Arabic/Hebrew
    if (syllables.length > 0) {
      syllables[syllables.length - 1]!.stressed = true;
    }

    return syllables;
  }

  // ─── Step 4: Rhyme Nucleus extraction ───────────────────────────────────────

  extractRN(syllables: Syllable[], _lang: string): RhymeNucleus {
    // Find the last long vowel syllable; fall back to last syllable
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
