import React, { useEffect, useRef, useCallback } from 'react';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';
import { DEFAULT_STRUCTURE } from './constants/editor';
import { safeRemoveItem } from './utils/storageUtils';
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
import { VersionsModal } from './components/app/modals/VersionsModal';
import { ResetModal } from './components/app/modals/ResetModal';
import { LeftSettingsPanel } from './components/app/LeftSettingsPanel';
import { TopRibbon } from './components/app/TopRibbon';
import { StructureSidebar } from './components/app/StructureSidebar';
import { StatusBar } from './components/app/StatusBar';
import { SuggestionsPanel } from './components/app/SuggestionsPanel';
import { MusicalTab } from './components/app/MusicalTab';
import { InsightsBar } from './components/app/InsightsBar';
import { LyricsView } from './components/app/LyricsView';
import { AboutModal } from './components/app/modals/AboutModal';
import { ApiErrorModal } from './components/app/modals/ApiErrorModal';
import { ImportModal } from './components/app/modals/ImportModal';
import { ExportModal } from './components/app/modals/ExportModal';
import { PasteModal } from './components/app/modals/PasteModal';
import { AnalysisModal } from './components/app/modals/AnalysisModal';
import { SimilarityModal } from './components/app/modals/SimilarityModal';
import { SaveToLibraryModal } from './components/app/modals/SaveToLibraryModal';
import { ConfirmModal } from './components/app/modals/ConfirmModal';
import { PromptModal } from './components/app/modals/PromptModal';
import { SettingsModal } from './components/app/modals/SettingsModal';
import { useTranslation, useLanguage } from './i18n';
import { findSimilarAssetsInLibrary, saveAssetToLibrary, loadLibraryAssets, deleteAssetFromLibrary } from './utils/libraryUtils';
import { createEmptySong, isPristineDraft, DEFAULT_TOPIC, DEFAULT_MOOD } from './utils/songDefaults';

