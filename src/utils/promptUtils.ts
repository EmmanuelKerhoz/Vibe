/**
 * Prompt building utilities for AI generation
 * Enriches prompts with phonemic constraints from IPA pipeline
 */

import type { Section, Line } from '../types';
import { runIPAPipeline } from './ipaPipeline';
import { getSectionText } from './songUtils';
import {
  DEFAULT_LONG_FIELD_MAX_LENGTH,
  UNTRUSTED_INPUT_PREAMBLE,
  fence,
  fenceLong,
} from './promptSanitization';
import { sanitizeLangName } from './sanitizeLangInput';

const APPLY_PROMPT_RULES = (uiLanguage: string): string => {
  const safeLang = sanitizeLangName(uiLanguage);
  return `IMPORTANT:
1. Maintain the existing section structure (Intro, Verse, Chorus, etc.).
2. Only update the lyrics as suggested.
3. Return the FULL updated song in the same JSON format as the input.
4. Do not change the section names unless specifically requested.
5. Preserve the original song language in all lyric text fields.
6. Write the "concept" field for each line in ${safeLang}.

Current Song Data:`;
};

type BuildAdaptSongPromptParams = {
  sourceSong: Section[];
  newLanguage: string;
  uiLanguage: string;
  ipaEnhancedPrompt?: string;
  /**
   * Authoritative per-line syllable counts computed by the IPA pipeline,
   * keyed by `line.id`. When provided, these override any stale value
   * stored on `Line.syllables` so the prompt stays in sync with the
   * IPA-enhanced block.
   */
  ipaSyllableCounts?: ReadonlyMap<string, number>;
};

type BuildAdaptSectionPromptParams = {
  section: Section;
  newLanguage: string;
  uiLanguage: string;
  ipaEnhancedPrompt?: string;
  /** See {@link BuildAdaptSongPromptParams.ipaSyllableCounts}. */
  ipaSyllableCounts?: ReadonlyMap<string, number>;
};

