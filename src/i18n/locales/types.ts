export interface Translations {
  /** Generic shared strings */
  common?: {
    loading: string;
  };

  app: {
    name: string;
    tagline: string;
  };

  /** Locale metadata – only populated for AI-generated draft locales */
  _meta?: {
    /** Whether this locale pack was bootstrapped by AI (pending human review) */
    isAiGenerated: boolean;
    generatedAt: string; // ISO date string
  };

  statusBar: {
    ready: string;
    generating: string;
    analyzing: string;
    suggesting: string;
    sections: string;
    sections_one: string;
    sections_other: string;
    words: string;
    words_one: string;
    words_other: string;
    theme: string;
    audioFeedback: string;
    language: string;
    settings: string;
  };

  ribbon: {
    lyrics: string;
    musical: string;
    similarity: string;
    import: string;
    export: string;
    versions: string;
    undo: string;
    redo: string;
    reset: string;
    aiUnavailable: string;
  };

  mobileNav: {
    navigation: string;
    settings: string;
    lyrics: string;
    music: string;
    structure: string;
  };

  leftPanel: {
    title: string;
    songTitle: string;
    songTitlePlaceholder: string;
    songTopic: string;
    songTopicPlaceholder: string;
    songMood: string;
    songMoodPlaceholder: string;
    songMoodPresets: string;
    rhymeScheme: string;
    targetSyllables: string;
    quantize: string;
    collapse: string;
  };

  structure: {
    title: string;
    addSection: string;
    normalize: string;
    collapse: string;
  };

  editor: {
    emptyState: {
      title: string;
      description: string;
      loadSession: string;
      pasteLyrics: string;
      generateSong: string;
    };
    markupMode: {
      title: string;
      description: string;
      hint: string;
      placeholder: string;
    };
    textMode: {
      title: string;
      description: string;
      hint: string;
      placeholder: string;
    };
    phoneticMode: {
      title: string;
      description: string;
      hint: string;
      placeholder: string;
      loading?: string;
      languageLabel?: string;
      error?: string;
    };
    sectionTooltip: {
      lines: string;
      words: string;
      syllablesTarget: string;
      rhymeScheme: string;
    };
    analyze: string;
    regenerate: string;
    adaptation: string;
    adaptGlobal: string;
    regenerateGlobal: string;
    regenerateLyrics: string;
    adaptSection: string;
    editorMode: string;
    markupModeLabel: string;
    phoneticModeLabel: string;
    textModeLabel: string;
    regenerateSection: string;
    quantize: string;
    lyricLine: string;
    rhymeSyllable: string;
    rhyme: string;
    syllables: string;
    syllableCount?: string;
    /** Column header for the rhyme schema badge */
    schemaHeader?: string;
    concept: string;
    lines: string;
    chars: string;
    adapt: string;
    moodPlaceholder: string;
    regenerateWarning: string;
    /** Button label to add a lyric line to a section */
    addLine?: string;
    /** Button label to add a musical/modulation/effect marker */
    addMusicalEffect?: string;
    moveSectionUp?: string;
    moveSectionDown?: string;
    dragToReorder?: string;
    anchoredSection?: string;
    dragToReorderLine?: string;
    humanLine?: string;
    aiLine?: string;
    moveLineUp?: string;
    moveLineDown?: string;
    deleteLine?: string;
    linePlaceholder?: string;
    addLineAfter?: string;
    /** Tooltip for the per-line language adaptation button */
    adaptLine?: string;
    /** Screen-reader-only label shown while the adaptation button is busy */
    adaptingLabel?: string;
    /** Screen-reader-only label shown while the language-detection button is busy */
    detectingLanguageLabel?: string;
    /** Screen-reader-only label shown while the analyze button is busy */
    analyzingLabel?: string;
    /** Screen-reader-only label shown while the similarity button is busy */
    checkingSimilarityLabel?: string;
    /** Section header label for the lyrics-editors group in the insights bar */
    lyricsEditors?: string;
    /** Section header label for the lyrics-insights group in the insights bar */
    lyricsInsights?: string;
    /** Short label on the detect-language button when no language has been detected yet */
    detect?: string;
  };

  suggestions: {
    title: string;
    crafting: string;
    clickToApply: string;
    moreOptions: string;
    empty: string;
  };

  musical: {
    title: string;
    description: string;
    genre: string;
    genrePlaceholder: string;
    tempo: string;
    instrumentation: string;
    instrumentationPlaceholder: string;
    rhythm: string;
    rhythmPlaceholder: string;
    narrative: string;
    narrativePlaceholder: string;
    analyzeLyrics: string;
    analyzeLyricsShort: string;
    analyzing: string;
    autoSuggestLabel: string;
    generatePrompt: string;
    promptLabel: string;
    promptPlaceholder: string;
    promptStructureLabel?: string;
    promptStructureHint?: string;
    optimizedFor: string;
    copyPrompt: string;
    copied: string;
    contextInfo: string;
    /** Metronome feature (B4) */
    metronome?: string;
    metronomeStart?: string;
    metronomeStop?: string;
    /** Instrument builder (B2) */
    instruments?: string;
    instrumentsPlaceholder?: string;
    /** Rhythm presets (B3) */
    rhythmPresets?: string;
    /** Vibe Board feature */
    vibeBoard?: string;
    vibeBoardDescription?: string;
    subStyle?: string;
  };

  analysis: {
    title: string;
    deepAnalysis: string;
    theme: string;
    emotionalArc: string;
    strengths: string;
    improvements: string;
    musicalSuggestions: string;
    summary: string;
    apply: string;
    revert: string;
    close: string;
    noData: string;
  };

  similarity: {
    title: string;
    subtitle: string;
    empty: string;
    noCandidates: string;
    score: string;
    sharedWords: string;
    sharedLines: string;
    matchedSections: string;
    sharedKeywords: string;
    thresholdHint: string;
    webTitle: string;
    webSubtitle: string;
    webIdle: string;
    webRunning: string;
    webNoMatches: string;
    webRefresh: string;
    nGramScoring: string;
    libraryTitle: string;
  };

  saveToLibrary: {
    title: string;
    save: string;
    saving: string;
    saved: string;
    saveDescription: string;
    browseDescription: string;
    yourLibrary: string;
    empty: string;
    load: string;
    loadDescription: string;
    close: string;
    storageTitle: string;
    storageLibraryData: string;
    storageUsed: string;
    storageQuota: string;
    storageSaturation: string;
    storageScopeLocal: string;
    libraryItems: string;
    purge: string;
    purgeWarning: string;
    confirmPurge: string;
    cancel: string;
  };

  paste: {
    title: string;
    description: string;
    placeholder: string;
    cancel: string;
    analyze: string;
    analyzing: string;
  };

  importDialog: {
    title: string;
    emptyDescription: string;
    replaceDescription: string;
    warning: string;
    supportedFiles: string;
    cancel: string;
    chooseFile: string;
  };

  exportDialog: {
    title: string;
    description: string;
    formatLabel: string;
    cancel: string;
    save: string;
    formats: {
      txt: string;
      markup: string;
      odt: string;
      docx: string;
    };
  };

  keyboardShortcuts: {
    title: string;
    description: string;
    keysColumn: string;
    actionColumn: string;
    close: string;
    categories: {
      edit: string;
      navigation: string;
      file: string;
      ai: string;
    };
    shortcuts: {
      undo: string;
      redo: string;
      dismissReset: string;
      dismissNavigation: string;
      dismissFileDialogs: string;
      dismissAiDialogs: string;
      openSearch: string;
    };
  };

  searchReplace: {
    title: string;
    searchPlaceholder: string;
    replacePlaceholder: string;
    matchCount: string;
    matchCountNone: string;
    previous: string;
    next: string;
    replace: string;
    replaceAll: string;
    caseSensitive: string;
    close: string;
    replacedCount: string;
  };

  about: {
    description: string;
    engine: string;
    engineLabel: string;
    modelLabel: string;
    apiKeyLabel: string;
    license: string;
    licenseLabel: string;
    close: string;
  };

  /** AI assistant panel — optional; non-EN/FR locales fall back via deep-merge */
  aiAssistant?: {
    title: string;
    onboarding: string;
    placeholder: string;
    send: string;
    close: string;
    thinking: string;
    error: string;
  };

  settings: {
    title: string;
    theme: {
      label: string;
      dark: string;
      light: string;
      system: string;
    };
    audio: {
      label: string;
      enable: string;
      /** @deprecated replaced by the enable/disable toggle buttons */
      volume: string;
      /** Optional: falls back to the English value via LanguageProvider deep-merge */
      disable?: string;
    };
    language: {
      label: string;
    };
    scale?: {
      label: string;
      small: string;
      medium: string;
      large: string;
    };
    editMode?: {
      label: string;
      text: string;
      section: string;
      markdown: string;
      phonetic?: string;
    };
    translation?: {
      label: string;
      show: string;
      hide: string;
    };
    actions: {
      default: string;
      save: string;
      close: string;
    };
    about: {
      version: string;
      github: string;
      docs: string;
    };
  };

  tooltips: {
    hideSidebar: string;
    showSidebar: string;
    lyricsTab: string;
    musicalTab: string;
    import: string;
    export: string;
    versions: string;
    undo: string;
    redo: string;
    reset: string;
    aiUnavailable: string;
    aiUnavailableHelp: string;
    quantize: string;
    analyzeTheme: string;
    regenerate: string;
    collapseLeft: string;
    collapseRight: string;
    theme: string;
    audioFeedback: string;
    appInfo: string;
    addSection: string;
    removeSection: string;
    normalizeStructure: string;
    loadSession: string;
    pasteLyrics: string;
    generateSong: string;
    regenerateSection: string;
    quantizeSection: string;
    /** Template: use `{lang}` placeholder for the target language name */
    adaptSong: string;
    sectionAdapt: string;
    markupMode: string;
    editorMode: string;
    phoneticMode: string;
    textMode: string;
    applyAnalysis: string;
    revertAnalysis: string;
    closeAnalysis: string;
    generateMusical: string;
    keyboardShortcuts: string;
    closeAbout: string;
    analysisCancel: string;
    analysisImport: string;
    checkSimilarity: string;
    copyPrompt: string;
    generateTitle: string;
    aiGeneratedTitle: string;
    userEnteredTitle: string;
    openSearch: string;
    /** Aria-label for the backdrop that closes a dialog when clicked */
    closeDialog?: string;
    /** Aria-label / title for the busy-indicator dot in the ribbon */
    processing?: string;
    /** Title attribute on the remove-from-library buttons */
    removeFromLibrary?: string;
    /** Aria-label for the remove-from-library button; use `{title}` as placeholder for the song title */
    removeFromLibraryItem?: string;
    /** Tooltip when the left (lyrics generation) panel is closed */
    openLeftPanel?: string;
    /** Tooltip when the left (lyrics generation) panel is open */
    closeLeftPanel?: string;
    /** Tooltip for the detect-language button when no language is detected */
    detectLanguage?: string;
    /** Tooltip for the detect-language button when languages are already detected.
     *  Use `{langs}` as a placeholder for the comma-separated language list. */
    redetectLanguage?: string;
  };

  sections: {
    intro: string;
    verse: string;
    preChorus: string;
    chorus: string;
    bridge: string;
    breakdown: string;
    finalChorus: string;
    outro: string;
  };

  moods: {
    aggressive: string;
    calm: string;
    dark: string;
    energetic: string;
    ethereal: string;
    funky: string;
    gloomy: string;
    happy: string;
    intense: string;
    joyful: string;
    lonely: string;
    majestic: string;
    melancholic: string;
    nostalgic: string;
    optimistic: string;
    peaceful: string;
    quirky: string;
    romantic: string;
    sad: string;
    tense: string;
    uplifting: string;
    vibrant: string;
    whimsical: string;
    yearning: string;
    zen: string;
  };

  insights: {
    title: string;
    sections: string;
    words: string;
    characters: string;
  };

  rhymeSchemes: {
    AABB: string;
    ABAB: string;
    AAAA: string;
    ABCB: string;
    AAABBB: string;
    AABBCC: string;
    ABABAB: string;
    ABCABC: string;
    FREE: string;
  };

  /**
   * Labels for the API-error modal.
   */
  apiError?: {
    title: string;
    close: string;
  };

  /**
   * Labels for the adaptation progress banner.
   */
  adaptationProgress?: {
    /** Step label while the "adapting" pipeline step is active */
    adapting: string;
    /** Step label while the "reversing" pipeline step is active */
    reversing: string;
    /** Step label while the "reviewing" pipeline step is active */
    reviewing: string;
    /** Step label when the pipeline is done */
    done: string;
    /** Label for the fidelity-score row in the result summary */
    fidelityScore: string;
    /** Inline note appended when the score is below the acceptance threshold */
    reviewRecommended: string;
    /** Error message displayed when the adaptation pipeline fails */
    pipelineFailed: string;
    /** Aria-label for the dismiss button on the adaptation-result banner */
    dismissResult: string;
  };

  /**
   * Labels for the regenerate confirmation modal.
   * Previously hardcoded in AppModals.tsx — now fully i18n-aware.
   */
  confirmModal?: {
    regenerateTitle: string;
    regenerateConfirm: string;
    cancel: string;
  };

  /**
   * Labels for the save-version prompt modal.
   * Previously hardcoded in AppModals.tsx — now fully i18n-aware.
   */
  promptModal?: {
    saveVersionTitle: string;
    saveVersionMessage: string;
    saveVersionPlaceholder: string;
    saveVersionConfirm: string;
    cancel: string;
  };
}
