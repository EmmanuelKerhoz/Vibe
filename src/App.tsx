import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Sparkles, Loader2, RefreshCw, Music, Lightbulb, ClipboardPaste, Ruler, BarChart2, GripVertical, Waves, Volume2, Wand2, History, Bot, User, FileText, Layout, Languages, Globe, Search } from 'lucide-react';
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
import { getTopSimilarSongMatches } from './utils/similarityUtils';

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
  
  const {
    song, structure, past, future, updateState, updateSongWithHistory, updateStructureWithHistory,
    updateSongAndStructureWithHistory, replaceStateWithoutHistory, clearHistory, undo, redo,
  } = useSongHistoryState([], DEFAULT_STRUCTURE);
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
  useEffect(() => {
    fetch('/api/status')
      .then(r => r.json())
      .then((data: { available?: boolean }) => setHasApiKey(data.available === true))
      .catch(() => setHasApiKey(false));
  }, []);

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

  const loadSavedSession = () => {
    const savedSession = localStorage.getItem('lyricist_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.song) {
          const cleanedSong = parsed.song.map((s: any) => ({ ...s, name: cleanSectionName(s.name) }));
          const nextStructure = cleanedSong.length > 0
            ? cleanedSong.map((s: any) => s.name)
            : (parsed.structure ? parsed.structure.map((s: any) => cleanSectionName(s)) : DEFAULT_STRUCTURE);
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
  }, []);

  useEffect(() => {
    if (song.length > 0) {
      const sessionData = {
        song, structure, title, topic, mood, rhymeScheme, targetSyllables,
        genre, tempo, instrumentation, musicalPrompt
      };
      localStorage.setItem('lyricist_session', JSON.stringify(sessionData));
      setHasSavedSession(true);
    }
  }, [song, structure, title, topic, mood, rhymeScheme, targetSyllables, genre, tempo, instrumentation, musicalPrompt]);

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
    updateSongAndStructureWithHistory([], DEFAULT_STRUCTURE);
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
    isAdaptingLanguage, toggleAnalysisItemSelection, applySelectedAnalysisItems,
    analyzeCurrentSong, adaptSongLanguage, adaptSectionLanguage, analyzePastedLyrics, clearAppliedAnalysisItems,
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
  const similarityMatches = useMemo(() => getTopSimilarSongMatches(song, versions), [song, versions]);
  const hasExistingWork = song.length > 0
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
                    <Select value={targetLanguage} onChange={(e: any) => setTargetLanguage(e.target.value as string)} size="small" style={{ height: 24, fontSize: '10px', color: 'var(--colorNeutralForeground2)', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '4px' }}>
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
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getSectionDotColor(section.name) }} />
                          {section.name}
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Tooltip title={isMarkupMode ? t.tooltips.visualMode : t.tooltips.markupMode}>
                    <button onClick={handleMarkupToggle} disabled={isGenerating || isAnalyzing} className="px-4 py-2 glass-button text-white text-xs rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                      <Layout className="w-3.5 h-3.5" />
                      {isMarkupMode ? t.editor.visualMode : t.editor.markupMode}
                    </button>
                  </Tooltip>
                  <Tooltip title={t.tooltips.analyzeTheme}>
                    <button onClick={analyzeCurrentSong} disabled={isGenerating || isAnalyzing || song.length === 0} className="px-4 py-2 glass-button text-white text-xs rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                      <BarChart2 className="w-3.5 h-3.5" />
                      {t.editor.analyze}
                    </button>
                  </Tooltip>
                  <Tooltip title={t.tooltips.checkSimilarity || t.ribbon?.similarity || 'Détection de similarité'}>
                    <button onClick={() => setIsSimilarityModalOpen(true)} disabled={isGenerating || isAnalyzing || song.length === 0} className="px-4 py-2 glass-button text-white text-xs rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                      <Search className="w-3.5 h-3.5" />
                      {t.ribbon?.similarity || 'Similarité'}
                    </button>
                  </Tooltip>
                  <Tooltip title={t.tooltips.regenerateGlobal}>
                    <button onClick={handleGlobalRegenerate} disabled={isGenerating || isAnalyzing} className="px-4 py-2 glass-button bg-[var(--accent-color)]/20 border-[var(--accent-color)]/50 hover:bg-[var(--accent-color)]/40 hover:border-[var(--accent-color)] text-white text-xs rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(var(--accent-color-rgb),0.2)] whitespace-nowrap">
                      {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      {t.editor.regenerateAll}
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
                {song.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
                    <div className="w-20 h-20 bg-[var(--accent-color)]/10 rounded-full flex items-center justify-center animate-pulse border border-[var(--accent-color)]/30">
                      <Sparkles className="w-10 h-10 text-[var(--accent-color)]" />
                    </div>
                    <div className="text-center space-y-4 max-w-md">
                      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-200">{t.editor.emptyState.title}</h2>
                      <p className="text-zinc-500 dark:text-zinc-400">{t.editor.emptyState.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-2xl mx-auto">
                        <button onClick={() => generateSong()} disabled={isGenerating} className="group relative p-6 bg-white dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-white/10 hover:border-[var(--accent-color)]/50 transition-all text-left overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-color)]/0 to-[var(--accent-color)]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative flex flex-col gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[var(--accent-color)]/10 flex items-center justify-center">
                              {isGenerating ? <Loader2 className="w-5 h-5 text-[var(--accent-color)] animate-spin" /> : <Bot className="w-5 h-5 text-[var(--accent-color)]" />}
                            </div>
                            <div>
                              <h3 className="font-bold text-zinc-900 dark:text-white">{t.editor.emptyState.actions.ai.title}</h3>
                              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t.editor.emptyState.actions.ai.description}</p>
                            </div>
                          </div>
                        </button>
                        
                        <button onClick={() => updateSongAndStructureWithHistory([{ id: generateId(), name: 'Verse 1', rhymeScheme: 'AABB', targetSyllables: 8, mood: '', lines: [] }], ['Verse 1'])} className="group relative p-6 bg-white dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-white/10 hover:border-blue-500/50 transition-all text-left overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative flex flex-col gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <h3 className="font-bold text-zinc-900 dark:text-white">{t.editor.emptyState.actions.manual.title}</h3>
                              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t.editor.emptyState.actions.manual.description}</p>
                            </div>
                          </div>
                        </button>
                        
                        <button onClick={() => setIsPasteModalOpen(true)} className="col-span-2 group relative p-6 bg-white dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-white/10 hover:border-purple-500/50 transition-all text-left overflow-hidden flex items-center justify-between">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                              <ClipboardPaste className="w-6 h-6 text-purple-500" />
                            </div>
                            <div>
                              <h3 className="font-bold text-zinc-900 dark:text-white">{t.editor.emptyState.actions.paste.title}</h3>
                              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t.editor.emptyState.actions.paste.description}</p>
                            </div>
                          </div>
                          <div className="px-4 py-2 bg-zinc-100 dark:bg-white/5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-300">
                            {t.editor.emptyState.actions.paste.button}
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : isMarkupMode ? (
                  <MarkupInput
                    value={markupText}
                    onChange={setMarkupText}
                  />
                ) : (
                  song.map((section, sIdx) => {
                    const nextSection = song[sIdx + 1];
                    const nextSectionName = nextSection ? cleanSectionName(nextSection.name) : null;
                    const nextSectionColor = nextSectionName ? getSectionColor(nextSectionName) : 'transparent';
                    
                    return (
                    <div key={section.id} id={`section-${section.id}`} className={`relative transition-all duration-300 ${draggedItemIndex !== null ? 'opacity-50' : ''}`}>
                      <div className="lcars-band">
                        <div className="lcars-band-stripe" style={{ backgroundColor: getSectionColor(section.name) }} />
                        <div className="flex-1 p-6">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="px-3 py-1 rounded-[8px_4px_8px_4px] text-xs font-bold tracking-widest uppercase border border-white/10 lcars-section-title" style={{ color: getSectionTextColor(section.name), backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                {section.name}
                              </div>
                              <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5 text-zinc-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                                  <span className="font-mono tracking-widest">{t.editor.sectionRhyme}: <span className="text-white font-bold">{section.rhymeScheme}</span></span>
                                </div>
                                <div className="flex items-center gap-1.5 text-zinc-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                                  <span className="font-mono tracking-widest">{t.editor.sectionSyllables}: <span className="text-white font-bold">{section.targetSyllables}</span></span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Tooltip title={t.tooltips.regenerateSection}>
                                <button
                                  onClick={() => regenerateSection(sIdx)}
                                  disabled={isGenerating}
                                  className="p-2 text-zinc-400 hover:text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 rounded-[8px_2px_8px_2px] transition-all disabled:opacity-50"
                                >
                                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                </button>
                              </Tooltip>
                              
                              <div className="relative">
                                <Tooltip title={t.tooltips.adaptSection.replaceAll('{lang}', sectionTargetLanguages[section.id] || targetLanguage)}>
                                  <div className="flex items-center gap-1">
                                    <Select 
                                      value={sectionTargetLanguages[section.id] || targetLanguage} 
                                      onChange={(e: any) => setSectionTargetLanguages(prev => ({...prev, [section.id]: e.target.value as string}))}
                                      size="small"
                                      style={{ height: 28, fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.05)', border: 'none' }}
                                    >
                                      {SUPPORTED_ADAPTATION_LANGUAGES.map(lang => (
                                        <MenuItem key={lang.code} value={lang.aiName} style={{ fontSize: '11px' }}>
                                          {lang.label}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                    <button
                                      onClick={() => adaptSectionLanguage(sIdx, sectionTargetLanguages[section.id] || targetLanguage)}
                                      disabled={isAdaptingLanguage || section.lines.length === 0}
                                      className="p-2 text-[var(--accent-color)] bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/20 rounded-[8px_2px_8px_2px] transition-all disabled:opacity-50"
                                    >
                                      {isAdaptingLanguage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                                    </button>
                                  </div>
                                </Tooltip>
                              </div>
                              <Tooltip title={t.tooltips.deleteSection}>
                                <button
                                  onClick={() => {
                                    if (window.confirm(t.editor.deleteSectionConfirm)) {
                                      updateSongAndStructureWithHistory(song.filter((_, i) => i !== sIdx), structure.filter((_, i) => i !== sIdx));
                                    }
                                  }}
                                  className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-[8px_2px_8px_2px] transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </Tooltip>
                            </div>
                          </div>

                          <div className="mb-4">
                            <InstructionEditor
                              instructions={section.preInstructions || []}
                              onChange={(newInst) => handleInstructionChange(sIdx, 'pre', newInst)}
                              onAdd={() => addInstruction(sIdx, 'pre')}
                              onRemove={(idx) => removeInstruction(sIdx, 'pre', idx)}
                              placeholder={t.editor.preInstructionPlaceholder}
                            />
                          </div>

                          <div className="space-y-1.5 pl-2 relative">
                            {section.lines.map((line, lIdx) => (
                              <div key={line.id} 
                                className="relative group/line flex items-center"
                                draggable
                                onDragStart={(e) => handleLineDragStart(e, section.id, line.id)}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  setDragOverLineInfo({ sectionId: section.id, lineId: line.id });
                                }}
                                onDrop={(e) => handleLineDrop(e, section.id, line.id)}
                              >
                                {dragOverLineInfo?.sectionId === section.id && dragOverLineInfo?.lineId === line.id && (
                                  <div className="absolute -top-1 left-0 right-0 h-0.5 bg-[var(--accent-color)] z-10 shadow-[0_0_8px_var(--accent-color)]" />
                                )}
                                <div className="absolute left-[-24px] opacity-0 group-hover/line:opacity-100 cursor-grab active:cursor-grabbing text-zinc-500 hover:text-white transition-opacity p-1">
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                
                                {line.isManual && (
                                  <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[var(--accent-color)] shadow-[0_0_5px_var(--accent-color)]" title="Ligne manuelle" />
                                )}
                                
                                <LyricInput
                                  value={line.text}
                                  onChange={(val) => updateLineText(sIdx, lIdx, val)}
                                  onKeyDown={(e) => handleLineKeyDown(e, sIdx, lIdx)}
                                  onFocus={() => handleLineClick(line.id)}
                                  isActive={selectedLineId === line.id}
                                  placeholder={t.editor.lyricPlaceholder}
                                  rhymingSyllables={line.rhymingSyllables}
                                  rhyme={line.rhyme}
                                  syllables={line.syllables}
                                  targetSyllables={section.targetSyllables}
                                  concept={line.concept}
                                />
                                
                                <div className="absolute right-[-40px] opacity-0 group-hover/line:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => {
                                      const newLines = [...section.lines];
                                      newLines.splice(lIdx, 1);
                                      updateSongInHistory(current => {
                                        const next = [...current];
                                        next[sIdx] = { ...section, lines: newLines };
                                        return next;
                                      });
                                    }}
                                    className="p-1 text-zinc-500 hover:text-red-400 rounded transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4">
                            <InstructionEditor
                              instructions={section.postInstructions || []}
                              onChange={(newInst) => handleInstructionChange(sIdx, 'post', newInst)}
                              onAdd={() => addInstruction(sIdx, 'post')}
                              onRemove={(idx) => removeInstruction(sIdx, 'post', idx)}
                              placeholder={t.editor.postInstructionPlaceholder}
                            />
                          </div>

                          {section.lines.length === 0 && (
                            <button
                              onClick={() => {
                                const newLines = [{ id: generateId(), text: '', rhymingSyllables: '', rhyme: '', syllables: 0, concept: '', isManual: true }];
                                updateSongInHistory(current => {
                                  const next = [...current];
                                  next[sIdx] = { ...section, lines: newLines };
                                  return next;
                                });
                              }}
                              className="mt-4 text-xs text-zinc-500 hover:text-[var(--accent-color)] flex items-center gap-1 transition-colors"
                            >
                              <div className="w-4 h-4 rounded bg-white/5 flex items-center justify-center group-hover:bg-[var(--accent-color)]/20">
                                <span className="font-mono leading-none -mt-px">+</span>
                              </div>
                              {t.editor.addFirstLine}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {sIdx < song.length - 1 && (
                        <div className="h-6 flex flex-col justify-center opacity-30">
                          <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
                        </div>
                      )}
                    </div>
                  )}))
                )}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto pb-32 lcars-panel p-8">
                <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/30">
                    <Music className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-wider uppercase text-white">{t.musical.title}</h2>
                    <p className="text-sm text-zinc-400 font-mono">{t.musical.subtitle}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="uppercase tracking-widest text-[10px] text-[var(--accent-color)]">{t.musical.genre}</Label>
                      <Input
                        value={genre}
                        onChange={(e: any) => setGenre(e.target.value)}
                        placeholder={t.musical.genrePlaceholder}
                        className="bg-black/40 border-white/10 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="uppercase tracking-widest text-[10px] text-[var(--accent-color)]">{t.musical.tempo}</Label>
                      <Input
                        type="number"
                        value={tempo}
                        onChange={(e: any) => setTempo(e.target.value)}
                        placeholder="120"
                        className="bg-black/40 border-white/10 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="uppercase tracking-widest text-[10px] text-[var(--accent-color)]">{t.musical.instruments}</Label>
                      <Input
                        value={instrumentation}
                        onChange={(e: any) => setInstrumentation(e.target.value)}
                        placeholder={t.musical.instrumentsPlaceholder}
                        className="bg-black/40 border-white/10 font-mono text-sm"
                      />
                    </div>
                    <Button 
                      onClick={generateMusicalPrompt}
                      disabled={isGeneratingMusicalPrompt || song.length === 0}
                      className="w-full glass-button mt-4 py-4 uppercase tracking-widest font-bold"
                    >
                      {isGeneratingMusicalPrompt ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                      {t.musical.generatePrompt}
                    </Button>
                  </div>

                  <div className="space-y-2 flex flex-col h-full">
                    <Label className="uppercase tracking-widest text-[10px] text-[var(--accent-color)] flex items-center justify-between">
                      {t.musical.prompt}
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(musicalPrompt);
                          alert(t.musical.copySuccess);
                        }}
                        disabled={!musicalPrompt}
                        className="text-xs text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {t.musical.copy}
                      </button>
                    </Label>
                    <textarea
                      value={musicalPrompt}
                      onChange={(e) => setMusicalPrompt(e.target.value)}
                      placeholder={t.musical.promptPlaceholder}
                      className="flex-1 w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-mono text-zinc-300 focus:outline-none focus:border-[var(--accent-color)] resize-none custom-scrollbar shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
                      style={{ minHeight: '300px' }}
                    />
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>

          <StatusBar
            song={song}
            charCount={charCount}
            wordCount={wordCount}
            sectionCount={sectionCount}
            isLeftPanelOpen={isLeftPanelOpen}
            isStructureOpen={isStructureOpen}
            activeTab={activeTab}
            audioFeedback={audioFeedback}
            setAudioFeedback={setAudioFeedback}
            theme={theme}
            setTheme={setTheme}
          />
        </div>

        <StructureSidebar
          isStructureOpen={isStructureOpen}
          structure={structure}
          song={song}
          newSectionName={newSectionName}
          setNewSectionName={setNewSectionName}
          addStructureItem={addStructureItem}
          removeStructureItem={removeStructureItem}
          normalizeStructure={normalizeStructure}
          handleDrop={handleDrop}
          draggedItemIndex={draggedItemIndex}
          setDraggedItemIndex={setDraggedItemIndex}
          dragOverIndex={dragOverIndex}
          setDragOverIndex={setDragOverIndex}
          draggableSectionIndex={draggableSectionIndex}
          setDraggableSectionIndex={setDraggableSectionIndex}
        />
      </div>

      <SuggestionsPanel
        selectedLineId={selectedLineId}
        suggestions={suggestions}
        isSuggesting={isSuggesting}
        applySuggestion={applySuggestion}
        generateSuggestions={generateSuggestions}
        clearSelection={clearSelection}
      />

      <input
        type="file"
        ref={importInputRef}
        onChange={handleImportInputChange}
        accept=".txt,.md"
        style={{ display: 'none' }}
      />
      
      <VersionsModal 
        isOpen={isVersionsModalOpen} 
        onClose={() => setIsVersionsModalOpen(false)} 
        versions={versions} 
        onRollback={rollbackToVersion}
        currentSong={song}
        currentTitle={title}
        saveVersion={saveVersion}
      />

      <ResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={resetSong}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      <PasteModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        pastedText={pastedText}
        setPastedText={setPastedText}
        onAnalyze={() => analyzePastedLyrics(pastedText)}
        isAnalyzing={isAnalyzing}
      />

      <AnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        analysisReport={analysisReport}
        analysisSteps={analysisSteps}
        appliedAnalysisItems={appliedAnalysisItems}
        selectedAnalysisItems={selectedAnalysisItems}
        isApplyingAnalysis={isApplyingAnalysis}
        toggleAnalysisItemSelection={toggleAnalysisItemSelection}
        applySelectedAnalysisItems={applySelectedAnalysisItems}
        clearAppliedAnalysisItems={clearAppliedAnalysisItems}
        song={song}
      />

      <SimilarityModal
        isOpen={isSimilarityModalOpen}
        onClose={() => setIsSimilarityModalOpen(false)}
        matches={similarityMatches}
        candidateCount={versions.length}
      />

    </div>
    </FluentProvider>
  );
}
