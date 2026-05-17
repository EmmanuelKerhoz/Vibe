import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Section } from '../../types';
import { getSectionDotColor } from '../../utils/songUtils';
import { SectionHeader } from './SectionHeader';
import { SectionAdaptControl } from './SectionAdaptControl';
import { SectionLineList } from './SectionLineList';
import { SectionFooter } from './SectionFooter';
import { useTranslation } from '../../i18n';
import { useDragActions, useDragState } from '../../contexts/DragContext';
import { useDragHandlersContext } from '../../contexts/DragHandlersContext';
import { useComposerContext } from '../../contexts/ComposerContext';
import { useRhymeProxyContext } from '../../contexts/RhymeProxyContext';
import { useSongContext } from '../../contexts/SongContext';
import { useSongMutation } from '../../contexts/SongMutationContext';
import { isPureMetaLine } from '../../utils/metaUtils';
import { useRhymeSchemeMultiLang } from '../../hooks/useRhymeSchemeMultiLang';
import type { AdaptationLangId } from '../../i18n/constants';

interface SectionEditorProps {
  section: Section;
  sectionIndex: number;
  songLength: number;
  lineNumberOffset?: number;
  isAnalyzing: boolean;
  hasApiKey: boolean;
  isAdaptingLanguage?: boolean;
  sectionTargetLanguage?: AdaptationLangId;
  onSectionTargetLanguageChange?: (sectionId: string, lang: AdaptationLangId) => void;
  adaptSectionLanguage?: (sectionId: string, lang: AdaptationLangId) => void;
  adaptLineLanguage?: (sectionId: string, lineId: string, lang: AdaptationLangId) => void;
  adaptingLineIds?: Set<string>;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
  onLineBlur?: () => void;
}

