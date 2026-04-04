/**
 * useAppSession
 *
 * Composite hook — aggregates all session-level concerns that were
 * previously inlined in AppInnerContent.
 *
 * Responsibilities:
 *   - Session persistence (load/save localStorage)
 *   - Audio feedback
 *   - Similarity index reads
 *   - Topic/mood suggester lifecycle
 *   - Markup editor helpers
 *   - Derived app state
 *   - Title generation
 *   - App-level action handlers (generate, reset, modal openers)
 *   - Modal action handlers
 *   - Session action bindings
 *
 * Returns only the values AppInnerContent needs for render/navigation.
 */
import { useRef, useCallback } from 'react';
import { useSongContext } from '../contexts/SongContext';
import { useComposerContext } from '../contexts/ComposerContext';
import { useAppStateContext } from '../contexts/AppStateContext';
import { useAnalysisContext } from '../contexts/AnalysisContext';
import { useSimilarityContext } from '../contexts/SimilarityContext';
import { useSessionPersistence } from './useSessionPersistence';
import { useAudioFeedback } from './useAudioFeedback';
import { useTopicMoodSuggester } from './useTopicMoodSuggester';
import { useMarkupEditor } from './useMarkupEditor';
import { useDerivedAppState } from './useDerivedAppState';
import { useTitleGenerator } from './useTitleGenerator';
import { useAppHandlers } from './useAppHandlers';
import { useModalHandlers } from './useModalHandlers';
import { useSessionActions } from './useSessionActions';
import { useTranslation } from '../i18n';

export function useAppSession() {
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
    activeTab, setActiveTab, setIsLeftPanelOpen, setIsStructureOpen,
  } = appState;

  const { isAnalyzing } = useAnalysisContext();
  const { index: webSimilarityIndex, resetIndex: resetWebSimilarityIndex } = useSimilarityContext();

  // ── Session persistence ───────────────────────────────────────────────
  useSessionPersistence({
    song, structure, title, titleOrigin, topic, mood, rhymeScheme, targetSyllables,
    genre, tempo, instrumentation, rhythm, narrative, musicalPrompt, songLanguage,
    isSessionHydrated, setIsSessionHydrated, setHasSavedSession,
    replaceStateWithoutHistory, clearHistory,
  });

  // ── Audio feedback ────────────────────────────────────────────────────
  const { playAudioFeedback } = useAudioFeedback(audioFeedback);

  // Stable ref so DragHandlersProvider never re-renders on audio toggle.
  const playAudioFeedbackRef = useRef(playAudioFeedback);
  playAudioFeedbackRef.current = playAudioFeedback;

  // ── Topic/mood suggester ──────────────────────────────────────────────
  const { resetSuggestionCycle } = useTopicMoodSuggester({ hasApiKey });

  // ── Markup editor helpers ─────────────────────────────────────────────
  const { scrollToSection } = useMarkupEditor({
    editMode, markupText, markupTextareaRef, setEditMode, setMarkupText,
    updateSongAndStructureWithHistory,
  });

  // ── Derived state ─────────────────────────────────────────────────────
  const { hasRealLyricContent } = useDerivedAppState({ editMode, markupText, webSimilarityIndex });

  // ── Title generation ──────────────────────────────────────────────────
  const { generateTitle } = useTitleGenerator();
  const { t } = useTranslation();

  // ── Mobile structure + line clear callback ────────────────────────────
  const setIsStructureOpenAndClearLine = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setIsStructureOpen((prev: boolean) => {
        const next = typeof value === 'function' ? value(prev) : value;
        if (next) setSelectedLineId(null);
        return next;
      });
    },
    [setIsStructureOpen, setSelectedLineId],
  );

  const closeMobilePanels = useCallback(() => {
    setIsLeftPanelOpen(false);
    setIsStructureOpen(false);
    setSelectedLineId(null);
  }, [setIsLeftPanelOpen, setIsStructureOpen, setSelectedLineId]);

  // ── App-level handlers ────────────────────────────────────────────────
  const { handleGlobalRegenerate } = useAppHandlers({
    t, hasRealLyricContent, isMobileOrTablet: false, // resolved at call site, passed in
    setApiErrorModal: appState.setApiErrorModal,
    setConfirmModal: appState.setConfirmModal,
    setActiveTab, setIsLeftPanelOpen, setIsStructureOpen,
    generateTitle, generateSong, scrollToSection,
  });

  // ── Modal handlers ────────────────────────────────────────────────────
  const {
    handleOpenSettings,
    handleOpenAbout,
    handleSectionTargetLanguageChange,
  } = useModalHandlers({
    setIsPasteModalOpen: appState.setIsPasteModalOpen,
    setIsImportModalOpen: appState.setIsImportModalOpen,
    setIsExportModalOpen: appState.setIsExportModalOpen,
    setIsSettingsOpen: appState.setIsSettingsOpen,
    setIsAboutOpen: appState.setIsAboutOpen,
    setIsKeyboardShortcutsModalOpen: appState.setIsKeyboardShortcutsModalOpen,
    setIsSearchReplaceOpen: appState.setIsSearchReplaceOpen,
    setSectionTargetLanguages: useAnalysisContext().setSectionTargetLanguages,
  });

  // ── Session actions ───────────────────────────────────────────────────
  useSessionActions({
    song, structure, rhymeScheme, appState,
    replaceStateWithoutHistory, clearHistory, clearSelection,
    resetWebSimilarityIndex, resetSuggestionCycle,
    updateSongAndStructureWithHistory, setIsResetModalOpen,
  });

  return {
    playAudioFeedback,
    playAudioFeedbackRef,
    handleGlobalRegenerate,
    handleOpenSettings,
    handleOpenAbout,
    handleSectionTargetLanguageChange,
    setIsStructureOpenAndClearLine,
    closeMobilePanels,
    isAnalyzing,
  };
}
