export interface Translations {
  app: {
    name: string;
    tagline: string;
  };

  statusBar: {
    ready: string;
    generating: string;
    analyzing: string;
    suggesting: string;
    sections: string;
    words: string;
    theme: string;
    audioFeedback: string;
    language: string;
  };

  ribbon: {
    lyrics: string;
    musical: string;
    import: string;
    exportTxt: string;
    exportMd: string;
    versions: string;
    undo: string;
    redo: string;
    reset: string;
    aiUnavailable: string;
  };

  leftPanel: {
    title: string;
    songTitle: string;
    songTopic: string;
    songMood: string;
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
    analyze: string;
    regenerate: string;
    adaptation: string;
    editorMode: string;
    markupModeLabel: string;
    regenerateSection: string;
    quantize: string;
    lyricLine: string;
    rhymeSyllable: string;
    rhyme: string;
    syllables: string;
    concept: string;
    lines: string;
    chars: string;
    adapt: string;
    moodPlaceholder: string;
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
    generatePrompt: string;
    promptLabel: string;
    promptPlaceholder: string;
    optimizedFor: string;
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

  paste: {
    title: string;
    description: string;
    placeholder: string;
    cancel: string;
    analyze: string;
    analyzing: string;
  };

  about: {
    description: string;
    engine: string;
    license: string;
    close: string;
  };

  tooltips: {
    hideSidebar: string;
    showSidebar: string;
    lyricsTab: string;
    musicalTab: string;
    import: string;
    exportTxt: string;
    exportMd: string;
    versions: string;
    undo: string;
    redo: string;
    reset: string;
    aiUnavailable: string;
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
    sectionAdapt: string;
    markupMode: string;
    editorMode: string;
    applyAnalysis: string;
    revertAnalysis: string;
    closeAnalysis: string;
    generateMusical: string;
    closeAbout: string;
    analysisCancel: string;
    analysisImport: string;
  };

  sections: {
    intro: string;
    verse: string;
    preChorus: string;
    chorus: string;
    bridge: string;
    breakdown: string;
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
}
