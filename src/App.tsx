import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Check, X, Loader2, RefreshCw, Music, AlignLeft, Hash, Lightbulb, ClipboardPaste, Undo2, Redo2, Ruler, BarChart2, Trash2, GripVertical, Download, Upload, Sun, Moon, Plus, ChevronDown, PanelRight, PanelLeft, ChevronRight, Waves, Mic, Volume2, VolumeX, Wand2, History, Bot, User, FileText, Layout, BookOpen, Activity, CheckCircle2, Target, Languages, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';

import { Section, SongVersion } from './types';
import { APP_VERSION } from './version';
import { DEFAULT_STRUCTURE } from './constants/editor';
import { cleanSectionName, getSectionColor, getSectionTextColor, getSectionDotColor, getRhymeColor, countSyllables } from './utils/songUtils';
import { generateId } from './utils/idUtils';
import { useAudioFeedback } from './hooks/useAudioFeedback';
import { useSongAnalysis } from './hooks/useSongAnalysis';
import { useSongEditor } from './hooks/useSongEditor';
import { useSongComposer } from './hooks/useSongComposer';
import { useSongHistoryState } from './hooks/useSongHistoryState';
import { Label } from './components/ui/Label';
import { Input } from './components/ui/Input';
import { Select } from './components/ui/Select';
import { Button } from './components/ui/Button';
import { Tooltip } from './components/ui/Tooltip';
import { MenuItem } from './components/ui/MenuItem';
import { IconButton } from './components/ui/IconButton';
import { LyricInput } from './components/editor/LyricInput';
import { MarkupInput } from './components/editor/MarkupInput';
import { InstructionEditor } from './components/editor/InstructionEditor';
import { VersionsModal } from './components/modals/VersionsModal';
import { ResetModal } from './components/modals/ResetModal';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  const [title, setTitle] = useState('Untitled Song');
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
    song,
    structure,
    past,
    future,
    updateState,
    updateSongWithHistory,
    updateStructureWithHistory,
    updateSongAndStructureWithHistory,
    replaceStateWithoutHistory,
    clearHistory,
    undo,
    redo,
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
    alert('Gemini backend unavailable. Set GEMINI_API_KEY in your Vercel project environment variables (Settings → Environment Variables) and redeploy.');
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
        song,
        structure,
        title,
        topic,
        mood,
        rhymeScheme,
        targetSyllables,
        genre,
        tempo,
        instrumentation,
        musicalPrompt
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
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);
  
  const [versions, setVersions] = useState<SongVersion[]>([]);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const resetSong = () => {
    updateSongAndStructureWithHistory([], DEFAULT_STRUCTURE);
    clearSelection();
    setIsResetModalOpen(false);
  };

  const saveVersion = (name: string) => {
    const newVersion: SongVersion = {
      id: generateId(),
      timestamp: Date.now(),
      song: JSON.parse(JSON.stringify(song)),
      topic,
      mood,
      name: name || `Version ${versions.length + 1}`,
    };
    setVersions(prev => [newVersion, ...prev]);
  };

  const rollbackToVersion = (version: SongVersion) => {
    updateSongAndStructureWithHistory(version.song, version.song.map(s => s.name));
    setTopic(version.topic);
    setMood(version.mood);
    setIsVersionsModalOpen(false);
  };

  const {
    isGenerating,
    isGeneratingMusicalPrompt,
    selectedLineId,
    setSelectedLineId,
    suggestions,
    isSuggesting,
    generateSong,
    regenerateSection,
    quantizeSyllables,
    generateSuggestions,
    updateLineText,
    handleLineKeyDown,
    applySuggestion,
    generateMusicalPrompt,
    handleLineClick,
    handleInstructionChange,
    addInstruction,
    removeInstruction,
    clearSelection,
  } = useSongComposer({
    song,
    structure,
    topic,
    mood,
    rhymeScheme,
    targetSyllables,
    title,
    genre,
    tempo,
    instrumentation,
    setMusicalPrompt,
    updateState,
    updateSongWithHistory,
    updateSongAndStructureWithHistory,
    saveVersion,
  });

  const {
    isPasteModalOpen,
    setIsPasteModalOpen,
    pastedText,
    setPastedText,
    isAnalyzing,
    isAnalysisModalOpen,
    setIsAnalysisModalOpen,
    analysisReport,
    analysisSteps,
    appliedAnalysisItems,
    selectedAnalysisItems,
    isApplyingAnalysis,
    isAnalyzingTheme,
    songLanguage,
    targetLanguage,
    setTargetLanguage,
    sectionTargetLanguages,
    setSectionTargetLanguages,
    isDetectingLanguage,
    isAdaptingLanguage,
    toggleAnalysisItemSelection,
    applySelectedAnalysisItems,
    applyAnalysisItem,
    analyzeCurrentSong,
    detectLanguage,
    adaptSongLanguage,
    adaptSectionLanguage,
    analyzePastedLyrics,
    clearAppliedAnalysisItems,
  } = useSongAnalysis({
    song,
    topic,
    mood,
    rhymeScheme,
    setTopic,
    setMood,
    saveVersion,
    updateState,
    updateSongWithHistory,
    updateSongAndStructureWithHistory,
    clearLineSelection: clearSelection,
  });

  const {
    removeStructureItem,
    addStructureItem,
    normalizeStructure,
    handleDrop,
    handleLineDragStart,
    handleLineDrop,
    exportTxt,
    exportMd,
    handleImport,
  } = useSongEditor({
    song,
    structure,
    newSectionName,
    setNewSectionName,
    draggedItemIndex,
    setDraggedItemIndex,
    setDragOverIndex,
    draggedLineInfo,
    setDraggedLineInfo,
    setDragOverLineInfo,
    updateState,
    updateSongWithHistory,
    updateStructureWithHistory,
    updateSongAndStructureWithHistory,
    title,
    topic,
    mood,
    openPasteModalWithText: (text: string) => {
      setPastedText(text);
      setIsPasteModalOpen(true);
    },
    playAudioFeedback,
  });

  const sectionCount = song.length;
  const wordCount = song.reduce((acc, sec) => acc + sec.lines.reduce((lAcc, line) => lAcc + line.text.split(/\s+/).filter(w => w.length > 0).length, 0), 0);
  const charCount = song.reduce((acc, sec) => acc + sec.lines.reduce((lAcc, line) => lAcc + line.text.length, 0), 0);

  return (
    <FluentProvider theme={theme === 'dark' ? webDarkTheme : webLightTheme} style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }}>
    <div className={`h-screen w-full bg-fluent-bg text-zinc-400 flex flex-col overflow-hidden font-sans selection:bg-[var(--accent-color)]/30 ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="flex-1 flex overflow-hidden">
        <div className={`border-r border-fluent-border bg-fluent-sidebar flex flex-col z-10 shadow-2xl transition-all duration-300 ease-in-out flex-shrink-0 lcars-panel !rounded-none ${isLeftPanelOpen ? 'w-80' : 'w-0 overflow-hidden border-r-0'}`}>
          <div className="w-80 flex flex-col h-full">
            <div className="h-16 px-5 border-b border-fluent-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center shadow-inner">
                  <Music className="w-4.5 h-4.5 text-[var(--accent-color)]" />
                </div>
                <h1 className="text-base text-primary tracking-tight">
                  Lyricist Pro
                </h1>
              </div>
            </div>
            <div className="p-5 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <Label>Song Title</Label>
                  <Input value={title} onChange={(e: any) => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label>Topic</Label>
                  <Input value={topic} onChange={(e: any) => setTopic(e.target.value)} />
                </div>
                <div>
                  <Label>Mood</Label>
                  <Input value={mood} onChange={(e: any) => setMood(e.target.value)} />
                </div>
                <div>
                  <Label>Rhyme</Label>
                  <Input value={rhymeScheme} onChange={(e: any) => setRhymeScheme(e.target.value)} />
                </div>
                <div>
                  <Label>Syllables</Label>
                  <Input type="number" value={targetSyllables} onChange={(e: any) => setTargetSyllables(Number(e.target.value) || 0)} />
                </div>
                <Button onClick={generateSong} disabled={isGenerating} variant="contained" fullWidth>
                  {isGenerating ? 'Generating…' : 'Generate Song'}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3 p-8">
            <h2 className="text-xl text-primary">Lyricist Pro UI restored</h2>
            <p className="text-sm text-zinc-500">Core screen is back. Advanced panels remain wired through hooks/components.</p>
            <div className="text-xs text-zinc-600">Sections: {sectionCount} · Words: {wordCount} · Chars: {charCount} · Version: {APP_VERSION}</div>
          </div>
        </div>
      </div>
      <VersionsModal
        isOpen={isVersionsModalOpen}
        versions={versions}
        onClose={() => setIsVersionsModalOpen(false)}
        onSaveCurrent={() => {
          const name = prompt('Enter version name:');
          if (name !== null) saveVersion(name);
        }}
        onRollback={rollbackToVersion}
      />
      <ResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={resetSong}
      />
    </div>
    </FluentProvider>
  );
}
