/**
 * ALGO-SEM — Semitic languages strategy.
 *
 * Covers: ar (Arabic), he (Hebrew), am (Amharic).
 * Key traits: triconsonantal root structure, vocalic scheme extraction,
 *             hamza normalisation, matres lectionis, RTL-safe Unicode.
 *
 * NOTE — Amharic (am) low-resource path:
 *   Amharic uses Ethiopic Fidel script (U+1200–U+137F). The current Arabic/Hebrew
 *   vowel detectors never match Fidel characters, producing an empty syllable array
 *   and a silent analysis failure. Until a dedicated Amharic G2P is implemented,
 *   the strategy emits a structured TODO sentinel syllable with
 *   lowResourceFallback: true so the pipeline degrades gracefully.
 *   TODO(am): replace sentinel with eSpeak-NG 'am' voice or a Fidel → IPA table.
 */

import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable } from '../core/types';
import { classifyCoda, normalizeHamza, stripTashkeel, hasTashkeel, HEBREW_MATRES } from '../utils';

// ─── Arabic constants ────────────────────────────────────────────────────────

/** Arabic short vowel diacritics (tashkeel). */
const AR_SHORT_VOWELS: Record<string, string> = {
  '\u064E': 'a',  // fathah   َ
  '\u064F': 'u',  // dammah   ُ
  '\u0650': 'i',  // kasrah   ِ
};

/**
 * Arabic characters that are unambiguously vocalic in all positions:
 *   ا alif    — long /a:/ or hamza carrier
 * Characters that are AMBIGUOUS (و waw, ي ya’):
 *   Consonantal when word-initial or following a consonant.
 *   Vocalic     when following a vowel or vowel diacritic.
 * Handled by isArabicVowel() below.
 */
const AR_UNAMBIGUOUS_LONG_VOWEL = '\u0627'; // ا alif only

/** Tashkeel code point range U+064B–U+065F. */
const AR_TASHKEEL_RE = /[\u064B-\u065F]/;

/**
 * Context-aware Arabic vowel detector.
 *
 * @param ch     Current character.
 * @param prevCh Immediately preceding character (empty string at word start).
 *
 * Decision table for و (waw, U+0648) and ي (ya’, U+064A):
 *   — prevCh is empty OR prevCh is a consonant (not a vowel, not tashkeel)
 *     → consonant (w / y onset). Return false.
 *   — prevCh is ا alif, or a vowel diacritic, or another vocalic و/ي
 *     → vocalic (long vowel /u:/ or /i:/). Return true.
 *
 * ا alif is always vocalic in the context of the syllabifier
 * (hamza normalisation has already run).
 */
function isArabicVowel(ch: string, prevCh: string): boolean {
  // Short vowel diacritics: always vocalic (they ARE the vowel above a consonant).
  if (AR_TASHKEEL_RE.test(ch)) return true;

  // Alif: always vocalic here (hamza-normalised upstream).
  if (ch === AR_UNAMBIGUOUS_LONG_VOWEL) return true;

  // Waw (و) and ya' (ي): ambiguous — resolve by preceding context.
  if (ch === '\u0648' || ch === '\u064a') {
    // Word-initial or post-consonantal → consonant.
    if (!prevCh || (!AR_TASHKEEL_RE.test(prevCh) && prevCh !== AR_UNAMBIGUOUS_LONG_VOWEL
        && prevCh !== '\u0648' && prevCh !== '\u064a')) {
      return false;
    }
    return true;
  }

  return false;
}

/** Hebrew vowels (basic orthographic matres lectionis + gutturals). */
const HE_VOWEL_RE = /[אהעוי]/;

/** Hebrew nikkud (vowel pointing) — U+05B0–U+05BD. */
const HE_NIKKUD_RE = /[\u05B0-\u05BD]/;

function isHebrewNikkud(ch: string): boolean {
  return HE_NIKKUD_RE.test(ch);
}

/** Latin/IPA vowel pattern (does NOT match Ethiopic — intentional). */
const GENERAL_VOWEL_RE = /[aeiouyəɛɔɪʊäüöàáèéìíòóùú]/i;

