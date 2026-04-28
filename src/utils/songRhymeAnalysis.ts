import { languageNameToCode } from '../constants/langFamilyMap';
import type { Section } from '../types';
import { compareTextsWithIPA } from './ipaPipeline';
import { detectRhymeSchemeFromIPAPairs, detectRhymeSchemeLocally } from './rhymeSchemeUtils';
import { segmentVerseToRhymingUnit } from './rhymeDetection';

/**
 * Local rhyme comparison for a pair of lyric lines.
 * `quality` mirrors the IPA rhyme classifier, `confidenceScore` is the normalized
 * 0–100 score used by the hook, and `isApproximated` flags mocked or downgraded
 * near-matches that should count below an exact pair of the same base similarity.
 * `crossSection` is true when the two lines come from different sections.
 * `rhymePosition` reflects the structural role detected by segmentVerseToRhymingUnit
 * ('end' | 'internal' | 'enjambed') so the UI can highlight accordingly.
 * `crossFamily` is true when the two lines were analyzed through different
 * language pipelines (code-switching pair).
 */
export type LocalRhymePairAnalysis = {
  lineIndexes: [number, number];
  lines: [string, string];
  quality: string;
  confidenceScore: number;
  usedIpa: boolean;
  isApproximated: boolean;
  crossSection?: boolean;
  rhymePosition?: 'end' | 'internal' | 'enjambed';
  crossFamily?: boolean;
};

/**
 * Per-section rhyme diagnostics built locally before any AI analysis.
 * `mode: "ipa"` means a supported language was analyzed through compareTextsWithIPA,
 * while `mode: "graphemic"` indicates an unsupported language or graceful fallback.
 * `isProxied` is true when the G2P family is handled by a proxy stub.
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
 * Detect the language of a single line when it may differ from the section
 * language (code-switching). Returns the section langCode as default when
 * no override is detected.
 *
 * Strategy (lightweight, no external call):
 * - If the line contains a per-line language annotation in the form
 *   «[lang:xx]» at the start, use that code (stripped before analysis).
 * - Otherwise return the section langCode unchanged.
 *
 * This intentionally avoids a full LID call per-line to keep the pipeline
 * synchronous-friendly. A future upgrade can inject a real LID result here.
 *
 * @param lineText    Raw line text (may contain inline lang tag)
 * @param sectionLang Section-level ISO 639 code
 * @returns           { text: cleaned text, langCode: resolved code }
 */
const detectLineLang = (
  lineText: string,
  sectionLang: string,
): { text: string; langCode: string } => {
  const INLINE_TAG = /^\[lang:([a-z]{2,3})\]\s*/i;
  const match = INLINE_TAG.exec(lineText);
  if (match) {
    return {
      text: lineText.slice(match[0].length),
      langCode: match[1]!.toLowerCase(),
    };
  }
  return { text: lineText, langCode: sectionLang };
};

/**
 * Builds lightweight, local rhyme diagnostics for each song section.
 *
 * Changes vs. previous version:
 * - Each line is passed through segmentVerseToRhymingUnit() (step-0) before
 *   IPA comparison so the pipeline receives the correct rhyming unit rather
 *   than the raw full line.
 * - rhymePosition from segmentation is forwarded to LocalRhymePairAnalysis.
 * - Per-line language override via detectLineLang() enables cross-family
 *   code-switching pairs. When line A and line B resolve to different langCodes,
 *   compareTextsWithIPA is called with { langCode2 } so each line goes through
 *   its own G2P family. The effective threshold is min(th_A, th_B).
 *
 * @param song - The song sections to analyze
 * @param detectCrossSectionBoundary - When true, also compares the last line of
 *   each section against the first line of the next (rime bridges).
 */
