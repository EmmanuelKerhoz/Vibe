/**
 * useEditorHandlers
 * Aggregates all action/handler hooks for AppEditorLayout.
 * Receives the output of useEditorState to avoid double context reads.
 */
import { useCallback } from 'react';
import { useTranslation } from '../i18n';
import { useSongEditor } from './useSongEditor';
import { useTitleGenerator } from './useTitleGenerator';
import { useTopicMoodSuggester } from './useTopicMoodSuggester';
import { useAppHandlers } from './useAppHandlers';
import { useModalHandlers } from './useModalHandlers';
import { useSessionActions } from './useSessionActions';
import { useLibraryActions } from './useLibraryActions';
import { useImportHandlers } from './useImportHandlers';
import type { useEditorState } from './useEditorState';

type EditorState = ReturnType<typeof useEditorState>;

interface UseEditorHandlersProps {
  state: EditorState;
  isMobileOrTablet: boolean;
}

export function useEditorHandlers({ state, isMobileOrTablet }: UseEditorHandlersProps) {
  const { t } = useTranslation();

  const {
    song, structure, rhymeScheme,
    appState, hasApiKey,
    setTopic, setMood,
    replaceStateWithoutHistory, clearHistory, clearSelection,
    resetWebSimilarityIndex,
    updateSongAndStructureWithHistory,
    setSongLanguage,
    setPastedText,
    setSectionTargetLanguages,
    hasRealLyricContent,
    scrollToSectionFn,
    generateSong,
  } = state;

  const {
    activeTab: _activeTab,
    setActiveTab,
    setIsLeftPanelOpen,
    setIsStructureOpen,
    setApiErrorModal,
    setConfirmModal,
    setIsPasteModalOpen,
    setIsImportModalOpen,
    setIsExportModalOpen,
    setIsSettingsOpen,
    setIsAboutOpen,
    setIsKeyboardShortcutsModalOpen,
    setIsSearchReplaceOpen,
    setIsResetModalOpen,
    setIsSaveToLibraryModalOpen,
    setIsSavingToLibrary,
    setSimilarityMatches,
    setLibraryCount,
    setLibraryAssets,
    setIsAnalysisPanelOpen,
    importInputRef,
  } = appState;

  // ── Song editor (add/remove structure, file analysis) ───────────────────
  const { removeStructureItem, addStructureItem, loadFileForAnalysis } = useSongEditor({
    openPasteModalWithText: (text: string) => {
      setPastedText(text);
      setIsPasteModalOpen(true);
    },
  });

  // ── Title generator ─────────────────────────────────────────────────────
  const { generateTitle, isGeneratingTitle } = useTitleGenerator();

  // ── Topic/mood suggester ─────────────────────────────────────────────────
  const {
    generateSuggestion: handleSurprise,
    isGeneratingSuggestion: isSurprising,
    resetSuggestionCycle,
  } = useTopicMoodSuggester({ hasApiKey });

  const handleSurpriseClick = useCallback(async () => {
    const suggestion = await handleSurprise();
    if (suggestion) {
      setTopic(suggestion.topic);
      setMood(suggestion.mood);
    }
  }, [handleSurprise, setMood, setTopic]);

  // ── App-level handlers ───────────────────────────────────────────────────
  const {
    handleApiKeyHelp,
    handleTitleChange,
    handleGenerateTitle,
    handleGlobalRegenerate,
    handleScrollToSection,
    handleOpenNewGeneration,
  } = useAppHandlers({
    t,
    hasRealLyricContent,
    isMobileOrTablet,
    setApiErrorModal,
    setConfirmModal,
    setActiveTab,
    setIsLeftPanelOpen,
    setIsStructureOpen,
    generateTitle,
    generateSong,
    scrollToSection: scrollToSectionFn,
  });

  // ── Modal handlers ───────────────────────────────────────────────────────
  const {
    handleOpenPasteModal,
    handleOpenImport,
    handleOpenExport,
    handleOpenSettings,
    handleOpenAbout,
    handleOpenKeyboardShortcuts,
    handleOpenSearch,
    handleSectionTargetLanguageChange,
  } = useModalHandlers({
    setIsPasteModalOpen,
    setIsImportModalOpen,
    setIsExportModalOpen,
    setIsSettingsOpen,
    setIsAboutOpen,
    setIsKeyboardShortcutsModalOpen,
    setIsSearchReplaceOpen,
    setSectionTargetLanguages,
  });

  // ── Session actions ──────────────────────────────────────────────────────
  const { handleCreateEmptySong } = useSessionActions({
    song,
    structure,
    rhymeScheme,
    appState,
    replaceStateWithoutHistory,
    clearHistory,
    clearSelection,
    resetWebSimilarityIndex,
    resetSuggestionCycle,
    updateSongAndStructureWithHistory,
    setIsResetModalOpen,
  });

  // ── Library actions ──────────────────────────────────────────────────────
  const { handleOpenSaveToLibraryModal } = useLibraryActions({
    song,
    replaceStateWithoutHistory,
    clearHistory,
    setSimilarityMatches,
    setLibraryCount,
    setLibraryAssets,
    setIsSavingToLibrary,
    setIsSaveToLibraryModalOpen,
  });

  // ── Import handlers ──────────────────────────────────────────────────────
  const { handleImportInputChange, handleImportChooseFile } = useImportHandlers({
    importInputRef,
    loadFileForAnalysis,
    setIsImportModalOpen,
    setIsPasteModalOpen,
    setPastedText,
    setSongLanguage,
  });

  // ── Derived composite callbacks ──────────────────────────────────────────
  const handleGenerateSongFromLeftPanel = useCallback(() => {
    setIsLeftPanelOpen(false);
    handleGlobalRegenerate();
  }, [setIsLeftPanelOpen, handleGlobalRegenerate]);

  const handleToggleAnalysisPanel = useCallback(() => {
    setIsAnalysisPanelOpen((prev: boolean) => !prev);
  }, [setIsAnalysisPanelOpen]);

  const handleCloseAnalysisPanel = useCallback(() => {
    setIsAnalysisPanelOpen(false);
  }, [setIsAnalysisPanelOpen]);

  return {
    // Song structure
    removeStructureItem,
    addStructureItem,
    loadFileForAnalysis,
    // Title
    handleTitleChange,
    handleGenerateTitle,
    isGeneratingTitle,
    // Surprise
    handleSurpriseClick,
    isSurprising,
    // App handlers
    handleApiKeyHelp,
    handleGlobalRegenerate,
    handleScrollToSection,
    handleOpenNewGeneration,
    // Modal handlers
    handleOpenPasteModal,
    handleOpenImport,
    handleOpenExport,
    handleOpenSettings,
    handleOpenAbout,
    handleOpenKeyboardShortcuts,
    handleOpenSearch,
    handleSectionTargetLanguageChange,
    // Session
    handleCreateEmptySong,
    // Library
    handleOpenSaveToLibraryModal,
    // Import
    handleImportInputChange,
    handleImportChooseFile,
    // Composite
    handleGenerateSongFromLeftPanel,
    handleToggleAnalysisPanel,
    handleCloseAnalysisPanel,
  };
}
