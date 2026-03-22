import { useState, useEffect, useRef } from 'react';
import { Type } from '@google/genai';
import { AI_MODEL_NAME, generateContentWithRetry, safeJsonParse } from '../../utils/aiUtils';
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
import { matchRhymeSchemeAcrossLang } from '../../utils/adaptationUtils';
import { languageNameToCode } from '../../constants/langFamilyMap';
import { abortCurrent, withAbort, isAbortError } from '../../utils/withAbort';
import {
  buildAdaptSectionPrompt,
  buildAdaptSongPrompt,
  buildDetectLanguagePrompt,
} from '../../utils/promptUtils';

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
    return () => { abortCurrent(abortRef); };
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

    setIsDetectingLanguage(true);
    let wasAborted = false;
    try {
      await withAbort(abortRef, async (nextSignal) => {
        const songText = song
          .flatMap(s =>
            s.lines
              .filter(l => !l.isMeta && !isSectionHeader(l.text.replace(/^\[|\]$/g, '').trim()))
              .map(l => l.text)
          )
          .join('\n');

        if (!songText.trim()) return;

        const response = await generateContentWithRetry({
          model: AI_MODEL_NAME,
          contents: buildDetectLanguagePrompt(songText),
          signal: nextSignal,
        });
        if (nextSignal.aborted) {
          wasAborted = true;
          return;
        }
        setSongLanguage(response.text?.trim() || 'English');
      });
    } catch (error) {
      if (isAbortError(error)) {
        wasAborted = true;
        return;
      }
      console.error('Language detection error:', error);
    } finally {
      if (!wasAborted) setIsDetectingLanguage(false);
    }
  };

  const adaptSongLanguage = async (newLanguage: string) => {
    if (song.length === 0 || newLanguage === songLanguage) return;

    // Freeze song at start to prevent race conditions
    const sourceSong = [...song];

    const sourceLanguage = songLanguage || 'unknown';
    const progressLabel  = `${sourceLanguage} \u2192 ${newLanguage}`;

    setIsAdaptingLanguage(true);
    setAdaptationResult(null);
    setAdaptationProgress({ active: 'adapting', steps: PIPELINE_STEPS, label: progressLabel });
    saveVersion(`Before Translation to ${newLanguage}`);

    let wasAborted = false;
    try {
      await withAbort(abortRef, async (nextSignal) => {
        setStep('adapting', progressLabel);

        // Extract source lines (filter out meta lines and section headers)
        const sourceLines = sourceSong.flatMap(s =>
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
              targetLangCode,
              nextSignal
            );
            if (nextSignal.aborted) {
              wasAborted = true;
              return;
            }

            if (adaptationResult.success) {
              // Use IPA-enhanced prompt
              ipaEnhancedPrompt = `\n\n${adaptationResult.constrainedPrompt}`;
              console.debug('IPA constraints applied:', adaptationResult.sourceScheme);
            }
          } catch (error) {
            console.debug('IPA pipeline not available, continuing with standard prompt:', error);
          }
        }

        const adaptResponse = await generateContentWithRetry({
          model: AI_MODEL_NAME,
          contents: buildAdaptSongPrompt({
            sourceSong,
            newLanguage,
            uiLanguage: uiLang,
            ipaEnhancedPrompt,
          }),
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
          signal: nextSignal,
        });

        if (nextSignal.aborted) {
          wasAborted = true;
          return;
        }

        const newSongData = safeJsonParse<any[]>(adaptResponse.text || '[]', []);
        if (newSongData.length === 0) throw new Error('Empty adaptation response');

        const adaptedSong = mapSongWithPreservedIds(newSongData, sourceSong, newLanguage);
        updateSongAndStructureWithHistory(adaptedSong, adaptedSong.map(s => s.name));
        setSongLanguage(newLanguage);

        setStep('reversing', progressLabel);
        const reversedLines = await reverseTranslate(adaptedSong, newLanguage, sourceLanguage, nextSignal);
        if (nextSignal.aborted) {
          wasAborted = true;
          return;
        }

        setStep('reviewing', progressLabel);
        const { score, warnings } = await reviewFidelity(sourceSong, reversedLines, newLanguage, sourceLanguage, nextSignal);
        if (nextSignal.aborted) {
          wasAborted = true;
          return;
        }

        const result: AdaptationResult = { score, warnings, accepted: score >= 50, targetLanguage: newLanguage };
        setAdaptationResult(result);
        setAdaptationProgress({ active: 'done', steps: PIPELINE_STEPS, label: progressLabel });
      });
    } catch (error) {
      if (isAbortError(error)) {
        wasAborted = true;
        return;
      }
      console.error('Language adaptation error:', error);
      setAdaptationProgress({ active: 'failed', steps: PIPELINE_STEPS, label: progressLabel });
    } finally {
      if (!wasAborted) setIsAdaptingLanguage(false);
    }
  };

  const adaptSectionLanguage = async (sectionId: string, newLanguage: string) => {
    const section = song.find(s => s.id === sectionId);
    if (!section) return;

    const sourceLanguage = songLanguage || 'unknown';
    const progressLabel  = `${section.name}: ${sourceLanguage} \u2192 ${newLanguage}`;

    setIsAdaptingLanguage(true);
    setAdaptationResult(null);
    setAdaptationProgress({ active: 'adapting', steps: PIPELINE_STEPS, label: progressLabel });
    saveVersion(`Before Section ${section.name} Translation to ${newLanguage}`);

    let wasAborted = false;
    try {
      await withAbort(abortRef, async (nextSignal) => {
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
              targetLangCode,
              nextSignal
            );
            if (nextSignal.aborted) {
              wasAborted = true;
              return;
            }

            if (adaptationResult.success) {
              // Use IPA-enhanced prompt
              ipaEnhancedPrompt = `\n\n${adaptationResult.constrainedPrompt}`;
              console.debug('IPA constraints applied for section:', section.name, adaptationResult.sourceScheme);
            }
          } catch (error) {
            console.debug('IPA pipeline not available for section, continuing with standard prompt:', error);
          }
        }

        const adaptResponse = await generateContentWithRetry({
          model: AI_MODEL_NAME,
          contents: buildAdaptSectionPrompt({
            section,
            newLanguage,
            uiLanguage: uiLang,
            ipaEnhancedPrompt,
          }),
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
          signal: nextSignal,
        });

        if (nextSignal.aborted) {
          wasAborted = true;
          return;
        }

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
        const reversedLines = await reverseTranslate(adaptedSectionSong, newLanguage, sourceLanguage, nextSignal);
        if (nextSignal.aborted) {
          wasAborted = true;
          return;
        }

        setStep('reviewing', progressLabel);
        const { score, warnings } = await reviewFidelity([section], reversedLines, newLanguage, sourceLanguage, nextSignal);
        if (nextSignal.aborted) {
          wasAborted = true;
          return;
        }

        const result: AdaptationResult = { score, warnings, accepted: score >= 50, targetLanguage: newLanguage };
        setAdaptationResult(result);
        setAdaptationProgress({ active: 'done', steps: PIPELINE_STEPS, label: progressLabel });
      });
    } catch (error) {
      if (isAbortError(error)) {
        wasAborted = true;
        return;
      }
      console.error('Section language adaptation error:', error);
      setAdaptationProgress({ active: 'failed', steps: PIPELINE_STEPS, label: progressLabel });
    } finally {
      if (!wasAborted) setIsAdaptingLanguage(false);
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
