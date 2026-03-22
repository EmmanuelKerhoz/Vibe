import React, { useCallback, memo } from 'react';
import { ClipboardPaste, Layout, Library, Music, Sparkles } from '../ui/icons';
import { Section } from '../../types';
import { SectionEditor } from '../editor/SectionEditor';
import { MarkupInput } from '../editor/MarkupInput';
import { Button } from '../ui/Button';
import { useTranslation } from '../../i18n';
import { generateId } from '../../utils/idUtils';
import { isLinkedChorusSectionName, isLinkedPreChorusPair, isPreChorusSectionName, SECTION_TYPE_OPTIONS } from '../../constants/sections';

// Module-level helpers for tied section detection
const isSectionPreChorus = (s: Section) => isPreChorusSectionName(s.name);
const isSectionChorus = (s: Section) => isLinkedChorusSectionName(s.name);

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
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
  handleDrop: (targetIndex: number) => void;
  handleLineDragStart: (sectionId: string, lineId: string) => void;
  handleLineDrop: (sectionId: string, lineId: string) => void;
  isMarkupMode: boolean;
  setIsMarkupMode: (v: boolean) => void;
  markupText: string;
  setMarkupText: (v: string) => void;
  markupTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  markupDirection?: 'ltr' | 'rtl';
  onOpenLibrary: () => void;
  onPasteLyrics: () => void;
  onGenerateSong: () => void;
}

