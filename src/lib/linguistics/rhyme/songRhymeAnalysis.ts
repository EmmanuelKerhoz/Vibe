/**
 * songRhymeAnalysis.ts
 *
 * Song-level rhyme analysis orchestrator.
 *
 * `analyzeSongRhymes` iterates over all sections of a song, runs the
 * phonological rhyme-scheme detector on each, and optionally compares
 * the last line of a section against the first line of the next one
 * (cross-section boundary detection).
 *
 * Architecture:
 *  - This is a pure function — no React, no state, no side effects.
 *  - Consumers (hooks) are responsible for memoisation.
 *  - `isProxied` is set to true when the language falls outside the five
 *    natively implemented G2P families and the analysis relied on the
 *    graphemic proxy layer (`proxies.ts`).
 */

import type { Section } from '../../../types';
import { detectRhymeScheme } from './rhymeSchemeDetector';
import { PhonologicalRegistry } from '../core/Registry';
import { extractLineEndingUnit } from './lyricSegmenter';
import type { DetectedSchema } from '../core/types';

// ─── Native G2P families ──────────────────────────────────────────────────────

/**
 * Language codes for which a dedicated phonological strategy exists
 * (BNT, ROM, GER, KWA, CRV). All other codes are handled by the
 * graphemic proxy layer and should be flagged with `isProxied: true`.
 */
export const NATIVE_G2P_FAMILIES = new Set([
  // Romance
  'fr', 'es', 'it', 'pt', 'ca', 'ro',
  // Germanic
  'en', 'de', 'nl', 'sv', 'da', 'no', 'af',
  // Bantu
  'sw', 'zu', 'xh', 'rw', 'ny',
  // KWA / Niger-Congo
  'yo', 'ba', 'di', 'ew', 'mi', 'tw', 'ibo', 'ln',
  // CRV
  'bk', 'cb', 'og', 'ha',
]);

// ─── Output types ─────────────────────────────────────────────────────────────

export interface RhymeLinePair {
  /** 0-based index of the first line in its section */
  lineIndexA: number;
  /** 0-based index of the second line in its section */
  lineIndexB: number;
  sectionIdA: string;
  sectionIdB: string;
  score: number;
  /** True when the pair spans a section boundary */
  crossSection: boolean;
}

export interface LocalRhymeSectionAnalysis {
  sectionId: string;
  detectedSchema: DetectedSchema;
  /**
   * True when the analysis was produced by the graphemic proxy layer rather
   * than a dedicated phonological strategy. UI should surface a degradation
   * indicator (e.g. "~" prefix on the scheme badge).
   */
  isProxied: boolean;
  /** Cross-section pairs involving the last line of this section (requires detectCrossSectionBoundary). */
  crossSectionPairs: RhymeLinePair[];
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getLyricLines(section: Section): string[] {
  return section.lines
    .filter(l => !l.isMeta && l.text.trim().length > 0)
    .map(l => l.text);
}

function isProxiedLang(lang: string): boolean {
  return !NATIVE_G2P_FAMILIES.has(lang.toLowerCase().trim());
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Analyse all sections of a song for rhyme schemes.
 *
 * @param song                     Ordered array of sections.
 * @param lang                     Song language code (e.g. 'en', 'fr').
 * @param detectCrossSectionBoundary  When true, compare last line of each
 *                                    section with first line of the next.
 *                                    Cross-section pairs carry `crossSection: true`.
 */
export function analyzeSongRhymes(
  song: Section[],
  lang: string,
  detectCrossSectionBoundary = false,
): LocalRhymeSectionAnalysis[] {
  const proxied = isProxiedLang(lang);

  const results: LocalRhymeSectionAnalysis[] = song.map(section => {
    const lines = getLyricLines(section);
    const text = lines.join('\n');

    const detectedSchema: DetectedSchema =
      lines.length >= 2
        ? detectRhymeScheme(text, lang)
        : { pattern: '', confidence: 0, lineCount: lines.length };

    return {
      sectionId: section.id,
      detectedSchema,
      isProxied: proxied,
      crossSectionPairs: [],
    };
  });

  if (!detectCrossSectionBoundary || song.length < 2) return results;

  // Cross-section boundary pass
  for (let i = 0; i < song.length - 1; i++) {
    const secA = song[i]!;
    const secB = song[i + 1]!;
    const linesA = getLyricLines(secA);
    const linesB = getLyricLines(secB);
    if (linesA.length === 0 || linesB.length === 0) continue;

    const lastLineA = linesA[linesA.length - 1]!;
    const firstLineB = linesB[0]!;

    try {
      const tailA = extractLineEndingUnit(lastLineA, lang).normalized;
      const tailB = extractLineEndingUnit(firstLineB, lang).normalized;
      const cmp = PhonologicalRegistry.compare(tailA, tailB, lang);
      const score = cmp?.score ?? 0;

      if (score > 0) {
        const pair: RhymeLinePair = {
          lineIndexA: linesA.length - 1,
          lineIndexB: 0,
          sectionIdA: secA.id,
          sectionIdB: secB.id,
          score,
          crossSection: true,
        };
        results[i]!.crossSectionPairs.push(pair);
      }
    } catch {
      // Non-fatal: cross-section comparison is best-effort
    }
  }

  return results;
}
