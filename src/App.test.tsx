import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const mockAppState = vi.hoisted(() => ({
  initialActiveTab: 'lyrics' as 'lyrics' | 'musical',
  initialIsMarkupMode: true,
  setActiveTabSpy: vi.fn(),
  setIsMarkupModeSpy: vi.fn(),
  noop: vi.fn(),
  asyncNoop: vi.fn(async () => {}),
}));

vi.mock('@fluentui/react-components', () => ({
  FluentProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  webLightTheme: {},
  webDarkTheme: {},
}));

vi.mock('./contexts/ModalContext', () => ({
  ModalProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./contexts/DragContext', () => ({
  DragProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./hooks/useAudioFeedback', () => ({
  useAudioFeedback: () => ({ playAudioFeedback: mockAppState.noop }),
}));

vi.mock('./hooks/useSongAnalysis', () => ({
  useSongAnalysis: () => ({
    isPasteModalOpen: false,
    setIsPasteModalOpen: mockAppState.noop,
    pastedText: '',
    setPastedText: mockAppState.noop,
    isAnalyzing: false,
    isAnalysisModalOpen: false,
    setIsAnalysisModalOpen: mockAppState.noop,
    analysisReport: null,
    analysisSteps: [],
    appliedAnalysisItems: [],
    selectedAnalysisItems: [],
    isApplyingAnalysis: false,
    targetLanguage: 'en',
    setTargetLanguage: mockAppState.noop,
    isAdaptingLanguage: false,
    isDetectingLanguage: false,
    adaptationProgress: null,
    adaptationResult: null,
    sectionTargetLanguages: {},
    setSectionTargetLanguages: mockAppState.noop,
    toggleAnalysisItemSelection: mockAppState.noop,
    applySelectedAnalysisItems: mockAppState.noop,
    analyzeCurrentSong: mockAppState.asyncNoop,
    detectLanguage: mockAppState.asyncNoop,
    adaptSongLanguage: mockAppState.asyncNoop,
    adaptSectionLanguage: mockAppState.asyncNoop,
    analyzePastedLyrics: mockAppState.asyncNoop,
    clearAppliedAnalysisItems: mockAppState.noop,
  }),
}));

vi.mock('./hooks/useSongEditor', () => ({
  useSongEditor: () => ({
    removeStructureItem: mockAppState.noop,
    addStructureItem: mockAppState.noop,
    normalizeStructure: mockAppState.noop,
    handleDrop: mockAppState.noop,
    handleLineDragStart: mockAppState.noop,
    handleLineDrop: mockAppState.noop,
    exportSong: mockAppState.asyncNoop,
    loadFileForAnalysis: mockAppState.asyncNoop,
  }),
}));

vi.mock('./hooks/useSongComposer', () => ({
  useSongComposer: () => ({
    isGenerating: false,
    isRegeneratingSection: () => false,
    isGeneratingMusicalPrompt: false,
    isAnalyzingLyrics: false,
    selectedLineId: null,
    setSelectedLineId: mockAppState.noop,
    suggestions: [],
    isSuggesting: false,
    generateSong: mockAppState.asyncNoop,
    regenerateSection: mockAppState.asyncNoop,
    quantizeSyllables: mockAppState.noop,
    generateSuggestions: mockAppState.asyncNoop,
    updateLineText: mockAppState.noop,
    handleLineKeyDown: mockAppState.noop,
    applySuggestion: mockAppState.noop,
    generateMusicalPrompt: mockAppState.asyncNoop,
    analyzeLyricsForMusic: mockAppState.asyncNoop,
    handleLineClick: mockAppState.noop,
    handleInstructionChange: mockAppState.noop,
    addInstruction: mockAppState.noop,
    removeInstruction: mockAppState.noop,
    clearSelection: mockAppState.noop,
  }),
}));

vi.mock('./hooks/useSongHistoryState', () => ({
  useSongHistoryState: () => ({
    song: [],
    structure: [],
    past: [],
    future: [],
    updateState: mockAppState.noop,
    updateSongWithHistory: mockAppState.noop,
    updateStructureWithHistory: mockAppState.noop,
    updateSongAndStructureWithHistory: mockAppState.noop,
    replaceStateWithoutHistory: mockAppState.noop,
    clearHistory: mockAppState.noop,
    undo: mockAppState.noop,
    redo: mockAppState.noop,
  }),
}));

vi.mock('./hooks/useTitleGenerator', () => ({
  useTitleGenerator: () => ({
    generateTitle: vi.fn(async () => null),
    isGeneratingTitle: false,
  }),
}));

vi.mock('./hooks/useTopicMoodSuggester', () => ({
  useTopicMoodSuggester: () => ({
    generateSuggestion: vi.fn(async () => null),
    isGeneratingSuggestion: false,
    resetSuggestionCycle: mockAppState.noop,
  }),
}));

