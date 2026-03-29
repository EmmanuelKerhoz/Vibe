import React, { useCallback, useMemo, memo, useRef } from 'react';
import { ClipboardPaste, FileText, Layout, Library, Loader2, Music, PersonVoice, Sparkles, Type } from '../ui/icons';
import { Section } from '../../types';
import { SectionEditor } from '../editor/SectionEditor';
import { MarkupInput } from '../editor/MarkupInput';
import { Button } from '../ui/Button';
import { useTranslation } from '../../i18n';
import { generateId } from '../../utils/idUtils';
import { isLinkedChorusSectionName, isLinkedPreChorusPair, isPreChorusSectionName, SECTION_TYPE_OPTIONS } from '../../constants/sections';
import { useSongContext } from '../../contexts/SongContext';
import { useComposerContext } from '../../contexts/ComposerContext';
import { usePhoneticTranscription } from '../../hooks/usePhoneticTranscription';
import { useEditorContext } from '../../contexts/EditorContext';

// Module-level helpers for tied section detection
const isSectionPreChorus = (s: Section) => isPreChorusSectionName(s.name);
const isSectionChorus = (s: Section) => isLinkedChorusSectionName(s.name);

interface LyricsViewProps {
  isAnalyzing: boolean;
  isAdaptingLanguage?: boolean;
  sectionTargetLanguages?: Record<string, string>;
  onSectionTargetLanguageChange?: (sectionId: string, lang: string) => void;
  adaptSectionLanguage?: (sectionId: string, lang: string) => void;
  adaptLineLanguage?: (sectionId: string, lineId: string, lang: string) => void;
  adaptingLineIds?: Set<string>;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
  // TODO(DragHandlersContext): migrate these 3 props to a DragHandlersContext
  // once useSongEditor handlers are lifted into a provider.
  handleDrop: (targetIndex: number) => void;
  handleLineDragStart: (sectionId: string, lineId: string) => void;
  handleLineDrop: (sectionId: string, lineId: string) => void;
  canPasteLyrics: boolean;
  targetLanguage?: string;
  onOpenLibrary: () => void;
  onPasteLyrics: () => void;
  onGenerateSong: () => void;
  showTranslationFeatures?: boolean;
}

