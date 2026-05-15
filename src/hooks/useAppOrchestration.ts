/**
 * useAppOrchestration
 *
 * Composite hook that groups the non-visual orchestration concerns
 * previously inlined in AppInnerContent:
 *   - session persistence
 *   - audio feedback
 *   - scroll to section (atomic — no sync effect)
 *   - app handlers (generate, navigation)
 *   - modal handlers
 *   - analysis context bridge
 *   - web similarity index
 *   - topic/mood suggestions
 *   - derived app state
 *   - title generator
 *
 * Returns only the values that AppInnerContent needs to wire into JSX or
 * pass to child components.
 *
 * isMobileOrTablet is received as a parameter (computed once in
 * AppInnerContent via useMobileLayout) to avoid a duplicate matchMedia
 * listener that would otherwise fire on every breakpoint change.
 *
 * Note: useSessionActions (resetSong) is intentionally NOT called here.
 * It is instantiated in AppModalLayer which is the sole consumer of resetSong.
 */
import { useTranslation } from '../i18n';
import { useAudioFeedback } from './useAudioFeedback';
import { useScrollToSection } from './useScrollToSection';
import { useAppHandlers } from './useAppHandlers';
import { useModalHandlers } from './useModalHandlers';
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
  playAudioFeedbackRef: ReturnType<typeof useAudioFeedback>['playAudioFeedbackRef'];
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

export function useAppOrchestration(isMobileOrTablet: boolean): AppOrchestrationResult {
  const { t } = useTranslation();

  const {
    song,
    rhymeScheme,
    replaceStateWithoutHistory, clearHistory,
    updateSongAndStructureWithHistory,
  } = useSongContext();

  const { clearSelection, generateSong } = useComposerContext();

  const { appState } = useAppStateContext();
  const {
    audioFeedback,
    editMode, markupText, markupTextareaRef, setEditMode, setMarkupText,
    isSessionHydrated, setIsSessionHydrated, setHasSavedSession,
    hasApiKey,
    setActiveTab, setIsLeftPanelOpen, setIsStructureOpen,
  } = appState;

  // ── Session persistence ──────────────────────────────────────────────────
  useSessionPersistence({
    isSessionHydrated, setIsSessionHydrated, setHasSavedSession,
  });

  // ── Audio feedback ───────────────────────────────────────────────────────
  const { playAudioFeedback, playAudioFeedbackRef } = useAudioFeedback(audioFeedback);

  // ── Analysis bridge ──────────────────────────────────────────────────────
  const {
    isAnalyzing,
    sectionTargetLanguages, setSectionTargetLanguages,
    adaptSectionLanguage, adaptLineLanguage, adaptingLineIds,
  } = useAnalysisContext();

  // ── Similarity + suggestions ─────────────────────────────────────────────
  const { index: webSimilarityIndex } = useSimilarityContext();
  useTopicMoodSuggester({ hasApiKey });

  // ── Scroll to section (atomic — no sync effect) ──────────────────────────
  const { scrollToSection } = useScrollToSection({
    editMode,
    markupText,
    markupTextareaRef,
  });

  // ── Derived state ────────────────────────────────────────────────────────
  const { hasRealLyricContent } = useDerivedAppState({ editMode, markupText, webSimilarityIndex });

  // ── Title generator ──────────────────────────────────────────────────────
  const { generateTitle } = useTitleGenerator();

  // ── App handlers ─────────────────────────────────────────────────────────
  const { handleGlobalRegenerate } = useAppHandlers({
    t,
    hasRealLyricContent, isMobileOrTablet,
    setApiErrorModal: appState.setApiErrorModal, setConfirmModal: appState.setConfirmModal,
    setActiveTab, setIsLeftPanelOpen, setIsStructureOpen,
    generateSong, scrollToSection,
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

  return {
    playAudioFeedback,
    playAudioFeedbackRef,
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
