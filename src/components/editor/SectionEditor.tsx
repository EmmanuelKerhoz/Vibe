import React, { useContext } from 'react';
import { Loader2, GripVertical, Wand2, ChevronUp, ChevronDown, Bot, User, Plus, Trash2, Settings2, X, Languages } from 'lucide-react';
import { Section } from '../../types';
import { getSectionDotColor, getSectionColorHex, getRhymeColor, getSchemeLetterForLine } from '../../utils/songUtils';
import { LyricInput } from './LyricInput';
import { MetaLine } from './MetaLine';
import { InstructionEditor } from './InstructionEditor';
import { Tooltip } from '../ui/Tooltip';
import { LcarsSelect } from '../ui/LcarsSelect';
import { useTranslation } from '../../i18n';
import { SUPPORTED_ADAPTATION_LANGUAGES, adaptationLanguageLabel } from '../../i18n';
import { useEditorContext } from '../../contexts/EditorContext';

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
  isAdaptingLanguage?: boolean;
  sectionTargetLanguage?: string;
  onSectionTargetLanguageChange?: (sectionId: string, lang: string) => void;
  adaptSectionLanguage?: (sectionId: string, lang: string) => void;
  draggedItemIndex: number | null;
  dragOverIndex: number | null;
  draggedLineInfo: { sectionId: string; lineId: string } | null;
  dragOverLineInfo: { sectionId: string; lineId: string } | null;
  isRegeneratingSection: (sectionId: string) => boolean;
  handleLineClick: (lineId: string) => void;
  updateLineText: (sectionId: string, lineId: string, text: string) => void;
  handleLineKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, sectionId: string, lineId: string) => void;
  handleInstructionChange: (sectionId: string, type: 'pre' | 'post', index: number, value: string) => void;
  addInstruction: (sectionId: string, type: 'pre' | 'post') => void;
  removeInstruction: (sectionId: string, type: 'pre' | 'post', index: number) => void;
  handleLineDragStart: (sectionId: string, lineId: string) => void;
  handleLineDrop: (sectionId: string, lineId: string) => void;
  setDraggedItemIndex: (i: number | null) => void;
  setDragOverIndex: (i: number | null) => void;
  setDraggedLineInfo: (info: { sectionId: string; lineId: string } | null) => void;
  setDragOverLineInfo: (info: { sectionId: string; lineId: string } | null) => void;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
  handleDrop: (targetIndex: number) => void;
  regenerateSection: (sectionId: string) => void;
}

/** A run of consecutive isMeta lines rendered as a single merged row */
type MetaGroup = { kind: 'meta'; lines: Section['lines'] };
/** A single non-meta lyric line */
type LyricItem = { kind: 'lyric'; line: Section['lines'][number]; index: number };
type RenderItem = MetaGroup | LyricItem;

function buildRenderItems(lines: Section['lines']): RenderItem[] {
  const items: RenderItem[] = [];
  let lyricIdx = 0;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (line.isMeta) {
      const group: Section['lines'] = [line];
      while (i + 1 < lines.length && lines[i + 1]!.isMeta) { i++; group.push(lines[i]!); }
      items.push({ kind: 'meta', lines: group });
    } else {
      items.push({ kind: 'lyric', line, index: lyricIdx++ });
    }
    i++;
  }
  return items;
}

