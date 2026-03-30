import React, { act } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { WebSimilarityCandidate, WebSimilarityIndex } from './types/webSimilarity';

const mockAppState = vi.hoisted(() => ({
  initialActiveTab: 'lyrics' as 'lyrics' | 'musical',
  initialEditMode: 'markdown' as 'text' | 'markdown' | 'section' | 'phonetic',
  initialIsLeftPanelOpen: false,
  initialIsStructureOpen: false,
  initialIsMobile: false,
  initialIsTablet: false,
  initialIsGenerating: false,
  initialSelectedLineId: null as string | null,
  initialSuggestions: [] as string[],
  song: [] as Array<{ id: string; name: string; lines: Array<{ id: string; text: string; isMeta: boolean }> }>,
  structure: [] as Array<{ id: string; name: string }>,
  similarityIndex: { status: 'idle', candidates: [], lastUpdated: null, error: null } as WebSimilarityIndex,
  setActiveTabSpy: vi.fn(),
  setEditModeSpy: vi.fn(),
  setIsLeftPanelOpenSpy: vi.fn(),
  setIsStructureOpenSpy: vi.fn(),
  useKeyboardShortcutsSpy: vi.fn(),
  appModalsPropsSpy: vi.fn(),
  useVersionManagerSpy: vi.fn(),
  useLibraryActionsSpy: vi.fn(),
  useAppHandlersSpy: vi.fn(),
  useSongAnalysisSpy: vi.fn(),
  topRibbonPropsSpy: vi.fn(),
  statusBarPropsSpy: vi.fn(),
  mobileBottomNavPropsSpy: vi.fn(),
  noop: vi.fn(),
  asyncNoop: vi.fn(async () => {}),
}));

vi.mock('@fluentui/react-components', () => ({
  FluentProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  webLightTheme: {},
  webDarkTheme: {},
  Spinner: () => <div data-testid="spinner" />,
}));

vi.mock('./contexts/ModalContext', async () => {
  const actual = await vi.importActual<typeof import('./contexts/ModalContext')>('./contexts/ModalContext');
  return actual;
});

vi.mock('./contexts/DragContext', () => ({
  DragProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./contexts/DragHandlersContext', () => ({
  DragHandlersProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDragHandlersContext: () => ({
    handleDrop: mockAppState.noop,
    handleLineDragStart: mockAppState.noop,
    handleLineDrop: mockAppState.noop,
  }),
}));

vi.mock('./hooks/useAudioFeedback', () => ({
  useAudioFeedback: () => ({ playAudioFeedback: mockAppState.noop }),
}));

vi.mock('./hooks/useSongAnalysis', () => ({
  useSongAnalysis: (params: unknown) => {
    mockAppState.useSongAnalysisSpy(params);
    return {
      // PR-4 fix: added missing fields from current contract
      canPasteLyrics: false,
      isPasteModalOpen: false,
      setIsPasteModalOpen: mockAppState.noop,
      pastedText: '',
      setPastedText: mockAppState.noop,
      isAnalyzing: false,
      isAnalyzingTheme: false,
      isAnalysisModalOpen: false,
      setIsAnalysisModalOpen: mockAppState.noop,
      importProgress: { current: 0, total: 0, currentLabel: '' },
      analysisReport: null,
      analysisSteps: [],
      appliedAnalysisItems: new Set<string>(),
      selectedAnalysisItems: new Set<string>(),
      isApplyingAnalysis: null,
      targetLanguage: 'en',
      setTargetLanguage: mockAppState.noop,
      isAdaptingLanguage: false,
      isDetectingLanguage: false,
      adaptationProgress: null,
      adaptationResult: null,
      sectionTargetLanguages: {},
      setSectionTargetLanguages: mockAppState.noop,
      toggleAnalysisItemSelection: mockAppState.noop,
      applyAnalysisItem: mockAppState.asyncNoop,
      applySelectedAnalysisItems: mockAppState.noop,
      analyzeCurrentSong: mockAppState.asyncNoop,
      detectLanguage: mockAppState.asyncNoop,
      adaptSongLanguage: mockAppState.asyncNoop,
      adaptSectionLanguage: mockAppState.asyncNoop,
      analyzePastedLyrics: mockAppState.asyncNoop,
      clearAppliedAnalysisItems: mockAppState.noop,
    };
  },
}));

vi.mock('./hooks/useSongEditor', () => ({
  useSongEditor: () => ({
    removeStructureItem: mockAppState.noop,
    addStructureItem: mockAppState.noop,
    normalizeStructure: mockAppState.noop,
    exportSong: mockAppState.asyncNoop,
    loadFileForAnalysis: mockAppState.asyncNoop,
  }),
}));

vi.mock('./hooks/useSongComposer', async () => {
  const ReactModule = await import('react');
  return {
    useSongComposer: () => {
      const [selectedLineId, setSelectedLineId] = ReactModule.useState<string | null>(mockAppState.initialSelectedLineId);
      return {
        isGenerating: mockAppState.initialIsGenerating,
        isRegeneratingSection: () => false,
        isGeneratingMusicalPrompt: false,
        isAnalyzingLyrics: false,
        selectedLineId,
        setSelectedLineId,
        suggestions: mockAppState.initialSuggestions,
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
      };
    },
  };
});