export const SectionEditor = React.memo(function SectionEditor({
  section, sectionIndex, songLength,
  lineNumberOffset = 0,
  isAnalyzing, hasApiKey,
  isAdaptingLanguage = false,
  sectionTargetLanguage = 'adapt:EN' as AdaptationLangId,
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
  const { draggedItemIndex, dragOverIndex } = useDragState();
  const { setDragOverIndex } = useDragActions();
  const { isProxiedForSection } = useRhymeProxyContext();
  const { lineLanguages, rhymeScheme: globalRhymeScheme } = useSongContext();
  const { setSectionName, setSectionRhymeScheme } = useSongMutation();

  const sectionName: string = section.name ?? '';
  const committedRhyme: string = section.rhymeScheme || globalRhymeScheme;

  // ── Pending state ───────────────────────────────────────────────────────────
  const [pendingName, setPendingName] = useState<string>(sectionName);
  const [pendingRhyme, setPendingRhyme] = useState<string>(committedRhyme);
  const [pendingLang, setPendingLang] = useState<AdaptationLangId>(sectionTargetLanguage);

  // Keep pending in sync when committed values change externally
  // (e.g. undo, remote sync) — only if no local edit is pending
  useEffect(() => {
    setPendingName(sectionName);
  }, [sectionName]);

  useEffect(() => {
    setPendingRhyme(committedRhyme);
  }, [committedRhyme]);

  useEffect(() => {
    setPendingLang(sectionTargetLanguage);
  }, [sectionTargetLanguage]);

  const isDirty =
    pendingName !== sectionName ||
    pendingRhyme !== committedRhyme ||
    pendingLang !== sectionTargetLanguage;

  // ── Apply ────────────────────────────────────────────────────────────────────
  const handleApply = useCallback(() => {
    if (!isDirty) return;
    if (pendingName !== sectionName) {
      setSectionName(section.id, pendingName);
    }
    if (pendingRhyme !== committedRhyme) {
      setSectionRhymeScheme(section.id, pendingRhyme);
    }
    if (pendingLang !== sectionTargetLanguage) {
      // Propagate language selection upstream (triggers adaptation if adaptSectionLanguage provided)
      onSectionTargetLanguageChange?.(section.id, pendingLang);
      if (adaptSectionLanguage) {
        adaptSectionLanguage(section.id, pendingLang);
      }
    }
  }, [
    isDirty,
    pendingName, sectionName,
    pendingRhyme, committedRhyme,
    pendingLang, sectionTargetLanguage,
    section.id,
    setSectionName, setSectionRhymeScheme,
    onSectionTargetLanguageChange, adaptSectionLanguage,
  ]);

  // ── Drag ─────────────────────────────────────────────────────────────────────
  const isSectionDropTarget = dragOverIndex === sectionIndex && draggedItemIndex !== null && draggedItemIndex !== sectionIndex;

  const hasLyrics = useMemo(
    () => section.lines.some(
      l => !(l.isMeta ?? isPureMetaLine(l.text)) && l.text.trim().length > 0,
    ),
    [section.lines],
  );

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

  const isProxied = isProxiedForSection(section.id);

  const multiLangLines = useMemo(
    () =>
      section.lines
        .filter(l => !(l.isMeta ?? isPureMetaLine(l.text)))
        .map(l => ({
          text: l.text,
          lang: lineLanguages[l.id] ?? sectionTargetLanguage,
        })),
    [
      section.lines,
      sectionTargetLanguage,
      lineLanguages,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      section.lines.map(l => lineLanguages[l.id] ?? '').join('\x00'),
    ],
  );

  const schemeResult = useRhymeSchemeMultiLang(multiLangLines, isProxied);

  const lineListOptional = {
    ...(adaptLineLanguage ? { adaptLineLanguage } : {}),
    ...(adaptingLineIds ? { adaptingLineIds } : {}),
    ...(onLineBlur ? { onLineBlur } : {}),
  };

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

      <div className="flex-1 pt-2.5 px-3.5 pb-2" style={{ minWidth: 0, width: '100%', overflow: 'visible' }}>

        <div className="mb-2 flex items-start justify-between gap-3 flex-wrap">
          <SectionHeader
            section={section}
            sectionIndex={sectionIndex}
            songLength={songLength}
            pendingName={pendingName}
            pendingRhyme={pendingRhyme}
            onPendingNameChange={setPendingName}
            onPendingRhymeChange={setPendingRhyme}
          />
          {adaptSectionLanguage && (
            <SectionAdaptControl
              sectionId={section.id}
              sectionTargetLanguage={sectionTargetLanguage}
              hasApiKey={hasApiKey}
              hasLyrics={hasLyrics}
              isGenerating={isGenerating}
              isAnalyzing={isAnalyzing}
              isAdaptingLanguage={isAdaptingLanguage}
              pendingLang={pendingLang}
              onPendingLangChange={setPendingLang}
              isDirty={isDirty}
              onApply={handleApply}
              adaptSectionLanguage={adaptSectionLanguage}
            />
          )}
        </div>

        <div className="flex items-center gap-1.5 pl-1 pr-8 mb-1 select-none" aria-hidden="true">
          <span className="flex-shrink-0 w-6" />
          <span className="flex-shrink-0 w-3.5" />
          <span className="flex-1 min-w-0" />
          <span className="flex-shrink-0 w-16" />
          <span className="flex-shrink-0 w-[2.75rem] text-right text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-600 dark:text-zinc-400">
            {t.editor?.syllableCount ?? 'Count'}
          </span>
          <span className="flex-shrink-0 w-2" />
          <span className="flex-shrink-0 w-7 text-center text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-600 dark:text-zinc-400">
            {t.editor?.schemaHeader ?? 'Sch.'}
          </span>
        </div>

        <SectionLineList
          section={section}
          lineNumberOffset={lineNumberOffset}
          sectionTargetLanguage={sectionTargetLanguage}
          hasApiKey={hasApiKey}
          schemeResult={schemeResult}
          playAudioFeedback={playAudioFeedback}
          {...lineListOptional}
        />

        <SectionFooter
          sectionId={section.id}
          hasLyrics={hasLyrics}
          preInstructions={section.preInstructions ?? []}
          postInstructions={section.postInstructions ?? []}
          playAudioFeedback={playAudioFeedback}
          schemeResult={schemeResult}
        />
      </div>
    </section>
  );
});
