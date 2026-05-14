export interface Translations {
  /** Generic shared strings */
  common?: {
    loading: string;
    /** Aria-label for the application splash screen */
    appLoading?: string;
    /** Label shown under the splash spinner during initialization */
    initializing?: string;
  };

  /** Labels for inline error fallbacks rendered by panel ErrorBoundaries.
   *  Use `{label}` placeholder for the panel name in `panelUnavailable`. */
  errorBoundary?: {
    panelUnavailable: string;
    panelGeneric: string;
    closePanel: string;
  };

  /** Labels for the right-side panel switcher (Structure / Suggestions / Analysis). */
  panels?: {
    structure: string;
    suggestions: string;
    analysis: string;
    /** Aria template used for the segmented switcher buttons. Use `{name}`. */
    switchTo: string;
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
    settingsTooltip?: string;
    /** Tooltip shown on the saved-session indicator dot */
    sessionSavedTooltip?: string;
    /** Inline badge text next to the saved-session dot */
    sessionSavedBadge?: string;
    /** Inline badge text while the session is being persisted */
    saving?: string;
    /** Inline badge text when the latest changes are not yet saved */
    unsaved?: string;
    /** Inline badge text when the most recent save attempt failed */
    saveError?: string;
    /** Aria-label template for the theme toggle when current theme is dark */
    themeSwitchToLight?: string;
    /** Aria-label template for the theme toggle when current theme is light */
    themeSwitchToDark?: string;
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
    /** Tooltip shown on the burger menu trigger */
    menu?: string;
    /** Aria-label for the burger menu trigger */
    menuAria?: string;
    /** Label for the "Send to SUNO" button in the ribbon */
    send_to_suno?: string;
  };

  mobileNav: {
    navigation: string;
    settings: string;
    lyrics: string;
    music: string;
    structure: string;
    /** Short label on the centre CTA when it opens the composer panel */
    compose?: string;
    /** Aria-label for the centre CTA when in compose mode */
    composeAria?: string;
    /** Short label on the centre CTA when it triggers a regenerate */
    generateShort?: string;
  };

  /** Labels for the burger-menu panel section headers and menu items */
  menu?: {
    create: string;
    workspace: string;
    tools: string;
    app: string;
    newLyricsGeneration: string;
    newSong: string;
    about: string;
    sponsor: string;
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
    /** Top-right badge that labels the panel as the new-generation form */
    newGenerationBadge?: string;
    /** Section header for the song-info group inside the form */
    songInfoSection?: string;
    /** Label of the "Suggest random" button */
    suggest?: string;
    /** Tooltip of the "Suggest random" button */
    suggestTooltip?: string;
    /** Aria-label for the close button of the form panel */
    closePanel?: string;
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
    /** Button label to apply the language adaptation */
    adaptApply?: string;
    /** Tooltip for the per-line quantize button */
    quantize_line?: string;
    /** Brief confirmation message shown after a line is quantized */
    quantize_line_done?: string;
    /** Tooltip shown when quantize is disabled for unsupported scripts */
    quantize_line_unsupported?: string;
  };

  suggestions: {
    title: string;
    crafting: string;
    clickToApply: string;
    moreOptions: string;
    empty: string;
    spellCheckTitle: string;
    spellChecking: string;
    applyCorrection: string;
    dismiss: string;
    synonymsTitle: string;
    synonymsLoading: string;
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
    showMusicalSuggestions: string;
    hideMusicalSuggestions: string;
    musicalSuggestionsMovedHint: string;
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
    github: string;
    docs: string;
    close: string;
    /** SR-only countdown text shown while the splash auto-closes. Use `{seconds}` as placeholder. */
    splashAutoClose?: string;
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
    /** Tooltip for the preset moods dropdown */
    moodPresets?: string;
    /** Tooltip for the default rhyme scheme dropdown */
    rhymeScheme?: string;
    /** Tooltip for the target syllables slider */
    targetSyllables?: string;
    /** Tooltip for the view mode selector dropdown */
    viewMode?: string;
    /** Tooltip for the "New Lyrics Generation" menu item */
    newLyricsGeneration?: string;
    /** Tooltip for the "New Song" menu item */
    newSong?: string;
    pasteAvailable?: string;
    pasteUnavailable?: string;
    browseLibrary?: string;
    openSettings?: string;
    sponsor?: string;
    sendToSuno?: string;
    sendToSunoConfirm?: string;
    /** Tooltip shown after the SUNO prompt was sent and was truncated to MAX_SUNO_PROMPT_LENGTH.
     *  Use `{max}` as placeholder for the character limit. */
    sendToSunoTruncated?: string;
    /** Tooltip shown when the SUNO prompt exceeds MAX_SUNO_PROMPT_LENGTH and will be trimmed on send.
     *  Use `{max}` as placeholder for the character limit. */
    sendToSunoWillTruncate?: string;
    quantizeLineDone?: string;
  };

  /** Section type labels (Intro, Verse, Chorus, etc.) */
  sections?: {
    intro?: string;
    verse?: string;
    preChorus?: string;
    chorus?: string;
    bridge?: string;
    breakdown?: string;
    finalChorus?: string;
    outro?: string;
    [key: string]: string | undefined;
  };

  /** Preset mood labels */
  moods?: {
    [key: string]: string;
  };

  /** Insights / stats bar labels */
  insights?: {
    title?: string;
    sections?: string;
    words?: string;
    characters?: string;
    [key: string]: string | undefined;
  };

  /** Rhyme scheme option labels */
  rhymeSchemes?: {
    AABB?: string;
    ABAB?: string;
    AAAA?: string;
    ABCB?: string;
    AAABBB?: string;
    AABBCC?: string;
    ABABAB?: string;
    ABCABC?: string;
    FREE?: string;
    [key: string]: string | undefined;
  };

  /** API error modal */
  apiError?: {
    title?: string;
    close?: string;
    [key: string]: string | undefined;
  };

  /** Multi-step adaptation progress banner */
  adaptationProgress?: {
    adapting?: string;
    reversing?: string;
    reviewing?: string;
    done?: string;
    fidelityScore?: string;
    reviewRecommended?: string;
    pipelineFailed?: string;
    dismissResult?: string;
    [key: string]: string | undefined;
  };

  /** Confirm dialog (regenerate, etc.) */
  confirmModal?: {
    regenerateTitle?: string;
    regenerateConfirm?: string;
    cancel?: string;
    [key: string]: string | undefined;
  };

  /** Prompt/input dialog (save version, etc.) */
  promptModal?: {
    saveVersionTitle?: string;
    saveVersionMessage?: string;
    saveVersionPlaceholder?: string;
    saveVersionConfirm?: string;
    cancel?: string;
    [key: string]: string | undefined;
  };

  /** Rhythmic coherence check dialog */
  rhythmicCoherence?: {
    title?: string;
    scoreLabel?: string;
    optionA?: string;
    optionADescription?: string;
    optionB?: string;
    optionBDescription?: string;
    apply?: string;
    skip?: string;
    suggestedBpm?: string;
    tooLongLines?: string;
    [key: string]: string | undefined;
  };
}
