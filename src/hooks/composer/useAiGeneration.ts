import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Type } from '@google/genai';
import type { Section } from '../../types';
import { AI_MODEL_NAME, getAi, safeJsonParse, handleApiError } from '../../utils/aiUtils';
import { cleanSectionName } from '../../utils/songUtils';
import { isPureMetaLine } from '../../utils/metaUtils';
import { generateId } from '../../utils/idUtils';
import { mapSongWithPreservedIds, mergeAiSectionIntoCurrent } from '../../utils/songMergeUtils';
import { makeSongUpdater } from '../hookUtils';
import { withAbort, isAbortError } from '../../utils/withAbort';
import { withRetry } from '../../utils/withRetry';
import { getDefaultLineCount } from '../../utils/songDefaults';
import { buildRhymeConstrainedPrompt } from '../../utils/promptUtils';
import { z } from 'zod';

const LineResponseSchema = z.object({
  text: z.string().default(''),
  rhymingSyllables: z.string().default(''),
  rhyme: z.string().default(''),
  syllables: z.number().default(0),
  concept: z.string().default(''),
});

const SectionResponseSchema = z.object({
  name: z.string().default('Verse'),
  rhymeScheme: z.string().default('FREE'),
  lines: z.array(LineResponseSchema).default([]),
});

const SongResponseSchema = z.array(SectionResponseSchema);

/** Parse a raw AI JSON response into a partial Section array (without ids). */
const parseSongResponse = (text: string): Section[] =>
  safeJsonParse<Section[]>(text || '[]', [], SongResponseSchema as unknown as z.ZodType<Section[]>);

const sectionNamesMatch = (left: string, right: string) => left.toLowerCase() === right.toLowerCase();

const createEmptySection = (name: string, defaultRhymeScheme: string): Section => ({
  id: generateId(),
  name,
  rhymeScheme: defaultRhymeScheme,
  lines: Array(getDefaultLineCount(name))
    .fill(null)
    .map(() => ({
      id: generateId(),
      text: '',
      rhymingSyllables: '',
      rhyme: '',
      syllables: 0,
      concept: 'New line',
    })),
});

const alignGeneratedSongToStructure = (
  generatedSong: Section[],
  structure: string[],
  defaultRhymeScheme: string,
): Section[] => {
  const remainingSections = [...generatedSong];
  return structure.map(sectionName => {
    const matchingIndex = remainingSections.findIndex(section =>
      sectionNamesMatch(section.name, sectionName),
    );
    let matchedSection: Section | undefined;
    if (matchingIndex === -1) {
      matchedSection = remainingSections.length > 0 ? remainingSections.shift() : undefined;
    } else {
      matchedSection = remainingSections.splice(matchingIndex, 1)[0];
    }
    return matchedSection
      ? { ...matchedSection, name: sectionName }
      : createEmptySection(sectionName, defaultRhymeScheme);
  });
};

/** Raw line shape returned by the AI generator (before ID assignment). */
type RawLine = Omit<Section['lines'][number], 'id'> & { id?: string };

/** Flags isMeta on lines returned by the AI generator */
const flagMetaLines = <T extends { text?: string }>(lines: T[]): (T & { isMeta: boolean })[] =>
  lines.map(line => ({
    ...line,
    isMeta: isPureMetaLine(line.text ?? ''),
  }));

/**
 * Meta-instruction formatting rule injected into every prompt.
 * IMPORTANT: brackets are MANDATORY — bare text is not recognized.
 */
const META_INSTRUCTION_HINT =
`PERFORMANCE / PRODUCTION META-INSTRUCTIONS:
You may insert standalone meta-instruction lines using square brackets, e.g.:
  [Guitar solo], [Whispered], [Anthemic], [Ad-lib], [Key change], [Falsetto], [Drum break]
Rules:
- Square brackets are MANDATORY. Never write a meta-instruction as bare text — it will be ignored.
- Meta lines are NOT counted toward the section's lyric line count.
- Meta lines are NOT subject to rhyme or syllable requirements.
- These are preserved and displayed as special directives in the song editor.`;

/**
 * Rhyme enforcement rules injected into generation and regeneration prompts.
 * Provides concrete phonetic guidance per scheme and mandates self-validation.
 */
