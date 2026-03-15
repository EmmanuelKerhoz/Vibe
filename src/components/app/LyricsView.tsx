import React, { useCallback } from 'react';
import { ClipboardPaste, Layout, Library, Music, Sparkles } from 'lucide-react';
import { Section } from '../../types';
import { SectionEditor } from '../editor/SectionEditor';
import { MarkupInput } from '../editor/MarkupInput';
import { Button } from '../ui/Button';
import { useTranslation } from '../../i18n';
import { generateId } from '../../utils/idUtils';

interface LyricsViewProps {
  song: Section[];
  rhymeScheme: string;
  updateState: (transform: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] }) => void;
  updateSongAndStructureWithHistory: (song: Section[], structure: string[]) => void;
  selectedLineId: string | null;
  isGenerating: boolean;
  isAnalyzing: boolean;
  isAdaptingLanguage?: boolean;
  sectionTargetLanguages?: Record<string, string>;
  onSectionTargetLanguageChange?: (sectionId: string, lang: string) => void;
  adaptSectionLanguage?: (sectionId: string, lang: string) => void;
  isRegeneratingSection: (sectionId: string) => boolean;
  handleLineClick: (lineId: string) => void;
  updateLineText: (sectionId: string, lineId: string, text: string) => void;
  handleLineKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, sectionId: string, lineId: string) => void;
  handleInstructionChange: (sectionId: string, type: 'pre' | 'post', index: number, value: string) => void;
  addInstruction: (sectionId: string, type: 'pre' | 'post') => void;
  removeInstruction: (sectionId: string, type: 'pre' | 'post', index: number) => void;
  regenerateSection: (sectionId: string) => void;
  draggedItemIndex: number | null;
  dragOverIndex: number | null;
  draggedLineInfo: { sectionId: string; lineId: string } | null;
  dragOverLineInfo: { sectionId: string; lineId: string } | null;
  setDraggedItemIndex: (i: number | null) => void;
  setDragOverIndex: (i: number | null) => void;
  setDraggableSectionIndex: (i: number | null) => void;
  setDraggedLineInfo: (info: { sectionId: string; lineId: string } | null) => void;
  setDragOverLineInfo: (info: { sectionId: string; lineId: string } | null) => void;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
  handleDrop: (targetIndex: number) => void;
  handleLineDragStart: (sectionId: string, lineId: string) => void;
  handleLineDrop: (sectionId: string, lineId: string) => void;
  isMarkupMode: boolean;
  setIsMarkupMode: (v: boolean) => void;
  markupText: string;
  setMarkupText: (v: string) => void;
  markupTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onOpenLibrary: () => void;
  onPasteLyrics: () => void;
  onGenerateSong: () => void;
}