type BuildAdaptLinePromptParams = {
  line: Line;
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
 * Extracts per-line syllable constraints from source sections for adaptation prompts.
 * Returns an empty string if no lines have syllable data.
 *
 * Defensively iterates: any section whose `lines` is missing/non-array is
 * skipped instead of throwing. When `ipaSyllableCounts` is provided, the
 * authoritative IPA-pipeline count for a line ID takes precedence over the
 * (potentially stale) `Line.syllables` value.
 */
const buildSyllableConstraintsBlock = (
  sections: Section[],
  ipaSyllableCounts?: ReadonlyMap<string, number>,
): string => {
  const entries: { text: string; syllables: number }[] = [];
  const sectionList = Array.isArray(sections) ? sections : [];
  for (const section of sectionList) {
    const lines = Array.isArray(section?.lines) ? section.lines : [];
    for (const line of lines) {
      if (line.isMeta || !line.text || !line.text.trim()) continue;
      const fresh = ipaSyllableCounts?.get(line.id);
      const stored = typeof line.syllables === 'number' && line.syllables > 0
        ? line.syllables
        : 0;
      const count = typeof fresh === 'number' && fresh > 0 ? fresh : stored;
      if (count > 0) {
        entries.push({ text: line.text, syllables: count });
      }
    }
  }
  if (entries.length === 0) return '';

  const lines = entries
    .map((e, i) => `  Line ${i + 1}: "${e.text}" → MUST have ${e.syllables} syllables (±1 tolerance)`)
    .join('\n');

  return `\n\nSYLLABLE CONSTRAINTS (hard — singability depends on this):
Each adapted line MUST match the syllable count of its source line (±1 tolerance).
Violating this breaks the rhythmic fit with the music. Do NOT exceed ±1 syllable per line.
${lines}`;
};

/**
 * Extracts per-line syllable constraints from a single section.
 */
const buildSyllableConstraintsBlockFromSection = (
  section: Section,
  ipaSyllableCounts?: ReadonlyMap<string, number>,
): string => {
  return buildSyllableConstraintsBlock([section], ipaSyllableCounts);
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

/**
 * Maximum characters of lyrics sent to the language-detection model.
 * Capped to keep the prompt small and avoid blowing past model token limits
 * for very long pasted songs. The cap is enforced via {@link fenceLong} so an
 * explicit `… [truncated]` marker is appended — the model can therefore tell
 * it is seeing a sample, not the full song.
 */
export const DETECT_LANGUAGE_LYRICS_MAX_CHARS = 2000;

export const buildDetectLanguagePrompt = (songText: string): string =>
  `${UNTRUSTED_INPUT_PREAMBLE}

Analyze the languages used in these lyrics.
Return a JSON object with:
- "languages": an array of ALL distinct language names found, sorted by usage frequency (most used first). Use English names (e.g., "English", "French", "Spanish").
- "lineLanguages": an array of language names, one per non-empty lyric line, in the same order as the lyrics below.

Return ONLY valid JSON, no markdown fences.

${fenceLong('LYRICS', songText, { maxLength: DETECT_LANGUAGE_LYRICS_MAX_CHARS })}`;

export const buildThemeAnalysisPrompt = ({
  song,
  topic,
  mood,
  uiLanguage,
}: BuildThemeAnalysisPromptParams): string => {
  const safeLang = sanitizeLangName(uiLanguage);
  const lyrics = song
    .map(section => `${section.name}\n${getSectionText(section)}`)
    .join('\n\n');
  return `${UNTRUSTED_INPUT_PREAMBLE}

Analyze the following song lyrics.
Current Topic (untrusted user data): see the TOPIC fence below.
Current Mood (untrusted user data): see the MOOD fence below.

If the lyrics have significantly deviated from the current topic or mood, provide an updated topic and mood. If they still fit, return the current ones.
IMPORTANT: Return the topic and mood values in ${safeLang}.
Return JSON with "topic" and "mood" strings.

${fence('TOPIC', topic)}
${fence('MOOD', mood)}
${fenceLong('LYRICS', lyrics)}
`;
};

export const buildAdaptSongPrompt = ({
  sourceSong,
  newLanguage,
  uiLanguage,
  ipaEnhancedPrompt = '',
  ipaSyllableCounts,
}: BuildAdaptSongPromptParams): string => {
  const safeLang = sanitizeLangName(newLanguage);
  const safeUiLang = sanitizeLangName(uiLanguage);
  const songRhymeScheme = sourceSong
    .map(section => `${section.name}: ${section.rhymeScheme || 'FREE'}`)
    .join(', ');

  const syllableConstraints = buildSyllableConstraintsBlock(sourceSong, ipaSyllableCounts);

  return `${UNTRUSTED_INPUT_PREAMBLE}

You are an expert lyricist specializing in creative song adaptation across languages.

Your task: Adapt the following song lyrics to ${safeLang} with CREATIVE ADAPTATION, not literal translation.

CRITICAL GUIDELINES:

1. AUTHENTIC WRITING SYSTEM
   - Return the adapted lyrics using the authentic writing system and orthography of ${safeLang}
   - Do NOT use phonetic transcription, romanization, or IPA notation
   - Use the real native script, diacritics, and character set of ${safeLang} (e.g. Arabic script for Arabic, Cyrillic for Russian, proper accented characters for Haitian Creole or Yoruba, etc.)
   - Phonetic or romanized output is only acceptable if ${safeLang} has no native script of its own

2. EMOTIONAL IMPACT FIRST
   - Preserve the emotional journey and core message
   - Prioritize how the lyrics make people FEEL over word-for-word accuracy
   - Maintain the song's vibe, tone, and artistic intent

3. NATURAL LANGUAGE
   - Write as if the song was originally composed in ${safeLang}
   - Use idioms, expressions, and cultural references native to ${safeLang}
   - Avoid "translation-speak" - make it sound authentic and poetic
   - Respect ${safeLang} grammar, syntax, and natural word order

4. POETIC STRUCTURE
   - Maintain rhyme scheme quality (e.g., if AABB, keep clean rhymes in ${safeLang})
   - Maintain section rhyme schemes: ${songRhymeScheme}
   - STRICTLY respect the per-line syllable counts listed below — singability depends on it
   - Preserve rhythm and singability
   - Adapt imagery and metaphors to resonate in the target culture

5. CULTURAL ADAPTATION
   - Replace culture-specific references with equivalent concepts in ${safeLang} culture
   - Adapt humor, wordplay, and double meanings creatively
   - Ensure themes and stories make sense to ${safeLang} speakers

6. TECHNICAL REQUIREMENTS
   - Maintain the existing section structure (same section names)
   - Return the FULL updated song in the same JSON format as input
   - Update rhymingSyllables to reflect actual ${safeLang} rhymes
   - Set the syllables field to the actual syllable count of each adapted line
   - Write the "concept" field for each line in ${safeUiLang}
${syllableConstraints}

${fenceLong('CURRENT_SONG_DATA', JSON.stringify(sourceSong))}${ipaEnhancedPrompt}

Return the fully adapted song that feels native to ${safeLang} speakers while preserving the soul of the original.`;
};

export const buildAdaptSectionPrompt = ({
  section,
  newLanguage,
  uiLanguage,
  ipaEnhancedPrompt = '',
  ipaSyllableCounts,
}: BuildAdaptSectionPromptParams): string => {
  const safeLang = sanitizeLangName(newLanguage);
  const safeUiLang = sanitizeLangName(uiLanguage);
  const sourceLanguage = section.language || 'unknown';
  const sectionRhymeScheme = section.rhymeScheme || 'FREE';
  const syllableConstraints = buildSyllableConstraintsBlockFromSection(section, ipaSyllableCounts);

  return `${UNTRUSTED_INPUT_PREAMBLE}

You are an expert lyricist specializing in creative song adaptation across languages.

Source language detected: ${sourceLanguage}.
Adapt the following song section to ${safeLang} with CREATIVE ADAPTATION, not literal translation.
Keep section name unchanged. Update rhymingSyllables. Set syllables to the actual count of each adapted line.
Write the "concept" field for each line in ${safeUiLang}.
Maintain rhyme scheme: ${sectionRhymeScheme}.
STRICTLY respect the per-line syllable counts listed below — singability depends on it.

IMPORTANT: Return the adapted lyrics using the authentic writing system and orthography of ${safeLang}. Do NOT use phonetic transcription, romanization, or IPA notation. Use the real native script, diacritics, and character set of ${safeLang}. Phonetic or romanized output is only acceptable if ${safeLang} has no native script of its own.
${syllableConstraints}

${fenceLong('CURRENT_SECTION_DATA', JSON.stringify(section))}${ipaEnhancedPrompt}`;
};

export const buildAdaptLinePrompt = ({
  line,
  newLanguage,
  uiLanguage,
  ipaEnhancedPrompt = '',
}: BuildAdaptLinePromptParams): string => {
  const safeLang = sanitizeLangName(newLanguage);
  const safeUiLang = sanitizeLangName(uiLanguage);
  const sourceLanguage = 'language' in line && typeof line.language === 'string' && line.language.trim() !== ''
    ? line.language
    : 'unknown';

  const syllableHint = typeof line.syllables === 'number' && line.syllables > 0
    ? `\nSYLLABLE CONSTRAINT: The adapted line MUST have ${line.syllables} syllables (±1 tolerance). Singability depends on this.`
    : '';

  return `${UNTRUSTED_INPUT_PREAMBLE}

You are an expert lyricist specializing in creative song adaptation across languages.

Source language detected: ${sourceLanguage}.
Adapt the following single lyric line to ${safeLang} with CREATIVE ADAPTATION, not literal translation.
Preserve the emotional impact and singability. Update rhymingSyllables, rhyme, and syllables to reflect the adapted text.
Write the "concept" field in ${safeUiLang}.${syllableHint}

${fence('LINE_DATA', JSON.stringify(line), { maxLength: DEFAULT_LONG_FIELD_MAX_LENGTH })}${ipaEnhancedPrompt}`;
};

export const buildApplyAnalysisBatchPrompt = ({
  song,
  itemsToApply,
  uiLanguage,
}: BuildApplyAnalysisBatchPromptParams): string =>
  `${UNTRUSTED_INPUT_PREAMBLE}

Modify the following song lyrics based on these improvement suggestions:
${itemsToApply.map((item, i) => `${i + 1}. ${fence(`SUGGESTION_${i + 1}`, item)}`).join('\n')}

${APPLY_PROMPT_RULES(uiLanguage)}
${fenceLong('CURRENT_SONG_DATA', JSON.stringify(song))}`;

export const buildApplyAnalysisItemPrompt = ({
  song,
  itemText,
  uiLanguage,
}: BuildApplyAnalysisItemPromptParams): string =>
  `${UNTRUSTED_INPUT_PREAMBLE}

Modify the following song lyrics based on this specific improvement suggestion:
${fence('SUGGESTION', itemText)}

${APPLY_PROMPT_RULES(uiLanguage)}
${fenceLong('CURRENT_SONG_DATA', JSON.stringify(song))}`;

export const buildSongAnalysisPrompt = ({
  songText,
  uiLanguage,
}: BuildSongAnalysisPromptParams): string => {
  const safeLang = sanitizeLangName(uiLanguage);
  return `${UNTRUSTED_INPUT_PREAMBLE}

Thoroughly analyze the following song lyrics.
      Provide a detailed report including:
      1. Overall Theme & Narrative: What is the song truly about?
      2. Emotional Arc: How do the emotions shift throughout the song?
      3. Technical Analysis: Rhyme schemes, syllable consistency, and rhythmic flow.
      4. Strengths: What works well in the current version?
      5. Actionable Improvements: Specific suggestions to improve the lyrics, structure, or impact.
      6. Musical Suggestions: Ideas for instrumentation or vocal delivery based on the lyrics.

      IMPORTANT: Write the ENTIRE analysis report in ${safeLang}.

      ${fenceLong('SONG_LYRICS', songText)}`;
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