const RHYME_ENFORCEMENT_RULES =
`RHYME ENFORCEMENT — CRITICAL:
The rhyme scheme you declare MUST be phonetically respected. Shared-letter lines MUST end
with words whose final stressed vowel + following consonants match.

Phonetic rhyme rules by language:
- French: accented vowels are transparent (âme = ame, éclat = eclat). "E muet" at end counts
  (lame / âme / flamme all rhyme; bien / chrétien / lien all rhyme; BUT bien ≠ scintille).
- English: rely on pronunciation, not spelling (love/above rhyme; love/move do NOT).

Scheme-specific guidance:
- AABB: lines 1-2 share one rhyme sound, lines 3-4 share a DIFFERENT rhyme sound.
- ABAB: lines 1 and 3 rhyme; lines 2 and 4 rhyme (cross-rhyme).
- AABBCC: three distinct rhyme pairs — AA, BB, CC. Each pair must use a DIFFERENT sound.
- ABCB: only lines 2 and 4 rhyme; lines 1 and 3 are free.
- FREE: no rhyme constraints.

SELF-VALIDATION (mandatory before returning):
For each section, mentally check: do all lines sharing the same letter end with matching
phonetic sounds? If any pair fails, rewrite those lines before returning.`;

const buildExclusiveLanguageInstruction = (language: string): string =>
  language.trim() ? `Write exclusively in ${language.trim()}.` : '';

const GENERATION_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      rhymeScheme: {
        type: Type.STRING,
        description: 'The rhyme scheme for this section, e.g., AABB, ABAB, ABCB, AAAA, AAABBB, AABBCC, ABABAB, ABCABC, AABCCB, or FREE',
      },
      lines: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            rhymingSyllables: { type: Type.STRING },
            rhyme: { type: Type.STRING },
            syllables: { type: Type.INTEGER },
            concept: { type: Type.STRING },
          },
          required: ['text', 'rhymingSyllables', 'rhyme', 'syllables', 'concept'],
        },
      },
    },
    required: ['name', 'lines', 'rhymeScheme'],
  },
} as const;

type UseAiGenerationParams = {
  song: Section[];
  structure: string[];
  topic: string;
  mood: string;
  rhymeScheme: string;
  targetSyllables: number;
  title: string;
  songLanguage: string;
  uiLanguage: string;
  updateState: (
    recipe: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] },
  ) => void;
  updateSongWithHistory: (newSong: Section[]) => void;
  updateSongAndStructureWithHistory: (newSong: Section[], newStructure: string[]) => void;
  requestAutoTitleGeneration: () => void;
  setSelectedLineId: (id: string | null) => void;
};

