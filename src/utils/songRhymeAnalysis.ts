import { languageNameToCode } from '../constants/langFamilyMap';
import type { Section } from '../types';
import { compareTextsWithIPA } from './ipaPipeline';
import { detectRhymeSchemeFromIPAPairs, detectRhymeSchemeLocally } from './rhymeSchemeUtils';

/**
 * Local rhyme comparison for a pair of lyric lines.
 * `quality` mirrors the IPA rhyme classifier, `confidenceScore` is the normalized
 * 0–100 score used by the hook, and `isApproximated` flags mocked or downgraded
 * near-matches that should count below an exact pair of the same base similarity.
 * `crossSection` is true when the two lines come from different sections —
 * useful for detecting rime bridges between couplet-end and refrain-start.
 */
export type LocalRhymePairAnalysis = {
  lineIndexes: [number, number];
  lines: [string, string];
  quality: string;
  confidenceScore: number;
  usedIpa: boolean;
  isApproximated: boolean;
  crossSection?: boolean;
};

/**
 * Per-section rhyme diagnostics built locally before any AI analysis.
 * `mode: "ipa"` means a supported language was analyzed through compareTextsWithIPA,
 * while `mode: "graphemic"` indicates an unsupported language or graceful fallback.
 * `isProxied` is true when the G2P family is handled by a proxy stub (proxies.ts)
 * rather than a native implementation — consumers can use this to surface a
 * degradation notice in the UI.
 */
export type LocalRhymeSectionAnalysis = {
  sectionId: string;
  sectionName: string;
  langCode?: string;
  detectedScheme: string | null;
  mode: 'ipa' | 'graphemic';
  isProxied: boolean;
  pairs: LocalRhymePairAnalysis[];
};

/** Families with a native G2P implementation (non-proxy). */
const NATIVE_G2P_FAMILIES = new Set(['ALGO-ROM', 'ALGO-GER', 'ALGO-KWA', 'ALGO-CRV', 'ALGO-SEM']);

const toPairConfidenceScore = (similarity: { score?: number; isApproximated?: boolean }) => {
  const baseScore = typeof similarity.score === 'number' ? similarity.score : 0;
  const adjustedScore = similarity.isApproximated ? baseScore * 0.85 : baseScore;
  return Math.round(adjustedScore * 1000) / 10;
};

/**
 * Builds lightweight, local rhyme diagnostics for each song section.
 * It uses IPA comparison when the section language is supported and falls back
 * to graphemic scheme detection whenever the language is unsupported or the IPA
 * comparison fails, without throwing to the caller.
 *
 * When IPA pairs are successfully computed, the returned `detectedScheme` is
 * derived from those pairs (phonemic ground truth). The graphemic scheme serves
 * as fallback only.
 *
 * @param song - The song sections to analyze
 * @param detectCrossSectionBoundary - When true, also compares the last line of
 *   each section against the first line of the next section to detect rime
 *   bridges (e.g. couplet-end rhyming with refrain-start). Defaults to false.
 */
