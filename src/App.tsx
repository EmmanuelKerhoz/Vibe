import React, { useState, useEffect, useRef } from 'react';
import { Music, Plus, Sparkles, Sun, Moon, ChevronDown, GripVertical, Upload, Download, Undo2, Redo2, Trash2, History, Wand2 } from 'lucide-react';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';

import { Section, SongVersion } from './types';
import { APP_VERSION } from './version';
import { DEFAULT_STRUCTURE } from './constants/editor';
import { cleanSectionName, getSectionTextColor, countSyllables } from './utils/songUtils';
import { generateId } from './utils/idUtils';
import { useAudioFeedback } from './hooks/useAudioFeedback';
import { useSongAnalysis } from './hooks/useSongAnalysis';
import { useSongEditor } from './hooks/useSongEditor';
import { useSongComposer } from './hooks/useSongComposer';
import { useSongHistoryState } from './hooks/useSongHistoryState';
import { Label } from './components/ui/Label';
import { Input } from './components/ui/Input';
import { Button } from './components/ui/Button';
import { LyricInput } from './components/editor/LyricInput';
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
  const [draggedLineInfo, setDraggedLineInfo] = useState<{ sectionId: string; lineId: string } | null>(null);
  const [dragOverLineInfo, setDragOverLineInfo] = useState<{ sectionId: string; lineId: string } | null>(null);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [versions, setVersions] = useState<SongVersion[]>([]);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    song,
    structure,
    updateState,
    updateSongWithHistory,
    updateStructureWithHistory,
    updateSongAndStructureWithHistory,
    replaceStateWithoutHistory,
    clearHistory,
    undo,
    redo,
    past,
    future,
  } = useSongHistoryState([], DEFAULT_STRUCTURE);

  useEffect(() => {
    fetch('/api/status')
      .then(r => r.json())
      .then((data: { available?: boolean }) => setHasApiKey(data.available === true))
      .catch(() => setHasApiKey(false));
  }, []);

  useEffect(() => {
    const savedSession = localStorage.getItem('lyricist_session');
    if (!savedSession) return;
    try {
      const parsed = JSON.parse(savedSession);
      if (parsed.song && parsed.song.length > 0) {
        const cleanedSong = parsed.song.map((s: any) => ({ ...s, name: cleanSectionName(s.name) }));
        const nextStructure = cleanedSong.map((s: any) => s.name);
        replaceStateWithoutHistory(cleanedSong, nextStructure);
        setTitle(parsed.title || 'Untitled Song');
        setTopic(parsed.topic || '');
        setMood(parsed.mood || '');
        setRhymeScheme(parsed.rhymeScheme || 'AABB');
        setTargetSyllables(parsed.targetSyllables || 10);
        setHasSavedSession(true);
        clearHistory();
      }
    } catch (e) {
      console.error('Failed to load saved session', e);
    }
  }, []);

  useEffect(() => {
    if (song.length === 0) return;
    const payload = { song, structure, title, topic, mood, rhymeScheme, targetSyllables };
    localStorage.setItem('lyricist_session', JSON.stringify(payload));
    setHasSavedSession(true);
  }, [song, structure, title, topic, mood, rhymeScheme, targetSyllables]);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

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

  const { playAudioFeedback } = useAudioFeedback(audioFeedback);

  const {
    isGenerating,
    selectedLineId,
    suggestions,
    isSuggesting,
    generateSong,
    regenerateSection,
    quantizeSyllables,
    updateLineText,
    handleLineKeyDown,
    applySuggestion,
    handleLineClick,
    clearSelection,
  } = useSongComposer({
    song,
    structure,
    topic,
    mood,
    rhymeScheme,
    targetSyllables,
    title,
    genre: '',
    tempo: '120',
    instrumentation: '',
    setMusicalPrompt: () => {},
    updateState,
    updateSongWithHistory,
    updateSongAndStructureWithHistory,
    saveVersion,
  });

  const { analyzeCurrentSong } = useSongAnalysis({
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
    addStructureItem,
    removeStructureItem,
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
    openPasteModalWithText: () => {},
    playAudioFeedback,
  });

  const resetSong = () => {
    updateSongAndStructureWithHistory([], DEFAULT_STRUCTURE);
    clearSelection();
    setIsResetModalOpen(false);
  };

  const rollbackToVersion = (version: SongVersion) => {
    updateSongAndStructureWithHistory(version.song, version.song.map(s => s.name));
    setTopic(version.topic);
    setMood(version.mood);
    setIsVersionsModalOpen(false);
  };

  const addEmptyLine = (sectionId: string) => {
    updateState(current => ({
      song: current.song.map(section => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          lines: [...section.lines, { id: generateId(), text: '', rhymingSyllables: '', rhyme: '', syllables: 0, concept: 'New line', isManual: true }],
        };
      }),
      structure: current.structure,
    }));
  };

  const sectionCount = song.length;
  const lineCount = song.reduce((acc, section) => acc + section.lines.length, 0);
  const wordCount = song.reduce((acc, section) => acc + section.lines.reduce((inner, line) => inner + line.text.split(/\s+/).filter(Boolean).length, 0), 0);

  return (
    <FluentProvider theme={theme === 'dark' ? webDarkTheme : webLightTheme} style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }}>
      <div className={`h-screen w-full bg-fluent-bg text-zinc-400 flex overflow-hidden font-sans ${theme === 'dark' ? 'dark' : ''}`}>
        <aside className={`transition-all duration-300 border-r border-fluent-border bg-fluent-sidebar ${isLeftPanelOpen ? 'w-80' : 'w-0 overflow-hidden border-r-0'}`}>
          <div className="w-80 h-full flex flex-col">
            <div className="h-16 px-5 border-b border-fluent-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center">
                  <Music className="w-4.5 h-4.5 text-[var(--accent-color)]" />
                </div>
                <div>
                  <div className="text-base text-primary">Lyricist Pro</div>
                  <div className="text-[10px] text-zinc-500">v{APP_VERSION}</div>
                </div>
              </div>
              <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-5">
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
                <Label>Rhyme Scheme</Label>
                <Input value={rhymeScheme} onChange={(e: any) => setRhymeScheme(e.target.value)} />
              </div>
              <div>
                <Label>Target Syllables</Label>
                <Input type="number" value={targetSyllables} onChange={(e: any) => setTargetSyllables(Number(e.target.value) || 0)} />
              </div>

              {!hasApiKey && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
                  Gemini backend unavailable. Configure GEMINI_API_KEY on Vercel, then redeploy.
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={generateSong} disabled={isGenerating || !hasApiKey} variant="contained">
                  {isGenerating ? 'Generating…' : 'Generate'}
                </Button>
                <Button onClick={analyzeCurrentSong} disabled={song.length === 0 || !hasApiKey} variant="outlined">
                  Analyze
                </Button>
                <Button onClick={() => quantizeSyllables()} disabled={song.length === 0 || !hasApiKey} variant="outlined">
                  Quantize
                </Button>
                <Button onClick={() => setIsVersionsModalOpen(true)} variant="outlined">
                  Versions
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={undo} disabled={past.length === 0} variant="text" startIcon={<Undo2 className="w-4 h-4" />}>
                  Undo
                </Button>
                <Button onClick={redo} disabled={future.length === 0} variant="text" startIcon={<Redo2 className="w-4 h-4" />}>
                  Redo
                </Button>
                <Button onClick={exportTxt} disabled={song.length === 0} variant="text" startIcon={<Download className="w-4 h-4" />}>
                  TXT
                </Button>
                <Button onClick={exportMd} disabled={song.length === 0} variant="text" startIcon={<Download className="w-4 h-4" />}>
                  MD
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => fileInputRef.current?.click()} variant="text" startIcon={<Upload className="w-4 h-4" />}>
                  Import
                </Button>
                <Button onClick={() => setIsResetModalOpen(true)} disabled={song.length === 0} variant="text" startIcon={<Trash2 className="w-4 h-4" />}>
                  Reset
                </Button>
              </div>

              <input ref={fileInputRef} type="file" accept=".txt,.md" className="hidden" onChange={handleImport} />

              <div className="pt-2 border-t border-fluent-border">
                <Label>Structure</Label>
                <div className="space-y-2">
                  {structure.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      draggable
                      onDragStart={() => setDraggedItemIndex(index)}
                      onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
                      onDrop={() => handleDrop(index)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${dragOverIndex === index ? 'border-[var(--accent-color)]/40 bg-[var(--accent-color)]/10' : 'border-white/10 bg-white/[0.02]'}`}
                    >
                      <GripVertical className="w-4 h-4 text-zinc-500" />
                      <span className="flex-1">{item}</span>
                      <button onClick={() => removeStructureItem(index)} className="text-zinc-500 hover:text-red-400">×</button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Input value={newSectionName} onChange={(e: any) => setNewSectionName(e.target.value)} placeholder="Verse / Chorus / Bridge" />
                  <Button onClick={() => addStructureItem()} variant="outlined" startIcon={<Plus className="w-4 h-4" />}>
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <div className="h-16 border-b border-fluent-border px-5 flex items-center justify-between bg-fluent-sidebar">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => setIsLeftPanelOpen(v => !v)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <ChevronDown className={`w-4 h-4 transition-transform ${isLeftPanelOpen ? '' : '-rotate-90'}`} />
              </button>
              <div className="min-w-0">
                <div className="text-sm text-primary truncate">{title}</div>
                <div className="text-[11px] text-zinc-500 truncate">{topic || 'No topic'} • {mood || 'No mood'}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-zinc-500">
              <span>{sectionCount} sections</span>
              <span>{lineCount} lines</span>
              <span>{wordCount} words</span>
              {hasSavedSession && <span>saved</span>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {song.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-xl space-y-4">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center">
                    <Music className="w-6 h-6 text-[var(--accent-color)]" />
                  </div>
                  <h2 className="text-xl text-primary">Ready to write</h2>
                  <p className="text-sm text-zinc-500">Generate a song or build the structure manually, then edit lyrics line by line.</p>
                  <Button onClick={generateSong} disabled={isGenerating || !hasApiKey} variant="contained" startIcon={<Sparkles className="w-4 h-4" />}>
                    {isGenerating ? 'Generating…' : 'Generate first draft'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {song.map((section: Section) => (
                  <section key={section.id} className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
                      <div>
                        <h3 className={`text-sm font-semibold ${getSectionTextColor(section.name)}`}>{section.name}</h3>
                        <div className="text-[11px] text-zinc-500">
                          {section.lines.length} lines • scheme {section.rhymeScheme || rhymeScheme}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button onClick={() => regenerateSection(section.id)} disabled={!hasApiKey || isGenerating} variant="text" startIcon={<Wand2 className="w-4 h-4" />}>
                          Rewrite
                        </Button>
                        <Button onClick={() => quantizeSyllables(section.id)} disabled={!hasApiKey || isGenerating} variant="text">
                          Fit meter
                        </Button>
                        <Button onClick={() => addEmptyLine(section.id)} variant="text" startIcon={<Plus className="w-4 h-4" />}>
                          Line
                        </Button>
                      </div>
                    </div>

                    <div className="divide-y divide-white/5">
                      {section.lines.map((line) => (
                        <div
                          key={line.id}
                          className={`grid grid-cols-[56px_1fr_70px_70px] gap-3 px-4 py-3 items-center ${selectedLineId === line.id ? 'bg-[var(--accent-color)]/6' : ''}`}
                          draggable
                          onDragStart={() => handleLineDragStart(section.id, line.id)}
                          onDragOver={(e) => { e.preventDefault(); setDragOverLineInfo({ sectionId: section.id, lineId: line.id }); }}
                          onDrop={() => handleLineDrop(section.id, line.id)}
                        >
                          <div className="text-[11px] text-zinc-500">{line.rhyme || '—'}</div>
                          <div onClick={() => handleLineClick(line.id)}>
                            <LyricInput
                              data-line-id={line.id}
                              value={line.text}
                              onChange={(e: any) => updateLineText(section.id, line.id, e.target.value)}
                              onKeyDown={(e: any) => handleLineKeyDown(e, section.id, line.id)}
                              className="text-sm text-zinc-200"
                              placeholder="Write a lyric line"
                            />
                          </div>
                          <div className="text-[11px] text-zinc-500 text-right">{line.syllables ?? countSyllables(line.text)}</div>
                          <div className="text-[11px] text-zinc-500 text-right truncate">{line.concept || '—'}</div>
                        </div>
                      ))}
                    </div>

                    {selectedLineId && section.lines.some(l => l.id === selectedLineId) && (
                      <div className="border-t border-white/10 bg-black/10 p-4">
                        <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-2">Suggestions</div>
                        {isSuggesting ? (
                          <div className="text-sm text-zinc-500">Generating suggestions…</div>
                        ) : suggestions.length === 0 ? (
                          <div className="text-sm text-zinc-500">Select a line to receive alternatives.</div>
                        ) : (
                          <div className="space-y-2">
                            {suggestions.map((suggestion, index) => (
                              <button
                                key={`${index}-${suggestion}`}
                                onClick={() => applySuggestion(suggestion)}
                                className="block w-full text-left rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm hover:border-[var(--accent-color)]/30 hover:bg-[var(--accent-color)]/8"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                ))}
              </>
            )}
          </div>
        </main>

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
        <ResetModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onConfirm={resetSong} />
      </div>
    </FluentProvider>
  );
}