export const analyzeSongRhymes = async (
  song: Section[],
  detectCrossSectionBoundary = false,
): Promise<LocalRhymeSectionAnalysis[]> => {
  const results = await Promise.all(song.map(async (section, sectionIndex) => {
    const rawLyricLines = section.lines
      .filter(line => !line.isMeta)
      .map(line => line.text.trim())
      .filter(Boolean);

    const sectionLangCode = languageNameToCode(section.language ?? '');

    const { getAlgoFamily } = await import('../constants/langFamilyMap');
    const family = sectionLangCode ? getAlgoFamily(sectionLangCode) : undefined;
    const isProxied = family ? !NATIVE_G2P_FAMILIES.has(family) : false;

    // Step-0 segmentation: resolve rhyming unit + position for each line.
    // Also apply per-line language detection for code-switching.
    const segmented = rawLyricLines.map(rawLine => {
      const resolved = sectionLangCode
        ? detectLineLang(rawLine, sectionLangCode)
        : { text: rawLine, langCode: sectionLangCode ?? '' };
      const segment = segmentVerseToRhymingUnit(resolved.text, resolved.langCode || undefined);
      return {
        rawText: resolved.text,
        langCode: resolved.langCode,
        rhymingUnit: segment.rhymingUnit,
        position: segment.position,
      };
    });

    // Use raw texts for graphemic fallback (scheme detection operates on full lines)
    const lyricLines = segmented.map(s => s.rawText);

    const graphemicScheme = detectRhymeSchemeLocally(lyricLines, sectionLangCode);

    if (!sectionLangCode || lyricLines.length < 2) {
      return {
        sectionId: section.id,
        sectionName: section.name,
        langCode: sectionLangCode,
        detectedScheme: graphemicScheme,
        mode: 'graphemic' as const,
        isProxied,
        pairs: [] as LocalRhymePairAnalysis[],
        _sectionIndex: sectionIndex,
        _lyricLines: lyricLines,
        _segmented: segmented,
      };
    }

    try {
      const pairs: LocalRhymePairAnalysis[] = [];

      for (let firstIndex = 0; firstIndex < segmented.length; firstIndex++) {
        for (let secondIndex = firstIndex + 1; secondIndex < segmented.length; secondIndex++) {
          const first = segmented[firstIndex]!;
          const second = segmented[secondIndex]!;

          // Determine if this is a cross-family (code-switching) pair
          const isCrossFamily = first.langCode !== second.langCode;

          // Use rhymingUnit for IPA input; fall back to rawText if empty
          const inputA = first.rhymingUnit || first.rawText;
          const inputB = second.rhymingUnit || second.rawText;

          const similarity = await compareTextsWithIPA(
            inputA,
            inputB,
            first.langCode,
            isCrossFamily ? { langCode2: second.langCode } : undefined,
          );

          // Position is that of the first line (dominant structural signal)
          const rhymePosition = first.position;

          pairs.push({
            lineIndexes: [firstIndex, secondIndex],
            lines: [first.rawText, second.rawText],
            quality: similarity.quality,
            confidenceScore: toPairConfidenceScore(similarity as { score?: number; isApproximated?: boolean }),
            usedIpa: true,
            isApproximated: Boolean((similarity as { isApproximated?: boolean }).isApproximated),
            rhymePosition,
            ...(isCrossFamily && { crossFamily: true }),
          });
        }
      }

      const ipaScheme = detectRhymeSchemeFromIPAPairs(lyricLines.length, pairs);

      return {
        sectionId: section.id,
        sectionName: section.name,
        langCode: sectionLangCode,
        detectedScheme: ipaScheme ?? graphemicScheme,
        mode: 'ipa' as const,
        isProxied,
        pairs,
        _sectionIndex: sectionIndex,
        _lyricLines: lyricLines,
        _segmented: segmented,
      };
    } catch {
      return {
        sectionId: section.id,
        sectionName: section.name,
        langCode: sectionLangCode,
        detectedScheme: graphemicScheme,
        mode: 'graphemic' as const,
        isProxied,
        pairs: [] as LocalRhymePairAnalysis[],
        _sectionIndex: sectionIndex,
        _lyricLines: lyricLines,
        _segmented: segmented,
      };
    }
  }));

  // Cross-section boundary detection
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
          const lastSeg = current._segmented[current._segmented.length - 1];
          const firstSeg = next._segmented?.[0];
          const isCrossFamily = lastSeg && firstSeg && lastSeg.langCode !== firstSeg.langCode;

          const inputA = lastSeg?.rhymingUnit || lastLine;
          const inputB = firstSeg?.rhymingUnit || firstLine;
          const langA = lastSeg?.langCode || langCode;
          const langB = firstSeg?.langCode || next.langCode || langCode;

          const similarity = await compareTextsWithIPA(
            inputA,
            inputB,
            langA,
            isCrossFamily ? { langCode2: langB } : undefined,
          );
          current.pairs.push({
            lineIndexes: [current._lyricLines.length - 1, -1],
            lines: [lastLine, firstLine],
            quality: similarity.quality,
            confidenceScore: toPairConfidenceScore(similarity as { score?: number; isApproximated?: boolean }),
            usedIpa: true,
            isApproximated: Boolean((similarity as { isApproximated?: boolean }).isApproximated),
            crossSection: true,
            rhymePosition: lastSeg?.position ?? 'end',
            ...(isCrossFamily && { crossFamily: true }),
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
              rhymePosition: 'end',
            });
          }
        }
      } catch {
        // Cross-section comparison is best-effort — never throw to caller.
      }
    }
  }

  return results.map(({ _sectionIndex: _si, _lyricLines: _ll, _segmented: _sg, ...rest }) => rest);
};
