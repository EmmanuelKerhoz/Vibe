import React, { useEffect, useRef, useCallback } from 'react';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';
import { DEFAULT_STRUCTURE } from './constants/editor';
import { useAudioFeedback } from './hooks/useAudioFeedback';
import { useSongAnalysis } from './hooks/useSongAnalysis';
import { useSongEditor } from './hooks/useSongEditor';
import { useSongComposer } from './hooks/useSongComposer';
import { useSongHistoryState } from './hooks/useSongHistoryState';
import { useTitleGenerator } from './hooks/useTitleGenerator';
import { useTopicMoodSuggester } from './hooks/useTopicMoodSuggester';
import { useSimilarityEngine } from './hooks/useSimilarityEngine';
import { useAppKpis } from './hooks/useAppKpis';
import { useAppState } from './hooks/useAppState';
import { useSessionPersistence } from './hooks/useSessionPersistence';
import { useVersionManager } from './hooks/useVersionManager';
import { useMarkupEditor } from './hooks/useMarkupEditor';
import { useMobileLayout } from './hooks/useMobileLayout';
import { LeftSettingsPanel } from './components/app/LeftSettingsPanel';
import { TopRibbon } from './components/app/TopRibbon';
import { StructureSidebar } from './components/app/StructureSidebar';
import { StatusBar } from './components/app/StatusBar';
import { MusicalTab } from './components/app/MusicalTab';
import { InsightsBar } from './components/app/InsightsBar';
import { LyricsView } from './components/app/LyricsView';
import { AppModals } from './components/app/AppModals';
import { MobileBottomNav } from './components/app/MobileBottomNav';
import { useTranslation, useLanguage } from './i18n';
import { findSimilarAssetsInLibrary, saveAssetToLibrary, loadLibraryAssets, deleteAssetFromLibrary, loadAssetIntoEditor, type LibraryAsset } from './utils/libraryUtils';
import { createEmptySong, isPristineDraft, DEFAULT_TOPIC, DEFAULT_MOOD } from './utils/songDefaults';
import { buildResetPayload, buildPartialResetPayload, clearPersistedSession } from './utils/sessionReset';

// ─────────────────────────────────────────────────────────────────────────────
// Dispatch-style setter bag produced by useAppState
// ─────────────────────────────────────────────────────────────────────────────
type StateBag = ReturnType<typeof useAppState>;

/**
 * Applies a full ResetPayload to the state bag in one pass.
 * Keeps App.tsx free of per-field reset logic.
 */
function applyResetPayload(
  payload: ReturnType<typeof buildResetPayload>,
  replaceStateWithoutHistory: (song: ReturnType<typeof createEmptySong>, structure: string[]) => void,
  clearHistory: () => void,
  clearSelection: () => void,
  resetWebSimilarityIndex: () => void,
  s: StateBag,
) {
  replaceStateWithoutHistory(payload.song, payload.structure);
  clearHistory();
  clearPersistedSession();
  clearSelection();
  s.setHasSavedSession(payload.hasSavedSession);
  s.setTitle(payload.title);
  s.setTitleOrigin(payload.titleOrigin);
  s.setTopic(payload.topic);
  s.setMood(payload.mood);
  s.setRhymeScheme(payload.rhymeScheme);
  s.setTargetSyllables(payload.targetSyllables);
  s.setGenre(payload.genre);
  s.setTempo(payload.tempo);
  s.setInstrumentation(payload.instrumentation);
  s.setRhythm(payload.rhythm);
  s.setNarrative(payload.narrative);
  s.setMusicalPrompt(payload.musicalPrompt);
  s.setMarkupText(payload.markupText);
  s.setActiveTab(payload.activeTab);
  s.setIsLeftPanelOpen(payload.isLeftPanelOpen);
  s.setSimilarityMatches(payload.similarityMatches);
  resetWebSimilarityIndex();
}

