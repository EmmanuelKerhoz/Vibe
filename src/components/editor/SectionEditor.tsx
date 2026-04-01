import React, { useCallback } from 'react';
import { Section } from '../../types';
import { getSectionDotColor } from '../../utils/songUtils';
import { SectionHeader } from './SectionHeader';
import { SectionAdaptControl } from './SectionAdaptControl';
import { SectionLineList } from './SectionLineList';
import { SectionFooter } from './SectionFooter';
import { useTranslation } from '../../i18n';
import { useDrag } from '../../contexts/DragContext';
import { useDragHandlersContext } from '../../contexts/DragHandlersContext';
import { useComposerContext } from '../../contexts/ComposerContext';

interface SectionEditorProps {
  section: Section;
  sectionIndex: number;
  songLength: number;
  isAnalyzing: boolean;
  hasApiKey: boolean;
  isAdaptingLanguage?: boolean;
  sectionTargetLanguage?: string;
  onSectionTargetLanguageChange?: (sectionId: string, lang: string) => void;
  adaptSectionLanguage?: (sectionId: string, lang: string) => void;
  adaptLineLanguage?: (sectionId: string, lineId: string, lang: string) => void;
  adaptingLineIds?: Set<string>;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
  onLineBlur?: () => void;
}

export const SectionEditor = React.memo(function SectionEditor({
  section, sectionIndex, songLength,
  isAnalyzing, hasApiKey,
  isAdaptingLanguage = false,
  sectionTargetLanguage = 'English',
  onSectionTargetLanguageChange,
  adaptSectionLanguage,
  adaptLineLanguage,
  adaptingLineIds,
  playAudioFeedback,
  onLineBlur,
}: SectionEditorProps) {
  const { t } = useTranslation();
  const { isGenerating } = useComposerContext();
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
            {t.editor?.syllableCount ?? 'Count'}
          </span>
          <span className="flex-shrink-0 w-2" />
          <span className="flex-shrink-0 w-7 text-center text-[8px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
            {t.editor?.schemaHeader ?? 'Sch.'}
          </span>
        </div>

        <SectionLineList
          section={section}
          hasApiKey={hasApiKey}
          adaptLineLanguage={adaptLineLanguage}
          adaptingLineIds={adaptingLineIds}
          sectionTargetLanguage={sectionTargetLanguage}
          playAudioFeedback={playAudioFeedback}
          onLineBlur={onLineBlur}
        />

        <SectionFooter
          sectionId={section.id}
          preInstructions={section.preInstructions ?? []}
          postInstructions={section.postInstructions ?? []}
          playAudioFeedback={playAudioFeedback}
        />
      </div>
    </section>
  );
});