vi.mock('./hooks/useSimilarityEngine', () => ({
  useSimilarityEngine: () => ({
    index: { status: 'idle', candidates: [] },
    triggerNow: mockAppState.asyncNoop,
    resetIndex: mockAppState.noop,
  }),
}));

vi.mock('./hooks/useAppKpis', () => ({
  useAppKpis: () => ({
    sectionCount: 0,
    wordCount: 0,
    charCount: 0,
  }),
}));

vi.mock('./hooks/useAppState', async () => {
  const ReactModule = await import('react');

  return {
    useAppState: () => {
      const [activeTab, setActiveTabState] = ReactModule.useState<'lyrics' | 'musical'>(mockAppState.initialActiveTab);
      const [isMarkupMode, setIsMarkupModeState] = ReactModule.useState(mockAppState.initialIsMarkupMode);
      const markupTextareaRef = ReactModule.useRef<HTMLTextAreaElement>(null);
      const importInputRef = ReactModule.useRef<HTMLInputElement>(null);

      return {
        theme: 'dark',
        setTheme: mockAppState.noop,
        activeTab,
        setActiveTab: (value: 'lyrics' | 'musical') => {
          mockAppState.setActiveTabSpy(value);
          setActiveTabState(value);
        },
        isStructureOpen: false,
        setIsStructureOpen: mockAppState.noop,
        isLeftPanelOpen: false,
        setIsLeftPanelOpen: mockAppState.noop,
        title: 'Test Title',
        setTitle: mockAppState.noop,
        titleOrigin: 'user',
        setTitleOrigin: mockAppState.noop,
        topic: '',
        setTopic: mockAppState.noop,
        mood: '',
        setMood: mockAppState.noop,
        rhymeScheme: 'AABB',
        setRhymeScheme: mockAppState.noop,
        targetSyllables: 8,
        setTargetSyllables: mockAppState.noop,
        genre: '',
        setGenre: mockAppState.noop,
        tempo: '',
        setTempo: mockAppState.noop,
        instrumentation: '',
        setInstrumentation: mockAppState.noop,
        rhythm: '',
        setRhythm: mockAppState.noop,
        narrative: '',
        setNarrative: mockAppState.noop,
        musicalPrompt: '',
        setMusicalPrompt: mockAppState.noop,
        audioFeedback: false,
        setAudioFeedback: mockAppState.noop,
        uiScale: 100,
        setUiScale: mockAppState.noop,
        defaultEditMode: 'classic',
        setDefaultEditMode: mockAppState.noop,
        newSectionName: '',
        setNewSectionName: mockAppState.noop,
        similarityMatches: [],
        setSimilarityMatches: mockAppState.noop,
        libraryCount: 0,
        setLibraryCount: mockAppState.noop,
        libraryAssets: [],
        setLibraryAssets: mockAppState.noop,
        isSavingToLibrary: false,
        setIsSavingToLibrary: mockAppState.noop,
        isMarkupMode,
        setIsMarkupMode: (value: boolean) => {
          mockAppState.setIsMarkupModeSpy(value);
          setIsMarkupModeState(value);
        },
        markupText: '[Verse]\nHello',
        setMarkupText: mockAppState.noop,
        isAboutOpen: false,
        setIsAboutOpen: mockAppState.noop,
        isSettingsOpen: false,
        setIsSettingsOpen: mockAppState.noop,
        apiErrorModal: { open: false, message: '' },
        setApiErrorModal: mockAppState.noop,
        isImportModalOpen: false,
        setIsImportModalOpen: mockAppState.noop,
        isExportModalOpen: false,
        setIsExportModalOpen: mockAppState.noop,
        isSectionDropdownOpen: false,
        setIsSectionDropdownOpen: mockAppState.noop,
        isSimilarityModalOpen: false,
        setIsSimilarityModalOpen: mockAppState.noop,
        isSaveToLibraryModalOpen: false,
        setIsSaveToLibraryModalOpen: mockAppState.noop,
        isVersionsModalOpen: false,
        setIsVersionsModalOpen: mockAppState.noop,
        isResetModalOpen: false,
        setIsResetModalOpen: mockAppState.noop,
        shouldAutoGenerateTitle: false,
        setShouldAutoGenerateTitle: mockAppState.noop,
        confirmModal: null,
        setConfirmModal: mockAppState.noop,
        promptModal: null,
        setPromptModal: mockAppState.noop,
        setHasSavedSession: mockAppState.noop,
        isSessionHydrated: true,
        setIsSessionHydrated: mockAppState.noop,
        hasApiKey: true,
        importInputRef,
        markupTextareaRef,
        songLanguage: 'en',
        setSongLanguage: mockAppState.noop,
      };
    },
  };
});

