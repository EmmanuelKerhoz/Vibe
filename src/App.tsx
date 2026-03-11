import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Sparkles, Loader2, Music, Lightbulb, ClipboardPaste, Ruler, Waves, Volume2, History, FileText, Layout } from 'lucide-react';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';

import { Section, SongVersion } from './types';
import { DEFAULT_STRUCTURE } from './constants/editor';
import { cleanSectionName, getSectionColor, getSectionTextColor, getSectionColorHex, getSectionDotColor, getRhymeColor, countSyllables } from './utils/songUtils';
import { generateId } from './utils/idUtils';
import { safeSetItem, safeRemoveItem } from './utils/storageUtils';
import { useAudioFeedback } from './hooks/useAudioFeedback';
import { useSongAnalysis } from './hooks/useSongAnalysis';
import { useSongEditor } from './hooks/useSongEditor';
import { useSongComposer } from './hooks/useSongComposer';
import { useSongHistoryState } from './hooks/useSongHistoryState';
import { useTitleGenerator } from './hooks/useTitleGenerator';
import { useTopicMoodSuggester } from './hooks/useTopicMoodSuggester';
import { useSimilarityEngine } from './hooks/useSimilarityEngine';
import { useAppKpis } from './hooks/useAppKpis';
import { Label } from './components/ui/Label';
import { Input } from './components/ui/Input';
import { Select } from './components/ui/Select';
import { Button } from './components/ui/Button';
import { Tooltip } from './components/ui/Tooltip';
import { MenuItem } from './components/ui/MenuItem';
import { LyricInput } from './components/editor/LyricInput';
import { MarkupInput } from './components/editor/MarkupInput';
import { InstructionEditor } from './components/editor/InstructionEditor';
import { SectionEditor } from './components/editor/SectionEditor';
import { VersionsModal } from './components/modals/VersionsModal';
import { ResetModal } from './components/modals/ResetModal';
import { LeftSettingsPanel } from './components/app/LeftSettingsPanel';
import { TopRibbon } from './components/app/TopRibbon';
import { StructureSidebar } from './components/app/StructureSidebar';
import { StatusBar } from './components/app/StatusBar';
import { SuggestionsPanel } from './components/app/SuggestionsPanel';
import { MusicalTab } from './components/app/MusicalTab';
import { InsightsBar } from './components/app/InsightsBar';
import { AboutModal } from './components/app/modals/AboutModal';
import { ApiErrorModal } from './components/app/modals/ApiErrorModal';
import { ImportModal } from './components/app/modals/ImportModal';
import { PasteModal } from './components/app/modals/PasteModal';
import { AnalysisModal } from './components/app/modals/AnalysisModal';
import { SimilarityModal } from './components/app/modals/SimilarityModal';
import { SaveToLibraryModal } from './components/app/modals/SaveToLibraryModal';
import { ConfirmModal } from './components/app/modals/ConfirmModal';
import { PromptModal } from './components/app/modals/PromptModal';
import { useTranslation, useLanguage, SUPPORTED_ADAPTATION_LANGUAGES, adaptationLanguageLabel } from './i18n';
import { getTopSimilarSongMatches, SimilarityMatch } from './utils/similarityUtils';
import { findSimilarAssetsInLibrary, saveAssetToLibrary, loadLibraryAssets, deleteAssetFromLibrary, LibraryAsset } from './utils/libraryUtils';

const DEFAULT_TITLE = 'Untitled Song';
const DEFAULT_TOPIC = 'A neon city in the rain';
const DEFAULT_MOOD = 'Cyberpunk, nostalgic, bittersweet, reflective';

type VersionSnapshot = {
  song: Section[];
  structure: string[];
  title: string;
  titleOrigin: 'user' | 'ai';
  topic: string;
  mood: string;
};

const getDefaultLineCount = (name: string) =>
  name.toLowerCase().includes('verse') || name.toLowerCase().includes('bridge')
    ? 6
    : 4;

const createEmptySong = (structure: string[], defaultRhymeScheme: string): Section[] =>
  structure.map(name => ({
    id: generateId(),
    name,
    rhymeScheme: defaultRhymeScheme,
    lines: Array(getDefaultLineCount(name))
      .fill(null)
      .map(() => ({
        id: generateId(),
        text: '',
        rhymingSyllables: '',
        rhyme: '',
        syllables: 0,
        concept: 'New line',
      })),
  }));

const isPristineLine = (line: Section['lines'][number]) => (
  line.text === ''
  && line.rhymingSyllables === ''
  && line.rhyme === ''
  && line.syllables === 0
  && line.concept === 'New line'
);

const isPristineSection = (section: Section, structureName: string, defaultRhymeScheme: string) => (
  section.name === structureName
  && (section.rhymeScheme ?? defaultRhymeScheme) === defaultRhymeScheme
  && (!section.preInstructions || section.preInstructions.length === 0)
  && (!section.postInstructions || section.postInstructions.length === 0)
  && section.lines.length === getDefaultLineCount(section.name)
  && section.lines.every(isPristineLine)
);

const isPristineDraft = (song: Section[], structure: string[], defaultRhymeScheme: string) => (
  structure.length === DEFAULT_STRUCTURE.length
  && structure.every((name, index) => name === DEFAULT_STRUCTURE[index])
  && song.length === structure.length
  && song.every((section, sectionIndex) =>
    isPristineSection(section, structure[sectionIndex], defaultRhymeScheme)
  )
);