export function LyricsView({
  song, rhymeScheme,
  updateState, updateSongAndStructureWithHistory,
  selectedLineId, isGenerating, isAnalyzing,
  isAdaptingLanguage = false,
  sectionTargetLanguages = {},
  onSectionTargetLanguageChange,
  adaptSectionLanguage,
  isRegeneratingSection, handleLineClick, updateLineText, handleLineKeyDown,
  handleInstructionChange, addInstruction, removeInstruction, regenerateSection,
  draggedItemIndex, dragOverIndex, draggedLineInfo, dragOverLineInfo,
  setDraggedItemIndex, setDragOverIndex, setDraggableSectionIndex,
  setDraggedLineInfo, setDragOverLineInfo,
  playAudioFeedback, handleDrop, handleLineDragStart, handleLineDrop,
  isMarkupMode, setIsMarkupMode, markupText, setMarkupText, markupTextareaRef,
  onOpenLibrary, onPasteLyrics, onGenerateSong,
}: LyricsViewProps) {
  const { t } = useTranslation();

  const RHYME_KEYS = Object.keys(t.rhymeSchemes) as Array<keyof typeof t.rhymeSchemes>;
  const SECTION_TYPE_OPTIONS = ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Breakdown', 'Final Chorus', 'Outro'];

  const moveSectionUp = useCallback((sectionId: string) => {
    const idx = song.findIndex(s => s.id === sectionId);
    if (idx <= 0) return;
    const newSong = [...song];
    const a = newSong[idx - 1]!;
    const b = newSong[idx]!;
    newSong[idx - 1] = b;
    newSong[idx] = a;
    updateSongAndStructureWithHistory(newSong, newSong.map(s => s.name));
  }, [song, updateSongAndStructureWithHistory]);

  const moveSectionDown = useCallback((sectionId: string) => {
    const idx = song.findIndex(s => s.id === sectionId);
    if (idx < 0 || idx >= song.length - 1) return;
    const newSong = [...song];
    const a = newSong[idx]!;
    const b = newSong[idx + 1]!;
    newSong[idx] = b;
    newSong[idx + 1] = a;
    updateSongAndStructureWithHistory(newSong, newSong.map(s => s.name));
  }, [song, updateSongAndStructureWithHistory]);

  const moveLineUp = useCallback((sectionId: string, lineId: string) => {
    updateState(current => {
      const newSong = current.song.map(s => {
        if (s.id !== sectionId) return s;
        const idx = s.lines.findIndex(l => l.id === lineId);
        if (idx <= 0) return s;
        const newLines = [...s.lines];
        const a = newLines[idx - 1]!;
        const b = newLines[idx]!;
        newLines[idx - 1] = b;
        newLines[idx] = a;
        return { ...s, lines: newLines };
      });
      return { song: newSong, structure: current.structure };
    });
  }, [updateState]);

  const moveLineDown = useCallback((sectionId: string, lineId: string) => {
    updateState(current => {
      const newSong = current.song.map(s => {
        if (s.id !== sectionId) return s;
        const idx = s.lines.findIndex(l => l.id === lineId);
        if (idx < 0 || idx >= s.lines.length - 1) return s;
        const newLines = [...s.lines];
        const a = newLines[idx]!;
        const b = newLines[idx + 1]!;
        newLines[idx] = b;
        newLines[idx + 1] = a;
        return { ...s, lines: newLines };
      });
      return { song: newSong, structure: current.structure };
    });
  }, [updateState]);

  const addLineToSection = useCallback((sectionId: string) => {
    updateState(current => ({
      song: current.song.map(s => {
        if (s.id !== sectionId) return s;
        return { ...s, lines: [...s.lines, { id: generateId(), text: '', rhymingSyllables: '', rhyme: '', syllables: 0, concept: '', isManual: true }] };
      }),
      structure: current.structure,
    }));
  }, [updateState]);

  const deleteLineFromSection = useCallback((sectionId: string, lineId: string) => {
    updateState(current => ({
      song: current.song.map(s => {
        if (s.id !== sectionId) return s;
        return { ...s, lines: s.lines.filter(l => l.id !== lineId) };
      }),
      structure: current.structure,
    }));
  }, [updateState]);

  const setSectionRhymeScheme = useCallback((sectionId: string, newScheme: string) => {
    updateState(current => ({
      song: current.song.map(s => s.id === sectionId ? { ...s, rhymeScheme: newScheme } : s),
      structure: current.structure,
    }));
  }, [updateState]);

  const setSectionName = useCallback((sectionId: string, newName: string) => {
    const newSong = song.map(s => s.id === sectionId ? { ...s, name: newName } : s);
    updateSongAndStructureWithHistory(newSong, newSong.map(s => s.name));
  }, [song, updateSongAndStructureWithHistory]);

  return (
    <div className="w-full flex flex-col gap-1 pb-32">
      {isMarkupMode ? (
        <div className="flex-1 min-h-0 flex flex-col rounded-[24px_8px_24px_8px] border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl overflow-hidden fluent-fade-in" style={{ minHeight: 'calc(100vh - 280px)' }}>
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
      ) : song.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-center select-none fluent-animate-in" role="status" aria-label={t.editor.emptyState.title}>
          <div className="w-16 h-16 rounded-[16px_4px_16px_4px] bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center mb-6" aria-hidden="true">
            <Music className="w-8 h-8 text-[var(--accent-color)]/40" />
          </div>
          <h2 className="text-sm font-bold tracking-widest uppercase text-[var(--text-primary)] mb-3">
            {t.editor.emptyState.title}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-xs mb-2 leading-relaxed">
            {t.editor.emptyState.description}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={onOpenLibrary} aria-label={t.saveToLibrary.browseDescription} variant="outlined" color="info" size="small" startIcon={<Library className="w-3.5 h-3.5" />} className="fluent-animate-pressable">
              {t.saveToLibrary.title}
            </Button>
            <Button onClick={onPasteLyrics} aria-label={t.tooltips.pasteLyrics} variant="outlined" color="info" size="small" startIcon={<ClipboardPaste className="w-3.5 h-3.5" />} className="fluent-animate-pressable">
              {t.editor.emptyState.pasteLyrics}
            </Button>
            <Button onClick={onGenerateSong} aria-label={t.tooltips.generateSong} variant="contained" color="primary" size="small" startIcon={<Sparkles className="w-3.5 h-3.5" />} className="fluent-animate-pressable">
              {t.editor.emptyState.generateSong}
            </Button>
          </div>
        </div>
      ) : (
        song.map((section, sectionIndex) => (
          <div key={section.id} className={`fluent-animate-in fluent-stagger-${Math.min(sectionIndex + 1, 8)}`}>
            <SectionEditor
              section={section}
              sectionIndex={sectionIndex}
              songLength={song.length}
              rhymeScheme={rhymeScheme}
              RHYME_KEYS={RHYME_KEYS}
              SECTION_TYPE_OPTIONS={SECTION_TYPE_OPTIONS}
              selectedLineId={selectedLineId}
              isGenerating={isGenerating}
              isAnalyzing={isAnalyzing}
              isAdaptingLanguage={isAdaptingLanguage}
              sectionTargetLanguage={sectionTargetLanguages[section.id] ?? 'English'}
              onSectionTargetLanguageChange={onSectionTargetLanguageChange}
              adaptSectionLanguage={adaptSectionLanguage}
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
          </div>
        ))
      )}
    </div>
  );
}