export const LyricsView = memo(function LyricsView({
  song, rhymeScheme,
  updateState, updateSongAndStructureWithHistory,
  selectedLineId, isGenerating, isAnalyzing,
  isAdaptingLanguage = false,
  sectionTargetLanguages = {},
  onSectionTargetLanguageChange,
  adaptSectionLanguage,
  isRegeneratingSection, handleLineClick, updateLineText, handleLineKeyDown,
  handleInstructionChange, addInstruction, removeInstruction, regenerateSection,
  playAudioFeedback, handleDrop, handleLineDragStart, handleLineDrop,
  isMarkupMode, setIsMarkupMode, markupText, setMarkupText, markupTextareaRef, markupDirection = 'ltr',
  onOpenLibrary, onPasteLyrics, onGenerateSong,
}: LyricsViewProps) {
  const { t } = useTranslation();

  const RHYME_KEYS = Object.keys(t.rhymeSchemes) as Array<keyof typeof t.rhymeSchemes>;

  // ── Handlers locaux — stables via useCallback ────────────────────────────

  const moveSectionUp = useCallback((sectionId: string) => {
    const idx = song.findIndex(s => s.id === sectionId);
    if (idx <= 0) return;

    // Determine the block to move (Pre-Chorus + Chorus tied)
    let blockStart = idx;
    let blockEnd = idx;
    const section = song[idx]!;
    if (idx + 1 < song.length && isLinkedPreChorusPair(section.name, song[idx + 1]!.name)) {
      blockEnd = idx + 1;
    } else if (isSectionChorus(section) && idx > 0 && isSectionPreChorus(song[idx - 1]!)) {
      blockStart = idx - 1;
    }

    if (blockStart === 0) return;
    const newSong = [...song];
    const block = newSong.splice(blockStart, blockEnd - blockStart + 1);
    newSong.splice(blockStart - 1, 0, ...block);
    updateSongAndStructureWithHistory(newSong, newSong.map(s => s.name));
  }, [song, updateSongAndStructureWithHistory]);

  const moveSectionDown = useCallback((sectionId: string) => {
    const idx = song.findIndex(s => s.id === sectionId);
    if (idx < 0 || idx >= song.length - 1) return;

    // Determine the block to move (Pre-Chorus + Chorus tied)
    let blockStart = idx;
    let blockEnd = idx;
    const section = song[idx]!;
    if (idx + 1 < song.length && isLinkedPreChorusPair(section.name, song[idx + 1]!.name)) {
      blockEnd = idx + 1;
    } else if (isSectionChorus(section) && idx > 0 && isSectionPreChorus(song[idx - 1]!)) {
      blockStart = idx - 1;
      blockEnd = idx;
    }

    if (blockEnd >= song.length - 1) return;
    const newSong = [...song];
    const block = newSong.splice(blockStart, blockEnd - blockStart + 1);
    newSong.splice(blockStart + 1, 0, ...block);
    updateSongAndStructureWithHistory(newSong, newSong.map(s => s.name));
  }, [song, updateSongAndStructureWithHistory]);

  const moveLineUp = useCallback((sectionId: string, lineId: string) => {
    updateState(current => ({
      song: current.song.map(s => {
        if (s.id !== sectionId) return s;
        const idx = s.lines.findIndex(l => l.id === lineId);
        if (idx <= 0) return s;
        const lines = [...s.lines];
        [lines[idx - 1], lines[idx]] = [lines[idx]!, lines[idx - 1]!];
        return { ...s, lines };
      }),
      structure: current.structure,
    }));
  }, [updateState]);

  const moveLineDown = useCallback((sectionId: string, lineId: string) => {
    updateState(current => ({
      song: current.song.map(s => {
        if (s.id !== sectionId) return s;
        const idx = s.lines.findIndex(l => l.id === lineId);
        if (idx < 0 || idx >= s.lines.length - 1) return s;
        const lines = [...s.lines];
        [lines[idx], lines[idx + 1]] = [lines[idx + 1]!, lines[idx]!];
        return { ...s, lines };
      }),
      structure: current.structure,
    }));
  }, [updateState]);

  const addLineToSection = useCallback((sectionId: string, afterLineId?: string) => {
    const newLine = { id: generateId(), text: '', rhymingSyllables: '', rhyme: '', syllables: 0, concept: '', isManual: true };
    updateState(current => ({
      song: current.song.map(s => {
        if (s.id !== sectionId) return s;
        if (!afterLineId) {
          return { ...s, lines: [...s.lines, newLine] };
        }
        const afterIdx = s.lines.findIndex(l => l.id === afterLineId);
        if (afterIdx === -1) {
          return { ...s, lines: [...s.lines, newLine] };
        }
        const lines = [...s.lines];
        lines.splice(afterIdx + 1, 0, newLine);
        return { ...s, lines };
      }),
      structure: current.structure,
    }));
  }, [updateState]);

  const deleteLineFromSection = useCallback((sectionId: string, lineId: string) => {
    updateState(current => ({
      song: current.song.map(s =>
        s.id !== sectionId ? s : { ...s, lines: s.lines.filter(l => l.id !== lineId) }
      ),
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

  const editorHandlers = {
    moveSectionUp, moveSectionDown,
    moveLineUp, moveLineDown,
    addLineToSection, deleteLineFromSection,
    setSectionName, setSectionRhymeScheme,
  };

  return (
    <>
      {/* FIX #1: w-full + min-w-0 ensure the sections container expands to full available width */}
      <div className="w-full min-w-0 flex flex-col gap-1 pb-32">
        {isMarkupMode ? (
          <div className="lcars-gradient-container flex-1 min-h-0 flex flex-col rounded-[24px_8px_24px_8px] border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl overflow-hidden fluent-fade-in" style={{ minHeight: 'calc(100vh - 280px)' }}>
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
              direction={markupDirection}
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
            <div key={section.id} className={`w-full min-w-0 fluent-animate-in fluent-stagger-${Math.min(sectionIndex + 1, 8)}`}>
              <SectionEditor
                section={section}
                sectionIndex={sectionIndex}
                songLength={song.length}
                {...editorHandlers}
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
                isRegeneratingSection={isRegeneratingSection}
                handleLineClick={handleLineClick}
                updateLineText={updateLineText}
                handleLineKeyDown={handleLineKeyDown}
                handleInstructionChange={handleInstructionChange}
                addInstruction={addInstruction}
                removeInstruction={removeInstruction}
                regenerateSection={regenerateSection}
                handleLineDragStart={handleLineDragStart}
                handleLineDrop={handleLineDrop}
                playAudioFeedback={playAudioFeedback}
                handleDrop={handleDrop}
              />
            </div>
          ))
        )}
      </div>
    </>
  );
});