export default function App() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { song, structure, past, future, updateState, updateSongWithHistory, updateStructureWithHistory,
    updateSongAndStructureWithHistory, replaceStateWithoutHistory, clearHistory, undo, redo,
  } = useSongHistoryState(createEmptySong(DEFAULT_STRUCTURE, 'AABB'), DEFAULT_STRUCTURE);

  const appState = useAppState();
  const {
    theme, setTheme, activeTab, setActiveTab, isStructureOpen, setIsStructureOpen, isLeftPanelOpen, setIsLeftPanelOpen,
    title, setTitle, titleOrigin, setTitleOrigin, topic, setTopic, mood, setMood,
    rhymeScheme, setRhymeScheme, targetSyllables, setTargetSyllables, genre, setGenre, tempo, setTempo,
    instrumentation, setInstrumentation, rhythm, setRhythm, narrative, setNarrative, musicalPrompt, setMusicalPrompt,
    audioFeedback, setAudioFeedback, newSectionName, setNewSectionName,
    draggedItemIndex, setDraggedItemIndex, dragOverIndex, setDragOverIndex,
    draggedLineInfo, setDraggedLineInfo, dragOverLineInfo, setDragOverLineInfo,
    similarityMatches, setSimilarityMatches, libraryCount, setLibraryCount, libraryAssets, setLibraryAssets,
    isSavingToLibrary, setIsSavingToLibrary, isMarkupMode, setIsMarkupMode, markupText, setMarkupText,
    isAboutOpen, setIsAboutOpen, isSettingsOpen, setIsSettingsOpen,
    apiErrorModal, setApiErrorModal, isImportModalOpen, setIsImportModalOpen,
    isExportModalOpen, setIsExportModalOpen,
    isSectionDropdownOpen, setIsSectionDropdownOpen, isSimilarityModalOpen, setIsSimilarityModalOpen,
    isSaveToLibraryModalOpen, setIsSaveToLibraryModalOpen, isVersionsModalOpen, setIsVersionsModalOpen,
    isResetModalOpen, setIsResetModalOpen, shouldAutoGenerateTitle, setShouldAutoGenerateTitle,
    confirmModal, setConfirmModal, promptModal, setPromptModal,
    setHasSavedSession, isSessionHydrated, setIsSessionHydrated, hasApiKey, importInputRef, markupTextareaRef,
    songLanguage, setSongLanguage,
  } = appState;

  // ── Mobile layout ────────────────────────────────────────────────────────
  const { isMobile, isTablet } = useMobileLayout();
  const isMobileOrTablet = isMobile || isTablet;

  const prevIsMobileOrTablet = useRef(isMobileOrTablet);
  useEffect(() => {
    if (isMobileOrTablet && !prevIsMobileOrTablet.current) {
      setIsLeftPanelOpen(false);
      setIsStructureOpen(false);
    }
    prevIsMobileOrTablet.current = isMobileOrTablet;
  }, [isMobileOrTablet, setIsLeftPanelOpen, setIsStructureOpen]);

  const mobileInitRef = useRef(false);
  useEffect(() => {
    if (mobileInitRef.current) return;
    mobileInitRef.current = true;
    if (isMobileOrTablet) {
      setIsLeftPanelOpen(false);
      setIsStructureOpen(false);
    }
  }, [isMobileOrTablet, setIsLeftPanelOpen, setIsStructureOpen]);

  const closeMobilePanels = useCallback(() => {
    setIsLeftPanelOpen(false);
    setIsStructureOpen(false);
  }, [setIsLeftPanelOpen, setIsStructureOpen]);

  // fix: backdrop must only appear on mobile/tablet — never on desktop
  const showBackdrop = isMobileOrTablet && (isLeftPanelOpen || isStructureOpen);

  useSessionPersistence({
    song, structure, title, titleOrigin, topic, mood, rhymeScheme, targetSyllables,
    genre, tempo, instrumentation, rhythm, narrative, musicalPrompt, songLanguage,
    isSessionHydrated, setIsSessionHydrated, setHasSavedSession, replaceStateWithoutHistory, clearHistory,
    setTitle, setTitleOrigin, setTopic, setMood, setRhymeScheme, setTargetSyllables,
    setGenre, setTempo, setInstrumentation, setRhythm, setNarrative, setMusicalPrompt,
    setSongLanguage,
  });
  const { versions, saveVersion, rollbackToVersion, handleRequestVersionName } = useVersionManager({
    song, structure, title, titleOrigin, topic, mood, updateSongAndStructureWithHistory,
    setIsVersionsModalOpen, setPromptModal, setTitle, setTitleOrigin, setTopic, setMood,
  });
  const { playAudioFeedback } = useAudioFeedback(audioFeedback);
  const { scrollToSection, handleMarkupToggle } = useMarkupEditor({
    song, isMarkupMode, markupText, markupTextareaRef, setIsMarkupMode, setMarkupText, updateSongAndStructureWithHistory,
  });

  // ── isGenerating bridge ──────────────────────────────────────────────────
  // React hooks must be called in declaration order: useSongAnalysis is
  // instantiated BEFORE useSongComposer, so isGenerating is not yet in scope.
  // Passing it as a plain prop would create a stale closure (the analysis
  // engine would always see the initial `false` value).
  // Solution: a ref that is kept in sync via the useEffect below.
  // The analysis engine reads isGeneratingRef.current synchronously at call
  // time, always getting the live value without re-rendering.
  const isGeneratingRef = useRef(false);

  // ── useSongAnalysis ──────────────────────────────────────────────────────
  const { isPasteModalOpen, setIsPasteModalOpen, pastedText, setPastedText,
    isAnalyzing, isAnalysisModalOpen, setIsAnalysisModalOpen, analysisReport, analysisSteps,
    appliedAnalysisItems, selectedAnalysisItems, isApplyingAnalysis, targetLanguage, setTargetLanguage,
    isAdaptingLanguage, isDetectingLanguage, adaptationProgress, adaptationResult,
    sectionTargetLanguages, setSectionTargetLanguages,
    toggleAnalysisItemSelection, applySelectedAnalysisItems,
    analyzeCurrentSong, detectLanguage, adaptSongLanguage, adaptSectionLanguage, analyzePastedLyrics, clearAppliedAnalysisItems,
  } = useSongAnalysis({ song, topic, mood, rhymeScheme, uiLanguage: language,
    isGenerating: isGeneratingRef.current,
    songLanguage, setSongLanguage,
    setTopic, setMood, saveVersion,
    updateState, updateSongAndStructureWithHistory,
    clearLineSelection: () => clearSelection(), requestAutoTitleGeneration: () => setShouldAutoGenerateTitle(true),
  });

  // ── useSongComposer ──────────────────────────────────────────────────────
  const { isGenerating, isRegeneratingSection, isGeneratingMusicalPrompt, isAnalyzingLyrics,
    selectedLineId, setSelectedLineId, suggestions, isSuggesting, generateSong, regenerateSection,
    quantizeSyllables, generateSuggestions, updateLineText, handleLineKeyDown, applySuggestion,
    generateMusicalPrompt, analyzeLyricsForMusic, handleLineClick, handleInstructionChange, addInstruction, removeInstruction, clearSelection,
  } = useSongComposer({ song, structure, topic, mood, rhymeScheme, targetSyllables, title,
    genre, tempo, instrumentation, rhythm, narrative, songLanguage, uiLanguage: language,
    setMusicalPrompt, setGenre, setTempo, setInstrumentation, setRhythm, setNarrative,
    updateState, updateSongWithHistory, updateSongAndStructureWithHistory,
    requestAutoTitleGeneration: () => setShouldAutoGenerateTitle(true),
  });

  // Keep the ref in sync with the reactive value (see bridge comment above)
  useEffect(() => { isGeneratingRef.current = isGenerating; }, [isGenerating]);

  const { removeStructureItem, addStructureItem, normalizeStructure, handleDrop,
    handleLineDragStart, handleLineDrop, exportSong, loadFileForAnalysis,
  } = useSongEditor({ song, structure, newSectionName, setNewSectionName,
    draggedItemIndex, setDraggedItemIndex, setDragOverIndex, draggedLineInfo, setDraggedLineInfo, setDragOverLineInfo,
    updateState, updateStructureWithHistory, updateSongAndStructureWithHistory, title, topic, mood,
    openPasteModalWithText: (text: string) => { setPastedText(text); setIsPasteModalOpen(true); }, playAudioFeedback,
  });

  const { generateTitle, isGeneratingTitle } = useTitleGenerator(song, topic, mood, songLanguage);
  const { generateSuggestion: handleSurprise, isGeneratingSuggestion: isSurprising } =
    useTopicMoodSuggester(topic, mood, setTopic, setMood);
  const handleSurpriseClick = useCallback(async () => {
    const suggestion = await handleSurprise();
    if (suggestion) { setTopic(suggestion.topic); setMood(suggestion.mood); }
  }, [handleSurprise, setTopic, setMood]);

  const { index: webSimilarityIndex, triggerNow: triggerWebSimilarity, resetIndex: resetWebSimilarityIndex } = useSimilarityEngine(song, title);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.key === 'Escape') {
        if (promptModal?.open) { setPromptModal(null); return; }
        if (confirmModal?.open) { setConfirmModal(null); return; }
        if (apiErrorModal.open) { setApiErrorModal({ open: false, message: '' }); return; }
        if (isResetModalOpen) { setIsResetModalOpen(false); return; }
        if (isVersionsModalOpen) { setIsVersionsModalOpen(false); return; }
        if (isSaveToLibraryModalOpen) { setIsSaveToLibraryModalOpen(false); return; }
        if (isSimilarityModalOpen) { setIsSimilarityModalOpen(false); return; }
        if (isAnalysisModalOpen) { setIsAnalysisModalOpen(false); return; }
        if (isPasteModalOpen) { setIsPasteModalOpen(false); return; }
        if (isExportModalOpen) { setIsExportModalOpen(false); return; }
        if (isImportModalOpen) { setIsImportModalOpen(false); return; }
        if (isSettingsOpen) { setIsSettingsOpen(false); return; }
        if (isAboutOpen) { setIsAboutOpen(false); return; }
        if (isMobileOrTablet) { closeMobilePanels(); return; }
        return;
      }
      if (!(e.ctrlKey || e.metaKey) || e.key !== 'z') return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    apiErrorModal.open, confirmModal, isAboutOpen, isAnalysisModalOpen, isExportModalOpen,
    isImportModalOpen, isPasteModalOpen, isResetModalOpen, isSaveToLibraryModalOpen,
    isSettingsOpen, isSimilarityModalOpen, isVersionsModalOpen, promptModal,
    isMobileOrTablet, closeMobilePanels,
    redo, setApiErrorModal, setConfirmModal, setIsAboutOpen, setIsAnalysisModalOpen,
    setIsExportModalError, setIsImportModalOpen, setIsPasteModalOpen, setIsResetModalOpen,
    setIsSaveToLibraryModalOpen, setIsSettingsOpen, setIsSimilarityModalOpen, setIsVersionsModalOpen,
    setPromptModal, undo,
  ]);

  useEffect(() => {
    if (!shouldAutoGenerateTitle || song.length === 0) return;
    let isCancelled = false;
    const run = async () => {
      const newTitle = await generateTitle();
      if (!isCancelled && newTitle) { setTitle(newTitle); setTitleOrigin('ai'); }
      if (!isCancelled) setShouldAutoGenerateTitle(false);
    };
    void run();
    return () => { isCancelled = true; };
  }, [generateTitle, shouldAutoGenerateTitle, song.length, setTitle, setTitleOrigin, setShouldAutoGenerateTitle]);

  const { sectionCount, wordCount, charCount } = useAppKpis(song);

  // ── Library similarity — debounced 800ms ─────────────────────────────────
  const similarityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (similarityDebounceRef.current) clearTimeout(similarityDebounceRef.current);
    let isCancelled = false;
    similarityDebounceRef.current = setTimeout(() => {
      const runSimilarity = async () => {
        if (song.length === 0) { setSimilarityMatches([]); return; }
        const matches = await findSimilarAssetsInLibrary(song, 0, 3);
        if (!isCancelled) setSimilarityMatches(matches);
      };
      void runSimilarity();
    }, 800);
    return () => {
      isCancelled = true;
      if (similarityDebounceRef.current) clearTimeout(similarityDebounceRef.current);
    };
  }, [song, setSimilarityMatches]);

  // ── Library count — loaded once on mount ─────────────────────────────────
  useEffect(() => {
    const loadCount = async () => {
      try {
        const c = localStorage.getItem('lyricist_library');
        if (c) setLibraryCount(JSON.parse(c).length);
      } catch (e) {
        console.error('Failed to load library count:', e);
      }
    };
    void loadCount();
  }, [setLibraryCount]);

  const introOutroSortedRef = useRef<string | null>(null);
  useEffect(() => {
    if (song.length === 0) return;
    const introIdx = song.findIndex(s => s.name.toLowerCase() === 'intro');
    const outroIdx = song.findIndex(s => s.name.toLowerCase() === 'outro');
    if (introIdx <= 0 && (outroIdx === -1 || outroIdx === song.length - 1)) return;
    const others = song.filter(s => s.name.toLowerCase() !== 'intro' && s.name.toLowerCase() !== 'outro');
    const sorted = [...(introIdx !== -1 ? [song[introIdx]!] : []), ...others, ...(outroIdx !== -1 ? [song[outroIdx]!] : [])];
    const key = JSON.stringify(sorted.map(s => s.id));
    if (key === introOutroSortedRef.current) return;
    introOutroSortedRef.current = key;
    updateSongAndStructureWithHistory(sorted, sorted.map(s => s.name));
  }, [song, updateSongAndStructureWithHistory]);

  const hasRealLyricContent = song.some(s => s.lines.some(l => !l.isMeta && l.text.trim().length > 0));
  const hasExistingWork = (hasRealLyricContent && !isPristineDraft(song, structure, rhymeScheme))
    || topic !== DEFAULT_TOPIC || mood !== DEFAULT_MOOD || (isMarkupMode && markupText.trim().length > 0);

  const webBadgeLabel = webSimilarityIndex.status === 'done' && webSimilarityIndex.candidates.length > 0
    ? `${webSimilarityIndex.candidates[0]?.score}%` : null;

  const handleApiKeyHelp = () => setApiErrorModal({ open: true, message: t.tooltips.aiUnavailableHelp });
  const handleTitleChange = (value: string) => { setTitle(value); setTitleOrigin('user'); };
  const handleGenerateTitle = async () => { const t2 = await generateTitle(); if (t2) { setTitle(t2); setTitleOrigin('ai'); } };

  const handleGlobalRegenerate = () => {
    if (hasRealLyricContent) {
      setConfirmModal({ open: true, onConfirm: () => { setConfirmModal(null); void generateSong(); } });
    } else {
      void generateSong();
    }
  };

  const handleScrollToSection = useCallback((sectionId: string) => {
    const sec = song.find(s => s.id === sectionId);
    if (sec) scrollToSection(sec);
  }, [song, scrollToSection]);

  const handleOpenSaveToLibraryModal = useCallback(async () => {
    setLibraryAssets(await loadLibraryAssets());
    setIsSaveToLibraryModalOpen(true);
  }, [setLibraryAssets, setIsSaveToLibraryModalOpen]);

  const handleOpenNewGeneration = useCallback(() => {
    setActiveTab('lyrics');
    setIsLeftPanelOpen(true);
    if (isMobileOrTablet) setIsStructureOpen(false);
  }, [isMobileOrTablet, setActiveTab, setIsLeftPanelOpen, setIsStructureOpen]);

  // ── Reset handlers — dep-array: 1 stable entry each ─────────────────────
  const handleCreateEmptySong = useCallback(() => {
    applyResetPayload(
      buildResetPayload('AABB'),
      replaceStateWithoutHistory, clearHistory, clearSelection, resetWebSimilarityIndex,
      appState,
    );
  }, [appState, clearHistory, clearSelection, replaceStateWithoutHistory, resetWebSimilarityIndex]);

  const resetSong = useCallback(() => {
    const partial = buildPartialResetPayload(rhymeScheme);
    updateSongAndStructureWithHistory(partial.song, partial.structure);
    clearPersistedSession();
    appState.setHasSavedSession(false);
    clearSelection();
    appState.setMarkupText('');
    appState.setSimilarityMatches([]);
    resetWebSimilarityIndex();
    setIsResetModalOpen(false);
  }, [appState, clearSelection, resetWebSimilarityIndex, rhymeScheme, setIsResetModalOpen, updateSongAndStructureWithHistory]);

  const handleSaveToLibrary = async () => {
    if (song.length === 0) return;
    setIsSavingToLibrary(true);
    try {
      await saveAssetToLibrary({ title: title || 'Untitled Song', type: 'song', sections: song, metadata: { topic, mood, genre, tempo: parseInt(tempo) || 120, instrumentation, rhythm, narrative, musicalPrompt } });
      const updated = await loadLibraryAssets(); setLibraryCount(updated.length); setLibraryAssets(updated);
    } catch (e) { console.error('Failed to save to library:', e); } finally { setIsSavingToLibrary(false); }
  };

  const handleLoadLibraryAsset = useCallback((asset: LibraryAsset) => {
    const loadedAsset = loadAssetIntoEditor(asset);
    replaceStateWithoutHistory(loadedAsset.song, loadedAsset.structure);
    clearHistory();
    setTitle(loadedAsset.title);
    setTitleOrigin('user');
    setTopic(loadedAsset.topic);
    setMood(loadedAsset.mood);
    setRhymeScheme(loadedAsset.rhymeScheme);
    setTargetSyllables(loadedAsset.targetSyllables);
    setGenre(loadedAsset.genre);
    setTempo(loadedAsset.tempo);
    setInstrumentation(loadedAsset.instrumentation);
    setRhythm(loadedAsset.rhythm);
    setNarrative(loadedAsset.narrative);
    setMusicalPrompt(loadedAsset.musicalPrompt);
    setIsSaveToLibraryModalOpen(false);
  }, [clearHistory, replaceStateWithoutHistory, setGenre, setInstrumentation, setMood, setMusicalPrompt, setNarrative, setRhymeScheme, setRhythm, setTargetSyllables, setTempo, setTitle, setTitleOrigin, setTopic, setIsSaveToLibraryModalOpen]);

  const handleDeleteLibraryAsset = useCallback(async (versionId: string) => {
    try {
      await deleteAssetFromLibrary(versionId);
      setLibraryAssets(prev => prev.filter(asset => asset.id !== versionId));
      setSimilarityMatches(prev => prev.filter(m => m.versionId !== versionId));
      setLibraryCount(prev => Math.max(0, prev - 1));
    } catch (e) { console.error('Failed to delete library asset:', e); }
  }, [setLibraryAssets, setSimilarityMatches, setLibraryCount]);

  const handleImportInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    setIsImportModalOpen(false); loadFileForAnalysis(file);
  };

  const handleImportChooseFile = async () => {
    const pw = window as Window & { showOpenFilePicker?: (o: object) => Promise<Array<{ getFile: () => Promise<File> }>> };
    if (pw.showOpenFilePicker) {
      try {
        const [h] = await pw.showOpenFilePicker({
          multiple: false,
          types: [{ description: 'Lyrics files', accept: {
            'text/plain': ['.txt', '.md'], 'text/markdown': ['.md'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.oasis.opendocument.text': ['.odt'],
          }}],
        });
        if (!h) return;
        const file = await h.getFile(); setIsImportModalOpen(false); loadFileForAnalysis(file);
      } catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) console.error('Failed to open import file picker', e); }
      return;
    }
    importInputRef.current?.click();
  };

  return (
    <FluentProvider theme={theme === 'dark' ? webDarkTheme : webLightTheme} style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }}>
    <div className={`fui-FluentProvider ui-fluent h-screen w-full bg-fluent-bg text-zinc-400 flex flex-col overflow-hidden font-sans selection:bg-[var(--accent-color)]/30 ${theme === 'dark' ? 'dark' : ''}`}>

      {showBackdrop && (
        <div className="mobile-panel-backdrop" onClick={closeMobilePanels} aria-hidden="true" />
      )}

      <div className="flex-1 flex overflow-hidden">

        <LeftSettingsPanel
          isMobileOverlay={isMobileOrTablet}
          title={title} setTitle={handleTitleChange} titleOrigin={titleOrigin}
          onGenerateTitle={handleGenerateTitle} isGeneratingTitle={isGeneratingTitle}
          topic={topic} setTopic={setTopic} mood={mood} setMood={setMood}
          rhymeScheme={rhymeScheme} setRhymeScheme={setRhymeScheme}
          targetSyllables={targetSyllables} setTargetSyllables={setTargetSyllables}
          song={song} isGenerating={isGenerating} quantizeSyllables={quantizeSyllables}
          isLeftPanelOpen={isLeftPanelOpen} setIsLeftPanelOpen={setIsLeftPanelOpen}
          onSurprise={handleSurpriseClick}
          isSurprising={isSurprising}
          isSessionHydrated={isSessionHydrated}
          onGenerateSong={() => { setIsLeftPanelOpen(false); handleGlobalRegenerate(); }}
        />

        <div className="flex-1 flex flex-col min-w-0 bg-fluent-bg relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--accent-color)]/5 blur-[120px] pointer-events-none rounded" />
          <TopRibbon
            activeTab={activeTab} setActiveTab={setActiveTab}
            song={song} past={past} future={future} undo={undo} redo={redo}
            setIsVersionsModalOpen={setIsVersionsModalOpen} setIsResetModalOpen={setIsResetModalOpen}
            isStructureOpen={isStructureOpen} setIsStructureOpen={setIsStructureOpen}
            hasApiKey={hasApiKey} handleApiKeyHelp={handleApiKeyHelp}
            onOpenNewGeneration={handleOpenNewGeneration}
            onOpenNewEmpty={handleCreateEmptySong}
            onImportClick={() => setIsImportModalOpen(true)}
            onExportClick={() => setIsExportModalOpen(true)}
            onOpenLibraryClick={handleOpenSaveToLibraryModal}
            onOpenSettingsClick={() => setIsSettingsOpen(true)}
            onOpenAboutClick={() => setIsAboutOpen(true)}
            onPasteLyrics={() => setIsPasteModalOpen(true)}
            isGenerating={isGenerating} isAnalyzing={isAnalyzing}
          />
          {activeTab === 'lyrics' && song.length > 0 && (
            <InsightsBar
              song={song} sectionCount={sectionCount} wordCount={wordCount} charCount={charCount}
              targetLanguage={targetLanguage} setTargetLanguage={setTargetLanguage}
              isAdaptingLanguage={isAdaptingLanguage} isDetectingLanguage={isDetectingLanguage}
              songLanguage={songLanguage} isGenerating={isGenerating} isAnalyzing={isAnalyzing}
              isMarkupMode={isMarkupMode} webSimilarityIndex={webSimilarityIndex} webBadgeLabel={webBadgeLabel}
              libraryCount={libraryCount} adaptSongLanguage={adaptSongLanguage} detectLanguage={detectLanguage}
              analyzeCurrentSong={analyzeCurrentSong} handleGlobalRegenerate={handleGlobalRegenerate}
              handleMarkupToggle={handleMarkupToggle}
              setIsSimilarityModalOpen={setIsSimilarityModalOpen} scrollToSection={scrollToSection}
              adaptationProgress={adaptationProgress}
              adaptationResult={adaptationResult}
            />
          )}
          <div className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative lcars-lyrics-area ${isMobileOrTablet ? 'p-2' : 'p-4 lg:p-8'}`}
               style={isMobileOrTablet ? { paddingBottom: 'calc(60px + var(--sab))' } : undefined}>
            <div className="lyrics-editor-zoom-wrapper">
              <div className="lyrics-editor-zoom">
                {activeTab === 'lyrics' ? (
                  <LyricsView
                    song={song} rhymeScheme={rhymeScheme}
                    updateState={updateState} updateSongAndStructureWithHistory={updateSongAndStructureWithHistory}
                    selectedLineId={selectedLineId} isGenerating={isGenerating} isAnalyzing={isAnalyzing}
                    isAdaptingLanguage={isAdaptingLanguage}
                    sectionTargetLanguages={sectionTargetLanguages}
                    onSectionTargetLanguageChange={(sectionId, lang) => setSectionTargetLanguages(prev => ({ ...prev, [sectionId]: lang }))}
                    adaptSectionLanguage={adaptSectionLanguage}
                    isRegeneratingSection={isRegeneratingSection} handleLineClick={handleLineClick}
                    updateLineText={updateLineText} handleLineKeyDown={handleLineKeyDown}
                    handleInstructionChange={handleInstructionChange} addInstruction={addInstruction}
                    removeInstruction={removeInstruction} regenerateSection={regenerateSection}
                    draggedItemIndex={draggedItemIndex} dragOverIndex={dragOverIndex}
                    draggedLineInfo={draggedLineInfo} dragOverLineInfo={dragOverLineInfo}
                    setDraggedItemIndex={setDraggedItemIndex} setDragOverIndex={setDragOverIndex}
                    setDraggedLineInfo={setDraggedLineInfo} setDragOverLineInfo={setDragOverLineInfo}
                    playAudioFeedback={playAudioFeedback} handleDrop={handleDrop}
                    handleLineDragStart={handleLineDragStart} handleLineDrop={handleLineDrop}
                    isMarkupMode={isMarkupMode} setIsMarkupMode={setIsMarkupMode}
                    markupText={markupText} setMarkupText={setMarkupText} markupTextareaRef={markupTextareaRef}
                    onOpenLibrary={handleOpenSaveToLibraryModal}
                    onPasteLyrics={() => setIsPasteModalOpen(true)}
                    onGenerateSong={handleGlobalRegenerate}
                  />
                ) : (
                  <MusicalTab
                    song={song} title={title} topic={topic} mood={mood}
                    genre={genre} setGenre={setGenre} tempo={tempo} setTempo={setTempo}
                    instrumentation={instrumentation} setInstrumentation={setInstrumentation}
                    rhythm={rhythm} setRhythm={setRhythm} narrative={narrative} setNarrative={setNarrative}
                    musicalPrompt={musicalPrompt} setMusicalPrompt={setMusicalPrompt}
                    isGeneratingMusicalPrompt={isGeneratingMusicalPrompt} isAnalyzingLyrics={isAnalyzingLyrics}
                    hasApiKey={hasApiKey} generateMusicalPrompt={generateMusicalPrompt} analyzeLyricsForMusic={analyzeLyricsForMusic}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <StructureSidebar
          isMobileOverlay={isMobileOrTablet}
          className={isMobileOrTablet ? 'structure-sidebar-mobile-overlay' : undefined}
          isStructureOpen={isStructureOpen} setIsStructureOpen={setIsStructureOpen}
          structure={structure} song={song} newSectionName={newSectionName} setNewSectionName={setNewSectionName}
          isSectionDropdownOpen={isSectionDropdownOpen} setIsSectionDropdownOpen={setIsSectionDropdownOpen}
          draggedItemIndex={draggedItemIndex} setDraggedItemIndex={setDraggedItemIndex}
          dragOverIndex={dragOverIndex} setDragOverIndex={setDragOverIndex} isGenerating={isGenerating}
          addStructureItem={addStructureItem} removeStructureItem={removeStructureItem}
          normalizeStructure={normalizeStructure} handleDrop={handleDrop} onScrollToSection={handleScrollToSection}
        />
      </div>

      <StatusBar
        className="lcars-status-bar-desktop"
        song={song} wordCount={wordCount} charCount={charCount} isGenerating={isGenerating} isAnalyzing={isAnalyzing}
        isSuggesting={isSuggesting} theme={theme} setTheme={setTheme}
        audioFeedback={audioFeedback} setAudioFeedback={setAudioFeedback}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {isMobileOrTablet && (
        <MobileBottomNav
          isLeftPanelOpen={isLeftPanelOpen}
          isStructureOpen={isStructureOpen}
          activeTab={activeTab}
          isGenerating={isGenerating}
          setIsLeftPanelOpen={setIsLeftPanelOpen}
          setIsStructureOpen={setIsStructureOpen}
          setActiveTab={setActiveTab}
          onGenerateSong={handleGlobalRegenerate}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      <AppModals
        isAboutOpen={isAboutOpen} setIsAboutOpen={setIsAboutOpen}
        isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen}
        theme={theme} setTheme={setTheme} audioFeedback={audioFeedback} setAudioFeedback={setAudioFeedback}
        isImportModalOpen={isImportModalOpen} setIsImportModalOpen={setIsImportModalOpen}
        hasExistingWork={hasExistingWork} handleImportChooseFile={handleImportChooseFile}
        onOpenPasteLyrics={() => { setIsImportModalOpen(false); setIsPasteModalOpen(true); }}
        importInputRef={importInputRef} handleImportInputChange={handleImportInputChange}
        isExportModalOpen={isExportModalOpen} setIsExportModalOpen={setIsExportModalOpen}
        exportSong={exportSong}
        selectedLineId={selectedLineId} setSelectedLineId={setSelectedLineId}
        suggestions={suggestions} isSuggesting={isSuggesting}
        applySuggestion={applySuggestion} generateSuggestions={generateSuggestions}
        isPasteModalOpen={isPasteModalOpen} setIsPasteModalOpen={setIsPasteModalOpen}
        pastedText={pastedText} setPastedText={setPastedText}
        isAnalyzing={isAnalyzing} analyzePastedLyrics={analyzePastedLyrics}
        isAnalysisModalOpen={isAnalysisModalOpen} setIsAnalysisModalOpen={setIsAnalysisModalOpen}
        analysisReport={analysisReport} analysisSteps={analysisSteps}
        appliedAnalysisItems={appliedAnalysisItems} selectedAnalysisItems={selectedAnalysisItems}
        isApplyingAnalysis={isApplyingAnalysis}
        toggleAnalysisItemSelection={toggleAnalysisItemSelection}
        applySelectedAnalysisItems={applySelectedAnalysisItems}
        clearAppliedAnalysisItems={clearAppliedAnalysisItems}
        versions={versions} rollbackToVersion={rollbackToVersion}
        isSimilarityModalOpen={isSimilarityModalOpen} setIsSimilarityModalOpen={setIsSimilarityModalOpen}
        similarityMatches={similarityMatches} libraryCount={libraryCount}
        webSimilarityIndex={webSimilarityIndex} triggerWebSimilarity={triggerWebSimilarity}
        handleDeleteLibraryAsset={handleDeleteLibraryAsset}
        isSaveToLibraryModalOpen={isSaveToLibraryModalOpen} setIsSaveToLibraryModalOpen={setIsSaveToLibraryModalOpen}
        handleSaveToLibrary={handleSaveToLibrary} isSavingToLibrary={isSavingToLibrary}
        title={title} libraryAssets={libraryAssets} hasCurrentSong={song.length > 0} handleLoadLibraryAsset={handleLoadLibraryAsset}
        isVersionsModalOpen={isVersionsModalOpen} setIsVersionsModalOpen={setIsVersionsModalOpen}
        saveVersion={saveVersion} handleRequestVersionName={handleRequestVersionName}
        isResetModalOpen={isResetModalOpen} setIsResetModalOpen={setIsResetModalOpen}
        resetSong={resetSong}
        apiErrorModal={apiErrorModal} setApiErrorModal={setApiErrorModal}
        confirmModal={confirmModal} setConfirmModal={setConfirmModal}
        promptModal={promptModal} setPromptModal={setPromptModal}
      />
    </div>
    </FluentProvider>
  );
}