export const useAiGeneration = ({
  song,
  structure,
  topic,
  mood,
  rhymeScheme,
  targetSyllables,
  title,
  songLanguage,
  uiLanguage,
  updateState,
  updateSongWithHistory,
  updateSongAndStructureWithHistory,
  requestAutoTitleGeneration,
  setSelectedLineId,
}: UseAiGenerationParams) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingSections, setRegeneratingSections] = useState<Set<string>>(new Set());

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const ref = abortControllerRef;
    return () => { ref.current?.abort(); };
  }, []);

  const isRegeneratingSection = useCallback(
    (sectionId: string) => regeneratingSections.has(sectionId),
    [regeneratingSections],
  );

  const updateSong = useMemo(() => makeSongUpdater(updateState), [updateState]);

  // ── generateSong ─────────────────────────────────────────────────────────
  const generateSong = useCallback(async () => {
    setIsGenerating(true);
    try {
      await withAbort(abortControllerRef, async (signal) => {
        const lang = songLanguage || 'English';
        const exclusiveLanguageInstruction = buildExclusiveLanguageInstruction(songLanguage);
        const prompt =
`Write a song about "${topic}".
Mood: ${mood}
Default Rhyme Scheme: ${rhymeScheme}
Target Syllables per line: ${targetSyllables}
Structure: ${structure.join(', ')}

IMPORTANT: Write ALL lyrics in ${lang}. You MUST follow the provided structure EXACTLY.
${exclusiveLanguageInstruction ? `${exclusiveLanguageInstruction}\n` : ''}Generate exactly the sections listed in the Structure field, in that specific order.

${RHYME_ENFORCEMENT_RULES}

${META_INSTRUCTION_HINT}

Line counts for sections:
- Intro: 4 lines
- Verse: 6 lines
- Chorus: 4 lines
- Bridge: 6 lines
- Outro: 4 lines

For each section, provide a rhyme scheme (e.g., AABB, ABAB, ABCB, AAAA, AAABBB, AABBCC, ABABAB, ABCABC, AABCCB, or FREE).
For each line, provide the lyric text (in ${lang}), the rhyming syllables, the rhyme identifier, the exact syllable count, and a short core concept (in ${uiLanguage}).`;

        const response = await withRetry(() =>
          getAi().models.generateContent({
            model: AI_MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema: GENERATION_SCHEMA },
            signal,
          })
        );

        const data = parseSongResponse(response.text);
        const songWithIds = data.map((section) => ({
          ...section,
          name: cleanSectionName(section.name),
          id: generateId(),
          rhymeScheme: section.rhymeScheme || rhymeScheme,
          lines: flagMetaLines(section.lines).map((line) => ({ ...line, id: generateId() })),
        }));
        const orderedSong = alignGeneratedSongToStructure(songWithIds, structure, rhymeScheme);
        updateSongAndStructureWithHistory(orderedSong, structure);
        requestAutoTitleGeneration();
        setSelectedLineId(null);
      });
    } catch (error: unknown) {
      if (isAbortError(error)) return;
      handleApiError(error, 'Failed to generate song. Please try again.');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) setIsGenerating(false);
    }
  }, [
    structure, topic, mood, rhymeScheme, targetSyllables, songLanguage, uiLanguage,
    updateSongAndStructureWithHistory, requestAutoTitleGeneration, setSelectedLineId,
  ]);

  // ── regenerateSection ────────────────────────────────────────────────────
  const regenerateSection = useCallback(async (sectionId: string) => {
    const sectionToRegenerate = song.find(s => s.id === sectionId);
    if (!sectionToRegenerate) return;

    setRegeneratingSections(prev => new Set(prev).add(sectionId));
    try {
      await withAbort(abortControllerRef, async (signal) => {
        const sectionIndex = song.findIndex(s => s.id === sectionId);
        const prevSection = sectionIndex > 0 ? song[sectionIndex - 1] : null;
        const nextSection = sectionIndex < song.length - 1 ? song[sectionIndex + 1] : null;

        let lineCountPrompt = '';
        const lowerName = sectionToRegenerate.name.toLowerCase();
        if (lowerName.includes('intro'))  lineCountPrompt = 'The section should have exactly 4 lines.';
        else if (lowerName.includes('verse'))  lineCountPrompt = 'The section should have exactly 6 lines.';
        else if (lowerName.includes('chorus')) lineCountPrompt = 'The section should have exactly 4 lines.';
        else if (lowerName.includes('bridge')) lineCountPrompt = 'The section should have exactly 6 lines.';
        else if (lowerName.includes('outro'))  lineCountPrompt = 'The section should have exactly 4 lines.';

        const songStructure = song.map(s => s.name).join(' → ');
        const lang = songLanguage || 'English';
        const exclusiveLanguageInstruction = buildExclusiveLanguageInstruction(songLanguage);
        const formatSectionLyrics = (sec: Section) =>
          sec.lines.map(l => l.text).filter(Boolean).join('\n');

        const prevContext = prevSection
          ? `\nPrevious section context (${prevSection.name}):\n${formatSectionLyrics(prevSection)}`
          : '';
        const nextContext = nextSection
          ? `\nNext section context (${nextSection.name}):\n${formatSectionLyrics(nextSection)}`
          : '';

        const creativeDirectives = [
          ...(sectionToRegenerate.preInstructions || []),
          ...(sectionToRegenerate.postInstructions || []),
        ];
        const directivesPrompt = creativeDirectives.length > 0
          ? `\nCreative directives:\n${creativeDirectives.map(d => `- ${d}`).join('\n')}`
          : '';

        // Build IPA-enhanced prompt if section has language and existing lines with rhymes
        const langCode = sectionToRegenerate.language || songLanguage;
        const hasRhymedLines = sectionToRegenerate.lines.some(line =>
          line.rhyme && line.rhyme !== '' && line.rhyme !== 'FREE' && !line.isMeta
        );
        let ipaConstraints = '';
        if (langCode && hasRhymedLines) {
          try {
            const enrichedPrompt = await buildRhymeConstrainedPrompt(
              sectionToRegenerate.lines,
              langCode,
              sectionToRegenerate.rhymeScheme || rhymeScheme
            );
            // Extract just the IPA constraints portion to append
            if (enrichedPrompt.includes('PHONEMIC RHYME CONSTRAINTS:')) {
              ipaConstraints = '\n\n' + enrichedPrompt.substring(
                enrichedPrompt.indexOf('PHONEMIC RHYME CONSTRAINTS:')
              );
            }
          } catch (error) {
            console.debug('Failed to build IPA-enhanced prompt, continuing without:', error);
          }
        }

        const prompt =
`Rewrite the following section of a song titled "${title}" about "${topic}".
Mood: ${mood}
Target Syllables per line: ${targetSyllables}
Section Name: ${sectionToRegenerate.name}
Rhyme Scheme: ${sectionToRegenerate.rhymeScheme || rhymeScheme}
${lineCountPrompt}
Song structure: ${songStructure}
${prevContext}${nextContext}${directivesPrompt}

${RHYME_ENFORCEMENT_RULES}${ipaConstraints}

${META_INSTRUCTION_HINT}

IMPORTANT: Write ALL lyrics in ${lang}. Concepts may be written in ${uiLanguage}.
${exclusiveLanguageInstruction ? `${exclusiveLanguageInstruction}\n` : ''}

Current Section:
${JSON.stringify([sectionToRegenerate], null, 2)}

Provide a new creative version of this section that fits seamlessly with the surrounding sections.
Return the updated section in the exact same JSON structure (as an array with one section).`;

        const response = await withRetry(() =>
          getAi().models.generateContent({
            model: AI_MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema: GENERATION_SCHEMA },
            signal,
          })
        );

        const data = parseSongResponse(response.text);
        const firstSection = data[0];
        if (firstSection) {
          const patchedSection = { ...firstSection, lines: flagMetaLines(firstSection.lines ?? []) };
          updateSong(currentSong =>
            currentSong.map(section =>
              section.id !== sectionId ? section : mergeAiSectionIntoCurrent(section, patchedSection)
            )
          );
        }
      });
    } catch (error: unknown) {
      if (isAbortError(error)) return;
      handleApiError(error, 'Failed to regenerate section. Please try again.');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setRegeneratingSections(prev => {
          const next = new Set(prev);
          next.delete(sectionId);
          return next;
        });
      }
    }
  }, [
    song, title, topic, mood, rhymeScheme, targetSyllables, songLanguage, uiLanguage,
    updateSong,
  ]);

  // ── quantizeSyllables ────────────────────────────────────────────────────
  const quantizeSyllables = useCallback(async (sectionId?: string) => {
    if (song.length === 0) return;
    setIsGenerating(true);
    const lang = songLanguage || 'English';
    const exclusiveLanguageInstruction = buildExclusiveLanguageInstruction(songLanguage);

    try {
      await withAbort(abortControllerRef, async (signal) => {
        let prompt = '';
        if (sectionId) {
          const sectionToQuantize = song.find(s => s.id === sectionId);
          if (!sectionToQuantize) return;
          const syllables = sectionToQuantize.targetSyllables ?? targetSyllables;
          prompt =
`Rewrite the following section of a song so that EVERY line has EXACTLY ${syllables} syllables.
Maintain the original meaning, rhyme scheme, and section structure.
Write ALL lyrics in ${lang}.
${exclusiveLanguageInstruction ? `${exclusiveLanguageInstruction}\n` : ''}Preserve any meta-instruction lines (e.g. [Guitar solo]) verbatim — they are NOT counted toward syllable targets.

${RHYME_ENFORCEMENT_RULES}

Current Section:
${JSON.stringify([sectionToQuantize], null, 2)}

Return the updated section in the exact same JSON structure (as an array with one section).`;
        } else {
          prompt =
`Rewrite the following song so that EVERY line has EXACTLY the number of syllables specified by its
section's targetSyllables (or ${targetSyllables} if not specified).
Maintain the original meaning, rhyme scheme (respecting section-level schemes if specified), and section structure.
Write ALL lyrics in ${lang}.
${exclusiveLanguageInstruction ? `${exclusiveLanguageInstruction}\n` : ''}Preserve any meta-instruction lines (e.g. [Guitar solo]) verbatim — they are NOT counted toward syllable targets.

${RHYME_ENFORCEMENT_RULES}

Current Song:
${JSON.stringify(song, null, 2)}

Return the updated song in the exact same JSON structure.`;
        }

        const response = await withRetry(() =>
          getAi().models.generateContent({
            model: AI_MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema: GENERATION_SCHEMA },
            signal,
          })
        );

        const data = parseSongResponse(response.text);

        if (sectionId) {
          const firstSection = data[0];
          if (firstSection) {
            const patchedSection = { ...firstSection, lines: flagMetaLines(firstSection.lines ?? []) };
            updateSong(currentSong =>
              currentSong.map(section =>
                section.id !== sectionId ? section : mergeAiSectionIntoCurrent(section, patchedSection)
              )
            );
          }
        } else {
          const updatedSong = mapSongWithPreservedIds(data, song);
          const reflagged = updatedSong.map(sec => ({ ...sec, lines: flagMetaLines(sec.lines) }));
          updateSongWithHistory(reflagged);
        }
      });
    } catch (error: unknown) {
      if (isAbortError(error)) return;
      handleApiError(error, 'Failed to quantize syllables. Please try again.');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) setIsGenerating(false);
    }
  }, [
    song, targetSyllables, songLanguage, updateSong, updateSongWithHistory,
  ]);

  return {
    isGenerating,
    isRegeneratingSection,
    generateSong,
    regenerateSection,
    quantizeSyllables,
  };
};
