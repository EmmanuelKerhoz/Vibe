/**
 * ALGO-ROM — Romance languages strategy.
 * docs_fusion_optimal.md §10.1 / Annexe 2 §3.
 *
 * Covers: FR, ES, IT, PT, RO, CA.
 * Key traits: MOP syllabification, lexical stress, French e-muet handling.
 */

import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable } from '../core/types';

export class RomanceStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-ROM' as const;

  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 0.0,    // non-tonal family
    weight: 0.0,
    codaClass: 0.5,
    threshold: 0.75,
  };

  normalize(text: string, lang: string): string {
    let t = text.normalize('NFC').toLowerCase().trim();
    // FR: basic contraction expansion
    if (lang === 'fr') {
      t = t.replace(/l'/g, 'l ').replace(/j'/g, 'je ').replace(/d'/g, 'de ');
    }
    // Strip non-phonemic punctuation, keep apostrophes
    t = t.replace(/[^\p{L}\p{M}\s''-]/gu, '');
    return t;
  }

  g2p(normalized: string, _lang: string): string {
    // Stub: in production, delegate to eSpeak-NG / Epitran.
    // Returns the normalised form as-is until a real G2P backend is wired.
    return normalized;
  }

  syllabify(ipa: string, _lang: string): Syllable[] {
    // Simplified MOP-based syllabification:
    // split on whitespace (word boundaries) then on vowel clusters.
    const words = ipa.split(/\s+/).filter(Boolean);
    const syllables: Syllable[] = [];
    const vowelPattern = /[aeiouyàâæéèêëïîôœùûüÿáíóúãõɛɔɑɪʊʏ]/i;
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
      // trailing consonants → coda of last syllable
      if (current && syllables.length > 0) {
        syllables[syllables.length - 1]!.coda = current;
      }
    }
    // Mark last non-schwa syllable as stressed (FR default)
    for (let i = syllables.length - 1; i >= 0; i--) {
      if (syllables[i]!.nucleus !== 'ə') {
        syllables[i]!.stressed = true;
        break;
      }
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
  if (/[mnŋɲ]/.test(coda)) return 'nasal';
  if (/[lrɾɹ]/.test(coda)) return 'liquid';
  return 'obstruent';
}
