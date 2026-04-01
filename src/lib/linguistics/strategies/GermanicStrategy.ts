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

  syllabify(ipa: string, _lang: string): Syllable[] {
    const words = ipa.split(/\s+/).filter(Boolean);
    const syllables: Syllable[] = [];
    // IPA vowels + orthographic vowels (needed while G2P stub passes through text).
    const vowelPattern = /[aeiouyæɛɪɒɔʊʌəɜɑ]/i;
    for (const word of words) {
      let current = '';
      for (const ch of word) {
        current += ch;
        if (vowelPattern.test(ch)) {
          syllables.push({
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
      if (current && syllables.length > 0) {
        syllables[syllables.length - 1]!.coda = current;
      }
    }
    // EN: stress typically on penultimate or per dictionary; default to penultimate.
    if (syllables.length > 0) {
      const stressIdx = Math.max(0, syllables.length - 2);
      syllables[stressIdx]!.stressed = true;
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

function classifyCoda(coda: string): 'nasal' | 'liquid' | 'obstruent' | null {
  if (!coda) return null;
  if (/[mnŋ]/.test(coda)) return 'nasal';
  if (/[lrɾɹ]/.test(coda)) return 'liquid';
  return 'obstruent';
}
