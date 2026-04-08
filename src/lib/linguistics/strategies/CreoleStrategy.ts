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

/**
 * EN inflectional/derivational suffixes that are purely functional
 * (no lexical vowel of their own that should anchor the rime).
 * Stripped from the stem before the digraph scan so that the scan
 * lands on the lexical syllable nucleus, not the suffix consonants.
 *
 * Order matters: longer suffixes must be listed before shorter ones
 * to avoid partial stripping (e.g. 'ness' before 'ess').
 * Guard: stripped stem must be ≥ 2 chars to avoid over-stripping
 * monosyllabic roots.
 */
const EN_FUNCTIONAL_SUFFIXES = ['ness', 'ful', 'less', 'ing', 'th'] as const;

function stripEnSuffix(token: string): string {
  for (const suffix of EN_FUNCTIONAL_SUFFIXES) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 2) {
      return token.slice(0, -suffix.length);
    }
  }
  return token;
}

/** Token-level lexifier heuristic. Returns 'fr' | 'en' | 'local'. */
function detectTokenLexifier(token: string): 'fr' | 'en' | 'local' {
  if (/[éèêàùâîôûç]/.test(token)) return 'fr';
  if (/(tion|ment|eau|eux|oir|ais|ait)$/i.test(token)) return 'fr';
  if (/(th|ing|ness|ful|less)$/i.test(token)) return 'en';
  if (/^(the|a|an|is|are|was|were|you|my|we|they|it|this|that)$/i.test(token)) return 'en';
  return 'local';
}

/**
 * Resolve the IPA nucleus of a token via a full left-to-right digraph scan.
 *
 * For EN tokens: functional suffixes are stripped first so the scan anchors
 * on the lexical syllable ('feeling' → 'feel' → 'ee'→'iː').
 *
 * Last-match-wins: the scan always overwrites with the latest hit, so the
 * rime anchors on the rightmost (final-syllable) nucleus. This is correct
 * for both FR (terminal 'é' overrides internal digraphs) and EN (once
 * the consonantal functional suffix is stripped).
 *
 * Fallback: last vowel character, 'y' excluded (semivowel).
 */
function resolveNucleus(token: string, lexifier: 'fr' | 'en' | 'local'): string {
  const map = lexifier === 'fr' ? FR_VOWEL_MAP : lexifier === 'en' ? EN_VOWEL_MAP : {};
  // Strip EN functional suffixes so the scan hits the lexical nucleus.
  const stem = lexifier === 'en' ? stripEnSuffix(token) : token;
  const lower = stem.toLowerCase();
  let lastMatch = '';

  let i = 0;
  while (i < lower.length) {
    let matched = false;
    for (let len = 3; len >= 1; len--) {
      const slice = lower.slice(i, i + len);
      if (map[slice] !== undefined) {
        lastMatch = map[slice]!;  // last-match-wins: anchors on final syllable
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) i++;
  }

  if (lastMatch) return lastMatch;

  // Fallback: last vowel character, 'y' excluded (semivowel).
  const vowelMatch = lower.match(/[aeiouéèêàùâîôûœɛɔø]/g);
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
    tone: 0.0,
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

      while (i < chars.length && !vowelRe.test(chars[i]!)) {
        onset += chars[i];
        i++;
      }
      if (i < chars.length && vowelRe.test(chars[i]!)) {
        nucleus = chars[i]!;
        i++;
        if (i < chars.length && chars[i] === 'ː') {
          nucleus += 'ː';
          i++;
        }
      }
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
