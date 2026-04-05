/**
 * ALGO-CRE — Creole / Pidgin strategy.
 *
 * Covers:
 *   nou — Nouchi (Côte d'Ivoire urban creole, French/Dioula/Baoulé base)
 *   pcm — Nigerian Pidgin English (English/Yoruba/Igbo base)
 *   cfg — Camfranglais (Cameroon, French/English/local languages)
 *
 * Key traits:
 *   - No stable tonal system (tones lost or greatly reduced vs. substrate).
 *   - Lexifier-mixed: same song line may contain English, French, and Niger-Congo
 *     morphemes. Rhyme matching operates on the last audible syllable regardless
 *     of lexifier origin.
 *   - Syllable structure: dominantly CV / CVC, open syllables preferred.
 *   - Coda relevance: low. Final obstruents often dropped in fast speech.
 *   - Score threshold reduced to 0.70 to accommodate orthographic variation.
 *
 * Pipeline:
 *   1. normalize   — strip punctuation, lowercase, NFC
 *   2. g2p         — span-level lexifier detection, route to sub-G2P per token
 *   3. syllabify   — CV-greedy with optional CVC coda
 *   4. extractRN   — last syllable nucleus + optional coda
 *   5. score       — featureWeightedScore (nucleus dominant, coda low)
 */

import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable } from '../core/types';

/** Approximate French-origin grapheme → IPA nucleus map (subset). */
const FR_VOWEL_MAP: Record<string, string> = {
  'ou': 'u', 'au': 'o', 'eau': 'o', 'eu': 'ø', 'oeu': 'œ',
  'ai': 'ɛ', 'ei': 'ɛ', 'oi': 'wa', 'ui': 'ɥi',
  'an': 'ɑ̃', 'en': 'ɑ̃', 'in': 'ɛ̃', 'un': 'œ̃', 'on': 'ɔ̃',
  'a': 'a', 'e': 'ə', 'é': 'e', 'è': 'ɛ', 'ê': 'ɛ',
  'i': 'i', 'o': 'o', 'u': 'y',
};

/** Approximate English-origin grapheme → IPA nucleus map (subset). */
const EN_VOWEL_MAP: Record<string, string> = {
  'ee': 'iː', 'ea': 'iː', 'oo': 'uː', 'ou': 'aʊ', 'ow': 'aʊ',
  'ai': 'eɪ', 'ay': 'eɪ', 'oi': 'ɔɪ', 'oy': 'ɔɪ',
  'a': 'æ', 'e': 'ɛ', 'i': 'ɪ', 'o': 'ɒ', 'u': 'ʌ',
};

/** Token-level lexifier heuristic. Returns 'fr' | 'en' | 'local'. */
function detectTokenLexifier(token: string): 'fr' | 'en' | 'local' {
  // French markers: silent final consonants, accented vowels, nasal digraphs
  if (/[éèêàùâîôûç]/.test(token)) return 'fr';
  if (/(tion|ment|eau|eux|eux|oir|ais|ait)$/i.test(token)) return 'fr';
  // English markers: th, -ing, -tion, common English endings
  if (/(th|ing|tion|ness|ment|ful|less)$/i.test(token)) return 'en';
  if (/^(the|a|an|is|are|was|were|you|my|we|they|it|this|that)$/i.test(token)) return 'en';
  // Default: treat as local (CV-dominant Niger-Congo substrate)
  return 'local';
}

/** Resolve last nucleus from a token string using lexifier-aware map. */
function resolveNucleus(token: string, lexifier: 'fr' | 'en' | 'local'): string {
  const map = lexifier === 'fr' ? FR_VOWEL_MAP : lexifier === 'en' ? EN_VOWEL_MAP : {};
  const lower = token.toLowerCase();

  // Try digraphs first (length 3, then 2)
  for (let len = 3; len >= 1; len--) {
    for (let i = lower.length - len; i >= Math.max(0, lower.length - 4); i--) {
      const slice = lower.slice(i, i + len);
      if (map[slice]) return map[slice]!;
    }
  }

  // Fallback: last vowel character
  const vowelMatch = lower.match(/[aeiouyéèêàùâîôûœ]/g);
  if (vowelMatch) return vowelMatch[vowelMatch.length - 1]!;

  return lower.slice(-1);
}

export class CreoleStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-CRE' as const;

  /**
   * Nucleus dominant, coda low (open-syllable preference).
   * Threshold 0.70: accommodates orthographic variation across lexifiers.
   */
  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 0.0,     // tones not contrastive in Nouchi/PCM/Camfranglais
    weight: 0.0,
    codaClass: 0.3,
    threshold: 0.70,
  };

  // ─── Step 1 — Normalisation ───────────────────────────────────────────────

  normalize(text: string, _lang: string): string {
    return text
      .normalize('NFC')
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{M}\s]/gu, '');
  }

  // ─── Step 2 — G2P (span-level lexifier routing) ───────────────────────────

  g2p(normalized: string, _lang: string): string {
    // Split into tokens, detect lexifier per token, return last token's nucleus
    // as a pseudo-IPA representation sufficient for rhyme matching.
    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return '';
    const lastToken = tokens[tokens.length - 1]!;
    const lexifier = detectTokenLexifier(lastToken);
    return resolveNucleus(lastToken, lexifier);
  }

  // ─── Step 3 — Syllabification (CV-greedy, optional coda) ─────────────────

  syllabify(ipa: string, _lang: string): Syllable[] {
    const vowelRe = /[aeiouyɛɔœøɑɪʊəʌæɒiː]/i;
    const chars = [...ipa.replace(/\s+/g, '')];
    const syllables: Syllable[] = [];
    let i = 0;

    while (i < chars.length) {
      let onset = '';
      let nucleus = '';
      let coda = '';

      // Onset consonants
      while (i < chars.length && !vowelRe.test(chars[i]!)) {
        onset += chars[i];
        i++;
      }
      // Nucleus
      if (i < chars.length && vowelRe.test(chars[i]!)) {
        nucleus = chars[i]!;
        i++;
        // Long vowel marker
        if (i < chars.length && chars[i] === 'ː') {
          nucleus += 'ː';
          i++;
        }
      }
      // Optional single coda consonant (low relevance)
      if (
        i < chars.length &&
        !vowelRe.test(chars[i]!) &&
        (i + 1 >= chars.length || !vowelRe.test(chars[i + 1] ?? ''))
      ) {
        coda = chars[i]!;
        i++;
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

    if (syllables.length > 0) {
      syllables[syllables.length - 1]!.stressed = true;
    }

    return syllables;
  }

  // ─── Step 4 — RN extraction ───────────────────────────────────────────────

  extractRN(syllables: Syllable[], _lang: string): RhymeNucleus {
    const last = syllables[syllables.length - 1];
    const nucleus = last?.nucleus ?? '';
    const coda = last?.coda ?? '';
    return {
      nucleus,
      coda,
      toneClass: null,
      weight: null,
      codaClass: coda ? 'obstruent' : null,
      raw: `${nucleus}${coda}`,
      lowResourceFallback: true,
    };
  }

  // ─── Step 5 — Scoring ─────────────────────────────────────────────────────

  score(rn1: RhymeNucleus, rn2: RhymeNucleus, weights?: Partial<MatchingWeights>): number {
    return featureWeightedScore(rn1, rn2, { ...this.defaultWeights, ...weights });
  }
}