export default function App() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { song, structure, past, future, updateState, updateSongWithHistory, updateStructureWithHistory,
    updateSongAndStructureWithHistory, replaceStateWithoutHistory, clearHistory, undo, redo,
  } = useSongHistoryState(createEmptySong(DEFAULT_STRUCTURE, 'AABB'), DEFAULT_STRUCTURE);
  const {
    theme, setTheme, activeTab, setActiveTab, isStructureOpen, setIsStructureOpen, isLeftPanelOpen, setIsLeftPanelOpen,
    title, setTitle, titleOrigin, setTitleOrigin, topic, setTopic, mood, setMood,
    rhymeScheme, setRhymeScheme, targetSyllables, setTargetSyllables, genre, setGenre, tempo, setTempo,
    instrumentation, setInstrumentation, rhythm, setRhythm, narrative, setNarrative, musicalPrompt, setMusicalPrompt,
    audioFeedback, setAudioFeedback, newSectionName, setNewSectionName,
    draggedItemIndex, setDraggedItemIndex, dragOverIndex, setDragOverIndex, draggableSectionIndex, setDraggableSectionIndex,
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
  } = useAppState();
  useSessionPersistence({
    song, structure, title, topic, mood, rhymeScheme, targetSyllables,
    genre, tempo, instrumentation, rhythm, narrative, musicalPrompt,
    isSessionHydrated, setIsSessionHydrated, setHasSavedSession, replaceStateWithoutHistory, clearHistory,
    setTitle, setTitleOrigin, setTopic, setMood, setRhymeScheme, setTargetSyllables,
    setGenre, setTempo, setInstrumentation, setRhythm, setNarrative, setMusicalPrompt,
  });
  const { versions, saveVersion, rollbackToVersion, handleRequestVersionName } = useVersionManager({
    song, structure, title, titleOrigin, topic, mood, updateSongAndStructureWithHistory,
    setIsVersionsModalOpen, setPromptModal, setTitle, setTitleOrigin, setTopic, setMood,
  });
  const { playAudioFeedback } = useAudioFeedback(audioFeedback);
  const { scrollToSection, handleMarkupToggle } = useMarkupEditor({
    song, isMarkupMode, markupText, markupTextareaRef, setIsMarkupMode, setMarkupText, updateSongAndStructureWithHistory,
  });
  useEffect(() => {
    let isCancelled = false;
    const runSimilarity = async () => {
      if (song.length === 0) { setSimilarityMatches([]); return; }
      const matches = await findSimilarAssetsInLibrary(song, 0, 3);
      if (!isCancelled) setSimilarityMatches(matches);
    };
    const loadCount = async () => {
      try { const c = localStorage.getItem('lyricist_library'); if (c) setLibraryCount(JSON.parse(c).length); }
      catch (e) { console.error('Failed to load library count:', e); }
    };
    void runSimilarity(); void loadCount();
    return () => { isCancelled = true; };
  }, [song, setSimilarityMatches, setLibraryCount]);
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
  const { isPasteModalOpen, setIsPasteModalOpen, pastedText, setPastedText,
    isAnalyzing, isAnalysisModalOpen, setIsAnalysisModalOpen, analysisReport, analysisSteps,
    appliedAnalysisItems, selectedAnalysisItems, isApplyingAnalysis, songLanguage, targetLanguage, setTargetLanguage,
    isAdaptingLanguage, isDetectingLanguage, toggleAnalysisItemSelection, applySelectedAnalysisItems,
    analyzeCurrentSong, detectLanguage, adaptSongLanguage, analyzePastedLyrics, clearAppliedAnalysisItems,
  } = useSongAnalysis({ song, topic, mood, rhymeScheme, uiLanguage: language, setTopic, setMood, saveVersion,
    updateState, updateSongWithHistory, updateSongAndStructureWithHistory,
    clearLineSelection: () => clearSelection(), requestAutoTitleGeneration: () => setShouldAutoGenerateTitle(true),
  });
  const { isGenerating, isRegeneratingSection, isGeneratingMusicalPrompt, isAnalyzingLyrics,
    selectedLineId, setSelectedLineId, suggestions, isSuggesting, generateSong, regenerateSection,
    quantizeSyllables, generateSuggestions, updateLineText, handleLineKeyDown, applySuggestion,
    generateMusicalPrompt, analyzeLyricsForMusic, handleLineClick, handleInstructionChange, addInstruction, removeInstruction, clearSelection,
  } = useSongComposer({ song, structure, topic, mood, rhymeScheme, targetSyllables, title,
    genre, tempo, instrumentation, rhythm, narrative, songLanguage, uiLanguage: language,
    setMusicalPrompt, setGenre, setTempo, setInstrumentation, setRhythm, setNarrative,
    updateState, updateSongWithHistory, updateSongAndStructureWithHistory, saveVersion,
    requestAutoTitleGeneration: () => setShouldAutoGenerateTitle(true),
  });
  const { removeStructureItem, addStructureItem, normalizeStructure, handleDrop,
    handleLineDragStart, handleLineDrop, exportSong, loadFileForAnalysis,
  } = useSongEditor({ song, structure, newSectionName, setNewSectionName,
    draggedItemIndex, setDraggedItemIndex, setDragOverIndex, draggedLineInfo, setDraggedLineInfo, setDragOverLineInfo,
    updateState, updateSongWithHistory, updateStructureWithHistory, updateSongAndStructureWithHistory, title, topic, mood,
    openPasteModalWithText: (text: string) => { setPastedText(text); setIsPasteModalOpen(true); }, playAudioFeedback,
  });
  const { generateTitle, isGeneratingTitle } = useTitleGenerator(song, topic, mood, songLanguage);
  // Destructure hook return — generateSuggestion exposed as onSurprise for LeftSettingsPanel
  const { generateSuggestion: handleSurprise, isGeneratingSuggestion: isSurprising } =
    useTopicMoodSuggester(topic, mood, setTopic, setMood);
  const handleSurpriseClick = useCallback(async () => {
    const suggestion = await handleSurprise();
    if (suggestion) { setTopic(suggestion.topic); setMood(suggestion.mood); }
  }, [handleSurprise, setTopic, setMood]);
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
        if (isAboutOpen) setIsAboutOpen(false);
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
    apiErrorModal.open,
    confirmModal,
    isAboutOpen,
    isAnalysisModalOpen,
    isExportModalOpen,
    isImportModalOpen,
    isPasteModalOpen,
    isResetModalOpen,
    isSaveToLibraryModalOpen,
    isSettingsOpen,
    isSimilarityModalOpen,
    isVersionsModalOpen,
    promptModal,
    redo,
    setApiErrorModal,
    setConfirmModal,
    setIsAboutOpen,
    setIsAnalysisModalOpen,
    setIsExportModalOpen,
    setIsImportModalOpen,
    setIsPasteModalOpen,
    setIsResetModalOpen,
    setIsSaveToLibraryModalOpen,
    setIsSettingsOpen,
    setIsSimilarityModalOpen,
    setIsVersionsModalOpen,
    setPromptModal,
    undo,
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
  const { index: webSimilarityIndex, triggerNow: triggerWebSimilarity } = useSimilarityEngine(song, title);
  const hasExistingWork = (song.length > 0 && !isPristineDraft(song, structure, rhymeScheme))
    || topic !== DEFAULT_TOPIC || mood !== DEFAULT_MOOD || (isMarkupMode && markupText.trim().length > 0);
  const webBadgeLabel = webSimilarityIndex.status === 'done' && webSimilarityIndex.candidates.length > 0
    ? `${webSimilarityIndex.candidates[0]?.score}%` : null;
  const handleApiKeyHelp = () => setApiErrorModal({
    open: true,
    message: t.tooltips.aiUnavailableHelp,
  });
  const handleTitleChange = (value: string) => { setTitle(value); setTitleOrigin('user'); };
  const handleGenerateTitle = async () => { const t2 = await generateTitle(); if (t2) { setTitle(t2); setTitleOrigin('ai'); } };
  const handleGlobalRegenerate = () => {
    if (song.length > 0) { setConfirmModal({ open: true, onConfirm: () => { setConfirmModal(null); void generateSong(); } }); }
    else { void generateSong(); }
  };
  const handleScrollToSection = useCallback((sectionId: string) => {
    const sec = song.find(s => s.id === sectionId);
    if (sec) scrollToSection(sec);
  }, [song, scrollToSection]);
  const handleOpenSaveToLibraryModal = async () => {
    if (song.length === 0) return;
    setLibraryAssets(await loadLibraryAssets());
    setIsSaveToLibraryModalOpen(true);
  };
  const handleSaveToLibrary = async () => {
    if (song.length === 0) return;
    setIsSavingToLibrary(true);
    try {
      await saveAssetToLibrary({ title: title || 'Untitled Song', type: 'song', sections: song, metadata: { topic, mood, genre, tempo: parseInt(tempo) || 120, instrumentation } });
      const updated = await loadLibraryAssets(); setLibraryCount(updated.length); setLibraryAssets(updated);
    } catch (e) { console.error('Failed to save to library:', e); } finally { setIsSavingToLibrary(false); }
  };
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
        const [h] = await pw.showOpenFilePicker({ multiple: false, types: [{ description: 'Lyrics files', accept: { 'text/plain': ['.txt', '.md'], 'text/markdown': ['.md'] } }] });
        if (!h) return;
        const file = await h.getFile(); setIsImportModalOpen(false); loadFileForAnalysis(file);
      } catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) console.error('Failed to open import file picker', e); }
      return;
    }
    importInputRef.current?.click();
  };
  const resetSong = () => {
    updateSongAndStructureWithHistory(createEmptySong(DEFAULT_STRUCTURE, rhymeScheme), DEFAULT_STRUCTURE);
    safeRemoveItem('lyricist_session'); setHasSavedSession(false); clearSelection(); setIsResetModalOpen(false);
  };
  return (
    <FluentProvider theme={theme === 'dark' ? webDarkTheme : webLightTheme} style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }}>
    <div className={`fui-FluentProvider h-screen w-full bg-fluent-bg text-zinc-400 flex flex-col overflow-hidden font-sans selection:bg-[var(--accent-color)]/30 ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="flex-1 flex overflow-hidden">
        <LeftSettingsPanel
          title={title} setTitle={handleTitleChange} titleOrigin={titleOrigin}
          onGenerateTitle={handleGenerateTitle} isGeneratingTitle={isGeneratingTitle}
          topic={topic} setTopic={setTopic} mood={mood} setMood={setMood}
          rhymeScheme={rhymeScheme} setRhymeScheme={setRhymeScheme}
          targetSyllables={targetSyllables} setTargetSyllables={setTargetSyllables}
          song={song} isGenerating={isGenerating} quantizeSyllables={quantizeSyllables}
          isLeftPanelOpen={isLeftPanelOpen} setIsLeftPanelOpen={setIsLeftPanelOpen}
          onSurprise={handleSurpriseClick}
          isSurprising={isSurprising}
        />
        <div className="flex-1 flex flex-col min-w-0 bg-fluent-bg relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--accent-color)]/5 blur-[120px] pointer-events-none rounded" />
          <TopRibbon
            isLeftPanelOpen={isLeftPanelOpen} setIsLeftPanelOpen={setIsLeftPanelOpen}
            activeTab={activeTab} setActiveTab={setActiveTab}
            song={song} past={past} future={future} undo={undo} redo={redo}
             setIsVersionsModalOpen={setIsVersionsModalOpen} setIsResetModalOpen={setIsResetModalOpen}
             isStructureOpen={isStructureOpen} setIsStructureOpen={setIsStructureOpen}
             hasApiKey={hasApiKey} handleApiKeyHelp={handleApiKeyHelp}
              onImportClick={() => setIsImportModalOpen(true)} onExportClick={() => setIsExportModalOpen(true)}
              onOpenLibraryClick={handleOpenSaveToLibraryModal}
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
            />
          )}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative p-4 lg:p-8 lcars-lyrics-area">
            <div className="lyrics-editor-zoom-wrapper">
              <div className="lyrics-editor-zoom">
                {activeTab === 'lyrics' ? (
                  <LyricsView
                    song={song} rhymeScheme={rhymeScheme}
                    updateState={updateState} updateSongAndStructureWithHistory={updateSongAndStructureWithHistory}
                    selectedLineId={selectedLineId} isGenerating={isGenerating} isAnalyzing={isAnalyzing}
                    isRegeneratingSection={isRegeneratingSection} handleLineClick={handleLineClick}
                    updateLineText={updateLineText} handleLineKeyDown={handleLineKeyDown}
                    handleInstructionChange={handleInstructionChange} addInstruction={addInstruction}
                    removeInstruction={removeInstruction} regenerateSection={regenerateSection}
                    draggedItemIndex={draggedItemIndex} dragOverIndex={dragOverIndex}
                    draggedLineInfo={draggedLineInfo} dragOverLineInfo={dragOverLineInfo}
                    setDraggedItemIndex={setDraggedItemIndex} setDragOverIndex={setDragOverIndex}
                    setDraggableSectionIndex={setDraggableSectionIndex}
                    setDraggedLineInfo={setDraggedLineInfo} setDragOverLineInfo={setDragOverLineInfo}
                    playAudioFeedback={playAudioFeedback} handleDrop={handleDrop}
                    handleLineDragStart={handleLineDragStart} handleLineDrop={handleLineDrop}
                    isMarkupMode={isMarkupMode} setIsMarkupMode={setIsMarkupMode}
                    markupText={markupText} setMarkupText={setMarkupText} markupTextareaRef={markupTextareaRef}
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
        song={song} wordCount={wordCount} isGenerating={isGenerating} isAnalyzing={isAnalyzing}
        isSuggesting={isSuggesting} theme={theme} setTheme={setTheme}
        audioFeedback={audioFeedback} setAudioFeedback={setAudioFeedback}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        audioFeedback={audioFeedback}
        setAudioFeedback={setAudioFeedback}
      />
      <ImportModal isOpen={isImportModalOpen} hasExistingWork={hasExistingWork} onClose={() => setIsImportModalOpen(false)} onChooseFile={handleImportChooseFile} />
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} onExport={exportSong} />
      <SuggestionsPanel selectedLineId={selectedLineId} setSelectedLineId={setSelectedLineId} suggestions={suggestions} isSuggesting={isSuggesting} applySuggestion={applySuggestion} generateSuggestions={generateSuggestions} />
      <PasteModal isOpen={isPasteModalOpen} onClose={() => setIsPasteModalOpen(false)} pastedText={pastedText} setPastedText={setPastedText} isAnalyzing={isAnalyzing} onAnalyze={analyzePastedLyrics} />
      <AnalysisModal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} isAnalyzing={isAnalyzing} analysisReport={analysisReport} analysisSteps={analysisSteps} appliedAnalysisItems={appliedAnalysisItems} selectedAnalysisItems={selectedAnalysisItems} isApplyingAnalysis={isApplyingAnalysis} toggleAnalysisItemSelection={toggleAnalysisItemSelection} applySelectedAnalysisItems={applySelectedAnalysisItems} clearAppliedAnalysisItems={clearAppliedAnalysisItems} versions={versions} rollbackToVersion={rollbackToVersion} />
      <SimilarityModal isOpen={isSimilarityModalOpen} onClose={() => setIsSimilarityModalOpen(false)} matches={similarityMatches} candidateCount={libraryCount} webIndex={webSimilarityIndex} onWebRefresh={triggerWebSimilarity} onDeleteLibraryAsset={handleDeleteLibraryAsset} />
      <SaveToLibraryModal isOpen={isSaveToLibraryModalOpen} onClose={() => setIsSaveToLibraryModalOpen(false)} onSave={handleSaveToLibrary} onDeleteAsset={handleDeleteLibraryAsset} isSaving={isSavingToLibrary} currentTitle={title} libraryAssets={libraryAssets} />
      <VersionsModal isOpen={isVersionsModalOpen} versions={versions} onClose={() => setIsVersionsModalOpen(false)} onSaveCurrent={saveVersion} onRollback={rollbackToVersion} onRequestVersionName={handleRequestVersionName} />
      <ResetModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onConfirm={resetSong} />
      <ApiErrorModal isOpen={apiErrorModal.open} onClose={() => setApiErrorModal({ open: false, message: '' })} message={apiErrorModal.message} />
      {confirmModal && <ConfirmModal isOpen={confirmModal.open} title="Regenerate Song" message={t.editor.regenerateWarning} confirmLabel="Regenerate" cancelLabel="Cancel" onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(null)} />}
      {promptModal && <PromptModal isOpen={promptModal.open} title="Save Version" message="Enter a name for this version:" placeholder="Version name" confirmLabel="Save" cancelLabel="Cancel" onConfirm={promptModal.onConfirm} onCancel={() => setPromptModal(null)} />}
      <input ref={importInputRef} type="file" accept=".txt,.md" className="hidden" onChange={handleImportInputChange} />
    </div>
    </FluentProvider>
  );
}