/** Ethiopic Fidel block — U+1200–U+137F. */
const AMHARIC_FIDEL_RE = /[\u1200-\u137F]/;

function isVowelChar(ch: string, lang: string, prevCh = ''): boolean {
  if (lang === 'ar') {
    // After g2p, Arabic text may contain Latin vowels (a/u/i) replacing
    // tashkeel diacritics. Detect both Arabic-native and Latin vowels.
    return isArabicVowel(ch, prevCh) || GENERAL_VOWEL_RE.test(ch);
  }
  if (lang === 'he') return HE_VOWEL_RE.test(ch) || HEBREW_MATRES.has(ch) || isHebrewNikkud(ch);
  return GENERAL_VOWEL_RE.test(ch);
}

function isLongVowel(ch: string, lang: string): boolean {
  if (lang === 'he') return HEBREW_MATRES.has(ch);
  if (lang === 'ar') return ch === AR_UNAMBIGUOUS_LONG_VOWEL || ch === '\u0648' || ch === '\u064a';
  return false;
}

function isAmharicScript(text: string): boolean {
  return AMHARIC_FIDEL_RE.test(text);
}

// ─── Strategy ────────────────────────────────────────────────────────────────

export class SemiticStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-SEM' as const;

  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 0.0,
    weight: 0.0,
    codaClass: 0.5,
    threshold: 0.75,
  };

  // ─── Step 1: Normalisation ─────────────────────────────────────────────

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

  // ─── Step 2: G2P ───────────────────────────────────────────────────

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

  // ─── Step 3: Syllabification ────────────────────────────────────────────

  /**
   * Syllabify Arabic/Hebrew text.
   *
   * Key change from previous implementation:
   *   isVowelChar() now receives the preceding character so that
   *   Arabic و and ي can be resolved as consonants in word-initial
   *   and post-consonantal positions.
   *
   * Loop invariant:
   *   At each iteration, `prevCh` holds the last consumed character
   *   (space-normalised), enabling the positional decision in isArabicVowel().
   */
  syllabify(ipa: string, lang: string): Syllable[] {
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
    let prevCh = '';

    while (i < chars.length) {
      const ch = chars[i]!;

      if (/\s/.test(ch)) {
        prevCh = '';
        i++;
        continue;
      }

      let onset = '';
      let nucleus = '';
      let coda = '';

      // Collect onset consonants.
      while (
        i < chars.length
        && !isVowelChar(chars[i]!, lang, prevCh)
        && !/\s/.test(chars[i]!)
      ) {
        onset += chars[i];
        prevCh = chars[i]!;
        i++;
      }

      // Consume nucleus vowel.
      if (i < chars.length && isVowelChar(chars[i]!, lang, prevCh)) {
        nucleus = chars[i]!;
        prevCh = nucleus;
        i++;
      }

      // Collect coda consonants (stop before next vowel, leave last C as onset).
      const codaStart = i;
      while (
        i < chars.length
        && !isVowelChar(chars[i]!, lang, prevCh)
        && !/\s/.test(chars[i]!)
      ) {
        prevCh = chars[i]!;
        i++;
      }

      // If a vowel follows, the last consonant stays as next onset.
      if (i < chars.length && isVowelChar(chars[i]!, lang, prevCh) && i - codaStart > 0) {
        coda = chars.slice(codaStart, i - 1).join('');
        i = i - 1;
        prevCh = chars[i]!;
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

    // Default: ultima stress (correct for standard Arabic; approximate for Hebrew).
    if (syllables.length > 0) {
      syllables[syllables.length - 1]!.stressed = true;
    }

    return syllables;
  }

  // ─── Step 4: Rhyme Nucleus extraction ──────────────────────────────────────

  extractRN(syllables: Syllable[], lang: string): RhymeNucleus {
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

  // ─── Step 5: Scoring ─────────────────────────────────────────────────

  score(rn1: RhymeNucleus, rn2: RhymeNucleus, weights?: Partial<MatchingWeights>): number {
    return featureWeightedScore(rn1, rn2, { ...this.defaultWeights, ...weights });
  }
}