vi.mock('./hooks/useSessionPersistence', () => ({
  useSessionPersistence: mockAppState.noop,
}));

vi.mock('./hooks/useVersionManager', () => ({
  useVersionManager: () => ({
    versions: [],
    saveVersion: mockAppState.noop,
    rollbackToVersion: mockAppState.noop,
    handleRequestVersionName: mockAppState.noop,
  }),
}));

vi.mock('./hooks/useMarkupEditor', () => ({
  useMarkupEditor: () => ({
    scrollToSection: mockAppState.noop,
    handleMarkupToggle: mockAppState.noop,
  }),
}));

vi.mock('./hooks/useMobileLayout', () => ({
  useMobileLayout: () => ({
    isMobile: false,
    isTablet: false,
  }),
}));

vi.mock('./hooks/useMobileInitPanels', () => ({
  useMobileInitPanels: mockAppState.noop,
}));

vi.mock('./hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: mockAppState.noop,
}));

vi.mock('./hooks/useSessionActions', () => ({
  useSessionActions: () => ({
    handleCreateEmptySong: mockAppState.noop,
    resetSong: mockAppState.noop,
  }),
}));

vi.mock('./hooks/useImportHandlers', () => ({
  useImportHandlers: () => ({
    handleImportInputChange: mockAppState.noop,
    handleImportChooseFile: mockAppState.noop,
  }),
}));

vi.mock('./hooks/useLibraryActions', () => ({
  useLibraryActions: () => ({
    handleSaveToLibrary: mockAppState.asyncNoop,
    handleLoadLibraryAsset: mockAppState.noop,
    handleDeleteLibraryAsset: mockAppState.noop,
    handlePurgeLibrary: mockAppState.noop,
    handleOpenSaveToLibraryModal: mockAppState.noop,
  }),
}));

vi.mock('./hooks/useUIStateForProvider', () => ({
  useUIStateForProvider: (params: unknown) => params,
}));

vi.mock('./components/app/LeftSettingsPanel', () => ({
  LeftSettingsPanel: () => <div data-testid="left-settings-panel" />,
}));

vi.mock('./components/app/TopRibbon', () => ({
  TopRibbon: ({ setActiveTab }: { setActiveTab: (value: 'lyrics' | 'musical') => void }) => (
    <button type="button" onClick={() => setActiveTab('musical')}>
      Switch to musical
    </button>
  ),
}));

vi.mock('./components/app/StructureSidebar', () => ({
  StructureSidebar: () => <div data-testid="structure-sidebar" />,
}));

vi.mock('./components/app/StatusBar', () => ({
  StatusBar: () => <div data-testid="status-bar" />,
}));

vi.mock('./components/app/InsightsBar', () => ({
  InsightsBar: () => <div data-testid="insights-bar" />,
}));

vi.mock('./components/app/LyricsView', () => ({
  LyricsView: () => <div data-testid="lyrics-view" />,
}));

vi.mock('./components/app/AppModals', () => ({
  AppModals: () => <div data-testid="app-modals" />,
}));

vi.mock('./components/app/MobileBottomNav', () => ({
  MobileBottomNav: () => <div data-testid="mobile-bottom-nav" />,
}));

vi.mock('./components/app/musical/MusicalTab', () => ({
  MusicalTab: () => <div data-testid="musical-tab" />,
}));

vi.mock('./i18n', () => ({
  useTranslation: () => ({
    t: {
      tooltips: {
        aiUnavailableHelp: 'help',
      },
    },
  }),
  useLanguage: () => ({ language: 'en' }),
}));

describe('App markup mode reset', () => {
  beforeEach(() => {
    mockAppState.initialActiveTab = 'lyrics';
    mockAppState.initialIsMarkupMode = true;
    mockAppState.setActiveTabSpy.mockClear();
    mockAppState.setIsMarkupModeSpy.mockClear();
  });

  it('keeps markup mode while the lyrics tab remains active and resets it after switching tabs', async () => {
    render(<App />);

    expect(mockAppState.setIsMarkupModeSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('lyrics-view')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Switch to musical' }));

    await waitFor(() => expect(mockAppState.setIsMarkupModeSpy).toHaveBeenCalledWith(false));
    expect(screen.getByTestId('musical-tab')).toBeInTheDocument();
  });

  it('does not reset markup mode when it is already disabled on a non-lyrics tab', () => {
    mockAppState.initialActiveTab = 'musical';
    mockAppState.initialIsMarkupMode = false;

    render(<App />);

    expect(mockAppState.setIsMarkupModeSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('musical-tab')).toBeInTheDocument();
  });
});
