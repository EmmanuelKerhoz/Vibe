import { useState, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { AI_MODEL_NAME, generateContentWithRetry, safeJsonParse } from '../../utils/aiUtils';
import { mergeAiSectionIntoCurrent } from '../../utils/songMergeUtils';
import { isSectionHeader } from '../../utils/metaUtils';
import { resolveUiLanguageName } from '../../utils/uiLangUtils';
import type { Line, Section } from '../../types';
import { makeSongUpdater } from '../hookUtils';
import {
  type AdaptationProgress,
  type AdaptationResult,
  type AdaptationStepId,
  PIPELINE_STEPS,
  IDLE_PROGRESS,
} from './languageAdapterTypes';
import { detectSongLanguage, getAdaptationResponseSchema, getIpaEnhancedPrompt, getLineAdaptationResponseSchema, parseAdaptationResponse, reverseTranslate, reviewFidelity } from './languageAdapterPipeline';
import { abortCurrent, withAbort, isAbortError } from '../../utils/withAbort';
import { buildAdaptLinePrompt, buildAdaptSectionPrompt, buildAdaptSongPrompt } from '../../utils/promptUtils';
export type { AdaptationStepId, AdaptationStep, AdaptationProgress, AdaptationResult } from './languageAdapterTypes';
type SaveVersionFn = (name: string, snapshot?: { song: Section[]; structure: string[]; title: string; titleOrigin: 'user' | 'ai'; topic: string; mood: string }) => void;
type UseLanguageAdapterParams = {
  song: Section[];
  uiLanguage: string;
  saveVersion: SaveVersionFn;
  updateSongAndStructureWithHistory: (newSong: Section[], newStructure: string[]) => void;
  updateState: (recipe: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] }) => void;
  isGeneratingRef: RefObject<boolean>;
  songLanguage: string;
  setSongLanguage: (lang: string) => void;
  detectedLanguages: string[];
  setDetectedLanguages: (langs: string[]) => void;
  lineLanguages: Record<string, string>;
  setLineLanguages: (map: Record<string, string>) => void;
  hasApiKey: boolean;
};
type AdaptationScope = { kind: 'song'; sourceSong: Section[] } | { kind: 'section'; section: Section };
export const useLanguageAdapter = ({
  song,
  uiLanguage,
  saveVersion,
  updateSongAndStructureWithHistory,
  updateState,
  isGeneratingRef,
  songLanguage,
  setSongLanguage,
  detectedLanguages,
  setDetectedLanguages,
  lineLanguages,
  setLineLanguages,
  hasApiKey,
}: UseLanguageAdapterParams) => {
  const [targetLanguage, setTargetLanguage] = useState<string>('English');
  const [sectionTargetLanguages, setSectionTargetLanguages] = useState<Record<string, string>>({});
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [isAdaptingLanguage, setIsAdaptingLanguage] = useState(false);
  const [adaptingLineIds, setAdaptingLineIds] = useState<Set<string>>(new Set());
  const [adaptationProgress, setAdaptationProgress] = useState<AdaptationProgress>(IDLE_PROGRESS);
  const [adaptationResult, setAdaptationResult] = useState<AdaptationResult | null>(null);

  const autoDetectFiredRef = useRef(false);
  const firstSectionIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lineAbortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const detectRunIdRef = useRef(0);
  const adaptRunIdRef = useRef(0);
  const adaptationLabelRef = useRef('');
  const updateSong = makeSongUpdater(updateState);
  const uiLang = resolveUiLanguageName(uiLanguage);
  const isGenerating = isGeneratingRef.current ?? false;

  useEffect(() => {
    const lineControllers = lineAbortControllersRef.current;
    return () => {
      abortCurrent(abortRef);
      for (const controller of lineControllers.values()) {
        controller.abort();
      }
      lineControllers.clear();
    };
  }, []);

  useEffect(() => {
    if (song.length === 0) return;
    const currentFirstId = song[0]!.id;
    if (firstSectionIdRef.current !== null && firstSectionIdRef.current !== currentFirstId) {
      autoDetectFiredRef.current = false;
      setSongLanguage('');
      setDetectedLanguages([]);
      setLineLanguages({});
    }
    firstSectionIdRef.current = currentFirstId;
  }, [song, setSongLanguage, setDetectedLanguages, setLineLanguages]);

  useEffect(() => {
    if (!hasApiKey) return;
    if (song.length > 0 && !songLanguage && !isGeneratingRef.current && !isAdaptingLanguage && !autoDetectFiredRef.current) {
      autoDetectFiredRef.current = true;
      void detectLanguage();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasApiKey, song.length, songLanguage, isGenerating, isAdaptingLanguage]);

  useEffect(() => {
    if (song.length === 0) {
      autoDetectFiredRef.current = false;
      firstSectionIdRef.current = null;
      setSongLanguage('');
      setDetectedLanguages([]);
      setLineLanguages({});
    }
  }, [song.length, setSongLanguage, setDetectedLanguages, setLineLanguages]);

  const setStep = (id: AdaptationStepId, label: string) =>
    setAdaptationProgress(prev => ({ ...prev, active: id, label }));

  const detectLanguage = async () => {
    if (song.length === 0) return;

    const runId = ++detectRunIdRef.current;
    setIsDetectingLanguage(true);
    try {
      await withAbort(abortRef, async (nextSignal) => {
        const result = await detectSongLanguage(song, nextSignal);
        if (nextSignal.aborted) {
          return;
        }
        if (result.languages.length > 0) {
          setSongLanguage(result.languages[0]!);
          setDetectedLanguages(result.languages);
        }
        setLineLanguages(result.lineLanguageMap);
      });
    } catch (error) {
      if (isAbortError(error)) return;
      console.error('Language detection error:', error);
    } finally {
      if (detectRunIdRef.current === runId) setIsDetectingLanguage(false);
    }
  };

  const runAdaptationPipeline = async (
    scope: AdaptationScope,
    newLanguage: string,
    sourceLanguage: string,
    signal: AbortSignal,
    buildPrompt: (ipaEnhancedPrompt: string) => string,
    onAdapted: (adaptedSong: Section[]) => void,
  ): Promise<void> => {
    const sourceSong = scope.kind === 'song' ? scope.sourceSong : [scope.section];
    const ipaEnhancedPrompt = await getIpaEnhancedPrompt(
      sourceSong,
      sourceLanguage,
      newLanguage,
      signal,
      scope.kind === 'section' ? scope.section.name : undefined,
    );
    if (signal.aborted) return;

    const adaptResponse = await generateContentWithRetry({
      model: AI_MODEL_NAME,
      contents: buildPrompt(ipaEnhancedPrompt),
      config: {
        responseMimeType: 'application/json',
        responseSchema: getAdaptationResponseSchema(scope.kind),
      },
      signal,
    });
    if (signal.aborted) return;

    const adaptedSong = scope.kind === 'song'
      ? parseAdaptationResponse({
          kind: 'song',
          responseText: adaptResponse.text || '[]',
          sourceSong,
          newLanguage,
        })
      : parseAdaptationResponse({
          kind: 'section',
          responseText: adaptResponse.text || '{}',
          section: scope.section,
          newLanguage,
        });

    setStep('reversing', adaptationLabelRef.current);
    onAdapted(adaptedSong);

    const reversedLines = await reverseTranslate(adaptedSong, newLanguage, sourceLanguage, signal);
    if (signal.aborted) return;

    setStep('reviewing', adaptationLabelRef.current);
    const { score, warnings } = await reviewFidelity(sourceSong, reversedLines, newLanguage, sourceLanguage, signal);
    if (signal.aborted) return;

    const result: AdaptationResult = { score, warnings, accepted: score >= 50, targetLanguage: newLanguage };
    setAdaptationResult(result);
  };

  const runAdaptation = async ({
    scope,
    newLanguage,
    sourceLanguage,
    progressLabel,
    saveLabel,
    errorLabel,
    buildPrompt,
    onAdapted,
  }: {
    scope: AdaptationScope;
    newLanguage: string;
    sourceLanguage: string;
    progressLabel: string;
    saveLabel: string;
    errorLabel: string;
    buildPrompt: (ipaEnhancedPrompt: string) => string;
    onAdapted: (adaptedSong: Section[]) => void;
  }) => {
    const runId = ++adaptRunIdRef.current;

    adaptationLabelRef.current = progressLabel;
    setIsAdaptingLanguage(true);
    setAdaptationResult(null);
    setAdaptationProgress({ active: 'adapting', steps: PIPELINE_STEPS, label: progressLabel });
    saveVersion(saveLabel);

    try {
      await withAbort(abortRef, async (nextSignal) => {
        setStep('adapting', progressLabel);
        await runAdaptationPipeline(scope, newLanguage, sourceLanguage, nextSignal, buildPrompt, onAdapted);
        if (nextSignal.aborted) return;

        setAdaptationProgress({ active: 'done', steps: PIPELINE_STEPS, label: progressLabel });
      });
    } catch (error) {
      if (isAbortError(error)) return;
      console.error(errorLabel, error);
      setAdaptationProgress({ active: 'failed', steps: PIPELINE_STEPS, label: progressLabel });
    } finally {
      if (adaptRunIdRef.current === runId) setIsAdaptingLanguage(false);
    }
  };

  const adaptSongLanguage = async (newLanguage: string) => {
    if (song.length === 0 || newLanguage === songLanguage) return;

    const sourceSong = [...song];
    const sourceLanguage = songLanguage || 'unknown';
    const progressLabel = `${sourceLanguage} → ${newLanguage}`;

    await runAdaptation({
      scope: { kind: 'song', sourceSong },
      newLanguage,
      sourceLanguage,
      progressLabel,
      saveLabel: `Before Translation to ${newLanguage}`,
      errorLabel: 'Language adaptation error:',
      buildPrompt: ipaEnhancedPrompt => buildAdaptSongPrompt({ sourceSong, newLanguage, uiLanguage: uiLang, ipaEnhancedPrompt }),
      onAdapted: adaptedSong => {
        updateSongAndStructureWithHistory(adaptedSong, adaptedSong.map(section => section.name));
        setSongLanguage(newLanguage);
      },
    });
  };

  const adaptSectionLanguage = async (sectionId: string, newLanguage: string) => {
    const section = song.find(s => s.id === sectionId);
    if (!section) return;

    const sourceLanguage = songLanguage || 'unknown';
    const progressLabel = `${section.name}: ${sourceLanguage} → ${newLanguage}`;

    await runAdaptation({
      scope: { kind: 'section', section },
      newLanguage,
      sourceLanguage,
      progressLabel,
      saveLabel: `Before Section ${section.name} Translation to ${newLanguage}`,
      errorLabel: 'Section language adaptation error:',
      buildPrompt: ipaEnhancedPrompt => buildAdaptSectionPrompt({ section, newLanguage, uiLanguage: uiLang, ipaEnhancedPrompt }),
      onAdapted: adaptedSong => updateSong(currentSong => currentSong.map(currentSection =>
        currentSection.id === sectionId
          ? mergeAiSectionIntoCurrent(currentSection, adaptedSong[0]!, newLanguage)
          : currentSection
      )),
    });
  };

  const adaptLineLanguage = async (sectionId: string, lineId: string, newLanguage: string) => {
    const section = song.find(s => s.id === sectionId);
    if (!section) return;
    const line = section.lines.find(l => l.id === lineId);
    if (!line) return;

    setAdaptingLineIds(prev => new Set(prev).add(lineId));
    try {
      const controller = new AbortController();
      // Abort any in-flight adaptation for this same line
      lineAbortControllersRef.current.get(lineId)?.abort();
      lineAbortControllersRef.current.set(lineId, controller);

      const adaptResponse = await generateContentWithRetry({
        model: AI_MODEL_NAME,
        contents: buildAdaptLinePrompt({ line, newLanguage, uiLanguage: uiLang }),
        config: {
          responseMimeType: 'application/json',
          responseSchema: getLineAdaptationResponseSchema(),
        },
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      const linePayload = safeJsonParse<Partial<Line>>(adaptResponse.text || '{}', {});
      if (linePayload.text) {
        updateSong(currentSong => currentSong.map(currentSection => {
          if (currentSection.id !== sectionId) return currentSection;
          return {
            ...currentSection,
            lines: currentSection.lines.map(currentLine => {
              if (currentLine.id !== lineId) return currentLine;
              return {
                ...currentLine,
                text: linePayload.text!,
                rhymingSyllables: linePayload.rhymingSyllables ?? currentLine.rhymingSyllables,
                rhyme: linePayload.rhyme ?? currentLine.rhyme,
                syllables: linePayload.syllables ?? currentLine.syllables,
                concept: linePayload.concept ?? currentLine.concept,
              };
            }),
          };
        }));
      }
    } catch (error) {
      if (isAbortError(error)) return;
      console.error('Line adaptation error:', error);
    } finally {
      lineAbortControllersRef.current.delete(lineId);
      setAdaptingLineIds(prev => {
        const next = new Set(prev);
        next.delete(lineId);
        return next;
      });
    }
  };

  return {
    songLanguage, setSongLanguage,
    detectedLanguages, lineLanguages,
    targetLanguage, setTargetLanguage,
    sectionTargetLanguages, setSectionTargetLanguages,
    isDetectingLanguage, isAdaptingLanguage,
    adaptingLineIds,
    adaptationProgress, adaptationResult,
    detectLanguage, adaptSongLanguage, adaptSectionLanguage, adaptLineLanguage,
  };
};
