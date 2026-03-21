import { useState, useEffect, useRef } from 'react';
import { Type } from '@google/genai';
import { AI_MODEL_NAME, getAi, safeJsonParse } from '../../utils/aiUtils';
import { mapSongWithPreservedIds, mergeAiSectionIntoCurrent } from '../../utils/songMergeUtils';
import { isSectionHeader } from '../../utils/metaUtils';
import { resolveUiLanguageName } from '../../utils/uiLangUtils';
import type { Section } from '../../types';
import { makeSongUpdater } from '../hookUtils';
import {
  type AdaptationProgress,
  type AdaptationResult,
  type AdaptationStepId,
  PIPELINE_STEPS,
  IDLE_PROGRESS,
} from './languageAdapterTypes';
import { reverseTranslate, reviewFidelity } from './languageAdapterPipeline';
import { matchRhymeSchemeAcrossLang, validateTranslatedLineRhyme } from '../../utils/adaptationUtils';
import { languageNameToCode } from '../../constants/langFamilyMap';

export type {
  AdaptationStepId,
  AdaptationStep,
  AdaptationProgress,
  AdaptationResult,
} from './languageAdapterTypes';

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
  isGenerating?: boolean;
  songLanguage: string;
  setSongLanguage: (lang: string) => void;
};

export const useLanguageAdapter = ({
  song,
  uiLanguage,
  saveVersion,
  updateSongAndStructureWithHistory,
  updateState,
  isGenerating = false,
  songLanguage,
  setSongLanguage,
}: UseLanguageAdapterParams) => {
  const [targetLanguage, setTargetLanguage] = useState<string>('English');
  const [sectionTargetLanguages, setSectionTargetLanguages] = useState<Record<string, string>>({});
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [isAdaptingLanguage, setIsAdaptingLanguage]   = useState(false);
  const [adaptationProgress, setAdaptationProgress]   = useState<AdaptationProgress>(IDLE_PROGRESS);
  const [adaptationResult, setAdaptationResult]       = useState<AdaptationResult | null>(null);

  const autoDetectFiredRef = useRef(false);
  const firstSectionIdRef  = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const updateSong = makeSongUpdater(updateState);

  const uiLang = resolveUiLanguageName(uiLanguage);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  useEffect(() => {
    if (song.length === 0) return;
    const currentFirstId = song[0]!.id;
    if (firstSectionIdRef.current !== null && firstSectionIdRef.current !== currentFirstId) {
      autoDetectFiredRef.current = false;
      setSongLanguage('');
    }
    firstSectionIdRef.current = currentFirstId;
  }, [song, setSongLanguage]);

  useEffect(() => {
    if (song.length > 0 && !songLanguage && !isGenerating && !isAdaptingLanguage && !autoDetectFiredRef.current) {
      autoDetectFiredRef.current = true;
      void detectLanguage();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song.length, songLanguage, isGenerating, isAdaptingLanguage]);

  useEffect(() => {
    if (song.length === 0) {
      autoDetectFiredRef.current = false;
      firstSectionIdRef.current = null;
      setSongLanguage('');
    }
  }, [song.length, setSongLanguage]);

  const setStep = (id: AdaptationStepId, label: string) =>
    setAdaptationProgress(prev => ({ ...prev, active: id, label }));

  const detectLanguage = async () => {
    if (song.length === 0) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsDetectingLanguage(true);
    try {
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
      if (controller.signal.aborted) return;
      setSongLanguage(response.text?.trim() || 'English');
    } catch (error) {
      if ((error as any)?.name === 'AbortError') return;
      console.error('Language detection error:', error);
    } finally {
      if (!controller.signal.aborted) setIsDetectingLanguage(false);
    }
  };

  const adaptSongLanguage = async (newLanguage: string) => {
    if (song.length === 0 || newLanguage === songLanguage) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const sourceLanguage = songLanguage || 'unknown';
    const progressLabel  = `${sourceLanguage} \u2192 ${newLanguage}`;

    setIsAdaptingLanguage(true);
    setAdaptationResult(null);
    setAdaptationProgress({ active: 'adapting', steps: PIPELINE_STEPS, label: progressLabel });
    saveVersion(`Before Translation to ${newLanguage}`);

    try {
      setStep('adapting', progressLabel);

      // Extract source lines (filter out meta lines and section headers)
      const sourceLines = song.flatMap(s =>
        s.lines
          .filter(l => !l.isMeta && !isSectionHeader(l.text.replace(/^\[|\]$/g, '').trim()))
          .map(l => l.text)
      );

      // Convert language names to ISO codes for IPA pipeline
      const sourceLangCode = languageNameToCode(sourceLanguage);
      const targetLangCode = languageNameToCode(newLanguage);

      // Try to apply IPA-based rhyme constraints if languages are supported
      let ipaEnhancedPrompt = '';
      if (sourceLangCode && targetLangCode && sourceLines.length > 0) {
        try {
          const adaptationResult = await matchRhymeSchemeAcrossLang(
            sourceLines,
            sourceLangCode,
            targetLangCode
          );

          if (adaptationResult.success) {
            // Use IPA-enhanced prompt
            ipaEnhancedPrompt = `\n\n${adaptationResult.constrainedPrompt}`;
            console.debug('IPA constraints applied:', adaptationResult.sourceScheme);
          }
        } catch (error) {
          console.debug('IPA pipeline not available, continuing with standard prompt:', error);
        }
      }

      const adaptPrompt = `You are an expert lyricist specializing in creative song adaptation across languages.\n\nYour task: Adapt the following song lyrics to ${newLanguage} with CREATIVE ADAPTATION, not literal translation.\n\nCRITICAL GUIDELINES:\n\n1. EMOTIONAL IMPACT FIRST\n   - Preserve the emotional journey and core message\n   - Prioritize how the lyrics make people FEEL over word-for-word accuracy\n   - Maintain the song's vibe, tone, and artistic intent\n\n2. NATURAL LANGUAGE\n   - Write as if the song was originally composed in ${newLanguage}\n   - Use idioms, expressions, and cultural references native to ${newLanguage}\n   - Avoid "translation-speak" - make it sound authentic and poetic\n   - Respect ${newLanguage} grammar, syntax, and natural word order\n\n3. POETIC STRUCTURE\n   - Maintain rhyme scheme quality (e.g., if AABB, keep clean rhymes in ${newLanguage})\n   - Match syllable counts when possible, but prioritize natural phrasing\n   - Preserve rhythm and singability\n   - Adapt imagery and metaphors to resonate in the target culture\n\n4. CULTURAL ADAPTATION\n   - Replace culture-specific references with equivalent concepts in ${newLanguage} culture\n   - Adapt humor, wordplay, and double meanings creatively\n   - Ensure themes and stories make sense to ${newLanguage} speakers\n\n5. TECHNICAL REQUIREMENTS\n   - Maintain the existing section structure (same section names)\n   - Return the FULL updated song in the same JSON format as input\n   - Update rhymingSyllables to reflect actual ${newLanguage} rhymes\n   - Adjust syllable counts to match the adapted lyrics\n   - Write the "concept" field for each line in ${uiLang}\n\nCurrent Song Data:\n${JSON.stringify(song)}${ipaEnhancedPrompt}\n\nReturn the fully adapted song that feels native to ${newLanguage} speakers while preserving the soul of the original.`;

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

      if (controller.signal.aborted) return;

      const newSongData = safeJsonParse<any[]>(adaptResponse.text || '[]', []);
      if (newSongData.length === 0) throw new Error('Empty adaptation response');

      const adaptedSong = mapSongWithPreservedIds(newSongData, song, newLanguage);
      updateSongAndStructureWithHistory(adaptedSong, adaptedSong.map(s => s.name));
      setSongLanguage(newLanguage);

      setStep('reversing', progressLabel);
      // P6-fix: pass controller.signal so abort propagates into pipeline steps
      const reversedLines = await reverseTranslate(adaptedSong, newLanguage, sourceLanguage, controller.signal);
      if (controller.signal.aborted) return;

      setStep('reviewing', progressLabel);
      const { score, warnings } = await reviewFidelity(song, reversedLines, newLanguage, sourceLanguage, controller.signal);
      if (controller.signal.aborted) return;

      const result: AdaptationResult = { score, warnings, accepted: score >= 50, targetLanguage: newLanguage };
      setAdaptationResult(result);
      setAdaptationProgress({ active: 'done', steps: PIPELINE_STEPS, label: progressLabel });

    } catch (error) {
      if ((error as any)?.name === 'AbortError') return;
      console.error('Language adaptation error:', error);
      setAdaptationProgress({ active: 'failed', steps: PIPELINE_STEPS, label: progressLabel });
    } finally {
      if (!controller.signal.aborted) setIsAdaptingLanguage(false);
    }
  };

  const adaptSectionLanguage = async (sectionId: string, newLanguage: string) => {
    const section = song.find(s => s.id === sectionId);
    if (!section) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const sourceLanguage = songLanguage || 'unknown';
    const progressLabel  = `${section.name}: ${sourceLanguage} \u2192 ${newLanguage}`;

    setIsAdaptingLanguage(true);
    setAdaptationResult(null);
    setAdaptationProgress({ active: 'adapting', steps: PIPELINE_STEPS, label: progressLabel });
    saveVersion(`Before Section ${section.name} Translation to ${newLanguage}`);

    try {
      setStep('adapting', progressLabel);

      // Extract source lines from the section (filter out meta lines and section headers)
      const sourceLines = section.lines
        .filter(l => !l.isMeta && !isSectionHeader(l.text.replace(/^\[|\]$/g, '').trim()))
        .map(l => l.text);

      // Convert language names to ISO codes for IPA pipeline
      const sourceLangCode = languageNameToCode(sourceLanguage);
      const targetLangCode = languageNameToCode(newLanguage);

      // Try to apply IPA-based rhyme constraints if languages are supported
      let ipaEnhancedPrompt = '';
      if (sourceLangCode && targetLangCode && sourceLines.length > 0) {
        try {
          const adaptationResult = await matchRhymeSchemeAcrossLang(
            sourceLines,
            sourceLangCode,
            targetLangCode
          );

          if (adaptationResult.success) {
            // Use IPA-enhanced prompt
            ipaEnhancedPrompt = `\n\n${adaptationResult.constrainedPrompt}`;
            console.debug('IPA constraints applied for section:', section.name, adaptationResult.sourceScheme);
          }
        } catch (error) {
          console.debug('IPA pipeline not available for section, continuing with standard prompt:', error);
        }
      }

      const sectionPrompt = `You are an expert lyricist specializing in creative song adaptation across languages.\n\nAdapt the following song section to ${newLanguage} with CREATIVE ADAPTATION, not literal translation.\nKeep section name unchanged. Update rhymingSyllables. Adjust syllable counts.\nWrite the "concept" field for each line in ${uiLang}.\n\nCurrent Section Data:\n${JSON.stringify(section)}${ipaEnhancedPrompt}`;

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

      if (controller.signal.aborted) return;

      const newSectionData = safeJsonParse<any>(adaptResponse.text || '{}', {});
      if (!newSectionData.name) throw new Error('Empty section adaptation response');

      const adaptedSectionSong: Section[] = [{
        ...section,
        lines: (newSectionData.lines ?? section.lines).filter((l: any) => !l.isMeta),
        language: newLanguage,
      }];

      updateSong(currentSong =>
        currentSong.map(currentSection => {
          if (currentSection.id !== sectionId) return currentSection;
          return mergeAiSectionIntoCurrent(currentSection, newSectionData, newLanguage);
        })
      );

      setStep('reversing', progressLabel);
      // P6-fix: pass controller.signal
      const reversedLines = await reverseTranslate(adaptedSectionSong, newLanguage, sourceLanguage, controller.signal);
      if (controller.signal.aborted) return;

      setStep('reviewing', progressLabel);
      const { score, warnings } = await reviewFidelity([section], reversedLines, newLanguage, sourceLanguage, controller.signal);
      if (controller.signal.aborted) return;

      const result: AdaptationResult = { score, warnings, accepted: score >= 50, targetLanguage: newLanguage };
      setAdaptationResult(result);
      setAdaptationProgress({ active: 'done', steps: PIPELINE_STEPS, label: progressLabel });

    } catch (error) {
      if ((error as any)?.name === 'AbortError') return;
      console.error('Section language adaptation error:', error);
      setAdaptationProgress({ active: 'failed', steps: PIPELINE_STEPS, label: progressLabel });
    } finally {
      if (!controller.signal.aborted) setIsAdaptingLanguage(false);
    }
  };

  return {
    songLanguage, setSongLanguage,
    targetLanguage, setTargetLanguage,
    sectionTargetLanguages, setSectionTargetLanguages,
    isDetectingLanguage, isAdaptingLanguage,
    adaptationProgress, adaptationResult,
    detectLanguage, adaptSongLanguage, adaptSectionLanguage,
  };
};
