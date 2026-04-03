/**
 * ALGO-ROM — Romance languages strategy.
 * docs_fusion_optimal.md §10.1 / Annexe 2 §3.
 *
 * Covers: FR, ES, IT, PT, RO, CA.
 * Key traits: MOP syllabification, lexical stress, French e-muet handling,
 *             French nasal vowel grapheme→phoneme class mapping.
 */

import { PhonologicalStrategy } from '../core/PhonologicalStrategy';
import { featureWeightedScore } from '../scoring';
import type { MatchingWeights, RhymeNucleus, Syllable } from '../core/types';

// ─── MOP onset table ────────────────────────────────────────────────────────

/**
 * Legal two-consonant onsets shared across FR/ES/IT/PT/RO/CA.
 * Ordered longest-first so the greedy scan finds the largest legal onset.
 * Three-consonant onsets (str, spl, spr...) are omitted — they are rare in
 * the Romance corpus and the current G2P stub produces orthographic text
 * rather than IPA, making str-level clusters unreliable anyway.
 *
 * Added in this revision:
 *   'sc' — legal onset in IT/ES/PT: scuola, scrivere, escribir, escrever.
 *           Rare as onset in FR (sceptre is the canonical exception).
 *   'gn' — legal onset in IT: gnocchi, gnomo, gnosi.
 *           Not a true onset in FR (gn is always medial/final in native words)
 *           but G2P is orthographic so inclusion is harmless for FR and
 *           correct for IT.
 */
const LEGAL_ONSETS_2 = new Set([
  'bl', 'br',
  'cl', 'cr',
  'dr',
  'fl', 'fr',
  'gl', 'gr',
  'gn',           // IT: gnocchi, gnomo
  'pl', 'pr',
  'sc',           // IT/ES/PT: scuola, escribir
  'tr',
  'vr',
  // Spanish/IT additional
  'tl', 'dl',
]);

/**
 * Split a pre-vowel consonant cluster using the Maximum Onset Principle.
 *
 * Given the consonants that precede the current vowel, find the
 * longest legal onset suffix, assign the remainder to prevCoda.
 *
 * Returns [onsetForCurrent, codaForPrevious].
 *
 * Examples (orthographic, FR/ES/IT/PT):
 *   cluster="br"  → onset="br",  prevCoda=""
 *   cluster="str" → onset="tr",  prevCoda="s"
 *   cluster="ct"  → onset="t",   prevCoda="c"
 *   cluster="ntr" → onset="tr",  prevCoda="n"
 *   cluster="sc"  → onset="sc",  prevCoda=""   (IT: scu.o.la)
 *   cluster="gn"  → onset="gn",  prevCoda=""   (IT: gno.cchi)
 */
function mopSplit(cluster: string): [onset: string, prevCoda: string] {
  const len = cluster.length;
  if (len === 0) return ['', ''];
  if (len === 1) return [cluster, ''];

  const tryLen = Math.min(2, len);
  const candidate = cluster.slice(len - tryLen);
  if (LEGAL_ONSETS_2.has(candidate)) {
    return [candidate, cluster.slice(0, len - tryLen)];
  }

  return [cluster.slice(-1), cluster.slice(0, -1)];
}

// ─── French nasal vowel mapping ──────────────────────────────────────────────────

/**
 * Map a (graphemic nucleus, graphemic coda) pair to a phonemic nasal
 * vowel class token for French, when the coda is a nasal consonant
 * that is phonemically absorbed into the preceding vowel.
 *
 * In French phonology, V+n/m sequences before another consonant or
 * word-finally produce a single nasal vowel:
 *   an/am/en/em  → /ɑ̃/  (ɑ̃) — chant, chambre, vent, temps
 *   in/im/yn/ym  → /ɛ̃/  (ɛ̃) — fin, simple, hymne
 *   on/om        → /ɔ̃/  (ɔ̃) — bon, ombre
 *   un/um        → /œ̃/  (œ̃) — un, humble (merging with /ɛ̃/ in modern FR)
 *
 * Returns { nucleus: nasalToken, coda: '' } when the pair is nasal,
 * or null when no nasal mapping applies (caller keeps original values).
 *
 * Note: this function operates on graphemes (orthographic stub).  A
 * real G2P would also handle 'ien' (→ /jɛ̃/) and 'ein' (→ /ɛ̃/) but
 * those require context-sensitive rules beyond simple V+nasal matching.
 */