export const LyricsView = memo(function LyricsView({
  isAnalyzing,
  isAdaptingLanguage = false,
  sectionTargetLanguages = {},
  onSectionTargetLanguageChange,
  adaptSectionLanguage,
  adaptLineLanguage,
  adaptingLineIds,
  playAudioFeedback, handleDrop, handleLineDragStart, handleLineDrop,
  canPasteLyrics,
  targetLanguage,
  onOpenLibrary, onPasteLyrics, onGenerateSong,
  showTranslationFeatures = true,
}: LyricsViewProps) {
  const { song, rhymeScheme, songLanguage, updateState, updateSongAndStructureWithHistory } = useSongContext();
  const { selectedLineId, isGenerating, isRegeneratingSection, handleLineClick, updateLineText,
    handleLineKeyDown, handleInstructionChange, addInstruction, removeInstruction, regenerateSection,
  } = useComposerContext();
  const { t } = useTranslation();
  // Editor state sourced from EditorContext — no longer drilled via props
  const { editMode, setEditMode, markupText, setMarkupText, markupTextareaRef, markupDirection } = useEditorContext();

  /**
   * FIX (PR-3): RHYME_KEYS was rebuilt on every render as a plain array literal,
   * passing a new reference to every SectionEditor and invalidating React.memo.
   * useMemo ensures a stable reference as long as t.rhymeSchemes doesn't change.
   */
  const RHYME_KEYS = useMemo(
    () => ['FREE', ...Object.keys(t.rhymeSchemes).filter((key) => key !== 'FREE')] as Array<keyof typeof t.rhymeSchemes>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t.rhymeSchemes]
  );

  const phoneticTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const phoneticState = usePhoneticTranscription({
    song,
    sectionTargetLanguages,
    songLanguage,
    targetLanguage,
    isActive: editMode === 'phonetic',
  });

  // ── Handlers locaux — stables via useCallback ────────────────────────────

  const moveSectionUp = useCallback((sectionId: string) => {
    const idx = song.findIndex(s => s.id === sectionId);
    if (idx <= 0) return;

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

  /**
   * FIX: editorHandlers était un objet littéral recréé à chaque render.
   * Le spread {...editorHandlers} dans SectionEditor invalidait React.memo()
   * sur tous les enfants à chaque frappe, même dans une autre section.
   * useMemo garantit une référence stable tant que les callbacks ne changent pas.
   */
  const editorHandlers = useMemo(() => ({
    moveSectionUp, moveSectionDown,
    moveLineUp, moveLineDown,
    addLineToSection, deleteLineFromSection,
    setSectionName, setSectionRhymeScheme,
  }), [
    moveSectionUp, moveSectionDown,
    moveLineUp, moveLineDown,
    addLineToSection, deleteLineFromSection,
    setSectionName, setSectionRhymeScheme,
  ]);

  return (
    <>
      <div className="w-full min-w-0 flex flex-col gap-1 pb-32">
        {editMode === 'text' ? (
          <div className="lcars-gradient-container flex-1 min-h-0 flex flex-col rounded-[24px_8px_24px_8px] border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl overflow-hidden fluent-fade-in" style={{ minHeight: 'calc(100vh - 280px)' }}>
            <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center">
                <Type className="w-4 h-4 text-[var(--accent-color)]" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-widest text-[var(--text-primary)] uppercase">
                  {t.editor.textMode.title}
                </h3>
                <p className="text-xs text-[var(--accent-color)] uppercase tracking-wider mt-0.5">
                  {t.editor.textMode.description}
                </p>
              </div>
            </div>
            <div className="relative flex-1 min-h-0 overflow-hidden">
              <textarea
                ref={markupTextareaRef as React.RefObject<HTMLTextAreaElement>}
                value={markupText}
                onChange={(e) => setMarkupText(e.target.value)}
                spellCheck={false}
                dir={markupDirection}
                placeholder={t.editor.textMode.placeholder}
                className="absolute inset-0 w-full h-full resize-none bg-[var(--bg-app)] caret-[var(--text-primary)] outline-none font-mono text-sm leading-7 text-[var(--text-primary)]"
                style={{ padding: '1.5rem' }}
              />
            </div>
            <div className="px-6 py-3 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)]">
              <p className="text-xs text-[var(--text-secondary)]">{t.editor.textMode.hint}</p>
            </div>
          </div>
        ) : editMode === 'markdown' ? (
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
        ) : editMode === 'phonetic' ? (
          <div className="lcars-gradient-container flex-1 min-h-0 flex flex-col rounded-[24px_8px_24px_8px] border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl overflow-hidden fluent-fade-in" style={{ minHeight: 'calc(100vh - 280px)' }}>
            <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center">
                <PersonVoice className="w-4 h-4 text-[var(--accent-color)]" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-widest text-[var(--text-primary)] uppercase">
                  {t.editor.phoneticMode.title}
                </h3>
                <p className="text-xs text-[var(--accent-color)] uppercase tracking-wider mt-0.5">
                  {t.editor.phoneticMode.description}
                </p>
              </div>
            </div>
            <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
              {phoneticState.status === 'loading' && (
                <div className="absolute inset-0 bg-[var(--bg-app)]/70 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] uppercase tracking-wider">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-color)]" />
                    <span>{t.editor.phoneticMode.loading ?? 'Generating phonetics...'}</span>
                  </div>
                </div>
              )}
              <MarkupInput
                value={phoneticState.text || (phoneticState.status === 'ready' ? t.editor.phoneticMode.placeholder : '')}
                onChange={() => {}}
                textareaRef={phoneticTextareaRef}
                direction={markupDirection}
                className="w-full flex-1 min-h-0 font-mono text-sm leading-7 text-[var(--text-primary)] bg-[var(--bg-app)]"
                spellCheck={false}
                readOnly
              />
            </div>
            <div className="px-6 py-3 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] flex items-center justify-between gap-3">
              <p className="text-xs text-[var(--text-secondary)]">
                {phoneticState.status === 'error'
                  ? (t.editor.phoneticMode.error
                    ? t.editor.phoneticMode.error.replace('{error}', phoneticState.error || 'unavailable')
                    : phoneticState.error)
                  : t.editor.phoneticMode.hint.replace('{lang}', phoneticState.languageLabel)}
              </p>
              <span className={`text-[10px] uppercase tracking-widest font-semibold ${phoneticState.status === 'error' ? 'text-red-300' : 'text-[var(--accent-color)]'}`}>
                {phoneticState.status === 'error'
                  ? (phoneticState.error || 'Error')
                  : phoneticState.languageLabel}
              </span>
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
              <Button onClick={onPasteLyrics} disabled={!canPasteLyrics} aria-label={t.tooltips.pasteLyrics} variant="outlined" color="info" size="small" startIcon={<ClipboardPaste className="w-3.5 h-3.5" />} className="fluent-animate-pressable">
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
                isAdaptingLanguage={showTranslationFeatures ? isAdaptingLanguage : false}
                sectionTargetLanguage={sectionTargetLanguages[section.id] ?? (songLanguage || 'English')}
                onSectionTargetLanguageChange={showTranslationFeatures ? onSectionTargetLanguageChange : undefined}
                adaptSectionLanguage={showTranslationFeatures ? adaptSectionLanguage : undefined}
                adaptLineLanguage={showTranslationFeatures ? adaptLineLanguage : undefined}
                adaptingLineIds={showTranslationFeatures ? adaptingLineIds : undefined}
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