export const SectionEditor = React.memo(function SectionEditor({
  section, sectionIndex, songLength, rhymeScheme,
  RHYME_KEYS, SECTION_TYPE_OPTIONS,
  selectedLineId, isGenerating, isAnalyzing,
  isAdaptingLanguage = false,
  sectionTargetLanguage = 'English',
  onSectionTargetLanguageChange,
  adaptSectionLanguage,
  draggedItemIndex, dragOverIndex, draggedLineInfo, dragOverLineInfo,
  isRegeneratingSection,
  handleLineClick, updateLineText, handleLineKeyDown,
  handleInstructionChange, addInstruction, removeInstruction,
  regenerateSection,
  handleLineDragStart, handleLineDrop,
  setDraggedItemIndex, setDragOverIndex, setDraggedLineInfo, setDragOverLineInfo,
  playAudioFeedback, handleDrop,
}: SectionEditorProps) {
  const { t } = useTranslation();

  const {
    moveSectionUp, moveSectionDown,
    moveLineUp, moveLineDown,
    addLineToSection, deleteLineFromSection,
    setSectionName, setSectionRhymeScheme,
  } = useEditorContext();

  // Guard: section.name may be undefined/null in corrupted state (causes toUpperCase crash)
  const sectionName: string = section.name ?? '';

  const isSectionDraggable = sectionName.toLowerCase() !== 'intro' && sectionName.toLowerCase() !== 'outro';
  const isSectionDropTarget = dragOverIndex === sectionIndex && draggedItemIndex !== null && draggedItemIndex !== sectionIndex;
  const sectionColor = getSectionColorHex(sectionName);
  const renderItems = buildRenderItems(section.lines);
  const isSectionAdapting = isAdaptingLanguage;
  const canAdaptSection = !!adaptSectionLanguage && !isGenerating && !isAnalyzing && !isSectionAdapting;

  // Build section type options safely — filter out any non-string entries defensively
  const safeSectionTypeOptions = SECTION_TYPE_OPTIONS.filter((opt): opt is string => typeof opt === 'string');
  const sectionTypeSelectOptions = [
    ...safeSectionTypeOptions.map(opt => ({ value: opt, label: opt.toUpperCase() })),
    ...(sectionName && !safeSectionTypeOptions.includes(sectionName)
      ? [{ value: sectionName, label: sectionName.toUpperCase() }]
      : []),
  ];

  return (
    <section
      id={`section-${section.id}`}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (draggedItemIndex === null || draggedItemIndex === sectionIndex) return; setDragOverIndex(sectionIndex); }}
      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (dragOverIndex === sectionIndex) setDragOverIndex(null); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDrop(sectionIndex); }}
      className={`lcars-band w-full ${draggedItemIndex === sectionIndex ? 'opacity-50' : ''} ${isSectionDropTarget ? 'ring-2 ring-[var(--accent-color)]/60 ring-offset-2 ring-offset-transparent' : ''}`}
      style={{ overflow: 'visible' }}
    >
      <div
        className={`lcars-band-stripe ${getSectionDotColor(sectionName)}`}
        style={{ borderRadius: '24px 0 0 24px', flexShrink: 0 }}
      />

      {/* flex-1 + min-w-0 + width:100% ensure the content area expands to fill available width */}
      <div className="flex-1 pt-3 px-4 pb-2" style={{ minWidth: 0, width: '100%', overflow: 'visible' }}>
        <div className="mb-3 flex items-center justify-between gap-4 flex-wrap lcars-section-header" style={{ color: sectionColor }}>
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <Tooltip title={t.editor.moveSectionUp ?? 'Move section up'}>
                <button type="button" onClick={() => moveSectionUp(section.id)} disabled={sectionIndex === 0 || sectionName.toLowerCase() === 'intro'} className="flex h-5 w-5 items-center justify-center text-zinc-600 transition hover:text-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed">
                  <ChevronUp className="h-3 w-3" />
                </button>
              </Tooltip>
              <Tooltip title={t.editor.moveSectionDown ?? 'Move section down'}>
                <button type="button" onClick={() => moveSectionDown(section.id)} disabled={sectionIndex === songLength - 1 || sectionName.toLowerCase() === 'outro'} className="flex h-5 w-5 items-center justify-center text-zinc-600 transition hover:text-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed">
                  <ChevronDown className="h-3 w-3" />
                </button>
              </Tooltip>
            </div>
            <div>
              <LcarsSelect
                value={sectionName}
                onChange={(v) => setSectionName(section.id, v)}
                options={sectionTypeSelectOptions}
                accentColor={sectionColor}
                style={{ color: sectionColor }}
              />
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">{section.lines.filter(l => !l.isMeta).length} {t.editor.lines ?? 'lines'}</p>
                <div className="min-w-[15rem] max-w-full flex-1">
                  <LcarsSelect
                    value={section.rhymeScheme || rhymeScheme}
                    onChange={(v) => setSectionRhymeScheme(section.id, v)}
                    options={RHYME_KEYS.filter((k): k is string => typeof k === 'string').map(key => ({ value: key, label: t.rhymeSchemes[key as keyof typeof t.rhymeSchemes] ?? key }))}
                    accentColor="var(--lcars-cyan)"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {adaptSectionLanguage && (
              <div className="flex items-center gap-1.5">
                {/* FIX A: min-w-[12rem] prevents flag emoji from being clipped by ellipsis at narrow widths */}
                <div className="min-w-[12rem] max-w-[16rem] flex-shrink-0">
                  <LcarsSelect
                    value={sectionTargetLanguage}
                    onChange={(v) => onSectionTargetLanguageChange?.(section.id, v)}
                    options={SUPPORTED_ADAPTATION_LANGUAGES.map(lang => ({
                      value: lang.aiName,
                      label: adaptationLanguageLabel(lang),
                    }))}
                    accentColor="var(--lcars-cyan)"
                  />
                </div>
                <Tooltip title={`Adapt this section to ${sectionTargetLanguage}`}>
                  <button
                    onClick={() => adaptSectionLanguage(section.id, sectionTargetLanguage)}
                    disabled={!canAdaptSection}
                    className="flex items-center gap-1.5 rounded border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSectionAdapting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Languages className="h-3 w-3" />
                    )}
                    {t.editor.adapt ?? 'ADAPT'}
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>

        {/* Lines */}
        <div className="flex flex-col gap-0.5">
          {renderItems.map((item, renderIdx) => {
            if (item.kind === 'meta') {
              return (
                <MetaLine
                  key={item.lines.map(l => l.id).join('-')}
                  lines={item.lines}
                  sectionId={section.id}
                  handleInstructionChange={handleInstructionChange}
                  addInstruction={addInstruction}
                  removeInstruction={removeInstruction}
                />
              );
            }
            const { line, index: lyricIndex } = item;
            const schemeLabel = getSchemeLetterForLine(section, lyricIndex, section.rhymeScheme || rhymeScheme);
            const rhymeColor = getRhymeColor(schemeLabel);
            const isDraggedLine = draggedLineInfo?.sectionId === section.id && draggedLineInfo?.lineId === line.id;
            const isDragOverLine = dragOverLineInfo?.sectionId === section.id && dragOverLineInfo?.lineId === line.id;
            return (
              <LyricInput
                key={line.id}
                line={line}
                lineIndex={lyricIndex}
                sectionId={section.id}
                sectionLinesCount={section.lines.filter(l => !l.isMeta).length}
                selectedLineId={selectedLineId}
                schemeLabel={schemeLabel}
                rhymeColor={rhymeColor}
                isGenerating={isGenerating}
                isDraggedLine={isDraggedLine}
                isDragOverLine={isDragOverLine}
                handleLineClick={handleLineClick}
                updateLineText={updateLineText}
                handleLineKeyDown={handleLineKeyDown}
                handleLineDragStart={handleLineDragStart}
                handleLineDrop={handleLineDrop}
                setDraggedLineInfo={setDraggedLineInfo}
                setDragOverLineInfo={setDragOverLineInfo}
                moveLineUp={moveLineUp}
                moveLineDown={moveLineDown}
                addLineToSection={addLineToSection}
                deleteLineFromSection={deleteLineFromSection}
                playAudioFeedback={playAudioFeedback}
              />
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => { addLineToSection(section.id); playAudioFeedback('click'); }}
            className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-200 transition"
          >
            <Plus className="h-3 w-3" />
            {t.editor.addLine ?? '+ ADD LINE'}
          </button>
          <InstructionEditor
            sectionId={section.id}
            instructions={section.preInstructions ?? []}
            type="pre"
            handleInstructionChange={handleInstructionChange}
            addInstruction={addInstruction}
            removeInstruction={removeInstruction}
          />
          <InstructionEditor
            sectionId={section.id}
            instructions={section.postInstructions ?? []}
            type="post"
            handleInstructionChange={handleInstructionChange}
            addInstruction={addInstruction}
            removeInstruction={removeInstruction}
          />
          {!isGenerating && (
            <Tooltip title={t.editor.regenerateSection ?? 'Regenerate this section'}>
              <button
                type="button"
                onClick={() => { regenerateSection(section.id); playAudioFeedback('click'); }}
                disabled={isRegeneratingSection(section.id)}
                className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isRegeneratingSection(section.id) ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Wand2 className="h-3 w-3" />
                )}
                {t.editor.regenerate ?? 'REGENERATE'}
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </section>
  );
});
