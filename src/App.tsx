import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Sparkles, Loader2, RefreshCw, Music, Lightbulb, ClipboardPaste, Ruler, BarChart2, GripVertical, Waves, Volume2, Wand2, History, Bot, User, FileText, Layout, Languages, Globe, Search, Save, ChevronUp, ChevronDown, Plus, Trash2, ScanText } from 'lucide-react';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';

import { Section, SongVersion } from './types';
import { DEFAULT_STRUCTURE } from './constants/editor';
import { cleanSectionName, getSectionColor, getSectionTextColor, getSectionDotColor, getRhymeColor, countSyllables } from './utils/songUtils';
import { generateId } from './utils/idUtils';
import { useAudioFeedback } from './hooks/useAudioFeedback';
import { useSongAnalysis } from './hooks/useSongAnalysis';
import { useSongEditor } from './hooks/useSongEditor';
import { useSongComposer } from './hooks/useSongComposer';
import { useSongHistoryState } from './hooks/useSongHistoryState';
import { useTitleGenerator } from './hooks/useTitleGenerator';
import { useTopicMoodSuggester } from './hooks/useTopicMoodSuggester';
import { Label } from './components/ui/Label';
import { Input } from './components/ui/Input';
import { Select } from './components/ui/Select';
import { Button } from './components/ui/Button';
import { Tooltip } from './components/ui/Tooltip';
import { MenuItem } from './components/ui/MenuItem';
import { LyricInput } from './components/editor/LyricInput';
import { MarkupInput } from './components/editor/MarkupInput';
import { InstructionEditor } from './components/editor/InstructionEditor';
import { VersionsModal } from './components/modals/VersionsModal';
import { ResetModal } from './components/modals/ResetModal';
import { LeftSettingsPanel } from './components/app/LeftSettingsPanel';
import { TopRibbon } from './components/app/TopRibbon';
import { StructureSidebar } from './components/app/StructureSidebar';
import { StatusBar } from './components/app/StatusBar';
import { SuggestionsPanel } from './components/app/SuggestionsPanel';
import { AboutModal } from './components/app/modals/AboutModal';
import { PasteModal } from './components/app/modals/PasteModal';
import { AnalysisModal } from './components/app/modals/AnalysisModal';
import { SimilarityModal } from './components/app/modals/SimilarityModal';
import { useTranslation, SUPPORTED_ADAPTATION_LANGUAGES, adaptationLanguageLabel } from './i18n';
import { getTopSimilarSongMatches, SimilarityMatch } from './utils/similarityUtils';
import { findSimilarAssetsInLibrary, saveAssetToLibrary } from './utils/libraryUtils';

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
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  const [title, setTitle] = useState('Untitled Song');
  const [titleOrigin, setTitleOrigin] = useState<'user' | 'ai'>('user');
  const [topic, setTopic] = useState('A neon city in the rain');
  const [mood, setMood] = useState('Cyberpunk, nostalgic, bittersweet, reflective');
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
  const [isSessionHydrated, setIsSessionHydrated] = useState(false);
  
  const {
    song, structure, past, future, updateState, updateSongWithHistory, updateStructureWithHistory,
    updateSongAndStructureWithHistory, replaceStateWithoutHistory, clearHistory, undo, redo,
  } = useSongHistoryState(createEmptySong(DEFAULT_STRUCTURE, rhymeScheme), DEFAULT_STRUCTURE);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'musical'>('lyrics');
  const [genre, setGenre] = useState('');
  const [tempo, setTempo] = useState('120');
  const [instrumentation, setInstrumentation] = useState('');
  const [musicalPrompt, setMusicalPrompt] = useState('');
  const [isStructureOpen, setIsStructureOpen] = useState(true);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);
  const sectionDropdownRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [isMarkupMode, setIsMarkupMode] = useState(false);
  const [markupText, setMarkupText] = useState('');
  const markupTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [hasApiKey, setHasApiKey] = useState(true);
  
  // Similarity detection: use library instead of local versions
  const [similarityMatches, setSimilarityMatches] = useState<SimilarityMatch[]>([]);
  const [libraryCount, setLibraryCount] = useState(0);
  
  useEffect(() => {
    fetch('/api/status')
      .then(r => r.json())
      .then((data: { available?: boolean }) => setHasApiKey(data.available === true))
      .catch(() => setHasApiKey(false));
  }, []);

  // Load library count and update similarity matches whenever song changes
  useEffect(() => {
    let isCancelled = false;
    
    const updateSimilarity = async () => {
      if (song.length === 0) {
        setSimilarityMatches([]);
        return;
      }
      
      const matches = await findSimilarAssetsInLibrary(song, 30, 3);
      if (!isCancelled) {
        setSimilarityMatches(matches);
      }
    };
    
    const loadLibraryCount = async () => {
      try {
        const cached = localStorage.getItem('lyricist_library');
        if (cached) {
          const library = JSON.parse(cached);
          setLibraryCount(library.length);
        }
      } catch (e) {
        console.error('Failed to load library count:', e);
      }
    };
    
    void updateSimilarity();
    void loadLibraryCount();
    
    return () => {
      isCancelled = true;
    };
  }, [song]);

  useEffect(() => {
    if (song.length > 0) {
      const needsCleanup = song.some(s => s.name !== cleanSectionName(s.name)) || structure.some(s => s !== cleanSectionName(s));
      if (needsCleanup) {
        replaceStateWithoutHistory(
          song.map(s => ({ ...s, name: cleanSectionName(s.name) })),
          structure.map(s => cleanSectionName(s))
        );
      }
    }
  }, []);

  const handleApiKeyHelp = () => {
    alert(t.tooltips.aiUnavailableHelp);
  };

  const handleSaveToLibrary = async () => {
    if (song.length === 0) {
      alert('Cannot save empty song to library');
      return;
    }
    
    setIsSavingToLibrary(true);
    try {
      await saveAssetToLibrary({
        title: title || 'Untitled Song',
        type: 'song',
        sections: song,
        metadata: {
          topic,
          mood,
          genre,
          tempo: parseInt(tempo) || 120,
          instrumentation,
        },
      });
      
      // Refresh library count
      const cached = localStorage.getItem('lyricist_library');
      if (cached) {
        const library = JSON.parse(cached);
        setLibraryCount(library.length);
      }
      
      alert(`"${title}" saved to library!`);
    } catch (error) {
      console.error('Failed to save to library:', error);
      alert('Failed to save to library');
    } finally {
      setIsSavingToLibrary(false);
    }
  };

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
      const sessionData = {
        song, structure, title, topic, mood, rhymeScheme, targetSyllables,
        genre, tempo, instrumentation, musicalPrompt
      };
      localStorage.setItem('lyricist_session', JSON.stringify(sessionData));
      setHasSavedSession(true);
    }
  }, [song, structure, title, topic, mood, rhymeScheme, targetSyllables, genre, tempo, instrumentation, musicalPrompt, isSessionHydrated]);

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
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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
  const [isSimilarityModalOpen, setIsSimilarityModalOpen] = useState(false);
  const [shouldAutoGenerateTitle, setShouldAutoGenerateTitle] = useState(false);
  const previousLyricsSnapshotRef = useRef<VersionSnapshot | null>(null);

  const createVersion = useCallback((
    snapshot: VersionSnapshot,
    name: string,
    previousVersions: SongVersion[],
    options?: { allowDuplicate?: boolean },
  ): SongVersion[] => {
    const latestVersion = previousVersions[0];
    const normalizedSnapshot = JSON.stringify({
      song: snapshot.song,
      structure: snapshot.structure,
      title: snapshot.title,
      titleOrigin: snapshot.titleOrigin,
      topic: snapshot.topic,
      mood: snapshot.mood,
    });

    if (!options?.allowDuplicate && latestVersion) {
      const normalizedLatest = JSON.stringify({
        song: latestVersion.song,
        structure: latestVersion.structure,
        title: latestVersion.title,
        titleOrigin: latestVersion.titleOrigin,
        topic: latestVersion.topic,
        mood: latestVersion.mood,
      });

      if (normalizedLatest === normalizedSnapshot) {
        return previousVersions;
      }
    }

    return [
      {
        id: generateId(),
        timestamp: Date.now(),
        song: JSON.parse(JSON.stringify(snapshot.song)),
        structure: [...snapshot.structure],
        title: snapshot.title,
        titleOrigin: snapshot.titleOrigin,
        topic: snapshot.topic,
        mood: snapshot.mood,
        name,
      },
      ...previousVersions,
    ];
  }, []);

  const resetSong = () => {
    updateSongAndStructureWithHistory(createEmptySong(DEFAULT_STRUCTURE, rhymeScheme), DEFAULT_STRUCTURE);
    localStorage.removeItem('lyricist_session');
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

  const {
    isGenerating, isGeneratingMusicalPrompt, selectedLineId, setSelectedLineId,
    suggestions, isSuggesting, generateSong, regenerateSection, quantizeSyllables,
    generateSuggestions, updateLineText, handleLineKeyDown, applySuggestion,
    generateMusicalPrompt, handleLineClick, handleInstructionChange,
    addInstruction, removeInstruction, clearSelection,
  } = useSongComposer({
    song, structure, topic, mood, rhymeScheme, targetSyllables, title,
    genre, tempo, instrumentation, setMusicalPrompt,
    updateState, updateSongWithHistory, updateSongAndStructureWithHistory, saveVersion,
    requestAutoTitleGeneration: () => setShouldAutoGenerateTitle(true),
  });

  const {
    isPasteModalOpen, setIsPasteModalOpen, pastedText, setPastedText,
    isAnalyzing, isAnalysisModalOpen, setIsAnalysisModalOpen, analysisReport, analysisSteps,
    appliedAnalysisItems, selectedAnalysisItems, isApplyingAnalysis,
    songLanguage, targetLanguage, setTargetLanguage, sectionTargetLanguages, setSectionTargetLanguages,
    isAdaptingLanguage, isDetectingLanguage, isAnalyzingTheme,
    toggleAnalysisItemSelection, applySelectedAnalysisItems, applyAnalysisItem,
    analyzeCurrentSong, detectLanguage, adaptSongLanguage, adaptSectionLanguage, analyzePastedLyrics, clearAppliedAnalysisItems,
  } = useSongAnalysis({
    song, topic, mood, rhymeScheme, setTopic, setMood, saveVersion,
    updateState, updateSongWithHistory, updateSongAndStructureWithHistory,
    clearLineSelection: clearSelection,
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

  const { generateTitle, isGeneratingTitle } = useTitleGenerator(song, topic, mood);

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

  const sectionCount = song.length;
  const wordCount = song.reduce((acc, sec) => acc + sec.lines.reduce((lAcc, line) => lAcc + line.text.split(/\s+/).filter(w => w.length > 0).length, 0), 0);
  const charCount = song.reduce((acc, sec) => acc + sec.lines.reduce((lAcc, line) => lAcc + line.text.length, 0), 0);
  const hasExistingWork = (
    song.length > 0
    && !isPristineDraft(song, structure, rhymeScheme)
  )
    || topic !== DEFAULT_TOPIC
    || mood !== DEFAULT_MOOD
    || (isMarkupMode && markupText.trim().length > 0);

  const handleImportInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    loadFileForAnalysis(file);
  };

  const triggerImportFilePicker = async () => {
    if (hasExistingWork) {
      const shouldContinue = window.confirm(
        `${t.importDialog.replaceDescription}\n\n${t.importDialog.warning}\n${t.importDialog.supportedFiles}`
      );
      if (!shouldContinue) {
        return;
      }
    }

    const pickerWindow = window as Window & {
      showOpenFilePicker?: (options: {
        multiple?: boolean;
        excludeAcceptAllOption?: boolean;
        types?: Array<{
          description?: string;
          accept: Record<string, string[]>;
        }>;
      }) => Promise<Array<{ getFile: () => Promise<File> }>>;
    };

    if (pickerWindow.showOpenFilePicker) {
      try {
        const [handle] = await pickerWindow.showOpenFilePicker({
          multiple: false,
          types: [
            {
              description: 'Lyrics files',
              accept: {
                'text/plain': ['.txt', '.md'],
                'text/markdown': ['.md'],
              },
            },
          ],
        });
        if (!handle) return;
        const file = await handle.getFile();
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
    if (newTitle) {
      setTitle(newTitle);
      setTitleOrigin('ai');
    }
  };

  useEffect(() => {
    if (!shouldAutoGenerateTitle || song.length === 0) return;

    let isCancelled = false;

    const run = async () => {
      const newTitle = await generateTitle();
      if (!isCancelled && newTitle) {
        setTitle(newTitle);
        setTitleOrigin('ai');
      }
      if (!isCancelled) {
        setShouldAutoGenerateTitle(false);
      }
    };

    void run();

    return () => {
      isCancelled = true;
    };
  }, [generateTitle, shouldAutoGenerateTitle, song.length]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setTitleOrigin('user');
  };

  const handleGlobalRegenerate = () => {
    if (song.length > 0 && !window.confirm(t.editor.regenerateWarning)) {
      return;
    }
    void generateSong();
  };

  const scrollToSection = (section: Section) => {
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
        if (container) { container.scrollTo({ top: el.offsetTop - 20, behavior: 'smooth' }); }
        else { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      }
    }
  };

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
          })
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
        return {
          ...s,
          lines: [...s.lines, { id: generateId(), text: '', rhymingSyllables: '', rhyme: '', syllables: 0, concept: '', isManual: true }],
        };
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

  return (
    <FluentProvider theme={theme === 'dark' ? webDarkTheme : webLightTheme} style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }}>
    <div className={`h-screen w-full bg-fluent-bg text-zinc-400 flex flex-col overflow-hidden font-sans selection:bg-[var(--accent-color)]/30 ${theme === 'dark' ? 'dark' : ''}`}>
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
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--accent-color)]/5 blur-[120px] pointer-events-none rounded-full" />

          <TopRibbon
            isLeftPanelOpen={isLeftPanelOpen} setIsLeftPanelOpen={setIsLeftPanelOpen}
            activeTab={activeTab} setActiveTab={setActiveTab}
            song={song} past={past} future={future} undo={undo} redo={redo}
            setIsVersionsModalOpen={setIsVersionsModalOpen} setIsResetModalOpen={setIsResetModalOpen}
            isStructureOpen={isStructureOpen} setIsStructureOpen={setIsStructureOpen}
            hasApiKey={hasApiKey} handleApiKeyHelp={handleApiKeyHelp}
            onImportClick={triggerImportFilePicker} exportTxt={exportTxt} exportMd={exportMd}
            isGenerating={isGenerating} isAnalyzing={isAnalyzing}
          />

          {activeTab === 'lyrics' && song.length > 0 && (
            <div className="border-b border-white/10 bg-white/[0.03] px-4 py-3 z-10">
              <div className="lyrics-editor-zoom flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="micro-label text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                    <BarChart2 className="w-3.5 h-3.5" />
                    {t.insights.title}
                  </h3>
                  <div className="h-4 w-px bg-white/10" />
                  <div className="flex items-center gap-2">
                    <Select value={targetLanguage} onChange={(e: { target: { value?: string } }) => setTargetLanguage(e.target.value ?? '')} size="small" style={{ height: 24, fontSize: '10px', color: 'var(--colorNeutralForeground2)', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '4px' }}>
                      {SUPPORTED_ADAPTATION_LANGUAGES.map(lang => (
                        <MenuItem key={lang.code} value={lang.aiName} style={{ fontSize: '10px' }}>
                          {adaptationLanguageLabel(lang)}
                        </MenuItem>
                      ))}
                    </Select>
                    <Tooltip title={t.tooltips.adaptSong.replaceAll('{lang}', targetLanguage)}>
                      <button onClick={() => adaptSongLanguage(targetLanguage)} disabled={isAdaptingLanguage || song.length === 0} className="px-3 py-1 bg-[var(--accent-color)]/20 hover:bg-[var(--accent-color)]/30 text-[var(--accent-color)] text-[10px] font-bold rounded transition-all flex items-center gap-1.5 disabled:opacity-50">
                        {isAdaptingLanguage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                        {t.editor.adaptation}
                      </button>
                    </Tooltip>
                    <Tooltip title={songLanguage ? `Detected: ${songLanguage} — click to re-detect` : 'Detect song language'}>
                      <button onClick={() => void detectLanguage()} disabled={isDetectingLanguage || song.length === 0} className="px-3 py-1 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 text-[10px] font-bold rounded transition-all flex items-center gap-1.5 disabled:opacity-50 border border-white/10">
                        {isDetectingLanguage ? <Loader2 className="w-3 h-3 animate-spin" /> : <ScanText className="w-3 h-3" />}
                        {songLanguage || 'Detect'}
                      </button>
                    </Tooltip>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end"><span className="micro-label text-zinc-500">{t.insights.sections}</span><span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{sectionCount}</span></div>
                  <div className="flex flex-col items-end"><span className="micro-label text-zinc-500">{t.insights.words}</span><span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{wordCount}</span></div>
                  <div className="flex flex-col items-end"><span className="micro-label text-zinc-500">{t.insights.characters}</span><span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{charCount}</span></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {song.map((section) => {
                    const sectionWordCount = section.lines.reduce((acc, line) => acc + line.text.split(/\s+/).filter(w => w.length > 0).length, 0);
                    return (
                      <Tooltip key={section.id} title={
                        <div className="flex flex-col gap-1 text-xs">
                          <div><span>{t.editor.sectionTooltip.lines}:</span> {section.lines.length}</div>
                          <div><span>{t.editor.sectionTooltip.words}:</span> {sectionWordCount}</div>
                        </div>
                      }>
                        <button
                          onClick={() => scrollToSection(section)}
                          className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap border border-transparent hover:border-white/20 transition-all lcars-section-chip glass-button"
                          style={{ color: getSectionTextColor(section.name) }}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${getSectionDotColor(section.name)}`} />
                          {section.name}
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Tooltip title="Save current song to library for similarity detection">
                    <button onClick={handleSaveToLibrary} disabled={isSavingToLibrary || song.length === 0} className="px-4 py-2 glass-button text-white text-xs rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSavingToLibrary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save to Library
                    </button>
                  </Tooltip>
                  <Tooltip title={isMarkupMode ? t.tooltips.editorMode : t.tooltips.markupMode}>
                    <button onClick={handleMarkupToggle} disabled={isGenerating || isAnalyzing} className="px-4 py-2 glass-button text-white text-xs rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                      <Layout className="w-3.5 h-3.5" />
                      {isMarkupMode ? t.editor.editorMode : t.editor.markupModeLabel}
                    </button>
                  </Tooltip>
                  <Tooltip title={t.tooltips.analyzeTheme}>
                    <button onClick={analyzeCurrentSong} disabled={isGenerating || isAnalyzing || song.length === 0} className="px-4 py-2 glass-button text-white text-xs rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                      <BarChart2 className="w-3.5 h-3.5" />
                      {t.editor.analyze}
                    </button>
                  </Tooltip>
                  <Tooltip title={`Check similarity with ${libraryCount} songs in library`}>
                    <button onClick={() => setIsSimilarityModalOpen(true)} disabled={isGenerating || isAnalyzing || song.length === 0} className="px-4 py-2 glass-button text-white text-xs rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed relative">
                      <Search className="w-3.5 h-3.5" />
                      {t.ribbon?.similarity || 'Similarity'}
                      {libraryCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-[var(--accent-color)]/20 rounded text-[9px]">{libraryCount}</span>}
                    </button>
                  </Tooltip>
                  <Tooltip title={t.tooltips.regenerate}>
                    <button onClick={handleGlobalRegenerate} disabled={isGenerating || isAnalyzing} className="px-4 py-2 glass-button bg-[var(--accent-color)]/20 border-[var(--accent-color)]/50 hover:bg-[var(--accent-color)]/40 hover:border-[var(--accent-color)] text-white text-xs rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(var(--accent-color-rgb),0.2)] whitespace-nowrap">
                      {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      {t.editor.regenerateGlobal}
                    </button>
                  </Tooltip>
                </div>
              </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative p-8">
            <div className="lyrics-editor-zoom h-full">
            {activeTab === 'lyrics' ? (
              <div className="max-w-4xl mx-auto space-y-8 pb-32">
                {isMarkupMode ? (
                  <MarkupInput
                    value={markupText}
                    onChange={(e) => setMarkupText(e.target.value)}
                    textareaRef={markupTextareaRef}
                    className="w-full min-h-[70vh] rounded-2xl border border-black/10 bg-white/70 p-5 font-mono text-sm leading-7 text-zinc-800 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-100"
                    spellCheck={false}
                  />
                ) : (
                  song.map((section, sectionIndex) => (
                    <section
                      key={section.id}
                      id={`section-${section.id}`}
                      className="lcars-band"
                    >
                      {/* LCARS asymmetric colored left stripe */}
                      <div className={`lcars-band-stripe ${getSectionDotColor(section.name)}`} />

                      <div className="flex-1 p-6">
                        {/* Section header */}
                        <div className="mb-5 flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            {/* Section move up/down */}
                            <div className="flex flex-col gap-0.5">
                              <Tooltip title="Move section up">
                                <button
                                  type="button"
                                  onClick={() => moveSectionUp(section.id)}
                                  disabled={sectionIndex === 0}
                                  className="flex h-5 w-5 items-center justify-center rounded border border-white/10 bg-white/[0.03] text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </button>
                              </Tooltip>
                              <Tooltip title="Move section down">
                                <button
                                  type="button"
                                  onClick={() => moveSectionDown(section.id)}
                                  disabled={sectionIndex === song.length - 1}
                                  className="flex h-5 w-5 items-center justify-center rounded border border-white/10 bg-white/[0.03] text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                              </Tooltip>
                            </div>

                            <div>
                              {/* Section type selector */}
                              <select
                                value={section.name}
                                onChange={(e) => setSectionName(section.id, e.target.value)}
                                className={`lcars-section-title text-lg font-semibold uppercase tracking-[0.25em] bg-transparent border-none outline-none cursor-pointer ${getSectionTextColor(section.name)}`}
                              >
                                {SECTION_TYPE_OPTIONS.map(opt => (
                                  <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                                ))}
                                {!SECTION_TYPE_OPTIONS.includes(section.name) && (
                                  <option value={section.name}>{section.name.toUpperCase()}</option>
                                )}
                              </select>
                              <div className="mt-1 flex items-center gap-2">
                                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                                  {section.lines.length} lines
                                </p>
                                {/* Per-section rhyme scheme selector */}
                                <select
                                  value={section.rhymeScheme || rhymeScheme}
                                  onChange={(e) => setSectionRhymeScheme(section.id, e.target.value)}
                                  className="text-[10px] uppercase tracking-[0.15em] bg-transparent border border-white/10 rounded px-1.5 py-0.5 text-zinc-500 dark:text-zinc-400 hover:border-white/25 transition cursor-pointer outline-none"
                                >
                                  {RHYME_KEYS.map(key => (
                                    <option key={key} value={key}>{key}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          <Tooltip title={t.tooltips.regenerateSection}>
                            <button
                              onClick={() => regenerateSection(section.id)}
                              disabled={isGenerating || isAnalyzing}
                              className="flex items-center gap-2 rounded-full border border-[var(--accent-color)]/30 bg-[var(--accent-color)]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent-color)] transition hover:bg-[var(--accent-color)]/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                              {t.editor.regenerateSection}
                            </button>
                          </Tooltip>
                        </div>

                        <InstructionEditor
                          instructions={section.preInstructions}
                          sectionId={section.id}
                          type="pre"
                          onChange={handleInstructionChange}
                          onAdd={addInstruction}
                          onRemove={removeInstruction}
                        />

                        <div className="mt-5 space-y-3">
                          {section.lines.map((line, index) => (
                            <div
                              key={line.id}
                              className={`group rounded-2xl border px-4 py-3 transition ${
                                selectedLineId === line.id
                                  ? 'border-[var(--accent-color)]/60 bg-[var(--accent-color)]/10 shadow-[0_0_0_1px_rgba(var(--accent-color-rgb),0.15)]'
                                  : 'border-black/10 bg-black/[0.02] hover:border-black/20 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Line move up/down */}
                                <div className="flex flex-col gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Tooltip title="Move line up">
                                    <button
                                      type="button"
                                      onClick={() => moveLineUp(section.id, line.id)}
                                      disabled={index === 0}
                                      className="flex h-4 w-4 items-center justify-center rounded border border-white/10 bg-white/[0.03] text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <ChevronUp className="h-2.5 w-2.5" />
                                    </button>
                                  </Tooltip>
                                  <Tooltip title="Move line down">
                                    <button
                                      type="button"
                                      onClick={() => moveLineDown(section.id, line.id)}
                                      disabled={index === section.lines.length - 1}
                                      className="flex h-4 w-4 items-center justify-center rounded border border-white/10 bg-white/[0.03] text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <ChevronDown className="h-2.5 w-2.5" />
                                    </button>
                                  </Tooltip>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleLineClick(line.id)}
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/70 text-[11px] font-semibold text-zinc-500 transition group-hover:text-zinc-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400 dark:group-hover:text-zinc-200"
                                >
                                  {index + 1}
                                </button>
                                <LyricInput
                                  value={line.text}
                                  onChange={(e) => updateLineText(section.id, line.id, e.target.value)}
                                  onKeyDown={(e) => handleLineKeyDown(e, section.id, line.id)}
                                  onClick={() => handleLineClick(line.id)}
                                  data-line-id={line.id}
                                  placeholder={`${section.name} line ${index + 1}`}
                                  className="flex-1 text-base text-zinc-900 placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                                />
                                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                                  <span>{line.syllables}</span>
                                  {line.rhyme && (
                                    <span className={`rounded-full px-2 py-1 border ${getRhymeColor(line.rhyme)}`}>
                                      {line.rhyme}
                                    </span>
                                  )}
                                </div>

                                {/* Delete line button */}
                                <Tooltip title="Delete line">
                                  <button
                                    type="button"
                                    onClick={() => deleteLineFromSection(section.id, line.id)}
                                    className="shrink-0 opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/25 hover:text-red-300"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </Tooltip>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add line button */}
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => addLineToSection(section.id)}
                            className="flex items-center gap-2 rounded-full border border-dashed border-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 transition hover:border-white/30 hover:text-zinc-300 dark:hover:text-zinc-200"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Line
                          </button>
                        </div>

                        <div className="mt-5">
                          <InstructionEditor
                            instructions={section.postInstructions}
                            sectionId={section.id}
                            type="post"
                            onChange={handleInstructionChange}
                            onAdd={addInstruction}
                            onRemove={removeInstruction}
                          />
                        </div>
                      </div>
                    </section>
                  ))
                )}
              </div>
            ) : (
              <div>Musical tab UI</div>
            )}
            </div>
          </div>
        </div>

        <StructureSidebar
          isStructureOpen={isStructureOpen} setIsStructureOpen={setIsStructureOpen}
          structure={structure} newSectionName={newSectionName} setNewSectionName={setNewSectionName}
          isSectionDropdownOpen={isSectionDropdownOpen} setIsSectionDropdownOpen={setIsSectionDropdownOpen}
          draggedItemIndex={draggedItemIndex} setDraggedItemIndex={setDraggedItemIndex}
          dragOverIndex={dragOverIndex} setDragOverIndex={setDragOverIndex} isGenerating={isGenerating}
          addStructureItem={addStructureItem} removeStructureItem={removeStructureItem}
          normalizeStructure={normalizeStructure} handleDrop={handleDrop}
        />
      </div>

      <StatusBar
        song={song} wordCount={wordCount} isGenerating={isGenerating} isAnalyzing={isAnalyzing}
        isSuggesting={isSuggesting} theme={theme} setTheme={setTheme}
        audioFeedback={audioFeedback} setAudioFeedback={setAudioFeedback}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      <SuggestionsPanel
        selectedLineId={selectedLineId} setSelectedLineId={setSelectedLineId}
        suggestions={suggestions} isSuggesting={isSuggesting}
        applySuggestion={applySuggestion} generateSuggestions={generateSuggestions}
      />

      <PasteModal
        isOpen={isPasteModalOpen} onClose={() => setIsPasteModalOpen(false)}
        pastedText={pastedText} setPastedText={setPastedText}
        isAnalyzing={isAnalyzing} onAnalyze={analyzePastedLyrics}
      />

      <AnalysisModal
        isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)}
        isAnalyzing={isAnalyzing} analysisReport={analysisReport} analysisSteps={analysisSteps}
        appliedAnalysisItems={appliedAnalysisItems} selectedAnalysisItems={selectedAnalysisItems}
        isApplyingAnalysis={isApplyingAnalysis} toggleAnalysisItemSelection={toggleAnalysisItemSelection}
        applySelectedAnalysisItems={applySelectedAnalysisItems} clearAppliedAnalysisItems={clearAppliedAnalysisItems}
        versions={versions} rollbackToVersion={rollbackToVersion}
      />
      <SimilarityModal
        isOpen={isSimilarityModalOpen}
        onClose={() => setIsSimilarityModalOpen(false)}
        matches={similarityMatches}
        candidateCount={libraryCount}
      />

      <VersionsModal isOpen={isVersionsModalOpen} versions={versions} onClose={() => setIsVersionsModalOpen(false)} onSaveCurrent={() => { const name = prompt('Enter version name:'); if (name !== null) saveVersion(name); }} onRollback={rollbackToVersion} />
      <ResetModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onConfirm={resetSong} />
      <input ref={importInputRef} type="file" accept=".txt,.md" className="hidden" onChange={handleImportInputChange} />
    </div>
    </FluentProvider>
  );
}
