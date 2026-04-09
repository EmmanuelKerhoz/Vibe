import { languageNameToCode } from '../constants/langFamilyMap';
import type { Section } from '../types';
import { compareTextsWithIPA } from './ipaPipeline';
import { detectRhymeSchemeFromIPAPairs, detectRhymeSchemeLocally } from './rhymeSchemeUtils';

/**
 * Local rhyme comparison for a pair of lyric lines.
 * `quality` mirrors the IPA rhyme classifier, `confidenceScore` is the normalized
 * 0–100 score used by the hook, and `isApproximated` flags mocked or downgraded
 * near-matches that should count below an exact pair of the same base similarity.
 */
export type LocalRhymePairAnalysis = {
  lineIndexes: [number, number];
  lines: [string, string];
  quality: string;
  confidenceScore: number;
  usedIpa: boolean;
  isApproximated: boolean;
};

/**
 * Per-section rhyme diagnostics built locally before any AI analysis.
 * `mode: "ipa"` means a supported language was analyzed through compareTextsWithIPA,
 * while `mode: "graphemic"` indicates an unsupported language or graceful fallback.
 */
export type LocalRhymeSectionAnalysis = {
  sectionId: string;
  sectionName: string;
  langCode?: string;
  detectedScheme: string | null;
  mode: 'ipa' | 'graphemic';
  pairs: LocalRhymePairAnalysis[];
};

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
 */
export const analyzeSongRhymes = async (song: Section[]): Promise<LocalRhymeSectionAnalysis[]> => {
  return Promise.all(song.map(async section => {
    const lyricLines = section.lines
      .filter(line => !line.isMeta)
      .map(line => line.text.trim())
      .filter(Boolean);

    const langCode = languageNameToCode(section.language ?? '');
    const graphemicScheme = detectRhymeSchemeLocally(lyricLines, langCode);

    if (!langCode || lyricLines.length < 2) {
      // Conditional spread: omit langCode when undefined (exactOptionalPropertyTypes).
      return {
        sectionId: section.id,
        sectionName: section.name,
        ...(langCode !== undefined && { langCode }),
        detectedScheme: graphemicScheme,
        mode: 'graphemic' as const,
        pairs: [],
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
        pairs,
      };
    } catch {
      return {
        sectionId: section.id,
        sectionName: section.name,
        langCode,
        detectedScheme: graphemicScheme,
        mode: 'graphemic' as const,
        pairs: [],
      };
    }
  }));
};
