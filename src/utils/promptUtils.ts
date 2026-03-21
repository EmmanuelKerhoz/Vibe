/**
 * Prompt building utilities for AI generation
 * Enriches prompts with phonemic constraints from IPA pipeline
 */

import type { Section, Line } from '../types';
import { runIPAPipeline } from './ipaPipeline';

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
      // Update or create constraint for this rhyme group
      if (!rhymeConstraints.has(analysis.rhyme)) {
        rhymeConstraints.set(analysis.rhyme, {
          rhymeNucleus: analysis.rhymeNucleus,
          syllableCount: analysis.syllableCount,
          exampleLine: analysis.text,
        });
      } else {
        // Update with latest line in this rhyme group
        rhymeConstraints.set(analysis.rhyme, {
          rhymeNucleus: analysis.rhymeNucleus,
          syllableCount: analysis.syllableCount,
          exampleLine: analysis.text,
        });
      }
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
