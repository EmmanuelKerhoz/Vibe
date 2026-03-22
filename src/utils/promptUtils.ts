/**
 * Prompt building utilities for AI generation
 * Enriches prompts with phonemic constraints from IPA pipeline
 */

import type { Section, Line } from '../types';
import { runIPAPipeline } from './ipaPipeline';
import { getSectionText } from './songUtils';

const APPLY_PROMPT_RULES = (uiLanguage: string): string => `IMPORTANT:
1. Maintain the existing section structure (Intro, Verse, Chorus, etc.).
2. Only update the lyrics as suggested.
3. Return the FULL updated song in the same JSON format as the input.
4. Do not change the section names unless specifically requested.
5. Preserve the original song language in all lyric text fields.
6. Write the "concept" field for each line in ${uiLanguage}.

Current Song Data:`;

type BuildAdaptSongPromptParams = {
  sourceSong: Section[];
  newLanguage: string;
  uiLanguage: string;
  ipaEnhancedPrompt?: string;
};

type BuildAdaptSectionPromptParams = {
  section: Section;
  newLanguage: string;
  uiLanguage: string;
  ipaEnhancedPrompt?: string;
};

type BuildThemeAnalysisPromptParams = {
  song: Section[];
  topic: string;
  mood: string;
  uiLanguage: string;
};

type BuildApplyAnalysisBatchPromptParams = {
  song: Section[];
  itemsToApply: string[];
  uiLanguage: string;
};

type BuildApplyAnalysisItemPromptParams = {
  song: Section[];
  itemText: string;
  uiLanguage: string;
};

type BuildSongAnalysisPromptParams = {
  songText: string;
  uiLanguage: string;
};

/**
 * Builds a rhyme-constrained prompt by analyzing existing lines with the IPA pipeline
 *
 * @param existingLines - Array of existing lines in the section
 * @param langCode - ISO 639 language code (e.g., 'fr', 'en', 'ee')
 * @param targetRhymeScheme - Target rhyme scheme (e.g., 'AABB', 'ABAB', 'FREE')
 * @returns Enriched prompt string with phonemic constraints
 */
export const buildRhymeConstrainedPrompt = async (
  existingLines: Line[],
  langCode: string,
  targetRhymeScheme: string
): Promise<string> => {
  // If no existing lines or no language code, return basic prompt
  if (!existingLines || existingLines.length === 0 || !langCode) {
    return `Generate lyrics following the rhyme scheme: ${targetRhymeScheme}`;
  }

  // Filter out empty lines and meta lines
  const nonEmptyLines = existingLines.filter(
    line => line.text && line.text.trim() !== '' && !line.isMeta
  );

  if (nonEmptyLines.length === 0) {
    return `Generate lyrics following the rhyme scheme: ${targetRhymeScheme}`;
  }

  // Analyze each line through IPA pipeline
  const lineAnalyses = await Promise.all(
    nonEmptyLines.map(async (line) => {
      const result = await runIPAPipeline(line.text, langCode);
      return {
        text: line.text,
        rhyme: line.rhyme,
        rhymeNucleus: result.rhymeNucleus,
        syllableCount: result.syllables.length,
        ipa: result.ipa,
        success: result.success,
      };
    })
  );

  // Build constraint mapping by rhyme identifier
  const rhymeConstraints = new Map<string, {
    rhymeNucleus: string;
    syllableCount: number;
    exampleLine: string;
  }>();

  // Group lines by rhyme identifier and extract last line's phonemics
  for (const analysis of lineAnalyses) {
    if (analysis.success && analysis.rhyme && analysis.rhyme !== '' && analysis.rhyme !== 'FREE') {
      rhymeConstraints.set(analysis.rhyme, {
        rhymeNucleus: analysis.rhymeNucleus,
        syllableCount: analysis.syllableCount,
        exampleLine: analysis.text,
      });
    }
  }

  // Build the enriched prompt
  let prompt = `Generate lyrics following the rhyme scheme: ${targetRhymeScheme}\n\n`;

  // Add existing context
  if (nonEmptyLines.length > 0) {
    prompt += 'Existing lines to continue from:\n';
    nonEmptyLines.forEach((line, idx) => {
      prompt += `${idx + 1}. "${line.text}" (rhyme: ${line.rhyme || 'none'})\n`;
    });
    prompt += '\n';
  }

  // Add phonemic constraints if available
  if (rhymeConstraints.size > 0) {
    prompt += 'PHONEMIC RHYME CONSTRAINTS:\n';
    prompt += 'The following rhyme groups have established phonemic patterns that MUST be matched:\n\n';

    rhymeConstraints.forEach((constraint, rhymeId) => {
      prompt += `Rhyme group "${rhymeId}":\n`;
      prompt += `  - Example: "${constraint.exampleLine}"\n`;
      prompt += `  - Rhyme nucleus (IPA): /${constraint.rhymeNucleus}/\n`;
      prompt += `  - Syllable count: ${constraint.syllableCount}\n`;
      prompt += `  - New lines with rhyme "${rhymeId}" MUST phonetically match this pattern\n\n`;
    });

    prompt += 'IMPORTANT: Lines sharing the same rhyme letter MUST have matching rhyme nuclei in IPA.\n';
    prompt += 'Match the phonetic sound, not just the spelling!\n\n';
  }

  // Add target syllable guidance if available
  const avgSyllables = lineAnalyses.length > 0
    ? Math.round(lineAnalyses.reduce((sum, a) => sum + a.syllableCount, 0) / lineAnalyses.length)
    : 0;

  if (avgSyllables > 0) {
    prompt += `Target syllable count per line: approximately ${avgSyllables} syllables\n`;
  }

  return prompt;
};