vi.mock('./hooks/useSongHistoryState', () => ({
  useSongHistoryState: () => ({
    song: mockAppState.song,
    structure: mockAppState.structure,
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
    index: mockAppState.similarityIndex,
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
      const [editMode, setEditModeState] = ReactModule.useState(mockAppState.initialEditMode);
      const [isStructureOpen, setIsStructureOpenState] = ReactModule.useState(mockAppState.initialIsStructureOpen);
      const [isLeftPanelOpen, setIsLeftPanelOpenState] = ReactModule.useState(mockAppState.initialIsLeftPanelOpen);
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
        isStructureOpen,
        setIsStructureOpen: (value: React.SetStateAction<boolean>) => {
          mockAppState.setIsStructureOpenSpy(value);
          setIsStructureOpenState(value);
        },
        isLeftPanelOpen,
        setIsLeftPanelOpen: (value: React.SetStateAction<boolean>) => {
          mockAppState.setIsLeftPanelOpenSpy(value);
          setIsLeftPanelOpenState(value);
        },
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
        tempo: 120,
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
        defaultEditMode: 'markdown',
        setDefaultEditMode: mockAppState.noop,
        showTranslationFeatures: false,
        setShowTranslationFeatures: mockAppState.noop,
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
        editMode,
        setEditMode: (value: 'text' | 'markdown' | 'section' | 'phonetic') => {
          mockAppState.setEditModeSpy(value);
          setEditModeState(value);
        },
        markupText: '[Verse]\nHello',
        setMarkupText: mockAppState.noop,
        isAboutOpen: false,
        setIsAboutOpen: mockAppState.noop,
        isSettingsOpen: false,
        setIsSettingsOpen: mockAppState.noop,
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
        isKeyboardShortcutsModalOpen: false,
        setIsKeyboardShortcutsModalOpen: mockAppState.noop,
        shouldAutoGenerateTitle: false,
        setShouldAutoGenerateTitle: mockAppState.noop,
        confirmModal: null,
        setConfirmModal: mockAppState.noop,
        promptModal: null,
        setPromptModal: mockAppState.noop,
        isPasteModalOpen: false,
        setIsPasteModalOpen: mockAppState.noop,
        isAnalysisModalOpen: false,
        setIsAnalysisModalOpen: mockAppState.noop,
        isSearchReplaceOpen: false,
        setIsSearchReplaceOpen: mockAppState.noop,
        apiErrorModal: { open: false, message: '' },
        setApiErrorModal: mockAppState.noop,
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
  useVersionManager: (params: unknown) => {
    mockAppState.useVersionManagerSpy(params);
    return {
      versions: [],
      saveVersion: mockAppState.noop,
      rollbackToVersion: mockAppState.noop,
      handleRequestVersionName: mockAppState.noop,
    };
  },
}));

vi.mock('./hooks/useMarkupEditor', () => ({
  useMarkupEditor: () => ({
    scrollToSection: mockAppState.noop,
    handleMarkupToggle: mockAppState.noop,
    switchEditMode: mockAppState.noop,
    markupDirection: 'ltr',
  }),
}));

vi.mock('./hooks/useMobileLayout', () => ({
  useMobileLayout: () => ({
    isMobile: mockAppState.initialIsMobile,
    isTablet: mockAppState.initialIsTablet,
  }),
}));

vi.mock('./hooks/useMobileInitPanels', () => ({
  useMobileInitPanels: mockAppState.noop,
}));

vi.mock('./hooks/useKeyboardShortcuts', async () => {
  const { useModalContext } = await vi.importActual<typeof import('./contexts/ModalContext')>('./contexts/ModalContext');
  return {
    useKeyboardShortcuts: (params: unknown) => {
      useModalContext();
      mockAppState.useKeyboardShortcutsSpy(params);
    },
  };
});

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
  useLibraryActions: (params: unknown) => {
    mockAppState.useLibraryActionsSpy(params);
    return {
      handleSaveToLibrary: mockAppState.asyncNoop,
      handleLoadLibraryAsset: mockAppState.noop,
      handleDeleteLibraryAsset: mockAppState.noop,
      handlePurgeLibrary: mockAppState.noop,
      handleOpenSaveToLibraryModal: mockAppState.noop,
    };
  },
}));

vi.mock('./hooks/useAppHandlers', () => ({
  useAppHandlers: (params: unknown) => {
    mockAppState.useAppHandlersSpy(params);
    return {
      handleApiKeyHelp: mockAppState.noop,
      handleTitleChange: mockAppState.noop,
      handleGenerateTitle: mockAppState.asyncNoop,
      handleGlobalRegenerate: mockAppState.noop,
      handleScrollToSection: mockAppState.noop,
      handleOpenNewGeneration: mockAppState.noop,
    };
  },
}));

vi.mock('./hooks/useUIStateForProvider', () => ({
  useUIStateForProvider: (params: unknown) => params,
}));

vi.mock('./components/app/LeftSettingsPanel', () => ({
  LeftSettingsPanel: () => <div data-testid="left-settings-panel" />,
}));