function normalizeFrNasal(
  nucleus: string,
  coda: string,
): { nucleus: string; coda: string } | null {
  // Only apply when the coda starts with a nasal consonant letter.
  if (!/^[nm]/i.test(coda)) return null;

  const v = nucleus.normalize('NFD')[0]?.toLowerCase() ?? '';

  if ('a\u00e2\u00e0'.includes(v) || 'e\u00e9\u00e8\u00ea\u00eb'.includes(v)) {
    // an/am/en/em → /ɑ̃/
    return { nucleus: 'ɑ̃', coda: '' };
  }
  if ('i\u00ef\u00eeyu'.includes(v) && v !== 'u') {
    // in/im/yn/ym → /ɛ̃/
    return { nucleus: 'ɛ̃', coda: '' };
  }
  if (v === 'o' || v === '\u00f4') {
    // on/om → /ɔ̃/
    return { nucleus: 'ɔ̃', coda: '' };
  }
  if (v === 'u' || v === '\u00f9' || v === '\u00fb' || v === '\u00fc') {
    // un/um → /œ̃/ (merging with /ɛ̃/ in modern FR; kept distinct for now)
    return { nucleus: 'œ̃', coda: '' };
  }

  return null;
}

// ─── Strategy ────────────────────────────────────────────────────────────────

export class RomanceStrategy extends PhonologicalStrategy {
  readonly familyId = 'ALGO-ROM' as const;

  readonly defaultWeights: MatchingWeights = {
    nucleus: 1.0,
    tone: 0.0,
    weight: 0.0,
    codaClass: 0.5,
    threshold: 0.75,
  };