export default function App() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [titleOrigin, setTitleOrigin] = useState<'user' | 'ai'>('user');
  const [topic, setTopic] = useState(DEFAULT_TOPIC);
  const [mood, setMood] = useState(DEFAULT_MOOD);
  const [rhymeScheme, setRhymeScheme] = useState('AABB');
  const [targetSyllables, setTargetSyllables] = useState(10);
  const [newSectionName, setNewSectionName] = useState('');
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggableSectionIndex, setDraggableSectionIndex] = useState<number | null>(null);
  const [draggedLineInfo, setDraggedLineInfo] = useState<{sectionId: string, lineId: string} | null>(null);
  const [dragOverLineInfo, setDragOverLineInfo] = useState<{sectionId: string, lineId: string} | null>(null);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);
  const [isSaveToLibraryModalOpen, setIsSaveToLibraryModalOpen] = useState(false);
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);
  const [isSessionHydrated, setIsSessionHydrated] = useState(false);
  
  const {
    song, structure, past, future, updateState, updateSongWithHistory, updateStructureWithHistory,
    updateSongAndStructureWithHistory, replaceStateWithoutHistory, clearHistory, undo, redo,
  } = useSongHistoryState(createEmptySong(DEFAULT_STRUCTURE, rhymeScheme), DEFAULT_STRUCTURE);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'musical'>('lyrics');
  const [genre, setGenre] = useState('');
  const [tempo, setTempo] = useState('120');
  const [instrumentation, setInstrumentation] = useState('');
  const [rhythm, setRhythm] = useState('');
  const [narrative, setNarrative] = useState('');
  const [musicalPrompt, setMusicalPrompt] = useState('');
  const [isStructureOpen, setIsStructureOpen] = useState(true);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [apiErrorModal, setApiErrorModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);
  const sectionDropdownRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const introOutroSortedRef = useRef<string | null>(null);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [isMarkupMode, setIsMarkupMode] = useState(false);
  const [markupText, setMarkupText] = useState('');
  const markupTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [hasApiKey, setHasApiKey] = useState(true);
  
  const [similarityMatches, setSimilarityMatches] = useState<SimilarityMatch[]>([]);
  const [libraryCount, setLibraryCount] = useState(0);

  const { index: webSimilarityIndex, triggerNow: triggerWebSimilarity } = useSimilarityEngine(song);
  const [isSimilarityModalOpen, setIsSimilarityModalOpen] = useState(false);
  
  useEffect(() => {
    fetch('/api/status')
      .then(r => r.json())
      .then((data: { available?: boolean }) => setHasApiKey(data.available === true))
      .catch(() => setHasApiKey(false));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ message: string }>).detail;
      setApiErrorModal({ open: true, message: detail.message });
    };
    window.addEventListener('vibe:apierror', handler);
    return () => window.removeEventListener('vibe:apierror', handler);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    
    const updateSimilarity = async () => {
      if (song.length === 0) {
        setSimilarityMatches([]);
        return;
      }
      const matches = await findSimilarAssetsInLibrary(song, 0, 3);
      if (!isCancelled) setSimilarityMatches(matches);
    };
    
    const loadLibraryCount = async () => {
      try {
        const cached = localStorage.getItem('lyricist_library');
        if (cached) setLibraryCount(JSON.parse(cached).length);
      } catch (e) {
        console.error('Failed to load library count:', e);
      }
    };
    
    void updateSimilarity();
    void loadLibraryCount();
    return () => { isCancelled = true; };
  }, [song]);

  const handleApiKeyHelp = () => alert(t.tooltips.aiUnavailableHelp);

  const handleOpenSaveToLibraryModal = async () => {
    if (song.length === 0) return;
    const assets = await loadLibraryAssets();
    setLibraryAssets(assets);
    setIsSaveToLibraryModalOpen(true);
  };

  const handleSaveToLibrary = async () => {
    if (song.length === 0) return;
    setIsSavingToLibrary(true);
    try {
      await saveAssetToLibrary({
        title: title || 'Untitled Song',
        type: 'song',
        sections: song,
        metadata: { topic, mood, genre, tempo: parseInt(tempo) || 120, instrumentation },
      });
      const updatedAssets = await loadLibraryAssets();
      setLibraryCount(updatedAssets.length);
      setLibraryAssets(updatedAssets);
    } catch (error) {
      console.error('Failed to save to library:', error);
    } finally {
      setIsSavingToLibrary(false);
    }
  };

  const handleDeleteLibraryAsset = useCallback(async (versionId: string) => {
    try {
      await deleteAssetFromLibrary(versionId);
      setSimilarityMatches(prev => prev.filter(m => m.versionId !== versionId));
      setLibraryCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to delete library asset:', error);
    }
  }, []);

  const loadSavedSession = () => {
    const savedSession = localStorage.getItem('lyricist_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.song) {
          const cleanedSong = parsed.song.map((s: Section) => ({ ...s, name: cleanSectionName(s.name) }));
          const nextStructure = cleanedSong.length > 0
            ? cleanedSong.map((s: Section) => s.name)
            : (parsed.structure ? parsed.structure.map((s: string) => cleanSectionName(s)) : DEFAULT_STRUCTURE);
          replaceStateWithoutHistory(cleanedSong, nextStructure);
        }
        if (parsed.title) setTitle(parsed.title);
        if (parsed.topic) setTopic(parsed.topic);
        if (parsed.mood) setMood(parsed.mood);
        if (parsed.rhymeScheme) setRhymeScheme(parsed.rhymeScheme);
        if (parsed.targetSyllables) setTargetSyllables(parsed.targetSyllables);
        if (parsed.genre) setGenre(parsed.genre);
        if (parsed.tempo) setTempo(parsed.tempo);
        if (parsed.instrumentation) setInstrumentation(parsed.instrumentation);
        if (parsed.rhythm) setRhythm(parsed.rhythm);
        if (parsed.narrative) setNarrative(parsed.narrative);
        if (parsed.musicalPrompt) setMusicalPrompt(parsed.musicalPrompt);
        clearHistory();
      } catch (e) {
        console.error('Failed to parse saved session', e);
      }
    }
  };

  useEffect(() => {
    const savedSession = localStorage.getItem('lyricist_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.song && parsed.song.length > 0) {
          setHasSavedSession(true);
          loadSavedSession();
        }
      } catch (e) {
        console.error('Failed to parse saved session', e);
      }
    }
    setIsSessionHydrated(true);
  }, []);

  useEffect(() => {
    if (isSessionHydrated && song.length > 0 && !isPristineDraft(song, structure, rhymeScheme)) {
      const sessionData = { song, structure, title, topic, mood, rhymeScheme, targetSyllables, genre, tempo, instrumentation, rhythm, narrative, musicalPrompt };
      safeSetItem('lyricist_session', JSON.stringify(sessionData));
      setHasSavedSession(true);
    }
  }, [song, structure, title, topic, mood, rhymeScheme, targetSyllables, genre, tempo, instrumentation, rhythm, narrative, musicalPrompt, isSessionHydrated]);

  const { playAudioFeedback } = useAudioFeedback(audioFeedback);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sectionDropdownRef.current && !sectionDropdownRef.current.contains(event.target as Node)) {
        setIsSectionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    if (song.length === 0) return;
    const introIdx = song.findIndex(s => s.name.toLowerCase() === 'intro');
    const outroIdx = song.findIndex(s => s.name.toLowerCase() === 'outro');
    const isIntroMisplaced = introIdx > 0;
    const isOutroMisplaced = outroIdx !== -1 && outroIdx !== song.length - 1;
    if (!isIntroMisplaced && !isOutroMisplaced) return;
    const others = song.filter(s => s.name.toLowerCase() !== 'intro' && s.name.toLowerCase() !== 'outro');
    const intro = introIdx !== -1 ? [song[introIdx]] : [];
    const outro = outroIdx !== -1 ? [song[outroIdx]] : [];
    const sorted = [...intro, ...others, ...outro];
    const sortedKey = JSON.stringify(sorted.map(s => s.id));
    if (sortedKey === introOutroSortedRef.current) return;
    introOutroSortedRef.current = sortedKey;
    updateSongAndStructureWithHistory(sorted, sorted.map(s => s.name));
  }, [song, updateSongAndStructureWithHistory]);

  const updateSongInHistory = (transform: (currentSong: Section[]) => Section[]) => {
    updateState(current => ({ song: transform(current.song), structure: current.structure }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        if (e.shiftKey) { redo(); } else { undo(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);
  
  const [versions, setVersions] = useState<SongVersion[]>([]);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [shouldAutoGenerateTitle, setShouldAutoGenerateTitle] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; onConfirm: () => void } | null>(null);
  const [promptModal, setPromptModal] = useState<{ open: boolean; onConfirm: (value: string) => void } | null>(null);
  const previousLyricsSnapshotRef = useRef<VersionSnapshot | null>(null);

  const createVersion = useCallback((
    snapshot: VersionSnapshot,
    name: string,
    previousVersions: SongVersion[],
    options?: { allowDuplicate?: boolean },
  ): SongVersion[] => {
    const latestVersion = previousVersions[0];
    const normalizedSnapshot = JSON.stringify({
      song: snapshot.song, structure: snapshot.structure,
      title: snapshot.title, titleOrigin: snapshot.titleOrigin,
      topic: snapshot.topic, mood: snapshot.mood,
    });
    if (!options?.allowDuplicate && latestVersion) {
      const normalizedLatest = JSON.stringify({
        song: latestVersion.song, structure: latestVersion.structure,
        title: latestVersion.title, titleOrigin: latestVersion.titleOrigin,
        topic: latestVersion.topic, mood: latestVersion.mood,
      });
      if (normalizedLatest === normalizedSnapshot) return previousVersions;
    }
    return [
      {
        id: generateId(), timestamp: Date.now(),
        song: JSON.parse(JSON.stringify(snapshot.song)),
        structure: [...snapshot.structure],
        title: snapshot.title, titleOrigin: snapshot.titleOrigin,
        topic: snapshot.topic, mood: snapshot.mood, name,
      },
      ...previousVersions,
    ];
  }, []);

  const resetSong = () => {
    updateSongAndStructureWithHistory(createEmptySong(DEFAULT_STRUCTURE, rhymeScheme), DEFAULT_STRUCTURE);
    safeRemoveItem('lyricist_session');
    setHasSavedSession(false);
    clearSelection();
    setIsResetModalOpen(false);
  };

  const saveVersion = useCallback((name: string, snapshot?: VersionSnapshot) => {
    const versionSnapshot = snapshot || { song, structure, title, titleOrigin, topic, mood };
    setVersions(prev => createVersion(versionSnapshot, name || `Version ${prev.length + 1}`, prev, { allowDuplicate: true }));
  }, [createVersion, song, structure, title, titleOrigin, topic, mood]);

  const rollbackToVersion = (version: SongVersion) => {
    updateSongAndStructureWithHistory(version.song, version.structure);
    setTitle(version.title);
    setTitleOrigin(version.titleOrigin);
    setTopic(version.topic);
    setMood(version.mood);
    setIsVersionsModalOpen(false);
  };

  const handleRequestVersionName = (callback: (name: string) => void) => {
    setPromptModal({
      open: true,
      onConfirm: (name) => { setPromptModal(null); callback(name); },
    });
  };

  // --- Analysis hook (must come before Composer to expose songLanguage) ---
  const {
    isPasteModalOpen, setIsPasteModalOpen, pastedText, setPastedText,
    isAnalyzing, isAnalysisModalOpen, setIsAnalysisModalOpen, analysisReport, analysisSteps,
    appliedAnalysisItems, selectedAnalysisItems, isApplyingAnalysis,
    songLanguage, targetLanguage, setTargetLanguage, sectionTargetLanguages, setSectionTargetLanguages,
    isAdaptingLanguage, isDetectingLanguage, isAnalyzingTheme,
    toggleAnalysisItemSelection, applySelectedAnalysisItems, applyAnalysisItem,
    analyzeCurrentSong, detectLanguage, adaptSongLanguage, adaptSectionLanguage, analyzePastedLyrics, clearAppliedAnalysisItems,
  } = useSongAnalysis({
    song, topic, mood, rhymeScheme,
    uiLanguage: language,
    setTopic, setMood, saveVersion,
    updateState, updateSongWithHistory, updateSongAndStructureWithHistory,
    clearLineSelection: () => clearSelection(),
    requestAutoTitleGeneration: () => setShouldAutoGenerateTitle(true),
  });

  const {
    isGenerating, isRegeneratingSection, isGeneratingMusicalPrompt, isAnalyzingLyrics,
    selectedLineId, setSelectedLineId,
    suggestions, isSuggesting, generateSong, regenerateSection, quantizeSyllables,
    generateSuggestions, updateLineText, handleLineKeyDown, applySuggestion,
    generateMusicalPrompt, analyzeLyricsForMusic, handleLineClick, handleInstructionChange,
    addInstruction, removeInstruction, clearSelection,
  } = useSongComposer({
    song, structure, topic, mood, rhymeScheme, targetSyllables, title,
    genre, tempo, instrumentation, rhythm, narrative,
    songLanguage,
    uiLanguage: language,
    setMusicalPrompt, setGenre, setTempo, setInstrumentation, setRhythm, setNarrative,
    updateState, updateSongWithHistory, updateSongAndStructureWithHistory, saveVersion,
    requestAutoTitleGeneration: () => setShouldAutoGenerateTitle(true),
  });

  const {
    removeStructureItem, addStructureItem, normalizeStructure, handleDrop,
    handleLineDragStart, handleLineDrop, exportTxt, exportMd, loadFileForAnalysis,
  } = useSongEditor({
    song, structure, newSectionName, setNewSectionName,
    draggedItemIndex, setDraggedItemIndex, setDragOverIndex,
    draggedLineInfo, setDraggedLineInfo, setDragOverLineInfo,
    updateState, updateSongWithHistory, updateStructureWithHistory,
    updateSongAndStructureWithHistory, title, topic, mood,
    openPasteModalWithText: (text: string) => {
      setPastedText(text);
      setIsPasteModalOpen(true);
    },
    playAudioFeedback,
  });

  const { generateTitle, isGeneratingTitle } = useTitleGenerator(song, topic, mood, songLanguage);

  useTopicMoodSuggester(topic, mood, setTopic, setMood);

  useEffect(() => {
    const currentSnapshot = { song, structure, title, titleOrigin, topic, mood };
    if (!previousLyricsSnapshotRef.current) {
      previousLyricsSnapshotRef.current = currentSnapshot;
      return;
    }
    const previousSnapshot = previousLyricsSnapshotRef.current;
    const lyricsChanged = JSON.stringify(previousSnapshot.song) !== JSON.stringify(song)
      || JSON.stringify(previousSnapshot.structure) !== JSON.stringify(structure);
    if (lyricsChanged && previousSnapshot.song.length > 0) {
      setVersions(prev => createVersion(previousSnapshot, 'Auto Restore Point', prev));
    }
    previousLyricsSnapshotRef.current = currentSnapshot;
  }, [createVersion, song, structure, title, titleOrigin, topic, mood]);

  const { sectionCount, wordCount, charCount } = useAppKpis(song);
  const hasExistingWork = (
    song.length > 0 && !isPristineDraft(song, structure, rhymeScheme)
  ) || topic !== DEFAULT_TOPIC || mood !== DEFAULT_MOOD || (isMarkupMode && markupText.trim().length > 0);

  const handleImportInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsImportModalOpen(false);
    loadFileForAnalysis(file);
  };

  const triggerImportFilePicker = () => setIsImportModalOpen(true);

  const handleImportChooseFile = async () => {
    const pickerWindow = window as Window & {
      showOpenFilePicker?: (options: {
        multiple?: boolean;
        excludeAcceptAllOption?: boolean;
        types?: Array<{ description?: string; accept: Record<string, string[]> }>;
      }) => Promise<Array<{ getFile: () => Promise<File> }>>;
    };
    if (pickerWindow.showOpenFilePicker) {
      try {
        const [handle] = await pickerWindow.showOpenFilePicker({
          multiple: false,
          types: [{ description: 'Lyrics files', accept: { 'text/plain': ['.txt', '.md'], 'text/markdown': ['.md'] } }],
        });
        if (!handle) return;
        const file = await handle.getFile();
        setIsImportModalOpen(false);
        loadFileForAnalysis(file);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Failed to open import file picker', error);
        }
      }
      return;
    }
    importInputRef.current?.click();
  };

  const handleGenerateTitle = async () => {
    const newTitle = await generateTitle();
    if (newTitle) { setTitle(newTitle); setTitleOrigin('ai'); }
  };

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
  }, [generateTitle, shouldAutoGenerateTitle, song.length]);

  const handleTitleChange = (value: string) => { setTitle(value); setTitleOrigin('user'); };

  const handleGlobalRegenerate = () => {
    if (song.length > 0) {
      setConfirmModal({
        open: true,
        onConfirm: () => { setConfirmModal(null); void generateSong(); },
      });
    } else {
      void generateSong();
    }
  };

  const scrollToSection = useCallback((section: Section) => {
    if (isMarkupMode) {
      if (!markupTextareaRef.current) return;
      let searchStr = `**[${section.name}]**`;
      let index = markupText.indexOf(searchStr);
      if (index === -1) { searchStr = `[${section.name}]`; index = markupText.indexOf(searchStr); }
      if (index !== -1) {
        markupTextareaRef.current.focus();
        markupTextareaRef.current.setSelectionRange(index, index + searchStr.length);
        markupTextareaRef.current.scrollTop = (markupText.substring(0, index).split('\n').length - 2) * 20;
      }
    } else {
      const el = document.getElementById(`section-${section.id}`);
      if (el) {
        const container = el.closest('.overflow-y-auto');
        if (container) container.scrollTo({ top: (el as HTMLElement).offsetTop - 20, behavior: 'smooth' });
        else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [isMarkupMode, markupText, markupTextareaRef]);

  const handleScrollToSection = useCallback((sectionId: string) => {
    const section = song.find(s => s.id === sectionId);
    if (section) scrollToSection(section);
  }, [song, scrollToSection]);

  const handleMarkupToggle = () => {
    if (isMarkupMode) {
      const blocks = markupText.split(/\n\s*\n/);
      const usedSectionIds = new Set<string>();
      const usedLineIds = new Set<string>();
      const newSections: Section[] = blocks.map((block, index) => {
        const lines = block.trim().split('\n');
        if (lines.length === 0 || (lines.length === 1 && !lines[0].trim())) return null;
        let name = 'Verse';
        let remainingLines = lines;
        const firstLine = lines[0].trim();
        if ((firstLine.startsWith('**[') && firstLine.endsWith(']**')) || (firstLine.startsWith('[') && firstLine.endsWith(']'))) {
          name = cleanSectionName(firstLine);
          remainingLines = lines.slice(1);
        }
        const preInstructions: string[] = [], postInstructions: string[] = [], lyricLines: string[] = [];
        let foundLyrics = false;
        remainingLines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            if (foundLyrics) postInstructions.push(trimmed); else preInstructions.push(trimmed);
          } else if (trimmed !== '') { foundLyrics = true; lyricLines.push(line); }
        });
        let existingSection = (song[index] && song[index].name === name) ? song[index] : song.find(s => s.name === name && !usedSectionIds.has(s.id));
        let sectionId = existingSection?.id || generateId();
        if (usedSectionIds.has(sectionId)) sectionId = generateId();
        usedSectionIds.add(sectionId);
        return {
          id: sectionId, name,
          rhymeScheme: existingSection?.rhymeScheme || 'AABB',
          targetSyllables: existingSection?.targetSyllables || 8,
          mood: existingSection?.mood || '',
          preInstructions: preInstructions.length > 0 ? preInstructions : (existingSection?.preInstructions || []),
          postInstructions: postInstructions.length > 0 ? postInstructions : (existingSection?.postInstructions || []),
          lines: lyricLines.map((text, lIdx) => {
            const existingLine = existingSection?.lines.find(l => l.text === text && !usedLineIds.has(l.id)) || (existingSection?.lines[lIdx] && !usedLineIds.has(existingSection.lines[lIdx].id) ? existingSection.lines[lIdx] : null);
            let lineId = existingLine?.id || generateId();
            if (usedLineIds.has(lineId)) lineId = generateId();
            usedLineIds.add(lineId);
            return { id: lineId, text, rhymingSyllables: existingLine?.rhymingSyllables || '', rhyme: existingLine?.rhyme || '', syllables: text.split(/\s+/).reduce((acc, word) => acc + (word ? countSyllables(word) : 0), 0), concept: existingLine?.concept || 'New line', isManual: true };
          }),
        };
      }).filter(s => s !== null) as Section[];
      if (newSections.length > 0) updateSongAndStructureWithHistory(newSections, newSections.map(s => s.name));
      setIsMarkupMode(false);
    } else {
      const fmt = (i: string) => { const tr = i.trim(); return (tr.startsWith('[') && tr.endsWith(']')) ? tr : `[${tr}]`; };
      const text = song.map(sec => {
        const pre = (sec.preInstructions || []).map(fmt).join('\n');
        const post = (sec.postInstructions || []).map(fmt).join('\n');
        return `[${sec.name}]\n${pre ? pre + '\n' : ''}${sec.lines.map(l => l.text).join('\n')}${post ? '\n' + post : ''}`;
      }).join('\n\n');
      setMarkupText(text);
      setIsMarkupMode(true);
    }
  };

  const RHYME_KEYS = Object.keys(t.rhymeSchemes) as Array<keyof typeof t.rhymeSchemes>;
  const SECTION_TYPE_OPTIONS = ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Breakdown', 'Outro'];

  const moveSectionUp = useCallback((sectionId: string) => {
    const idx = song.findIndex(s => s.id === sectionId);
    if (idx <= 0) return;
    const newSong = [...song];
    [newSong[idx - 1], newSong[idx]] = [newSong[idx], newSong[idx - 1]];
    updateSongAndStructureWithHistory(newSong, newSong.map(s => s.name));
  }, [song, updateSongAndStructureWithHistory]);

  const moveSectionDown = useCallback((sectionId: string) => {
    const idx = song.findIndex(s => s.id === sectionId);
    if (idx < 0 || idx >= song.length - 1) return;
    const newSong = [...song];
    [newSong[idx], newSong[idx + 1]] = [newSong[idx + 1], newSong[idx]];
    updateSongAndStructureWithHistory(newSong, newSong.map(s => s.name));
  }, [song, updateSongAndStructureWithHistory]);

  const moveLineUp = useCallback((sectionId: string, lineId: string) => {
    updateState((current) => {
      const newSong = current.song.map(s => {
        if (s.id !== sectionId) return s;
        const idx = s.lines.findIndex(l => l.id === lineId);
        if (idx <= 0) return s;
        const newLines = [...s.lines];
        [newLines[idx - 1], newLines[idx]] = [newLines[idx], newLines[idx - 1]];
        return { ...s, lines: newLines };
      });
      return { song: newSong, structure: current.structure };
    });
  }, [updateState]);

  const moveLineDown = useCallback((sectionId: string, lineId: string) => {
    updateState((current) => {
      const newSong = current.song.map(s => {
        if (s.id !== sectionId) return s;
        const idx = s.lines.findIndex(l => l.id === lineId);
        if (idx < 0 || idx >= s.lines.length - 1) return s;
        const newLines = [...s.lines];
        [newLines[idx], newLines[idx + 1]] = [newLines[idx + 1], newLines[idx]];
        return { ...s, lines: newLines };
      });
      return { song: newSong, structure: current.structure };
    });
  }, [updateState]);

  const addLineToSection = useCallback((sectionId: string) => {
    updateState((current) => ({
      song: current.song.map(s => {
        if (s.id !== sectionId) return s;
        return { ...s, lines: [...s.lines, { id: generateId(), text: '', rhymingSyllables: '', rhyme: '', syllables: 0, concept: '', isManual: true }] };
      }),
      structure: current.structure,
    }));
  }, [updateState]);

  const deleteLineFromSection = useCallback((sectionId: string, lineId: string) => {
    updateState((current) => ({
      song: current.song.map(s => {
        if (s.id !== sectionId) return s;
        return { ...s, lines: s.lines.filter(l => l.id !== lineId) };
      }),
      structure: current.structure,
    }));
  }, [updateState]);

  const setSectionRhymeScheme = useCallback((sectionId: string, newScheme: string) => {
    updateState((current) => ({
      song: current.song.map(s => s.id === sectionId ? { ...s, rhymeScheme: newScheme } : s),
      structure: current.structure,
    }));
  }, [updateState]);

  const setSectionName = useCallback((sectionId: string, newName: string) => {
    const newSong = song.map(s => s.id === sectionId ? { ...s, name: newName } : s);
    updateSongAndStructureWithHistory(newSong, newSong.map(s => s.name));
  }, [song, updateSongAndStructureWithHistory]);

  const webBadgeLabel = (() => {
    const { status, candidates } = webSimilarityIndex;
    if (status === 'running') return null;
    if (status === 'done' && candidates.length > 0) return `${candidates[0].score}%`;
    return null;
  })();

  return (
    <FluentProvider theme={theme === 'dark' ? webDarkTheme : webLightTheme} style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }}>
    <div className={`fui-FluentProvider h-screen w-full bg-fluent-bg text-zinc-400 flex flex-col overflow-hidden font-sans selection:bg-[var(--accent-color)]/30 ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="flex-1 flex overflow-hidden">
        <LeftSettingsPanel
          title={title} setTitle={handleTitleChange}
          titleOrigin={titleOrigin} onGenerateTitle={handleGenerateTitle} isGeneratingTitle={isGeneratingTitle}
          topic={topic} setTopic={setTopic}
          mood={mood} setMood={setMood} rhymeScheme={rhymeScheme} setRhymeScheme={setRhymeScheme}
          targetSyllables={targetSyllables} setTargetSyllables={setTargetSyllables}
          song={song} isGenerating={isGenerating} quantizeSyllables={quantizeSyllables}
          isLeftPanelOpen={isLeftPanelOpen} setIsLeftPanelOpen={setIsLeftPanelOpen}
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
            onImportClick={() => setIsImportModalOpen(true)} exportTxt={exportTxt} exportMd={exportMd}
            isGenerating={isGenerating} isAnalyzing={isAnalyzing}
          />

          {activeTab === 'lyrics' && song.length > 0 && (
            <InsightsBar
              song={song}
              sectionCount={sectionCount}
              wordCount={wordCount}
              charCount={charCount}
              targetLanguage={targetLanguage}
              setTargetLanguage={setTargetLanguage}
              isAdaptingLanguage={isAdaptingLanguage}
              isDetectingLanguage={isDetectingLanguage}
              songLanguage={songLanguage}
              isGenerating={isGenerating}
              isAnalyzing={isAnalyzing}
              isMarkupMode={isMarkupMode}
              webSimilarityIndex={webSimilarityIndex}
              webBadgeLabel={webBadgeLabel}
              libraryCount={libraryCount}
              adaptSongLanguage={adaptSongLanguage}
              detectLanguage={detectLanguage}
              analyzeCurrentSong={analyzeCurrentSong}
              handleGlobalRegenerate={handleGlobalRegenerate}
              handleOpenSaveToLibraryModal={handleOpenSaveToLibraryModal}
              handleMarkupToggle={handleMarkupToggle}
              setIsSimilarityModalOpen={setIsSimilarityModalOpen}
              scrollToSection={scrollToSection}
            />
          )}

          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative p-8 lcars-lyrics-area">
            <div className="lyrics-editor-zoom h-full flex flex-col">
              {activeTab === 'lyrics' ? (
                <div className="w-full flex flex-col gap-6 pb-32">
                  {isMarkupMode ? (
                    <div className="flex-1 min-h-0 flex flex-col rounded-[24px_8px_24px_8px] border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl overflow-hidden" style={{ minHeight: 'calc(100vh - 280px)' }}>
                      <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center">
                          <Layout className="w-4 h-4 text-[var(--accent-color)]" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold tracking-widest text-[var(--text-primary)] uppercase">
                            {t.editor.markupMode.title}
                          </h3>
                          <p className="text-xs text-[var(--accent-color)] uppercase tracking-wider mt-0.5">
                            {t.editor.markupMode.description}
                          </p>
                        </div>
                      </div>
                      <MarkupInput
                        value={markupText}
                        onChange={(e) => setMarkupText(e.target.value)}
                        textareaRef={markupTextareaRef}
                        className="w-full flex-1 min-h-0 font-mono text-sm leading-7 text-[var(--text-primary)] bg-[var(--bg-app)]"
                        spellCheck={false}
                      />
                      <div className="px-6 py-3 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)]">
                        <p className="text-xs text-[var(--text-secondary)]">{t.editor.markupMode.hint}</p>
                      </div>
                    </div>
                  ) : (
                    song.map((section, sectionIndex) => (
                      <SectionEditor
                        key={section.id}
                        section={section}
                        sectionIndex={sectionIndex}
                        songLength={song.length}
                        rhymeScheme={rhymeScheme}
                        RHYME_KEYS={RHYME_KEYS}
                        SECTION_TYPE_OPTIONS={SECTION_TYPE_OPTIONS}
                        selectedLineId={selectedLineId}
                        isGenerating={isGenerating}
                        isAnalyzing={isAnalyzing}
                        draggedItemIndex={draggedItemIndex}
                        dragOverIndex={dragOverIndex}
                        draggedLineInfo={draggedLineInfo}
                        dragOverLineInfo={dragOverLineInfo}
                        moveSectionUp={moveSectionUp}
                        moveSectionDown={moveSectionDown}
                        moveLineUp={moveLineUp}
                        moveLineDown={moveLineDown}
                        addLineToSection={addLineToSection}
                        deleteLineFromSection={deleteLineFromSection}
                        setSectionName={setSectionName}
                        setSectionRhymeScheme={setSectionRhymeScheme}
                        regenerateSection={regenerateSection}
                        isRegeneratingSection={isRegeneratingSection}
                        handleLineClick={handleLineClick}
                        updateLineText={updateLineText}
                        handleLineKeyDown={handleLineKeyDown}
                        handleInstructionChange={handleInstructionChange}
                        addInstruction={addInstruction}
                        removeInstruction={removeInstruction}
                        handleLineDragStart={handleLineDragStart}
                        handleLineDrop={handleLineDrop}
                        setDraggedItemIndex={setDraggedItemIndex}
                        setDragOverIndex={setDragOverIndex}
                        setDraggableSectionIndex={setDraggableSectionIndex}
                        setDraggedLineInfo={setDraggedLineInfo}
                        setDragOverLineInfo={setDragOverLineInfo}
                        playAudioFeedback={playAudioFeedback}
                        handleDrop={handleDrop}
                      />
                    ))
                  )}
                </div>
              ) : (
                <MusicalTab
                  song={song}
                  title={title}
                  topic={topic}
                  mood={mood}
                  genre={genre} setGenre={setGenre}
                  tempo={tempo} setTempo={setTempo}
                  instrumentation={instrumentation} setInstrumentation={setInstrumentation}
                  rhythm={rhythm} setRhythm={setRhythm}
                  narrative={narrative} setNarrative={setNarrative}
                  musicalPrompt={musicalPrompt} setMusicalPrompt={setMusicalPrompt}
                  isGeneratingMusicalPrompt={isGeneratingMusicalPrompt}
                  isAnalyzingLyrics={isAnalyzingLyrics}
                  hasApiKey={hasApiKey}
                  generateMusicalPrompt={generateMusicalPrompt}
                  analyzeLyricsForMusic={analyzeLyricsForMusic}
                />
              )}
            </div>
          </div>
        </div>

        <StructureSidebar
          isStructureOpen={isStructureOpen} setIsStructureOpen={setIsStructureOpen}
          structure={structure} song={song}
          newSectionName={newSectionName} setNewSectionName={setNewSectionName}
          isSectionDropdownOpen={isSectionDropdownOpen} setIsSectionDropdownOpen={setIsSectionDropdownOpen}
          draggedItemIndex={draggedItemIndex} setDraggedItemIndex={setDraggedItemIndex}
          dragOverIndex={dragOverIndex} setDragOverIndex={setDragOverIndex}
          isGenerating={isGenerating}
          addStructureItem={addStructureItem} removeStructureItem={removeStructureItem}
          normalizeStructure={normalizeStructure} handleDrop={handleDrop}
          onScrollToSection={handleScrollToSection}
        />
      </div>

      <StatusBar
        song={song} wordCount={wordCount} isGenerating={isGenerating} isAnalyzing={isAnalyzing}
        isSuggesting={isSuggesting} theme={theme} setTheme={setTheme}
        audioFeedback={audioFeedback} setAudioFeedback={setAudioFeedback}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <ImportModal isOpen={isImportModalOpen} hasExistingWork={hasExistingWork} onClose={() => setIsImportModalOpen(false)} onChooseFile={handleImportChooseFile} />
      <SuggestionsPanel selectedLineId={selectedLineId} setSelectedLineId={setSelectedLineId} suggestions={suggestions} isSuggesting={isSuggesting} applySuggestion={applySuggestion} generateSuggestions={generateSuggestions} />
      <PasteModal isOpen={isPasteModalOpen} onClose={() => setIsPasteModalOpen(false)} pastedText={pastedText} setPastedText={setPastedText} isAnalyzing={isAnalyzing} onAnalyze={analyzePastedLyrics} />
      <AnalysisModal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} isAnalyzing={isAnalyzing} analysisReport={analysisReport} analysisSteps={analysisSteps} appliedAnalysisItems={appliedAnalysisItems} selectedAnalysisItems={selectedAnalysisItems} isApplyingAnalysis={isApplyingAnalysis} toggleAnalysisItemSelection={toggleAnalysisItemSelection} applySelectedAnalysisItems={applySelectedAnalysisItems} clearAppliedAnalysisItems={clearAppliedAnalysisItems} versions={versions} rollbackToVersion={rollbackToVersion} />
      <SimilarityModal
        isOpen={isSimilarityModalOpen}
        onClose={() => setIsSimilarityModalOpen(false)}
        matches={similarityMatches}
        candidateCount={libraryCount}
        webIndex={webSimilarityIndex}
        onWebRefresh={triggerWebSimilarity}
        onDeleteLibraryAsset={handleDeleteLibraryAsset}
      />
      <SaveToLibraryModal isOpen={isSaveToLibraryModalOpen} onClose={() => setIsSaveToLibraryModalOpen(false)} onSave={handleSaveToLibrary} isSaving={isSavingToLibrary} currentTitle={title} libraryAssets={libraryAssets} />
      <VersionsModal isOpen={isVersionsModalOpen} versions={versions} onClose={() => setIsVersionsModalOpen(false)} onSaveCurrent={(name) => { saveVersion(name); }} onRollback={rollbackToVersion} onRequestVersionName={handleRequestVersionName} />
      <ResetModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onConfirm={resetSong} />
      <ApiErrorModal
        isOpen={apiErrorModal.open}
        onClose={() => setApiErrorModal({ open: false, message: '' })}
        message={apiErrorModal.message}
      />
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.open}
          title="Regenerate Song"
          message={t.editor.regenerateWarning}
          confirmLabel="Regenerate"
          cancelLabel="Cancel"
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
      {promptModal && (
        <PromptModal
          isOpen={promptModal.open}
          title="Save Version"
          message="Enter a name for this version:"
          placeholder="Version name"
          confirmLabel="Save"
          cancelLabel="Cancel"
          onConfirm={promptModal.onConfirm}
          onCancel={() => setPromptModal(null)}
        />
      )}
      <input ref={importInputRef} type="file" accept=".txt,.md" className="hidden" onChange={handleImportInputChange} />
    </div>
    </FluentProvider>
  );
}
