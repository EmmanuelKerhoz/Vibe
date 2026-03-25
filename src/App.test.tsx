import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { WebSimilarityCandidate, WebSimilarityIndex } from './types/webSimilarity';

const mockAppState = vi.hoisted(() => ({
  initialActiveTab: 'lyrics' as 'lyrics' | 'musical',
  initialEditMode: 'markdown' as 'text' | 'markdown' | 'section',
  initialIsLeftPanelOpen: false,
  initialIsStructureOpen: false,
  initialIsMobile: false,
  initialIsTablet: false,
  initialIsGenerating: false,
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
}));

vi.mock('./contexts/ModalContext', async () => {
  const actual = await vi.importActual<typeof import('./contexts/ModalContext')>('./contexts/ModalContext');

  return actual;
});

vi.mock('./contexts/DragContext', () => ({
  DragProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./hooks/useAudioFeedback', () => ({
  useAudioFeedback: () => ({ playAudioFeedback: mockAppState.noop }),
}));

vi.mock('./hooks/useSongAnalysis', () => ({
  useSongAnalysis: (params: unknown) => {
    mockAppState.useSongAnalysisSpy(params);
    return {
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
    };
  },
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
    isGenerating: mockAppState.initialIsGenerating,
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
        setEditMode: (value: 'text' | 'markdown' | 'section') => {
          mockAppState.setEditModeSpy(value);
          setEditModeState(value);
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

vi.mock('./components/app/TopRibbon', () => ({
  TopRibbon: (props: { setActiveTab: (value: 'lyrics' | 'musical') => void }) => (
    mockAppState.topRibbonPropsSpy(props),
    <button type="button" onClick={() => props.setActiveTab('musical')}>
      Switch to musical
    </button>
  ),
}));

vi.mock('./components/app/StructureSidebar', () => ({
  StructureSidebar: () => <div data-testid="structure-sidebar" />,
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
    mockAppState.initialEditMode = 'markdown';
    mockAppState.initialIsLeftPanelOpen = false;
    mockAppState.initialIsStructureOpen = false;
    mockAppState.initialIsMobile = false;
    mockAppState.initialIsTablet = false;
    mockAppState.initialIsGenerating = false;
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

  it('keeps markup mode while the lyrics tab remains active and resets it after switching tabs', async () => {
    render(<App />);

    expect(mockAppState.setEditModeSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('lyrics-view')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Switch to musical' }));

    await waitFor(() => expect(mockAppState.setEditModeSpy).toHaveBeenCalledWith('section'));
    expect(screen.getByTestId('musical-tab')).toBeTruthy();
  });

  it('does not reset markup mode when it is already disabled on a non-lyrics tab', () => {
    mockAppState.initialActiveTab = 'musical';
    mockAppState.initialEditMode = 'section';

    render(<App />);

    expect(mockAppState.setEditModeSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('musical-tab')).toBeTruthy();
  });

  it('renders the mobile backdrop as an accessible button that closes mobile panels', async () => {
    mockAppState.initialIsMobile = true;
    mockAppState.initialIsLeftPanelOpen = true;

    render(<App />);

    const backdrop = screen.getByRole('button', { name: 'Close mobile panels' });
    expect(backdrop.className).toContain('mobile-panel-backdrop');

    fireEvent.click(backdrop);

    await waitFor(() => expect(mockAppState.setIsLeftPanelOpenSpy).toHaveBeenCalledWith(false));
    expect(mockAppState.setIsStructureOpenSpy).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('button', { name: 'Close mobile panels' })).toBeNull();
  });

  it('does not build an undefined web similarity badge label when the first score is missing at runtime', () => {
    const candidateWithoutScore = {
      title: 'Match',
      snippet: 'Snippet',
      url: 'https://example.com',
      source: 'ddg',
      matchedSegments: [],
    } as unknown as WebSimilarityCandidate;

    mockAppState.song = [{
      id: 'section-1',
      name: 'Verse',
      lines: [{ id: 'line-1', text: 'Hello world', isMeta: false }],
    }];
    mockAppState.structure = [{ id: 'section-1', name: 'Verse' }];
    mockAppState.similarityIndex = {
      status: 'done',
      candidates: [candidateWithoutScore],
      lastUpdated: null,
      error: null,
    };

    render(<App />);

    expect(screen.getByTestId('insights-bar').textContent).toBe('no-web-badge-label');
    expect(screen.queryByText('undefined%')).toBeNull();
  });

  it('passes only external shortcut controls and business-data modal props from App', () => {
    render(<App />);

    expect(mockAppState.useKeyboardShortcutsSpy).toHaveBeenCalledWith({
      isMobileOrTablet: false,
      closeMobilePanels: expect.any(Function),
      undo: expect.any(Function),
      redo: expect.any(Function),
    });

    const appModalsProps = mockAppState.appModalsPropsSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(appModalsProps).toBeTruthy();
    expect(appModalsProps).toMatchObject({
      theme: 'dark',
      hasExistingWork: expect.any(Boolean),
      exportSong: expect.any(Function),
      handleImportInputChange: expect.any(Function),
      resetSong: expect.any(Function),
    });
    expect(appModalsProps).not.toHaveProperty('isAboutOpen');
    expect(appModalsProps).not.toHaveProperty('setIsAboutOpen');
    expect(appModalsProps).not.toHaveProperty('isSettingsOpen');
    expect(appModalsProps).not.toHaveProperty('setIsSettingsOpen');
    expect(appModalsProps).not.toHaveProperty('isImportModalOpen');
    expect(appModalsProps).not.toHaveProperty('setIsImportModalOpen');
    expect(appModalsProps).not.toHaveProperty('isExportModalOpen');
    expect(appModalsProps).not.toHaveProperty('setIsExportModalOpen');
    expect(appModalsProps).not.toHaveProperty('isPasteModalOpen');
    expect(appModalsProps).not.toHaveProperty('setIsPasteModalOpen');
    expect(appModalsProps).not.toHaveProperty('isAnalysisModalOpen');
    expect(appModalsProps).not.toHaveProperty('setIsAnalysisModalOpen');
    expect(appModalsProps).not.toHaveProperty('isSimilarityModalOpen');
    expect(appModalsProps).not.toHaveProperty('setIsSimilarityModalOpen');
    expect(appModalsProps).not.toHaveProperty('isSaveToLibraryModalOpen');
    expect(appModalsProps).not.toHaveProperty('setIsSaveToLibraryModalOpen');
    expect(appModalsProps).not.toHaveProperty('isVersionsModalOpen');
    expect(appModalsProps).not.toHaveProperty('setIsVersionsModalOpen');
    expect(appModalsProps).not.toHaveProperty('isResetModalOpen');
    expect(appModalsProps).not.toHaveProperty('setIsResetModalOpen');
    expect(appModalsProps).not.toHaveProperty('promptModal');
    expect(appModalsProps).not.toHaveProperty('setPromptModal');
    expect(appModalsProps).not.toHaveProperty('confirmModal');
    expect(appModalsProps).not.toHaveProperty('setConfirmModal');
    expect(appModalsProps).not.toHaveProperty('apiErrorModal');
    expect(appModalsProps).not.toHaveProperty('setApiErrorModal');
  });

  it('reuses shared stable modal-open handlers across AppInnerContent child props', async () => {
    mockAppState.initialIsMobile = true;

    render(<App />);

    const initialTopRibbonProps = mockAppState.topRibbonPropsSpy.mock.calls.at(-1)?.[0] as {
      onImportClick: () => void;
      onExportClick: () => void;
      onOpenSettingsClick: () => void;
      onOpenAboutClick: () => void;
      onOpenKeyboardShortcutsClick: () => void;
      onPasteLyrics: () => void;
    };
    const initialStatusBarProps = mockAppState.statusBarPropsSpy.mock.calls.at(-1)?.[0] as {
      onOpenAbout: () => void;
      onOpenSettings: () => void;
    };
    const initialMobileBottomNavProps = mockAppState.mobileBottomNavPropsSpy.mock.calls.at(-1)?.[0] as {
      onOpenSettings: () => void;
    };

    expect(initialTopRibbonProps.onOpenAboutClick).toBe(initialStatusBarProps.onOpenAbout);
    expect(initialTopRibbonProps.onOpenSettingsClick).toBe(initialStatusBarProps.onOpenSettings);
    expect(initialTopRibbonProps.onOpenSettingsClick).toBe(initialMobileBottomNavProps.onOpenSettings);

    fireEvent.click(screen.getByRole('button', { name: 'Switch to musical' }));

    await waitFor(() => {
      const rerenderedTopRibbonProps = mockAppState.topRibbonPropsSpy.mock.calls.at(-1)?.[0] as {
        onImportClick: () => void;
        onExportClick: () => void;
        onOpenSettingsClick: () => void;
        onOpenAboutClick: () => void;
        onOpenKeyboardShortcutsClick: () => void;
        onPasteLyrics: () => void;
      };
      const rerenderedStatusBarProps = mockAppState.statusBarPropsSpy.mock.calls.at(-1)?.[0] as {
        onOpenAbout: () => void;
        onOpenSettings: () => void;
      };
      const rerenderedMobileBottomNavProps = mockAppState.mobileBottomNavPropsSpy.mock.calls.at(-1)?.[0] as {
        onOpenSettings: () => void;
      };

      expect(rerenderedTopRibbonProps.onImportClick).toBe(initialTopRibbonProps.onImportClick);
      expect(rerenderedTopRibbonProps.onExportClick).toBe(initialTopRibbonProps.onExportClick);
      expect(rerenderedTopRibbonProps.onOpenSettingsClick).toBe(initialTopRibbonProps.onOpenSettingsClick);
      expect(rerenderedTopRibbonProps.onOpenAboutClick).toBe(initialTopRibbonProps.onOpenAboutClick);
      expect(rerenderedTopRibbonProps.onOpenKeyboardShortcutsClick).toBe(initialTopRibbonProps.onOpenKeyboardShortcutsClick);
      expect(rerenderedTopRibbonProps.onPasteLyrics).toBe(initialTopRibbonProps.onPasteLyrics);
      expect(rerenderedStatusBarProps.onOpenAbout).toBe(initialStatusBarProps.onOpenAbout);
      expect(rerenderedStatusBarProps.onOpenSettings).toBe(initialStatusBarProps.onOpenSettings);
      expect(rerenderedMobileBottomNavProps.onOpenSettings).toBe(initialMobileBottomNavProps.onOpenSettings);
    });
  });

  it('forwards the live generating ref object into useSongAnalysis', () => {
    mockAppState.initialIsGenerating = true;

    render(<App />);

    const params = mockAppState.useSongAnalysisSpy.mock.calls[0]?.[0] as {
      isGeneratingRef?: React.RefObject<boolean>;
      isGenerating?: boolean;
    };

    expect(params).toBeTruthy();
    expect(params.isGenerating).toBeUndefined();
    expect(params.isGeneratingRef).toBeTruthy();
    expect(params.isGeneratingRef?.current).toBe(true);
  });

  it('passes only external params to the autonomous hooks', () => {
    render(<App />);

    const versionManagerParams = mockAppState.useVersionManagerSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(versionManagerParams).toMatchObject({
      updateSongAndStructureWithHistory: expect.any(Function),
      setIsVersionsModalOpen: expect.any(Function),
      setPromptModal: expect.any(Function),
    });
    expect(versionManagerParams).not.toHaveProperty('song');
    expect(versionManagerParams).not.toHaveProperty('structure');
    expect(versionManagerParams).not.toHaveProperty('title');
    expect(versionManagerParams).not.toHaveProperty('titleOrigin');
    expect(versionManagerParams).not.toHaveProperty('topic');
    expect(versionManagerParams).not.toHaveProperty('mood');
    expect(versionManagerParams).not.toHaveProperty('setTitle');
    expect(versionManagerParams).not.toHaveProperty('setTitleOrigin');
    expect(versionManagerParams).not.toHaveProperty('setTopic');
    expect(versionManagerParams).not.toHaveProperty('setMood');

    const libraryActionsParams = mockAppState.useLibraryActionsSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(libraryActionsParams).toMatchObject({
      song: expect.any(Array),
      replaceStateWithoutHistory: expect.any(Function),
      clearHistory: expect.any(Function),
      setSimilarityMatches: expect.any(Function),
      setLibraryCount: expect.any(Function),
      setLibraryAssets: expect.any(Function),
      setIsSavingToLibrary: expect.any(Function),
      setIsSaveToLibraryModalOpen: expect.any(Function),
    });
    expect(libraryActionsParams).not.toHaveProperty('title');
    expect(libraryActionsParams).not.toHaveProperty('topic');
    expect(libraryActionsParams).not.toHaveProperty('mood');
    expect(libraryActionsParams).not.toHaveProperty('genre');
    expect(libraryActionsParams).not.toHaveProperty('tempo');
    expect(libraryActionsParams).not.toHaveProperty('instrumentation');
    expect(libraryActionsParams).not.toHaveProperty('rhythm');
    expect(libraryActionsParams).not.toHaveProperty('narrative');
    expect(libraryActionsParams).not.toHaveProperty('musicalPrompt');
    expect(libraryActionsParams).not.toHaveProperty('rhymeScheme');
    expect(libraryActionsParams).not.toHaveProperty('targetSyllables');
    expect(libraryActionsParams).not.toHaveProperty('setTitle');
    expect(libraryActionsParams).not.toHaveProperty('setTitleOrigin');
    expect(libraryActionsParams).not.toHaveProperty('setTopic');
    expect(libraryActionsParams).not.toHaveProperty('setMood');
    expect(libraryActionsParams).not.toHaveProperty('setRhymeScheme');
    expect(libraryActionsParams).not.toHaveProperty('setTargetSyllables');
    expect(libraryActionsParams).not.toHaveProperty('setGenre');
    expect(libraryActionsParams).not.toHaveProperty('setTempo');
    expect(libraryActionsParams).not.toHaveProperty('setInstrumentation');
    expect(libraryActionsParams).not.toHaveProperty('setRhythm');
    expect(libraryActionsParams).not.toHaveProperty('setNarrative');
    expect(libraryActionsParams).not.toHaveProperty('setMusicalPrompt');

    const appHandlersParams = mockAppState.useAppHandlersSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(appHandlersParams).toMatchObject({
      t: expect.any(Object),
      hasRealLyricContent: expect.any(Boolean),
      isMobileOrTablet: expect.any(Boolean),
      setApiErrorModal: expect.any(Function),
      setConfirmModal: expect.any(Function),
      setActiveTab: expect.any(Function),
      setIsLeftPanelOpen: expect.any(Function),
      setIsStructureOpen: expect.any(Function),
      generateTitle: expect.any(Function),
      generateSong: expect.any(Function),
      scrollToSection: expect.any(Function),
    });
    expect(appHandlersParams).not.toHaveProperty('song');
    expect(appHandlersParams).not.toHaveProperty('setTitle');
    expect(appHandlersParams).not.toHaveProperty('setTitleOrigin');

    const songAnalysisParams = mockAppState.useSongAnalysisSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(songAnalysisParams).toMatchObject({
      uiLanguage: 'en',
      isGeneratingRef: expect.any(Object),
      saveVersion: expect.any(Function),
      updateState: expect.any(Function),
      updateSongAndStructureWithHistory: expect.any(Function),
      clearLineSelection: expect.any(Function),
      requestAutoTitleGeneration: expect.any(Function),
      setIsPasteModalOpen: expect.any(Function),
      setIsAnalysisModalOpen: expect.any(Function),
    });
    expect(songAnalysisParams).not.toHaveProperty('song');
    expect(songAnalysisParams).not.toHaveProperty('topic');
    expect(songAnalysisParams).not.toHaveProperty('mood');
    expect(songAnalysisParams).not.toHaveProperty('rhymeScheme');
    expect(songAnalysisParams).not.toHaveProperty('songLanguage');
    expect(songAnalysisParams).not.toHaveProperty('setSongLanguage');
    expect(songAnalysisParams).not.toHaveProperty('setTopic');
    expect(songAnalysisParams).not.toHaveProperty('setMood');
  });
});
