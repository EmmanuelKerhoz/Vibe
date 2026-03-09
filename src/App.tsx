import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, RefreshCw, Music, Lightbulb, ClipboardPaste, Ruler, BarChart2, GripVertical, Waves, Volume2, Wand2, History, Bot, User, FileText, Layout, Languages, Globe } from 'lucide-react';
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
import { useTranslation, SUPPORTED_ADAPTATION_LANGUAGES, adaptationLanguageLabel } from './i18n';

export default function App() {
  const { t } = useTranslation();
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
    isGenerating, isGeneratingMusicalPrompt, selectedLineId, setSelectedLineId,
    suggestions, isSuggesting, generateSong, regenerateSection, quantizeSyllables,
    generateSuggestions, updateLineText, handleLineKeyDown, applySuggestion,
    generateMusicalPrompt, handleLineClick, handleInstructionChange,
    addInstruction, removeInstruction, clearSelection,
  } = useSongComposer({
    song, structure, topic, mood, rhymeScheme, targetSyllables, title,
    genre, tempo, instrumentation, setMusicalPrompt,
    updateState, updateSongWithHistory, updateSongAndStructureWithHistory, saveVersion,
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
  });

  const {
    removeStructureItem, addStructureItem, normalizeStructure, handleDrop,
    handleLineDragStart, handleLineDrop, exportTxt, exportMd, handleImport,
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

  const sectionCount = song.length;
  const wordCount = song.reduce((acc, sec) => acc + sec.lines.reduce((lAcc, line) => lAcc + line.text.split(/\s+/).filter(w => w.length > 0).length, 0), 0);
  const charCount = song.reduce((acc, sec) => acc + sec.lines.reduce((lAcc, line) => lAcc + line.text.length, 0), 0);

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
          title={title} setTitle={setTitle} topic={topic} setTopic={setTopic}
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
            handleImport={handleImport} exportTxt={exportTxt} exportMd={exportMd}
            isGenerating={isGenerating} isAnalyzing={isAnalyzing}
          />

          {activeTab === 'lyrics' && song.length > 0 && (
            <div className="border-b border-white/10 bg-white/[0.03] p-6 z-10 flex flex-col gap-4">
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
                        {t.editor.adaptGlobal}
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
                          <div><span>{t.editor.sectionTooltip.syllablesTarget}:</span> {section.targetSyllables !== undefined ? section.targetSyllables : targetSyllables}</div>
                          <div><span>{t.editor.sectionTooltip.rhymeScheme}:</span> {section.rhymeScheme || rhymeScheme}</div>
                        </div>
                      }>
                        <div onClick={() => scrollToSection(section)} className={`flex-shrink-0 px-3 py-1.5 border rounded-md text-[10px] flex items-center gap-2 transition-all hover:brightness-110 cursor-pointer ${getSectionColor(section.name)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getSectionDotColor(section.name)} shadow-[0_0_8px_rgba(0,0,0,0.2)]`}></span>
                          {section.name.toUpperCase()}
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip title={isMarkupMode ? t.tooltips.editorMode : t.tooltips.markupMode}>
                    <button onClick={handleMarkupToggle} disabled={!isMarkupMode && song.length === 0} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20 fluent-button whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                      {isMarkupMode ? <Layout className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                      {isMarkupMode ? t.editor.editorMode : t.editor.markupModeLabel}
                    </button>
                  </Tooltip>
                  <Tooltip title={t.tooltips.analyzeTheme}>
                    <button onClick={analyzeCurrentSong} disabled={isGenerating || isAnalyzing || song.length === 0} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20 fluent-button whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                      <BarChart2 className="w-3.5 h-3.5" />
                      {t.editor.analyze}
                    </button>
                  </Tooltip>
                  <Tooltip title={t.tooltips.regenerate}>
                    <button onClick={generateSong} disabled={isGenerating || isAnalyzing} className="px-4 py-2 bg-[var(--accent-color)] hover:brightness-110 text-[var(--on-accent-color)] text-xs rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--accent-color)]/20 fluent-button whitespace-nowrap">
                      {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {t.editor.regenerateGlobal}
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-8 z-10 custom-scrollbar">
            {activeTab === 'lyrics' ? (
              isMarkupMode ? (
                <div className="max-w-[1400px] mx-auto h-full flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center"><FileText className="w-4 h-4 text-zinc-400" /></div>
                      <div><h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{t.editor.markupMode.title}</h3><p className="text-[10px] text-zinc-500">{t.editor.markupMode.description}</p></div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg"><Lightbulb className="w-3.5 h-3.5 text-amber-500" /><p className="text-[10px] text-amber-500 font-medium">{t.editor.markupMode.hint}</p></div>
                  </div>
                  <div className="flex-1 min-h-[600px] mb-6">
                    <MarkupInput textareaRef={markupTextareaRef} value={markupText} onChange={(e: any) => setMarkupText(e.target.value)} className="w-full h-full bg-zinc-900/50 dark:bg-black/50 border border-white/10 rounded-xl text-sm font-mono custom-scrollbar resize-none leading-relaxed" placeholder={t.editor.markupMode.placeholder} onScroll={(e: any) => { const overlay = e.target.previousSibling; if (overlay) overlay.scrollTop = e.target.scrollTop; }} />
                  </div>
                </div>
              ) : song.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-5 p-8 border border-white/5 bg-white/[0.02] lcars-panel fluent-animate-in max-w-2xl mx-auto my-auto mt-20">
                  <div className="w-20 h-20 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-center shadow-2xl"><Music className="w-10 h-10 text-zinc-800" /></div>
                  <div className="text-center space-y-2"><p className="text-sm text-zinc-400">{t.editor.emptyState.title}</p><p className="text-xs text-zinc-600 max-w-xs mx-auto">{t.editor.emptyState.description}</p></div>
                  <div className="flex items-center gap-4 w-full max-w-2xl">
                    {hasSavedSession && <Tooltip title={t.tooltips.loadSession}><Button onClick={loadSavedSession} variant="outlined" color="success" startIcon={<History className="w-4 h-4" />} style={{ flex: 1, padding: '12px 0' }}>{t.editor.emptyState.loadSession}</Button></Tooltip>}
                    <Tooltip title={t.tooltips.pasteLyrics}><Button onClick={() => setIsPasteModalOpen(true)} variant="outlined" color="secondary" startIcon={<ClipboardPaste className="w-4 h-4" />} style={{ flex: 1, padding: '12px 0' }}>{t.editor.emptyState.pasteLyrics}</Button></Tooltip>
                    <Tooltip title={t.tooltips.generateSong}><Button onClick={generateSong} disabled={isGenerating || isAnalyzing} variant="contained" color="primary" startIcon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} style={{ flex: 1, padding: '12px 0' }}>{t.editor.emptyState.generateSong}</Button></Tooltip>
                  </div>
                </div>
              ) : (
                <div className="max-w-[1400px] mx-auto space-y-6 pb-32">
                  {song.map((section, idx) => (
                    <div key={section.id} id={`section-${section.id}`} className={`lcars-band transition-all fluent-animate-in relative group ${draggedItemIndex === idx ? 'opacity-30' : ''} ${dragOverIndex === idx && dragOverIndex !== draggedItemIndex ? 'border-t-2 border-[var(--accent-color)] pt-3 -mt-1' : ''}`} style={{ animationDelay: `${idx * 0.05}s` }} draggable={draggableSectionIndex === idx && !(section.name.toLowerCase() === 'intro' || section.name.toLowerCase() === 'outro')} onDragStart={() => { setDraggedItemIndex(idx); }} onDragOver={(e) => { e.preventDefault(); if (draggedItemIndex === null || draggedItemIndex === idx) return; if (idx === 0 && song[0].name.toLowerCase() === 'intro') return; if (idx === song.length - 1 && song[song.length - 1].name.toLowerCase() === 'outro') return; setDragOverIndex(idx); }} onDragLeave={() => setDragOverIndex(null)} onDrop={(e) => { e.stopPropagation(); handleDrop(idx); }}>
                      <div className={`lcars-band-stripe ${getSectionDotColor(section.name)}`} />
                      <div className="flex-1 space-y-4 p-5">
                        <div className="flex items-center gap-3 flex-wrap pb-2 border-b border-black/5 dark:border-white/10">
                          <h3 className={`text-lg tracking-tight uppercase ${getSectionTextColor(section.name)}`}>{section.name}</h3>
                          <div className="w-28">
                            <Select value={section.rhymeScheme || rhymeScheme} onChange={(e) => { const val = e.target.value; updateSongInHistory(currentSong => currentSong.map(s => s.id === section.id ? { ...s, rhymeScheme: val } : s)); }} className="!py-0 !px-2 !text-[10px] h-7" style={{ minHeight: '28px', height: '28px' }}>
                              {RHYME_KEYS.map(k => <MenuItem key={k} value={k}>{t.rhymeSchemes[k]}</MenuItem>)}
                            </Select>
                          </div>
                          <div className="w-32">
                            <Input value={section.mood || ''} onChange={(e) => { const val = e.target.value; updateSongInHistory(currentSong => currentSong.map(s => s.id === section.id ? { ...s, mood: val } : s)); }} placeholder={t.editor.moodPlaceholder} list="mood-suggestions" className="!py-0 !px-2 !text-[10px] h-7" style={{ minHeight: '28px', height: '28px' }} />
                          </div>
                          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded px-1 h-7">
                            <Globe className="w-3 h-3 text-zinc-500" />
                            <Select value={sectionTargetLanguages[section.id] || section.language || songLanguage} onChange={(e: any) => setSectionTargetLanguages(prev => ({ ...prev, [section.id]: e.target.value as string }))} style={{ height: 20, fontSize: '9px', color: 'var(--colorNeutralForeground2)', minWidth: 45 }}>
                              {SUPPORTED_ADAPTATION_LANGUAGES.map(lang => (
                                <MenuItem key={lang.code} value={lang.aiName} style={{ fontSize: '9px' }}>{lang.code}</MenuItem>
                              ))}
                            </Select>
                            <Tooltip title={t.tooltips.sectionAdapt}><button onClick={() => adaptSectionLanguage(section.id, sectionTargetLanguages[section.id] || section.language || songLanguage)} disabled={isAdaptingLanguage} className="px-1.5 py-0.5 bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/20 text-[var(--accent-color)] text-[8px] font-bold rounded transition-all disabled:opacity-50">{t.editor.adaptSection}</button></Tooltip>
                          </div>
                          <Tooltip title={t.tooltips.regenerateSection}><Button onClick={() => regenerateSection(section.id)} disabled={isGenerating} variant="outlined" color="success" size="small" startIcon={<RefreshCw className="w-3 h-3" />} style={{ minHeight: '28px', height: '28px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.editor.regenerateSection}</Button></Tooltip>
                          <div className="flex items-center gap-4 ml-auto flex-wrap sm:flex-nowrap">
                            <div className="flex items-center gap-2 shrink-0">
                              <input type="checkbox" id={`local-syllables-${section.id}`} checked={section.targetSyllables !== undefined} onChange={(e) => { const enabled = e.target.checked; updateSongInHistory(currentSong => currentSong.map(s => s.id === section.id ? { ...s, targetSyllables: enabled ? targetSyllables : undefined } : s)); }} className="accent-[var(--accent-color)] cursor-pointer w-3.5 h-3.5" />
                              <label htmlFor={`local-syllables-${section.id}`} className="micro-label text-zinc-500 cursor-pointer whitespace-nowrap">{t.editor.syllables} {section.targetSyllables !== undefined ? `(${section.targetSyllables})` : `(${targetSyllables})`}</label>
                            </div>
                            {section.targetSyllables !== undefined && <div className="flex items-center w-20 shrink-0"><input type="range" min="4" max="20" value={section.targetSyllables} onChange={e => { const val = parseInt(e.target.value); updateSongInHistory(currentSong => currentSong.map(s => s.id === section.id ? { ...s, targetSyllables: val } : s)); }} className="w-full accent-[var(--accent-color)] h-1 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer" /></div>}
                            <Tooltip title={t.tooltips.quantizeSection}><Button onClick={() => quantizeSyllables(section.id)} disabled={isGenerating} variant="outlined" color="primary" size="small" startIcon={<Ruler className="w-3 h-3" />} style={{ minHeight: '28px', height: '28px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>{t.editor.quantize}</Button></Tooltip>
                          </div>
                        </div>
                        <div className="space-y-1.5 px-2">
                          <div className="mb-4"><InstructionEditor instructions={section.preInstructions} sectionId={section.id} type="pre" onChange={handleInstructionChange} onAdd={addInstruction} onRemove={removeInstruction} /></div>
                          <div className="grid grid-cols-[1fr_100px_80px_60px_100px] gap-x-4 mb-2"><div className="micro-label text-zinc-500 dark:text-zinc-600 ml-1">{t.editor.lyricLine}</div><div className="micro-label text-zinc-500 dark:text-zinc-600 text-center">{t.editor.rhymeSyllable}</div><div className="micro-label text-zinc-500 dark:text-zinc-600 text-center">{t.editor.rhyme}</div><div className="micro-label text-zinc-500 dark:text-zinc-600 text-center">{t.editor.syllables}</div><div className="micro-label text-zinc-500 dark:text-zinc-600">{t.editor.concept}</div></div>
                          {section.lines.map((line) => (
                            <div key={line.id} draggable onDragStart={() => handleLineDragStart(section.id, line.id)} onDragOver={(e) => { e.preventDefault(); setDragOverLineInfo({ sectionId: section.id, lineId: line.id }); }} onDragLeave={() => setDragOverLineInfo(null)} onDrop={(e) => { e.stopPropagation(); handleLineDrop(section.id, line.id); }} className={`grid grid-cols-[1fr_100px_80px_60px_100px] gap-x-4 items-center transition-all ${draggedLineInfo?.lineId === line.id ? 'opacity-30' : ''} ${dragOverLineInfo?.lineId === line.id && dragOverLineInfo?.lineId !== draggedLineInfo?.lineId ? 'border-t-2 border-[var(--accent-color)] pt-2 -mt-2' : ''}`}>
                              <div className="flex items-center gap-2">
                                <GripVertical className="w-4 h-4 text-zinc-600 cursor-grab active:cursor-grabbing hover:text-zinc-800 dark:hover:text-zinc-400 transition-colors shrink-0" />
                                {line.isManual ? <User className="w-4 h-4 text-[var(--accent-color)]/70 shrink-0" /> : <Bot className="w-4 h-4 text-[var(--accent-color)]/70 shrink-0" />}
                                <div onClick={() => handleLineClick(line.id)} className={`relative group cursor-text transition-all flex-1 ${selectedLineId === line.id ? 'z-20' : ''}`}>
                                  <LyricInput data-line-id={line.id} value={line.text} onChange={(e: any) => updateLineText(section.id, line.id, e.target.value)} onKeyDown={(e: any) => handleLineKeyDown(e, section.id, line.id)} className={`w-full bg-transparent py-1.5 text-sm transition-all focus:outline-none ${selectedLineId === line.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`} />
                                  {selectedLineId === line.id && <div className="absolute -left-[6px] top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--accent-color)] rounded-full shadow-[0_0_12px_var(--accent-color)]" />}
                                </div>
                              </div>
                              <div className="flex items-center justify-center"><input value={line.rhymingSyllables || ''} onChange={(e) => { const val = e.target.value; updateSongInHistory(currentSong => currentSong.map(s => ({ ...s, lines: s.lines.map(l => l.id === line.id ? { ...l, rhymingSyllables: val } : l) }))); }} className="w-full bg-transparent text-[10px] text-center text-zinc-500 dark:text-zinc-400 focus:outline-none focus:text-zinc-900 dark:focus:text-white transition-colors" placeholder="-" /></div>
                              <div className="flex items-center justify-center"><input value={line.rhyme || ''} onChange={(e) => { const val = e.target.value.toUpperCase().slice(0, 1); updateSongInHistory(currentSong => currentSong.map(s => ({ ...s, lines: s.lines.map(l => l.id === line.id ? { ...l, rhyme: val } : l) }))); }} className={`w-7 h-7 rounded border text-[10px] telemetry-text text-center transition-all focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] ${getRhymeColor(line.rhyme)}`} placeholder="-" /></div>
                              <div className="flex items-center justify-center"><div className={`text-xs telemetry-text transition-colors ${line.syllables > targetSyllables ? 'text-[var(--accent-critical)]' : line.syllables < targetSyllables ? 'text-[var(--accent-warning)]' : 'text-[var(--accent-color)]'}`}>{line.syllables}</div></div>
                              <div className="flex items-center"><div className="text-[10px] text-zinc-500 italic truncate group-hover:text-zinc-800 dark:group-hover:text-zinc-400 transition-colors">{line.concept}</div></div>
                            </div>
                          ))}
                          <div className="flex items-center gap-4 mt-4 pt-2 border-t border-black/5 dark:border-white/5 micro-label text-zinc-500"><div className="flex items-center gap-1"><span className="text-zinc-400">{t.editor.lines}:</span><span className="font-mono">{section.lines.length}</span></div><div className="flex items-center gap-1"><span className="text-zinc-400">{t.insights.words}:</span><span className="font-mono">{section.lines.reduce((acc, l) => acc + (l.text.trim() ? l.text.trim().split(/\s+/).length : 0), 0)}</span></div><div className="flex items-center gap-1"><span className="text-zinc-400">{t.editor.chars}:</span><span className="font-mono">{section.lines.reduce((acc, l) => acc + l.text.length, 0)}</span></div></div>
                          <InstructionEditor instructions={section.postInstructions} sectionId={section.id} type="post" onChange={handleInstructionChange} onAdd={addInstruction} onRemove={removeInstruction} />
                        </div>
                      </div>
                      {!(section.name.toLowerCase() === 'intro' || section.name.toLowerCase() === 'outro') ? <div className="w-8 flex-shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing section-drag-handle hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-l border-black/5 dark:border-white/5" onMouseEnter={() => setDraggableSectionIndex(idx)} onMouseLeave={() => setDraggableSectionIndex(null)}><GripVertical className="w-4 h-4 text-zinc-400 opacity-50 group-hover:opacity-100 transition-opacity" /></div> : <div className="w-8 flex-shrink-0 border-l border-black/5 dark:border-white/5" />}
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="max-w-4xl mx-auto space-y-12 pb-32 p-8 border border-white/5 bg-white/[0.02] lcars-panel fluent-animate-in">
                <div className="flex items-center gap-4 mb-8"><div className="w-12 h-12 rounded-xl bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center"><Waves className="w-6 h-6 text-[var(--accent-color)]" /></div><div><h2 className="text-xl text-primary">{t.musical.title}</h2><p className="text-sm text-zinc-500">{t.musical.description}</p></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div><Label>{t.musical.genre}</Label><Input value={genre} onChange={e => setGenre(e.target.value)} placeholder={t.musical.genrePlaceholder} /></div>
                    <div><Label>{t.musical.tempo}</Label><div className="flex items-center gap-4"><input type="range" min="40" max="220" value={tempo} onChange={e => setTempo(e.target.value)} className="flex-1 accent-[var(--accent-color)] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer" /><span className="text-sm telemetry-text text-[var(--accent-color)] w-12 text-center">{tempo}</span></div></div>
                    <div><Label>{t.musical.instrumentation}</Label><textarea value={instrumentation} onChange={e => setInstrumentation(e.target.value)} className="w-full bg-white/5 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-lg p-3 text-sm text-zinc-800 dark:text-zinc-300 focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:border-[var(--accent-color)] outline-none transition-all min-h-[100px]" placeholder={t.musical.instrumentationPlaceholder} /></div>
                    <Tooltip title={t.tooltips.generateMusical}>
                      <Button onClick={generateMusicalPrompt} disabled={isGeneratingMusicalPrompt || (!title && !topic)} variant="contained" color="primary" fullWidth startIcon={isGeneratingMusicalPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} style={{ padding: '12px 0' }}>{t.musical.generatePrompt}</Button>
                    </Tooltip>
                  </div>
                  <div className="space-y-4">
                    <Label>{t.musical.promptLabel}</Label>
                    <div className="relative group"><div className="w-full bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/5 rounded-xl p-6 min-h-[300px] text-sm text-zinc-800 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-serif italic">{musicalPrompt || t.musical.promptPlaceholder}</div>{musicalPrompt && <button onClick={() => { navigator.clipboard.writeText(musicalPrompt); }} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Copy to clipboard"><ClipboardPaste className="w-4 h-4 text-zinc-400" /></button>}</div>
                    <div className="flex items-center gap-2 micro-label text-zinc-500"><Volume2 className="w-3 h-3" />{t.musical.optimizedFor}</div>
                  </div>
                </div>
              </div>
            )}
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

      <VersionsModal isOpen={isVersionsModalOpen} versions={versions} onClose={() => setIsVersionsModalOpen(false)} onSaveCurrent={() => { const name = prompt('Enter version name:'); if (name !== null) saveVersion(name); }} onRollback={rollbackToVersion} />
      <ResetModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onConfirm={resetSong} />
    </div>
    </FluentProvider>
  );
}