export const buildDetectLanguagePrompt = (songText: string): string =>
  `Detect the language of these lyrics. Return ONLY the name of the language in English (e.g., "English", "French", "Spanish").\n\nLyrics:\n${songText.substring(0, 1000)}`;

export const buildThemeAnalysisPrompt = ({
  song,
  topic,
  mood,
  uiLanguage,
}: BuildThemeAnalysisPromptParams): string =>
  `Analyze the following song lyrics.\nCurrent Topic: "${topic}"\nCurrent Mood: "${mood}"\n\nIf the lyrics have significantly deviated from the current topic or mood, provide an updated topic and mood. If they still fit, return the current ones.\nIMPORTANT: Return the topic and mood values in ${uiLanguage}.\nReturn JSON with "topic" and "mood" strings.\n\nLyrics:\n${song.map(section => section.name + '\n' + getSectionText(section)).join('\n\n')}\n`;

export const buildAdaptSongPrompt = ({
  sourceSong,
  newLanguage,
  uiLanguage,
  ipaEnhancedPrompt = '',
}: BuildAdaptSongPromptParams): string =>
  `You are an expert lyricist specializing in creative song adaptation across languages.\n\nYour task: Adapt the following song lyrics to ${newLanguage} with CREATIVE ADAPTATION, not literal translation.\n\nCRITICAL GUIDELINES:\n\n1. EMOTIONAL IMPACT FIRST\n   - Preserve the emotional journey and core message\n   - Prioritize how the lyrics make people FEEL over word-for-word accuracy\n   - Maintain the song's vibe, tone, and artistic intent\n\n2. NATURAL LANGUAGE\n   - Write as if the song was originally composed in ${newLanguage}\n   - Use idioms, expressions, and cultural references native to ${newLanguage}\n   - Avoid "translation-speak" - make it sound authentic and poetic\n   - Respect ${newLanguage} grammar, syntax, and natural word order\n\n3. POETIC STRUCTURE\n   - Maintain rhyme scheme quality (e.g., if AABB, keep clean rhymes in ${newLanguage})\n   - Match syllable counts when possible, but prioritize natural phrasing\n   - Preserve rhythm and singability\n   - Adapt imagery and metaphors to resonate in the target culture\n\n4. CULTURAL ADAPTATION\n   - Replace culture-specific references with equivalent concepts in ${newLanguage} culture\n   - Adapt humor, wordplay, and double meanings creatively\n   - Ensure themes and stories make sense to ${newLanguage} speakers\n\n5. TECHNICAL REQUIREMENTS\n   - Maintain the existing section structure (same section names)\n   - Return the FULL updated song in the same JSON format as input\n   - Update rhymingSyllables to reflect actual ${newLanguage} rhymes\n   - Adjust syllable counts to match the adapted lyrics\n   - Write the "concept" field for each line in ${uiLanguage}\n\nCurrent Song Data:\n${JSON.stringify(sourceSong)}${ipaEnhancedPrompt}\n\nReturn the fully adapted song that feels native to ${newLanguage} speakers while preserving the soul of the original.`;

export const buildAdaptSectionPrompt = ({
  section,
  newLanguage,
  uiLanguage,
  ipaEnhancedPrompt = '',
}: BuildAdaptSectionPromptParams): string =>
  `You are an expert lyricist specializing in creative song adaptation across languages.\n\nAdapt the following song section to ${newLanguage} with CREATIVE ADAPTATION, not literal translation.\nKeep section name unchanged. Update rhymingSyllables. Adjust syllable counts.\nWrite the "concept" field for each line in ${uiLanguage}.\n\nCurrent Section Data:\n${JSON.stringify(section)}${ipaEnhancedPrompt}`;

export const buildApplyAnalysisBatchPrompt = ({
  song,
  itemsToApply,
  uiLanguage,
}: BuildApplyAnalysisBatchPromptParams): string =>
  `Modify the following song lyrics based on these improvement suggestions:\n${itemsToApply.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n\n${APPLY_PROMPT_RULES(uiLanguage)}\n${JSON.stringify(song)}`;

export const buildApplyAnalysisItemPrompt = ({
  song,
  itemText,
  uiLanguage,
}: BuildApplyAnalysisItemPromptParams): string =>
  `Modify the following song lyrics based on this specific improvement suggestion: "${itemText}".\n\n${APPLY_PROMPT_RULES(uiLanguage)}\n${JSON.stringify(song)}`;

export const buildSongAnalysisPrompt = ({
  songText,
  uiLanguage,
}: BuildSongAnalysisPromptParams): string =>
  `Thoroughly analyze the following song lyrics.\n      Provide a detailed report including:\n      1. Overall Theme & Narrative: What is the song truly about?\n      2. Emotional Arc: How do the emotions shift throughout the song?\n      3. Technical Analysis: Rhyme schemes, syllable consistency, and rhythmic flow.\n      4. Strengths: What works well in the current version?\n      5. Actionable Improvements: Specific suggestions to improve the lyrics, structure, or impact.\n      6. Musical Suggestions: Ideas for instrumentation or vocal delivery based on the lyrics.\n\n      IMPORTANT: Write the ENTIRE analysis report in ${uiLanguage}.\n\n      Song Lyrics:\n      ${songText}`;

/**
 * Builds a rhyme-constrained prompt from a Section object
 * Convenience wrapper that extracts langCode from section.language
 *
 * @param section - Section object with lines and language property
 * @returns Enriched prompt string with phonemic constraints
 */
export const buildRhymeConstrainedPromptFromSection = async (
  section: Section
): Promise<string> => {
  const langCode = section.language || 'en'; // Default to English if not specified
  const targetRhymeScheme = section.rhymeScheme || 'FREE';

  return buildRhymeConstrainedPrompt(section.lines, langCode, targetRhymeScheme);
};