vi.mock('./components/app/TopRibbon', async () => {
  const { useAppNavigationContext } = await vi.importActual<typeof import('./contexts/AppStateContext')>('./contexts/AppStateContext');

  return {
    TopRibbon: (props: unknown) => {
      const { setActiveTab } = useAppNavigationContext();
      mockAppState.topRibbonPropsSpy(props);
      return <button type="button" onClick={() => setActiveTab('musical')}>Switch to musical</button>;
    },
  };
});

vi.mock('./components/app/StructureSidebar', () => ({
  StructureSidebar: () => <div data-testid="structure-sidebar" />,
}));

vi.mock('./components/app/SuggestionsPanel', () => ({
  SuggestionsPanel: () => <div data-testid="suggestions-panel" />,
}));

vi.mock('./components/app/StatusBar', () => ({
  StatusBar: (props: unknown) => {
    mockAppState.statusBarPropsSpy(props);
    return <div data-testid="status-bar" />;
  },
}));

vi.mock('./components/app/InsightsBar', () => ({
  InsightsBar: ({ webBadgeLabel }: { webBadgeLabel: string | null }) => (
    <div data-testid="insights-bar">{webBadgeLabel ?? 'no-web-badge-label'}</div>
  ),
}));

vi.mock('./components/app/LyricsView', () => ({
  LyricsView: () => <div data-testid="lyrics-view" />,
}));

vi.mock('./components/app/AppModals', () => ({
  AppModals: (props: unknown) => {
    mockAppState.appModalsPropsSpy(props);
    return <div data-testid="app-modals" />;
  },
}));

vi.mock('./components/app/MobileBottomNav', () => ({
  MobileBottomNav: (props: unknown) => {
    mockAppState.mobileBottomNavPropsSpy(props);
    return <div data-testid="mobile-bottom-nav" />;
  },
}));

vi.mock('./components/app/musical/MusicalTab', () => ({
  MusicalTab: () => <div data-testid="musical-tab" />,
}));

vi.mock('./i18n', () => ({
  useTranslation: () => ({
    t: {
      tooltips: { aiUnavailableHelp: 'help' },
      editor: { regenerateWarning: 'This will regenerate the song. Continue?' },
    },
  }),
  useLanguage: () => ({ language: 'en' }),
}));

describe('App markup mode reset', () => {
  beforeEach(() => {
    mockAppState.initialActiveTab = 'lyrics';
    mockAppState.initialEditMode = 'markdown';
    mockAppState.initialIsLeftPanelOpen = false;
    mockAppState.initialIsStructureOpen = false;
    mockAppState.initialIsMobile = false;
    mockAppState.initialIsTablet = false;
    mockAppState.initialIsGenerating = false;
    mockAppState.initialSelectedLineId = null;
    mockAppState.initialSuggestions = [];
    mockAppState.song = [];
    mockAppState.structure = [];
    mockAppState.similarityIndex = { status: 'idle', candidates: [], lastUpdated: null, error: null } as WebSimilarityIndex;
    mockAppState.setActiveTabSpy.mockClear();
    mockAppState.setEditModeSpy.mockClear();
    mockAppState.setIsLeftPanelOpenSpy.mockClear();
    mockAppState.setIsStructureOpenSpy.mockClear();
    mockAppState.useKeyboardShortcutsSpy.mockClear();
    mockAppState.appModalsPropsSpy.mockClear();
    mockAppState.useVersionManagerSpy.mockClear();
    mockAppState.useLibraryActionsSpy.mockClear();
    mockAppState.useAppHandlersSpy.mockClear();
    mockAppState.useSongAnalysisSpy.mockClear();
    mockAppState.topRibbonPropsSpy.mockClear();
    mockAppState.statusBarPropsSpy.mockClear();
    mockAppState.mobileBottomNavPropsSpy.mockClear();
  });

  it('renders the app without crashing (smoke test)', async () => {
    await act(async () => { render(<App />); });
    expect(screen.getByTestId('left-settings-panel')).toBeTruthy();
    expect(screen.getByTestId('status-bar')).toBeTruthy();
    expect(screen.getByTestId('lyrics-view')).toBeTruthy();
  });

  it('resets edit mode to section when switching away from the lyrics tab', async () => {
    render(<App />);
    await act(async () => {});
    const switchButton = screen.getByText('Switch to musical');
    await act(async () => { fireEvent.click(switchButton); });
    expect(mockAppState.setEditModeSpy).toHaveBeenCalledWith('section');
  });

  it('forwards isAnalyzingTheme and applyAnalysisItem to AppModals', async () => {
    await act(async () => { render(<App />); });
    const calls = mockAppState.appModalsPropsSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    // noUncheckedIndexedAccess-safe: assert non-nullish before indexing
    const lastCall = calls[calls.length - 1];
    const lastProps = (lastCall?.[0] ?? {}) as Record<string, unknown>;
    expect('isAnalyzingTheme' in lastProps).toBe(true);
    expect('applyAnalysisItem' in lastProps).toBe(true);
    expect(typeof lastProps.applyAnalysisItem).toBe('function');
  });
});
