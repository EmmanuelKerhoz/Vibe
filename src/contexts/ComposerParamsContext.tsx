/**
 * ComposerParamsContext
 *
 * Aggregates the song meta params and composer state needed by SongMetaForm
 * so that LeftSettingsPanel becomes a pure layout shell.
 *
 * Sources:
 *   - SongContext          → title, titleOrigin, topic, mood, rhymeScheme,
 *                            targetSyllables + their setters
 *   - ComposerContext      → song, isGenerating, quantizeSyllables
 *   - useTitleGenerator    → isGeneratingTitle, generateTitle
 *   - useTopicMoodSuggester → isSurprising, generateSuggestion
 *   - AppStateContext      → hasApiKey
 *
 * NOTE: onGenerateSong / onRegenerateSong are intentionally NOT in this
 * context — they carry layout intent (close panel, confirm overwrite) and
 * must remain props at the LeftSettingsPanel call-site.
 */
import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { useSongContext } from './SongContext';
import { useComposerContext } from './ComposerContext';
import { useAppStateContext } from './AppStateContext';
import { useTitleGenerator } from '../hooks/useTitleGenerator';
import { useTopicMoodSuggester } from '../hooks/useTopicMoodSuggester';

export interface ComposerParamsValue {
  // Song meta — data
  title: string;
  setTitle: (v: string) => void;
  titleOrigin: 'user' | 'ai';
  setTitleOrigin: (v: 'user' | 'ai') => void;
  topic: string;
  setTopic: (v: string) => void;
  mood: string;
  setMood: (v: string) => void;
  rhymeScheme: string;
  setRhymeScheme: (v: string) => void;
  targetSyllables: number;
  setTargetSyllables: (v: number) => void;
  // Composer state
  song: ReturnType<typeof useSongContext>['song'];
  isGenerating: ReturnType<typeof useComposerContext>['isGenerating'];
  quantizeSyllables: ReturnType<typeof useComposerContext>['quantizeSyllables'];
  // Title generation
  isGeneratingTitle: boolean;
  onGenerateTitle: () => Promise<void>;
  // Surprise
  isSurprising: boolean;
  onSurprise: () => Promise<void>;
  // API key availability
  hasApiKey: boolean;
}

const ComposerParamsContext = createContext<ComposerParamsValue | null>(null);

export function ComposerParamsProvider({ children }: { children: ReactNode }) {
  const songCtx = useSongContext();
  const composerCtx = useComposerContext();
  const { appState } = useAppStateContext();

  const { generateTitle, isGeneratingTitle } = useTitleGenerator();
  const { generateSuggestion, isGeneratingSuggestion } = useTopicMoodSuggester({
    hasApiKey: appState.hasApiKey,
  });

  const onGenerateTitle = useCallback(async () => {
    const generated = await generateTitle();
    if (generated) {
      songCtx.setTitle(generated);
      songCtx.setTitleOrigin('ai');
    }
  }, [generateTitle, songCtx]);

  const onSurprise = useCallback(async () => {
    const suggestion = await generateSuggestion();
    if (suggestion) {
      songCtx.setTopic(suggestion.topic);
      songCtx.setMood(suggestion.mood);
    }
  }, [generateSuggestion, songCtx]);

  const value = useMemo<ComposerParamsValue>(
    () => ({
      title: songCtx.title,
      setTitle: songCtx.setTitle,
      titleOrigin: songCtx.titleOrigin,
      setTitleOrigin: songCtx.setTitleOrigin,
      topic: songCtx.topic,
      setTopic: songCtx.setTopic,
      mood: songCtx.mood,
      setMood: songCtx.setMood,
      rhymeScheme: songCtx.rhymeScheme,
      setRhymeScheme: songCtx.setRhymeScheme,
      targetSyllables: songCtx.targetSyllables,
      setTargetSyllables: songCtx.setTargetSyllables,
      song: songCtx.song,
      isGenerating: composerCtx.isGenerating,
      quantizeSyllables: composerCtx.quantizeSyllables,
      isGeneratingTitle,
      onGenerateTitle,
      isSurprising: isGeneratingSuggestion,
      onSurprise,
      hasApiKey: appState.hasApiKey,
    }),
    [
      songCtx,
      composerCtx.isGenerating,
      composerCtx.quantizeSyllables,
      isGeneratingTitle,
      onGenerateTitle,
      isGeneratingSuggestion,
      onSurprise,
      appState.hasApiKey,
    ],
  );

  return (
    <ComposerParamsContext.Provider value={value}>
      {children}
    </ComposerParamsContext.Provider>
  );
}

export function useComposerParamsContext(): ComposerParamsValue {
  const ctx = useContext(ComposerParamsContext);
  if (!ctx) throw new Error('useComposerParamsContext must be used inside <ComposerParamsProvider>');
  return ctx;
}