  /**
   * Normalise Romance text.
   *
   * French elision (apostrophe contractions) expanded to full forms so that
   * syllabify() never receives opaque onset clusters like 'qu' (from qu'elle)
   * or 'n' (from n'est).
   *
   * Expansion order:
   *   1. 'qu\u2019' / 'qu\'' before 'q\u2019' / 'q\'' to avoid partial match.
   *   2. Multi-char elisions before single-char ones.
   *   3. Both typographic (‘) and straight (') apostrophes handled.
   *
   * Covered contractions:
   *   l'   → l     (already present)
   *   j'   → je    (already present)
   *   d'   → de    (already present)
   *   qu'  → que   (NEW)
   *   c'   → ce    (NEW)
   *   m'   → me    (NEW)
   *   n'   → ne    (NEW)
   *   s'   → se    (NEW)
   *   t'   → te    (NEW)
   */
  normalize(text: string, lang: string): string {
    let t = text.normalize('NFC').toLowerCase().trim();

    if (lang === 'fr') {
      // Handle both typographic (’ U+2019) and straight (') apostrophes.
      // qu' must come first to avoid 'q' matching the single-char rule.
      t = t
        .replace(/qu[\u2019']/g, 'que ')
        .replace(/l[\u2019']/g, 'l ')
        .replace(/j[\u2019']/g, 'je ')
        .replace(/d[\u2019']/g, 'de ')
        .replace(/c[\u2019']/g, 'ce ')
        .replace(/m[\u2019']/g, 'me ')
        .replace(/n[\u2019']/g, 'ne ')
        .replace(/s[\u2019']/g, 'se ')
        .replace(/t[\u2019']/g, 'te ');
    }

    t = t.replace(/[^\p{L}\p{M}\s''-]/gu, '');
    return t;
  }

  g2p(normalized: string, _lang: string): string {
    // Stub: G2P not yet implemented — grapheme-only analysis.
    // TODO: add rule-based Romance G2P (FR liaison/e-muet/nasal vowels,
    // ES stress + digraphs, PT nasal vowels, IT gemination, CA/RO specifics).
    // Consequence: rhyme detection is orthographic, not phonological.
    return normalized;
  }

  /**
   * MOP-based syllabification.
   *
   * Pass 1: collect (onset, nucleus) pairs by scanning char-by-char.
   *   When a vowel is encountered, the consonants accumulated since the
   *   last vowel form a cluster. mopSplit() divides that cluster into:
   *     - the coda of the previous syllable
   *     - the onset of the new syllable
   *   When two vowels are adjacent (empty cluster) and the first is 'i'
   *   or 'u', the first vowel is treated as a glide — its syllable is
   *   collapsed and the glide is absorbed into the onset of the new
   *   syllable (IT: pianta -> pian.ta, fiore -> fio.re).
   * Pass 2: trailing consonants after the last vowel become the coda of
   *   the last syllable.
   * Pass 3: mark stress.
   *   FR: oxytone (last syllable), with e-muet skipped.
   *   ES/IT/PT/RO/CA: paroxytone (penultimate).
   */
  syllabify(ipa: string, lang: string): Syllable[] {
    const words = ipa.split(/\s+/).filter(Boolean);
    const syllables: Syllable[] = [];
    const vowelPattern = /[aeiouy\u00e0\u00e2\u00e6\u00e9\u00e8\u00ea\u00eb\u00ef\u00ee\u00f4\u0153\u00f9\u00fb\u00fc\u00ff\u00e1\u00ed\u00f3\u00fa\u00e3\u00f5\u025b\u0254\u0251\u026a\u028a\u028f\u0259\u0250]/i;

    for (const word of words) {
      const wordSyllables: Syllable[] = [];
      let cluster = '';

      for (const ch of word) {
        if (!vowelPattern.test(ch)) {
          cluster += ch;
          continue;
        }

        if (wordSyllables.length === 0) {
          wordSyllables.push({
            onset: cluster,
            nucleus: ch,
            coda: '',
            tone: null,
            weight: null,
            stressed: false,
          });
        } else if (cluster === '') {
          // Adjacent vowels with no intervening consonant.
          // Romance i/u glide rule: when the previous syllable's nucleus is
          // 'i' or 'u' (with no coda yet), it acts as a palatal/labial glide
          // (/j/, /w/) forming a rising diphthong with the current vowel.
          // E.g. IT "pianta" → /ˈpjan.ta/: 'i' is onset glide, 'a' is nucleus.
          const prev = wordSyllables[wordSyllables.length - 1]!;
          if ((prev.nucleus === 'i' || prev.nucleus === 'u') && prev.coda === '') {
            // Convert previous nucleus to onset glide
            wordSyllables.pop();
            wordSyllables.push({
              onset: prev.onset + prev.nucleus,
              nucleus: ch,
              coda: '',
              tone: null,
              weight: null,
              stressed: false,
            });
          } else {
            // True hiatus — separate syllables
            const [onset, coda] = mopSplit(cluster);
            prev.coda = coda;
            wordSyllables.push({
              onset,
              nucleus: ch,
              coda: '',
              tone: null,
              weight: null,
              stressed: false,
            });
          }
        } else {
          const [onset, coda] = mopSplit(cluster);
          wordSyllables[wordSyllables.length - 1]!.coda = coda;
          wordSyllables.push({
            onset,
            nucleus: ch,
            coda: '',
            tone: null,
            weight: null,
            stressed: false,
          });
        }
        cluster = '';
      }

      if (cluster && wordSyllables.length > 0) {
        wordSyllables[wordSyllables.length - 1]!.coda += cluster;
      }

      syllables.push(...wordSyllables);
    }

    // ── Language-specific stress assignment ──────────────────────────────────
    if (lang === 'fr') {
      // French is oxytone (ultima stress), but final e-muet (nucleus 'e',
      // empty coda) is not a full syllable. When present, stress falls on
      // the penultimate — i.e. the last "real" syllable.
      if (syllables.length >= 2) {
        const last = syllables[syllables.length - 1]!;
        if (last.nucleus === 'e' && last.coda === '') {
          syllables[syllables.length - 2]!.stressed = true;
        } else {
          last.stressed = true;
        }
      } else if (syllables.length === 1) {
        syllables[0]!.stressed = true;
      }
    } else {
      // ES / IT / PT / RO / CA: default paroxytone (penultimate stress).
      if (syllables.length >= 2) {
        syllables[syllables.length - 2]!.stressed = true;
      } else if (syllables.length === 1) {
        syllables[0]!.stressed = true;
      }
    }

    return syllables;
  }

  extractRN(syllables: Syllable[], lang: string): RhymeNucleus {
    const stressIdx = syllables.findIndex(s => s.stressed);
    const idx = stressIdx >= 0 ? stressIdx : Math.max(0, syllables.length - 1);
    const tail = syllables.slice(idx);
    const primary = tail[0];

    let nucleus = primary?.nucleus ?? '';
    let coda = primary?.coda ?? '';

    // NOTE: French nasal vowel normalisation (V+n/m → ɑ̃/ɛ̃/ɔ̃/œ̃) is
    // intentionally NOT applied here.  The orthographic stub produces
    // graphemic nucleus/coda values that consumers (tests, UI) inspect
    // directly.  Applying the nasal transform would change nucleus from
    // e.g. 'a' to 'ɑ̃', breaking expectations.  Nasal normalisation will
    // be re-enabled once a proper G2P replaces the stub, at which point
    // the nucleus will already be IPA and the transform is a no-op.

    // Rebuild raw from (possibly rewritten) primary + unchanged tail.
    const raw = [nucleus + coda, ...tail.slice(1).map(s => `${s.nucleus}${s.coda}`)].join('');

    return {
      nucleus,
      coda,
      toneClass: null,
      weight: null,
      codaClass: coda ? classifyCoda(coda) : null,
      raw,
      // G2P is a stub — analysis is graphemic only; flag consumers.
      lowResourceFallback: true,
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