export const analyzeSongRhymes = async (
  song: Section[],
  detectCrossSectionBoundary = false,
): Promise<LocalRhymeSectionAnalysis[]> => {
  const results = await Promise.all(song.map(async (section, sectionIndex) => {
    const lyricLines = section.lines
      .filter(line => !line.isMeta)
      .map(line => line.text.trim())
      .filter(Boolean);

    const langCode = languageNameToCode(section.language ?? '');

    // Determine whether the assigned G2P family is a native impl or a proxy stub.
    const { getAlgoFamily } = await import('../constants/langFamilyMap');
    const family = langCode ? getAlgoFamily(langCode) : undefined;
    const isProxied = family ? !NATIVE_G2P_FAMILIES.has(family) : false;

    const graphemicScheme = detectRhymeSchemeLocally(lyricLines, langCode);

    if (!langCode || lyricLines.length < 2) {
      return {
        sectionId: section.id,
        sectionName: section.name,
        ...(langCode !== undefined && { langCode }),
        detectedScheme: graphemicScheme,
        mode: 'graphemic' as const,
        isProxied,
        pairs: [] as LocalRhymePairAnalysis[],
        _sectionIndex: sectionIndex,
        _lyricLines: lyricLines,
      };
    }

    try {
      const pairs: LocalRhymePairAnalysis[] = [];

      for (let firstIndex = 0; firstIndex < lyricLines.length; firstIndex++) {
        for (let secondIndex = firstIndex + 1; secondIndex < lyricLines.length; secondIndex++) {
          const firstLine = lyricLines[firstIndex];
          const secondLine = lyricLines[secondIndex];
          if (!firstLine || !secondLine) continue;

          const similarity = await compareTextsWithIPA(
            firstLine,
            secondLine,
            langCode,
          );

          pairs.push({
            lineIndexes: [firstIndex, secondIndex],
            lines: [firstLine, secondLine],
            quality: similarity.quality,
            confidenceScore: toPairConfidenceScore(similarity as { score?: number; isApproximated?: boolean }),
            usedIpa: true,
            isApproximated: Boolean((similarity as { isApproximated?: boolean }).isApproximated),
          });
        }
      }

      // Schéma IPA prioritaire — reconstruit depuis les paires déjà calculées,
      // sans second appel pipeline. Fallback graphémique si IPA ne converge pas.
      const ipaScheme = detectRhymeSchemeFromIPAPairs(lyricLines.length, pairs);

      return {
        sectionId: section.id,
        sectionName: section.name,
        langCode,
        detectedScheme: ipaScheme ?? graphemicScheme,
        mode: 'ipa' as const,
        isProxied,
        pairs,
        _sectionIndex: sectionIndex,
        _lyricLines: lyricLines,
      };
    } catch {
      return {
        sectionId: section.id,
        sectionName: section.name,
        langCode,
        detectedScheme: graphemicScheme,
        mode: 'graphemic' as const,
        isProxied,
        pairs: [] as LocalRhymePairAnalysis[],
        _sectionIndex: sectionIndex,
        _lyricLines: lyricLines,
      };
    }
  }));

  // Cross-section boundary detection: compare last line of section N with
  // first line of section N+1. Results are appended to the earlier section's
  // pairs array so consumers can inspect them without restructuring types.
  if (detectCrossSectionBoundary && results.length >= 2) {
    for (let i = 0; i < results.length - 1; i++) {
      const current = results[i]!;
      const next = results[i + 1]!;
      const lastLine = current._lyricLines[current._lyricLines.length - 1];
      const firstLine = next._lyricLines[0];

      if (!lastLine || !firstLine) continue;

      const langCode = current.langCode;

      try {
        if (langCode) {
          const similarity = await compareTextsWithIPA(lastLine, firstLine, langCode);
          current.pairs.push({
            lineIndexes: [current._lyricLines.length - 1, -1], // -1 signals cross-section
            lines: [lastLine, firstLine],
            quality: similarity.quality,
            confidenceScore: toPairConfidenceScore(similarity as { score?: number; isApproximated?: boolean }),
            usedIpa: true,
            isApproximated: Boolean((similarity as { isApproximated?: boolean }).isApproximated),
            crossSection: true,
          });
        } else {
          const { doLinesRhymeGraphemic } = await import('./rhymeDetection');
          if (doLinesRhymeGraphemic(lastLine, firstLine)) {
            current.pairs.push({
              lineIndexes: [current._lyricLines.length - 1, -1],
              lines: [lastLine, firstLine],
              quality: 'graphemic',
              confidenceScore: 70,
              usedIpa: false,
              isApproximated: true,
              crossSection: true,
            });
          }
        }
      } catch {
        // Cross-section comparison is best-effort — never throw to caller.
      }
    }
  }

  // Strip internal helper fields before returning.
  return results.map(({ _sectionIndex: _si, _lyricLines: _ll, ...rest }) => rest);
};
