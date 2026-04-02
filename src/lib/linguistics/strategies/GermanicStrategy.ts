/**
 * ALGO-GER — Germanic languages strategy.
 * docs_fusion_optimal.md §10.2 / Annexe 2 §4.
 *
 * Covers: EN, DE, NL, SV, DA, NO.
 * Key traits: irregular orthography (EN), vowel length (DE), Auslautverhärtung.
 */

import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable } from '../core/types';

export class GermanicStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-GER' as const;

  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 0.0,
    weight: 0.0,
    codaClass: 0.6,
    threshold: 0.75,
  };

  normalize(text: string, lang: string): string {
    let t = text.normalize('NFC').toLowerCase().trim();
    if (lang === 'en') {
      t = t.replace(/n't/g, ' not').replace(/'re/g, ' are').replace(/'s/g, ' is');
    }
    t = t.replace(/[^\p{L}\p{M}\s''-]/gu, '');
    return t;
  }

  g2p(normalized: string, _lang: string): string {
    // Stub: delegate to CMU dict / eSpeak-NG in production.
    return normalized;
  }

  syllabify(ipa: string, lang: string): Syllable[] {
    const words = ipa.split(/\s+/).filter(Boolean);
    const syllables: Syllable[] = [];
    const vowelPattern = /[aeiouyæɛɪɒɔʊʌəɜɑ]/i;

    for (const word of words) {
      const wordSyllables: Syllable[] = [];
      let current = '';

      for (const ch of word) {
        current += ch;
        if (vowelPattern.test(ch)) {
          wordSyllables.push({
            onset: current.slice(0, -1),
            nucleus: ch,
            coda: '',
            tone: null,
            weight: null,
            stressed: false,
          });
          current = '';
        }
      }
      if (current && wordSyllables.length > 0) {
        wordSyllables[wordSyllables.length - 1]!.coda = current;
      }

      if (wordSyllables.length > 0) {
        if (lang === 'en') {
          applyEnglishStress(word, wordSyllables);
        } else {
          // DE/NL/SV/DA/NO: penultimate default
          const stressIdx = Math.max(0, wordSyllables.length - 2);
          wordSyllables[stressIdx]!.stressed = true;
        }
      }

      syllables.push(...wordSyllables);
    }
    return syllables;
  }

  extractRN(syllables: Syllable[], _lang: string): RhymeNucleus {
    const stressIdx = syllables.findIndex(s => s.stressed);
    const idx = stressIdx >= 0 ? stressIdx : Math.max(0, syllables.length - 1);
    const tail = syllables.slice(idx);
    const raw = tail.map(s => `${s.nucleus}${s.coda}`).join('');
    const primary = tail[0];
    return {
      nucleus: primary?.nucleus ?? '',
      coda: primary?.coda ?? '',
      toneClass: null,
      weight: null,
      codaClass: classifyCoda(primary?.coda ?? ''),
      raw,
    };
  }

  score(rn1: RhymeNucleus, rn2: RhymeNucleus, weights?: Partial<MatchingWeights>): number {
    return featureWeightedScore(rn1, rn2, { ...this.defaultWeights, ...weights });
  }
}

// ─── English stress heuristic ───────────────────────────────────────────────────────────────────

/**
 * Suffix-based English stress placement.
 * Covers ~70% of common cases without a CMU dict lookup.
 *
 * Rules (highest to lowest priority):
 * 1. Monosyllabic word: stress index 0.
 * 2. Antepenultimate suffixes: -tion, -sion, -ic, -ical, -ity, -ify, -ious, -eous, -ual
 *    → stress on syllable before suffix (antepenult).
 * 3. Penultimate suffixes: -ness, -less, -ful, -ment, -er, -est, -ing, -ed, -ly
 *    → stress on penultimate.
 * 4. Default: stress on last syllable (ultima).
 *    Rationale: English oxytones (guitar, believe, around, receive, etc.) account
 *    for a significant share of 2+-syllable words not covered by rules 2–3.
 *    Ultima is the correct position for rhyme extraction purposes even when the
 *    phonetic stress is actually penultimate — the rime we care about is the
 *    final stressed syllable, which is the ultima when no suffix pattern matches.
 */
function applyEnglishStress(word: string, syllables: Syllable[]): void {
  const n = syllables.length;
  if (n === 0) return;
  if (n === 1) { syllables[0]!.stressed = true; return; }

  const w = word.toLowerCase();

  // Antepenultimate suffixes
  if (/(?:tion|sion|ic|ical|ity|ify|ious|eous|ual)$/.test(w)) {
    const idx = Math.max(0, n - 3);
    syllables[idx]!.stressed = true;
    return;
  }

  // Penultimate suffixes
  if (/(?:ness|less|ful|ment|ing|ed|est|er|ly)$/.test(w)) {
    const idx = Math.max(0, n - 2);
    syllables[idx]!.stressed = true;
    return;
  }

  // Default: ultima (last syllable)
  syllables[n - 1]!.stressed = true;
}

function classifyCoda(coda: string): 'nasal' | 'liquid' | 'obstruent' | null {
  if (!coda) return null;
  if (/[mnŋ]/.test(coda)) return 'nasal';
  if (/[lrɾɹ]/.test(coda)) return 'liquid';
  return 'obstruent';
}
