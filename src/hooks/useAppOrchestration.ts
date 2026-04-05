/**
 * useAppOrchestration
 *
 * Composite hook that groups the non-visual orchestration concerns
 * previously inlined in AppInnerContent:
 *   - session persistence
 *   - audio feedback
 *   - markup editor
 *   - app handlers (generate, navigation)
 *   - modal handlers
 *   - session actions (reset, import, export)
 *   - analysis context bridge
 *   - web similarity index
 *   - topic/mood suggestions
 *   - derived app state
 *   - title generator
 *
 * Returns only the values that AppInnerContent needs to wire into JSX or
 * pass to child components.
 */
import { useRef } from 'react';
import { useTranslation } from '../i18n';
import { useAudioFeedback } from './useAudioFeedback';
import { useMarkupEditor } from './useMarkupEditor';
import { useAppHandlers } from './useAppHandlers';
import { useModalHandlers } from './useModalHandlers';
import { useSessionActions } from './useSessionActions';
import { useSessionPersistence } from './useSessionPersistence';
import { useDerivedAppState } from './useDerivedAppState';
import { useTopicMoodSuggester } from './useTopicMoodSuggester';
import { useTitleGenerator } from './useTitleGenerator';
import { useSimilarityContext } from '../contexts/SimilarityContext';
import { useAnalysisContext } from '../contexts/AnalysisContext';
import { useSongContext } from '../contexts/SongContext';
import { useComposerContext } from '../contexts/ComposerContext';
import { useAppStateContext } from '../contexts/AppStateContext';

export interface AppOrchestrationResult {
  // Audio
  playAudioFeedback: ReturnType<typeof useAudioFeedback>['playAudioFeedback'];
  playAudioFeedbackRef: React.MutableRefObject<ReturnType<typeof useAudioFeedback>['playAudioFeedback']>;
  // Markup / editor
  scrollToSection: ReturnType<typeof useMarkupEditor>['scrollToSection'];
  // Handlers
  handleGlobalRegenerate: ReturnType<typeof useAppHandlers>['handleGlobalRegenerate'];
  handleOpenSettings: ReturnType<typeof useModalHandlers>['handleOpenSettings'];
  handleOpenAbout: ReturnType<typeof useModalHandlers>['handleOpenAbout'];
  handleSectionTargetLanguageChange: ReturnType<typeof useModalHandlers>['handleSectionTargetLanguageChange'];
  // Analysis
  isAnalyzing: ReturnType<typeof useAnalysisContext>['isAnalyzing'];
  sectionTargetLanguages: ReturnType<typeof useAnalysisContext>['sectionTargetLanguages'];
  setSectionTargetLanguages: ReturnType<typeof useAnalysisContext>['setSectionTargetLanguages'];
  adaptSectionLanguage: ReturnType<typeof useAnalysisContext>['adaptSectionLanguage'];
  adaptLineLanguage: ReturnType<typeof useAnalysisContext>['adaptLineLanguage'];
  adaptingLineIds: ReturnType<typeof useAnalysisContext>['adaptingLineIds'];
  // Derived
  hasRealLyricContent: boolean;
}

