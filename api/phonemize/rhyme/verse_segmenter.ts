/**
 * verse_segmenter.ts — Lyricist v4.1 Remediation #1
 * Segmentation du vers en unités rimantes avant extraction du RN.
 */

export type SegmentMode = 'end' | 'internal' | 'all';

export interface RhymingUnit {
  tokens: string[];
  position: 'end' | 'internal' | 'start';
  verseIndex: number;
  tokenSpan: [number, number];
}

export function segmentVerse(verse: string, lang = 'fr', mode: SegmentMode = 'end'): RhymingUnit[] {
  const tokens = tokenize(verse, lang);
  const units: RhymingUnit[] = [];

  if (mode === 'end' || mode === 'internal' || mode === 'all') {
    units.push({
      tokens: tokens.slice(-1),
      position: 'end',
      verseIndex: 0,
      tokenSpan: [tokens.length - 1, tokens.length],
    });
  }

  if (mode === 'internal' || mode === 'all') {
    const spans = detectInternalRhymePositions(tokens, lang);
    for (const span of spans) {
      units.push({
        tokens: tokens.slice(span[0], span[1]),
        position: 'internal',
        verseIndex: 0,
        tokenSpan: span,
      });
    }
  }

  if (mode === 'all') {
    units.push({
      tokens: tokens.slice(0, 1),
      position: 'start',
      verseIndex: 0,
      tokenSpan: [0, 1],
    });
  }

  return units;
}

function tokenize(verse: string, lang: string): string[] {
  let normalized = verse.trim().toLowerCase().replace(/[''`]/g, "'");
  if (lang === 'fr') normalized = normalized.replace(/\b(c|j|l|m|n|qu|s|t)'/g, "$1'");
  return (normalized.match(/[\w'-]+/g) ?? []).filter(Boolean);
}

function detectInternalRhymePositions(tokens: string[], _lang: string): Array<[number, number]> {
  const positions: Array<[number, number]> = [];
  const n = tokens.length;
  // Heuristique : césure médiane si vers long (> 5 mots)
  if (n >= 6) {
    const mid = Math.floor(n / 2);
    positions.push([mid - 1, mid]);
  }
  // TODO: règles prosodiques par langue (alexandrin FR 6/6, EN 4/4…)
  return positions;
}
