import React, { useCallback } from 'react';
import { Section } from '../../types';
import { getSectionDotColor } from '../../utils/songUtils';
import { SectionHeader } from './SectionHeader';
import { SectionAdaptControl } from './SectionAdaptControl';
import { SectionLineList } from './SectionLineList';
import { SectionFooter } from './SectionFooter';
import { useDrag } from '../../contexts/DragContext';
import { useDragHandlersContext } from '../../contexts/DragHandlersContext';

interface SectionEditorProps {
  section: Section;
  sectionIndex: number;
  songLength: number;
  rhymeScheme: string;
  RHYME_KEYS: string[];
  SECTION_TYPE_OPTIONS: string[];
  selectedLineId: string | null;
  isGenerating: boolean;
  isAnalyzing: boolean;
  hasApiKey: boolean;
  isAdaptingLanguage?: boolean;
  sectionTargetLanguage?: string;
  onSectionTargetLanguageChange?: (sectionId: string, lang: string) => void;
  adaptSectionLanguage?: (sectionId: string, lang: string) => void;
  adaptLineLanguage?: (sectionId: string, lineId: string, lang: string) => void;
  adaptingLineIds?: Set<string>;
  isRegeneratingSection: (sectionId: string) => boolean;
  handleLineClick: (lineId: string) => void;
  updateLineText: (sectionId: string, lineId: string, text: string) => void;
  handleLineKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, sectionId: string, lineId: string) => void;
  handleInstructionChange: (sectionId: string, type: 'pre' | 'post', index: number, value: string) => void;
  addInstruction: (sectionId: string, type: 'pre' | 'post') => void;
  removeInstruction: (sectionId: string, type: 'pre' | 'post', index: number) => void;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
  regenerateSection: (sectionId: string) => void;
  moveSectionUp: (sectionId: string) => void;
  moveSectionDown: (sectionId: string) => void;
  moveLineUp: (sectionId: string, lineId: string) => void;
  moveLineDown: (sectionId: string, lineId: string) => void;
  addLineToSection: (sectionId: string, afterLineId?: string) => void;
  deleteLineFromSection: (sectionId: string, lineId: string) => void;
  setSectionName: (sectionId: string, name: string) => void;
  setSectionRhymeScheme: (sectionId: string, scheme: string) => void;
}

export const SectionEditor = React.memo(function SectionEditor({
  section, sectionIndex, songLength, rhymeScheme,
  RHYME_KEYS, SECTION_TYPE_OPTIONS,
  selectedLineId, isGenerating, isAnalyzing, hasApiKey,
  isAdaptingLanguage = false,
  sectionTargetLanguage = 'English',
  onSectionTargetLanguageChange,
  adaptSectionLanguage,
  adaptLineLanguage,
  adaptingLineIds,
  isRegeneratingSection,
  handleLineClick, updateLineText, handleLineKeyDown,
  handleInstructionChange, addInstruction, removeInstruction,
  regenerateSection,
  playAudioFeedback,
  moveSectionUp, moveSectionDown,
  moveLineUp, moveLineDown,
  addLineToSection, deleteLineFromSection,
  setSectionName, setSectionRhymeScheme,
}: SectionEditorProps) {
  const { handleDrop } = useDragHandlersContext();
  const {
    draggedItemIndex,
    dragOverIndex,
    setDragOverIndex,
  } = useDrag();

  const sectionName: string = section.name ?? '';
  const isSectionDropTarget = dragOverIndex === sectionIndex && draggedItemIndex !== null && draggedItemIndex !== sectionIndex;

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (draggedItemIndex === null || draggedItemIndex === sectionIndex) return;
    setDragOverIndex(sectionIndex);
  }, [draggedItemIndex, sectionIndex, setDragOverIndex]);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (dragOverIndex === sectionIndex) setDragOverIndex(null);
  }, [dragOverIndex, sectionIndex, setDragOverIndex]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    handleDrop(sectionIndex);
  }, [handleDrop, sectionIndex]);

  return (
    <section
      id={`section-${section.id}`}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`lcars-band w-full ${draggedItemIndex === sectionIndex ? 'opacity-50' : ''} ${isSectionDropTarget ? 'ring-2 ring-[var(--accent-color)]/60 ring-offset-2 ring-offset-transparent' : ''}`}
      style={{ overflow: 'visible' }}
    >
      <div
        className={`lcars-band-stripe ${getSectionDotColor(sectionName)}`}
        style={{ flexShrink: 0 }}
      />

      <div className="flex-1 pt-3 px-4 pb-2" style={{ minWidth: 0, width: '100%', overflow: 'visible' }}>

        <div className="mb-3 flex items-center justify-between gap-4 flex-wrap">
          <SectionHeader
            section={section}
            sectionIndex={sectionIndex}
            songLength={songLength}
            rhymeScheme={rhymeScheme}
            RHYME_KEYS={RHYME_KEYS}
            SECTION_TYPE_OPTIONS={SECTION_TYPE_OPTIONS}
            moveSectionUp={moveSectionUp}
            moveSectionDown={moveSectionDown}
            setSectionName={setSectionName}
            setSectionRhymeScheme={setSectionRhymeScheme}
          />
          <SectionAdaptControl
            sectionId={section.id}
            sectionTargetLanguage={sectionTargetLanguage}
            hasApiKey={hasApiKey}
            isGenerating={isGenerating}
            isAnalyzing={isAnalyzing}
            isAdaptingLanguage={isAdaptingLanguage}
            onSectionTargetLanguageChange={onSectionTargetLanguageChange}
            adaptSectionLanguage={adaptSectionLanguage}
          />
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-1.5 pl-1 pr-8 mb-0.5 select-none" aria-hidden="true">
          <span className="flex-shrink-0 w-3.5" />
          <span className="flex-1 min-w-0" />
          <span className="flex-shrink-0 w-16" />
          <span className="flex-shrink-0 w-[2.75rem] text-right text-[8px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(section as any).t?.editor?.syllableCount ?? 'Count'}
          </span>
          <span className="flex-shrink-0 w-2" />
          <span className="flex-shrink-0 w-7 text-center text-[8px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(section as any).t?.editor?.schemaHeader ?? 'Sch.'}
          </span>
        </div>

        <SectionLineList
          section={section}
          rhymeScheme={rhymeScheme}
          selectedLineId={selectedLineId}
          isGenerating={isGenerating}
          hasApiKey={hasApiKey}
          adaptLineLanguage={adaptLineLanguage}
          adaptingLineIds={adaptingLineIds}
          sectionTargetLanguage={sectionTargetLanguage}
          handleLineClick={handleLineClick}
          updateLineText={updateLineText}
          handleLineKeyDown={handleLineKeyDown}
          moveLineUp={moveLineUp}
          moveLineDown={moveLineDown}
          addLineToSection={addLineToSection}
          deleteLineFromSection={deleteLineFromSection}
          playAudioFeedback={playAudioFeedback}
        />

        <SectionFooter
          sectionId={section.id}
          preInstructions={section.preInstructions ?? []}
          postInstructions={section.postInstructions ?? []}
          isGenerating={isGenerating}
          isRegeneratingSection={isRegeneratingSection}
          addLineToSection={addLineToSection}
          handleInstructionChange={handleInstructionChange}
          addInstruction={addInstruction}
          removeInstruction={removeInstruction}
          regenerateSection={regenerateSection}
          playAudioFeedback={playAudioFeedback}
        />
      </div>
    </section>
  );
});
