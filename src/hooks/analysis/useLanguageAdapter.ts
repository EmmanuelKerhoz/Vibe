import { useState, useEffect, useRef } from 'react';
import { Type } from '@google/genai';
import { AI_MODEL_NAME, getAi, safeJsonParse } from '../../utils/aiUtils';
import { mapSongWithPreservedIds, mergeAiSectionIntoCurrent } from '../../utils/songMergeUtils';
import { isSectionHeader } from '../../utils/metaUtils';
import type { Section } from '../../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdaptationStepId =
  | 'idle'
  | 'adapting'
  | 'reversing'
  | 'reviewing'
  | 'done'
  | 'failed';

export interface AdaptationStep {
  id: AdaptationStepId;
  label: string;
  /** 0–100, undefined while not yet started */
  progress?: number;
}

export interface AdaptationProgress {
  active: AdaptationStepId;
  steps: AdaptationStep[];
  /** Context label, e.g. "French → Baoulé" */
  label: string;
}

export interface AdaptationResult {
  /** Conceptual fidelity score 0–100 returned by the LLM reviewer */
  score: number;
  /** Human-readable warnings produced by the reviewer */
  warnings: string[];
  /** Whether the adapted lyrics were accepted (score >= 50) */
  accepted: boolean;
  /** Target language of this result */
  targetLanguage: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PIPELINE_STEPS: AdaptationStep[] = [
  { id: 'adapting',  label: 'Adapting lyrics'       },
  { id: 'reversing', label: 'Reverse translating'   },
  { id: 'reviewing', label: 'Reviewing fidelity'    },
  { id: 'done',      label: 'Done'                  },
];

const IDLE_PROGRESS: AdaptationProgress = {
  active: 'idle',
  steps: PIPELINE_STEPS,
  label: '',
};

// ---------------------------------------------------------------------------
// Hook params
// ---------------------------------------------------------------------------

type SaveVersionFn = (name: string, snapshot?: {
  song: Section[];
  structure: string[];
  title: string;
  titleOrigin: 'user' | 'ai';
  topic: string;
  mood: string;
}) => void;

type UseLanguageAdapterParams = {
  song: Section[];
  uiLanguage: string;
  saveVersion: SaveVersionFn;
  updateSongAndStructureWithHistory: (newSong: Section[], newStructure: string[]) => void;
  updateState: (recipe: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] }) => void;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useLanguageAdapter = ({
  song,
  uiLanguage,
  saveVersion,
  updateSongAndStructureWithHistory,
  updateState,
}: UseLanguageAdapterParams) => {
  const [songLanguage, setSongLanguage]     = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<string>('English');
  const [sectionTargetLanguages, setSectionTargetLanguages] = useState<Record<string, string>>({});
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [isAdaptingLanguage, setIsAdaptingLanguage]   = useState(false);
  const [adaptationProgress, setAdaptationProgress]   = useState<AdaptationProgress>(IDLE_PROGRESS);
  const [adaptationResult, setAdaptationResult]       = useState<AdaptationResult | null>(null);

  const uiLang = uiLanguage === 'fr' ? 'French'
    : uiLanguage === 'es' ? 'Spanish'
    : uiLanguage === 'de' ? 'German'
    : uiLanguage === 'pt' ? 'Portuguese'
    : uiLanguage === 'ar' ? 'Arabic'
    : uiLanguage === 'zh' ? 'Chinese'
    : uiLanguage === 'ko' ? 'Korean'
    : 'English';

  // Track previous song length so auto-detect only fires when length actually changes
  const prevSongLengthRef = useRef(song.length);

  // Auto-detect language only when song length changes AND language is not yet known
  useEffect(() => {
    const lengthChanged = song.length !== prevSongLengthRef.current;
    prevSongLengthRef.current = song.length;

    if (song.length > 0 && !songLanguage && lengthChanged) {
      detectLanguage();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song.length, songLanguage]);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const updateSong = (transform: (currentSong: Section[]) => Section[]) => {
    updateState(current => ({
      song: transform(current.song),
      structure: current.structure,
    }));
  };

  const setStep = (id: AdaptationStepId, label: string) => {
    setAdaptationProgress(prev => ({ ...prev, active: id, label }));
  };

  // -------------------------------------------------------------------------
  // Reverse-translate: plain literal translation back to source language
  // Returns array of plain strings (one per line, all sections flattened)
  // -------------------------------------------------------------------------
  const reverseTranslate = async (
    adaptedSong: Section[],
    fromLanguage: string,
    toLanguage: string,
  ): Promise<string[]> => {
    const lines = adaptedSong.flatMap(s =>
      s.lines.filter(l => !l.isMeta).map(l => l.text)
    );
    if (lines.length === 0) return [];

    const response = await getAi().models.generateContent({
      model: AI_MODEL_NAME,
      contents: [
        `You are a professional literal translator. Translate the following ${fromLanguage} lyrics LITERALLY (word-for-word, no adaptation) into ${toLanguage}.`,
        `Return a JSON array of strings, one translated string per input line, preserving order exactly.`,
        `Input lines (${fromLanguage}):`,
        JSON.stringify(lines),
      ].join('\n'),
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });
    return safeJsonParse<string[]>(response.text || '[]', []);
  };

  // -------------------------------------------------------------------------
  // Review fidelity: compare original intent vs reverse-translated lines
  // Returns { score, warnings }
  // -------------------------------------------------------------------------
  const reviewFidelity = async (
    originalSong: Section[],
    reversedLines: string[],
    targetLanguage: string,
    sourceLang: string,
  ): Promise<{ score: number; warnings: string[] }> => {
    const originalLines = originalSong
      .flatMap(s => s.lines.filter(l => !l.isMeta).map(l => l.text));

    const reviewPrompt = [
      `You are a senior lyric consultant reviewing the conceptual fidelity of a song adaptation from ${sourceLang} to ${targetLanguage}.`,
      ``,
      `You have:`,
      `- ORIGINAL lyrics in ${sourceLang}`,
      `- REVERSE TRANSLATION of the ${targetLanguage} adaptation (literal, back into ${sourceLang})`,
      ``,
      `Your task: assess whether the ${targetLanguage} adaptation preserved the conceptual intent of the original.`,
      ``,
      `Return a JSON object with:`,
      `- "score": integer 0-100 (100 = perfect fidelity, 0 = completely lost the meaning)`,
      `- "warnings": array of strings describing specific intent losses (empty array if none)`,
      ``,
      `ORIGINAL (${sourceLang}):`,
      JSON.stringify(originalLines),
      ``,
      `REVERSE TRANSLATION (back to ${sourceLang}):`,
      JSON.stringify(reversedLines),
    ].join('\n');

    const response = await getAi().models.generateContent({
      model: AI_MODEL_NAME,
      contents: reviewPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score:    { type: Type.INTEGER },
            warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['score', 'warnings'],
        },
      },
    });

    return safeJsonParse<{ score: number; warnings: string[] }>(
      response.text || '{"score":50,"warnings":[]}',
      { score: 50, warnings: [] },
    );
  };

  // -------------------------------------------------------------------------
  // Public: detect language
  // -------------------------------------------------------------------------
  const detectLanguage = async () => {
    if (song.length === 0) return;
    setIsDetectingLanguage(true);
    try {
      // Filter out meta-lines and section header names so the AI only sees real lyrics
      const songText = song
        .flatMap(s =>
          s.lines
            .filter(l => !l.isMeta && !isSectionHeader(l.text.replace(/^\[|\]$/g, '').trim()))
            .map(l => l.text)
        )
        .join('\n');
      if (!songText.trim()) {
        setIsDetectingLanguage(false);
        return;
      }
      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: `Detect the language of these lyrics. Return ONLY the name of the language in English (e.g., "English", "French", "Spanish").\n\nLyrics:\n${songText.substring(0, 1000)}`,
      });
      const detected = response.text?.trim() || 'English';
      setSongLanguage(detected);
    } catch (error) {
      console.error('Language detection error:', error);
    } finally {
      setIsDetectingLanguage(false);
    }
  };

  // -------------------------------------------------------------------------
  // Public: adapt full song with reverse-check pipeline
  // -------------------------------------------------------------------------
  const adaptSongLanguage = async (newLanguage: string) => {
    if (song.length === 0 || newLanguage === songLanguage) return;

    const sourceLanguage = songLanguage || 'unknown';
    const progressLabel  = `${sourceLanguage} → ${newLanguage}`;

    setIsAdaptingLanguage(true);
    setAdaptationResult(null);
    setAdaptationProgress({ active: 'adapting', steps: PIPELINE_STEPS, label: progressLabel });
    saveVersion(`Before Translation to ${newLanguage}`);

    try {
      // ------- STEP 1: Adapt -----------------------------------------------
      setStep('adapting', progressLabel);

      const adaptPrompt = `You are an expert lyricist specializing in creative song adaptation across languages.

Your task: Adapt the following song lyrics to ${newLanguage} with CREATIVE ADAPTATION, not literal translation.

CRITICAL GUIDELINES:

1. EMOTIONAL IMPACT FIRST
   - Preserve the emotional journey and core message
   - Prioritize how the lyrics make people FEEL over word-for-word accuracy
   - Maintain the song's vibe, tone, and artistic intent

2. NATURAL LANGUAGE
   - Write as if the song was originally composed in ${newLanguage}
   - Use idioms, expressions, and cultural references native to ${newLanguage}
   - Avoid "translation-speak" - make it sound authentic and poetic
   - Respect ${newLanguage} grammar, syntax, and natural word order

3. POETIC STRUCTURE
   - Maintain rhyme scheme quality (e.g., if AABB, keep clean rhymes in ${newLanguage})
   - Match syllable counts when possible, but prioritize natural phrasing
   - Preserve rhythm and singability
   - Adapt imagery and metaphors to resonate in the target culture

4. CULTURAL ADAPTATION
   - Replace culture-specific references with equivalent concepts in ${newLanguage} culture
   - Adapt humor, wordplay, and double meanings creatively
   - Ensure themes and stories make sense to ${newLanguage} speakers

5. TECHNICAL REQUIREMENTS
   - Maintain the existing section structure (same section names)
   - Return the FULL updated song in the same JSON format as input
   - Update rhymingSyllables to reflect actual ${newLanguage} rhymes
   - Adjust syllable counts to match the adapted lyrics
   - Write the "concept" field for each line in ${uiLang}

Current Song Data:
${JSON.stringify(song)}

Return the fully adapted song that feels native to ${newLanguage} speakers while preserving the soul of the original.`;

      const adaptResponse = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: adaptPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                rhymeScheme: { type: Type.STRING },
                lines: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text:             { type: Type.STRING },
                      rhymingSyllables: { type: Type.STRING },
                      rhyme:            { type: Type.STRING },
                      syllables:        { type: Type.INTEGER },
                      concept:          { type: Type.STRING },
                    },
                    required: ['text', 'rhymingSyllables', 'rhyme', 'syllables', 'concept'],
                  },
                },
              },
              required: ['name', 'lines'],
            },
          },
        },
      });

      const newSongData = safeJsonParse<any[]>(adaptResponse.text || '[]', []);
      if (newSongData.length === 0) throw new Error('Empty adaptation response');

      const adaptedSong = mapSongWithPreservedIds(newSongData, song, newLanguage);

      // Apply adapted lyrics immediately so the user sees the result
      updateSongAndStructureWithHistory(adaptedSong, adaptedSong.map(s => s.name));
      setSongLanguage(newLanguage);

      // ------- STEP 2: Reverse translate -----------------------------------
      setStep('reversing', progressLabel);
      const reversedLines = await reverseTranslate(adaptedSong, newLanguage, sourceLanguage);

      // ------- STEP 3: Review fidelity -------------------------------------
      setStep('reviewing', progressLabel);
      const { score, warnings } = await reviewFidelity(song, reversedLines, newLanguage, sourceLanguage);

      // ------- STEP 4: Done ------------------------------------------------
      const result: AdaptationResult = {
        score,
        warnings,
        accepted: score >= 50,
        targetLanguage: newLanguage,
      };
      setAdaptationResult(result);
      setAdaptationProgress({ active: 'done', steps: PIPELINE_STEPS, label: progressLabel });

    } catch (error) {
      console.error('Language adaptation error:', error);
      setAdaptationProgress({ active: 'failed', steps: PIPELINE_STEPS, label: progressLabel });
    } finally {
      setIsAdaptingLanguage(false);
    }
  };

  // -------------------------------------------------------------------------
  // Public: adapt single section with reverse-check pipeline
  // -------------------------------------------------------------------------
  const adaptSectionLanguage = async (sectionId: string, newLanguage: string) => {
    const section = song.find(s => s.id === sectionId);
    if (!section) return;

    const sourceLanguage = songLanguage || 'unknown';
    const progressLabel  = `${section.name}: ${sourceLanguage} → ${newLanguage}`;

    setIsAdaptingLanguage(true);
    setAdaptationResult(null);
    setAdaptationProgress({ active: 'adapting', steps: PIPELINE_STEPS, label: progressLabel });
    saveVersion(`Before Section ${section.name} Translation to ${newLanguage}`);

    try {
      // ------- STEP 1: Adapt -----------------------------------------------
      setStep('adapting', progressLabel);

      const sectionPrompt = `You are an expert lyricist specializing in creative song adaptation across languages.

Adapt the following song section to ${newLanguage} with CREATIVE ADAPTATION, not literal translation.
Keep section name unchanged. Update rhymingSyllables. Adjust syllable counts.
Write the "concept" field for each line in ${uiLang}.

Current Section Data:
${JSON.stringify(section)}`;

      const adaptResponse = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: sectionPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              rhymeScheme: { type: Type.STRING },
              lines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text:             { type: Type.STRING },
                    rhymingSyllables: { type: Type.STRING },
                    rhyme:            { type: Type.STRING },
                    syllables:        { type: Type.INTEGER },
                    concept:          { type: Type.STRING },
                  },
                  required: ['text', 'rhymingSyllables', 'rhyme', 'syllables', 'concept'],
                },
              },
            },
            required: ['name', 'lines'],
          },
        },
      });

      const newSectionData = safeJsonParse<any>(adaptResponse.text || '{}', {});
      if (!newSectionData.name) throw new Error('Empty section adaptation response');

      // Build a single-section song for reverse check
      const adaptedSectionSong: Section[] = [{
        ...section,
        lines: newSectionData.lines ?? section.lines,
        language: newLanguage,
      }];

      // Apply immediately
      updateSong(currentSong =>
        currentSong.map(currentSection => {
          if (currentSection.id !== sectionId) return currentSection;
          return mergeAiSectionIntoCurrent(currentSection, newSectionData, newLanguage);
        })
      );

      // ------- STEP 2: Reverse translate -----------------------------------
      setStep('reversing', progressLabel);
      const reversedLines = await reverseTranslate(adaptedSectionSong, newLanguage, sourceLanguage);

      // ------- STEP 3: Review fidelity -------------------------------------
      setStep('reviewing', progressLabel);
      // Use the original section lines as reference
      const originalSectionSong: Section[] = [section];
      const { score, warnings } = await reviewFidelity(originalSectionSong, reversedLines, newLanguage, sourceLanguage);

      // ------- STEP 4: Done ------------------------------------------------
      const result: AdaptationResult = {
        score,
        warnings,
        accepted: score >= 50,
        targetLanguage: newLanguage,
      };
      setAdaptationResult(result);
      setAdaptationProgress({ active: 'done', steps: PIPELINE_STEPS, label: progressLabel });

    } catch (error) {
      console.error('Section language adaptation error:', error);
      setAdaptationProgress({ active: 'failed', steps: PIPELINE_STEPS, label: progressLabel });
    } finally {
      setIsAdaptingLanguage(false);
    }
  };

  return {
    songLanguage,
    setSongLanguage,
    targetLanguage,
    setTargetLanguage,
    sectionTargetLanguages,
    setSectionTargetLanguages,
    isDetectingLanguage,
    isAdaptingLanguage,
    adaptationProgress,
    adaptationResult,
    detectLanguage,
    adaptSongLanguage,
    adaptSectionLanguage,
  };
};