export function useAppOrchestration(): AppOrchestrationResult {
  const {
    song, structure,
    title, titleOrigin, topic, mood, rhymeScheme, targetSyllables,
    genre, tempo, instrumentation, rhythm, narrative, musicalPrompt,
    songLanguage,
    replaceStateWithoutHistory, clearHistory,
    updateSongAndStructureWithHistory,
  } = useSongContext();

  const { selectedLineId, setSelectedLineId, clearSelection, generateSong } = useComposerContext();

  const { appState } = useAppStateContext();
  const {
    audioFeedback,
    editMode, markupText, markupTextareaRef, setEditMode, setMarkupText,
    isSessionHydrated, setIsSessionHydrated, setHasSavedSession,
    setIsResetModalOpen,
    hasApiKey,
    setActiveTab, setIsLeftPanelOpen, setIsStructureOpen,
  } = appState;

  // ── Session persistence ──────────────────────────────────────────────────
  useSessionPersistence({
    song, structure, title, titleOrigin, topic, mood, rhymeScheme, targetSyllables,
    genre, tempo, instrumentation, rhythm, narrative, musicalPrompt, songLanguage,
    isSessionHydrated, setIsSessionHydrated, setHasSavedSession,
    replaceStateWithoutHistory, clearHistory,
  });

  // ── Audio feedback ───────────────────────────────────────────────────────
  const { playAudioFeedback } = useAudioFeedback(audioFeedback);
  const playAudioFeedbackRef = useRef(playAudioFeedback);
  playAudioFeedbackRef.current = playAudioFeedback;

  // ── Analysis bridge ──────────────────────────────────────────────────────
  const {
    isAnalyzing,
    sectionTargetLanguages, setSectionTargetLanguages,
    adaptSectionLanguage, adaptLineLanguage, adaptingLineIds,
  } = useAnalysisContext();

  // ── Similarity + suggestions ─────────────────────────────────────────────
  const { index: webSimilarityIndex, resetIndex: resetWebSimilarityIndex } = useSimilarityContext();
  const { resetSuggestionCycle } = useTopicMoodSuggester({ hasApiKey });

  // ── Markup editor ────────────────────────────────────────────────────────
  const { scrollToSection } = useMarkupEditor({
    editMode, markupText, markupTextareaRef, setEditMode, setMarkupText,
    updateSongAndStructureWithHistory,
  });

  // ── Derived state ────────────────────────────────────────────────────────
  const { hasRealLyricContent } = useDerivedAppState({ editMode, markupText, webSimilarityIndex });

  // ── Title generator ──────────────────────────────────────────────────────
  const { generateTitle } = useTitleGenerator();
  const { t } = useTranslation();

  // ── App handlers ─────────────────────────────────────────────────────────
  const { handleGlobalRegenerate } = useAppHandlers({
    t, hasRealLyricContent, isMobileOrTablet: false, // resolved by caller via useMobileLayout
    setApiErrorModal: appState.setApiErrorModal, setConfirmModal: appState.setConfirmModal,
    setActiveTab, setIsLeftPanelOpen, setIsStructureOpen,
    generateTitle, generateSong, scrollToSection,
  });

  // ── Modal handlers ───────────────────────────────────────────────────────
  const { handleOpenSettings, handleOpenAbout, handleSectionTargetLanguageChange } = useModalHandlers({
    setIsPasteModalOpen: appState.setIsPasteModalOpen,
    setIsImportModalOpen: appState.setIsImportModalOpen,
    setIsExportModalOpen: appState.setIsExportModalOpen,
    setIsSettingsOpen: appState.setIsSettingsOpen,
    setIsAboutOpen: appState.setIsAboutOpen,
    setIsKeyboardShortcutsModalOpen: appState.setIsKeyboardShortcutsModalOpen,
    setIsSearchReplaceOpen: appState.setIsSearchReplaceOpen,
    setSectionTargetLanguages,
  });

  // ── Session actions ──────────────────────────────────────────────────────
  useSessionActions({
    song, structure, rhymeScheme, appState,
    replaceStateWithoutHistory, clearHistory, clearSelection,
    resetWebSimilarityIndex, resetSuggestionCycle,
    updateSongAndStructureWithHistory, setIsResetModalOpen,
  });

  return {
    playAudioFeedback,
    playAudioFeedbackRef,
    scrollToSection,
    handleGlobalRegenerate,
    handleOpenSettings,
    handleOpenAbout,
    handleSectionTargetLanguageChange,
    isAnalyzing,
    sectionTargetLanguages,
    setSectionTargetLanguages,
    adaptSectionLanguage,
    adaptLineLanguage,
    adaptingLineIds,
    hasRealLyricContent,
  };
}
