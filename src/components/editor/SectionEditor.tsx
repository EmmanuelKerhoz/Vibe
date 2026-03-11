import React from 'react';
import { Loader2, GripVertical, Wand2, ChevronUp, ChevronDown, Bot, User, Plus, Trash2 } from 'lucide-react';
import { Section } from '../../types';
import { getSectionDotColor, getSectionColorHex, getSectionTextColor, getRhymeColor } from '../../utils/songUtils';
import { LyricInput } from './LyricInput';
import { InstructionEditor } from './InstructionEditor';
import { Tooltip } from '../ui/Tooltip';
import { useTranslation } from '../../i18n';

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
  draggedItemIndex: number | null;
  dragOverIndex: number | null;
  draggedLineInfo: { sectionId: string; lineId: string } | null;
  dragOverLineInfo: { sectionId: string; lineId: string } | null;
  // callbacks
  moveSectionUp: (sectionId: string) => void;
  moveSectionDown: (sectionId: string) => void;
  moveLineUp: (sectionId: string, lineId: string) => void;
  moveLineDown: (sectionId: string, lineId: string) => void;
  addLineToSection: (sectionId: string) => void;
  deleteLineFromSection: (sectionId: string, lineId: string) => void;
  setSectionName: (sectionId: string, name: string) => void;
  setSectionRhymeScheme: (sectionId: string, scheme: string) => void;
  regenerateSection: (sectionId: string) => void;
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
  setDraggableSectionIndex: (i: number | null) => void;
  setDraggedLineInfo: (info: { sectionId: string; lineId: string } | null) => void;
  setDragOverLineInfo: (info: { sectionId: string; lineId: string } | null) => void;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
  handleDrop: (targetIndex: number) => void;
}

export const SectionEditor = React.memo(function SectionEditor({
  section,
  sectionIndex,
  songLength,
  rhymeScheme,
  RHYME_KEYS,
  SECTION_TYPE_OPTIONS,
  selectedLineId,
  isGenerating,
  isAnalyzing,
  draggedItemIndex,
  dragOverIndex,
  draggedLineInfo,
  dragOverLineInfo,
  moveSectionUp,
  moveSectionDown,
  moveLineUp,
  moveLineDown,
  addLineToSection,
  deleteLineFromSection,
  setSectionName,
  setSectionRhymeScheme,
  regenerateSection,
  isRegeneratingSection,
  handleLineClick,
  updateLineText,
  handleLineKeyDown,
  handleInstructionChange,
  addInstruction,
  removeInstruction,
  handleLineDragStart,
  handleLineDrop,
  setDraggedItemIndex,
  setDragOverIndex,
  setDraggableSectionIndex,
  setDraggedLineInfo,
  setDragOverLineInfo,
  playAudioFeedback,
  handleDrop,
}: SectionEditorProps) {
  const { t } = useTranslation();
  const isSectionDraggable = section.name.toLowerCase() !== 'intro' && section.name.toLowerCase() !== 'outro';
  const isSectionDropTarget = dragOverIndex === sectionIndex && draggedItemIndex !== null && draggedItemIndex !== sectionIndex;

  return (
    <section
      id={`section-${section.id}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedItemIndex === null || draggedItemIndex === sectionIndex) return;
        setDragOverIndex(sectionIndex);
      }}
      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (dragOverIndex === sectionIndex) setDragOverIndex(null); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDrop(sectionIndex); }}
      className={`lcars-band ${draggedItemIndex === sectionIndex ? 'opacity-50' : ''} ${isSectionDropTarget ? 'ring-2 ring-[var(--accent-color)]/60 ring-offset-2 ring-offset-transparent' : ''}`}
    >
      <div className={`lcars-band-stripe ${getSectionDotColor(section.name)}`} />

      {/* pt-3 pb-2 instead of p-4: reduces bottom padding inside each section container */}
      <div className="flex-1 pt-3 px-4 pb-2">
        <div className="mb-3 flex items-center justify-between gap-4 flex-wrap lcars-section-header" style={{ color: getSectionColorHex(section.name) }}>
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <Tooltip title={t.editor.moveSectionUp ?? 'Move section up'}>
                <button type="button" onClick={() => moveSectionUp(section.id)} disabled={sectionIndex === 0 || section.name.toLowerCase() === 'intro'} className="flex h-5 w-5 items-center justify-center text-zinc-600 transition hover:text-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed">
                  <ChevronUp className="h-3 w-3" />
                </button>
              </Tooltip>
              <Tooltip title={t.editor.moveSectionDown ?? 'Move section down'}>
                <button type="button" onClick={() => moveSectionDown(section.id)} disabled={sectionIndex === songLength - 1 || section.name.toLowerCase() === 'outro'} className="flex h-5 w-5 items-center justify-center text-zinc-600 transition hover:text-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed">
                  <ChevronDown className="h-3 w-3" />
                </button>

              </Tooltip>
            </div>
            <div>
              <select
                value={section.name}
                onChange={(e) => setSectionName(section.id, e.target.value)}
                className={`lcars-section-title text-lg font-semibold uppercase tracking-[0.25em] bg-transparent border-none outline-none cursor-pointer ${getSectionTextColor(section.name)}`}
                style={{ color: getSectionColorHex(section.name) }}
              >
                {SECTION_TYPE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                ))}
                {!SECTION_TYPE_OPTIONS.includes(section.name) && (
                  <option value={section.name}>{section.name.toUpperCase()}</option>
                )}
              </select>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">{section.lines.length} {t.editor.lines ?? 'lines'}</p>
                <select
                  value={section.rhymeScheme || rhymeScheme}
                  onChange={(e) => setSectionRhymeScheme(section.id, e.target.value)}
                  className="text-[10px] uppercase tracking-[0.15em] bg-transparent border border-white/10 rounded px-1.5 py-0.5 text-zinc-500 dark:text-zinc-400 hover:border-white/25 transition cursor-pointer outline-none"
                >
                  {RHYME_KEYS.map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip title={t.tooltips.regenerateSection}>
              <button
                onClick={() => regenerateSection(section.id)}
                disabled={isGenerating || isAnalyzing || isRegeneratingSection(section.id)}
                className="flex items-center gap-2 rounded border border-[var(--accent-color)]/30 bg-[var(--accent-color)]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent-color)] transition hover:bg-[var(--accent-color)]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRegeneratingSection(section.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                {t.editor.regenerateSection}
              </button>
            </Tooltip>
            <Tooltip title={isSectionDraggable ? (t.editor.dragToReorder ?? 'Drag to reorder section') : (t.editor.anchoredSection ?? 'Intro and Outro stay anchored')}>
              <div
                draggable={isSectionDraggable}
                onDragStart={() => {
                  if (!isSectionDraggable) return;
                  setDraggedItemIndex(sectionIndex);
                  setDraggableSectionIndex(sectionIndex);
                  playAudioFeedback('drag');
                }}
                onDragEnd={() => { setDraggedItemIndex(null); setDragOverIndex(null); setDraggableSectionIndex(null); }}
                className={`cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300 transition-colors ${!isSectionDraggable ? 'cursor-not-allowed opacity-40' : ''}`}
              >
                <GripVertical className="h-5 w-5" />
              </div>
            </Tooltip>
          </div>
        </div>

        <InstructionEditor
          instructions={section.preInstructions}
          sectionId={section.id}
          type="pre"
          onChange={handleInstructionChange}
          onAdd={addInstruction}
          onRemove={removeInstruction}
        />

        <div className="mt-3 space-y-3">
          <div
            className="px-3 pb-1 border-b border-white/5 mb-1"
            style={{ display: 'grid', gridTemplateColumns: '20px 16px 16px 32px 1fr 72px 40px 52px 24px', alignItems: 'center', columnGap: '10px' }}
          >
            <div aria-hidden="true"/><div aria-hidden="true"/><div aria-hidden="true"/><div aria-hidden="true"/><div aria-hidden="true"/>
            <span className="micro-label text-zinc-600 dark:text-zinc-500" style={{ textAlign: 'center', whiteSpace: 'nowrap', minWidth: 0 }}>{t.editor.rhyme}</span>
            <span className="micro-label text-zinc-600 dark:text-zinc-500" style={{ textAlign: 'right', whiteSpace: 'nowrap', minWidth: 0 }}>{t.editor.syllables}</span>
            <span className="micro-label text-zinc-600 dark:text-zinc-500" style={{ textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{t.editor.rhymeSyllable}</span>
            <div/>
          </div>
          {section.lines.map((line, index) => {
            const isLineDropTarget = dragOverLineInfo?.sectionId === section.id && dragOverLineInfo.lineId === line.id;
            const isDraggedLine = draggedLineInfo?.sectionId === section.id && draggedLineInfo.lineId === line.id;
            return (
              <div
                key={line.id}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!draggedLineInfo || isDraggedLine) return; setDragOverLineInfo({ sectionId: section.id, lineId: line.id }); }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (isLineDropTarget) setDragOverLineInfo(null); }}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleLineDrop(section.id, line.id); }}
                className={`group transition-colors ${
                  selectedLineId === line.id
                    ? 'bg-[var(--accent-color)]/10 shadow-[inset_2px_0_0_var(--accent-color)]'
                    : 'hover:bg-white/[0.025]'
                } ${isLineDropTarget ? 'ring-1 ring-[var(--accent-color)]/60' : ''} ${isDraggedLine ? 'opacity-50' : ''}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 16px 16px 32px 1fr 72px 40px 52px 24px',
                  alignItems: 'center',
                  columnGap: '10px',
                  paddingLeft: '12px',
                  paddingRight: '12px',
                  minHeight: '36px',
                }}
              >
                {isSectionDraggable ? (
                  <Tooltip title={t.editor.dragToReorderLine ?? 'Drag to reorder line'}>
                    <div
                      draggable
                      onDragStart={() => handleLineDragStart(section.id, line.id)}
                      onDragEnd={() => { setDraggedLineInfo(null); setDragOverLineInfo(null); }}
                      className="flex h-8 w-5 items-center justify-center text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:text-zinc-300"
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </div>
                  </Tooltip>
                ) : <div />}

                <Tooltip title={line.isManual ? (t.editor.humanLine ?? 'Human') : (t.editor.aiLine ?? 'AI')}>
                  <span className="flex items-center justify-center w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity">
                    {line.isManual
                      ? <User className="h-3.5 w-3.5 text-emerald-400" />
                      : <Bot className="h-3.5 w-3.5 text-[var(--accent-color)]" />}
                  </span>
                </Tooltip>

                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Tooltip title={t.editor.moveLineUp ?? 'Move line up'}>
                    <button type="button" onClick={() => moveLineUp(section.id, line.id)} disabled={index === 0} className="flex h-4 w-4 items-center justify-center text-zinc-600 transition hover:text-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed">
                      <ChevronUp className="h-2.5 w-2.5" />
                    </button>
                  </Tooltip>
                  <Tooltip title={t.editor.moveLineDown ?? 'Move line down'}>
                    <button type="button" onClick={() => moveLineDown(section.id, line.id)} disabled={index === section.lines.length - 1} className="flex h-4 w-4 items-center justify-center text-zinc-600 transition hover:text-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed">
                      <ChevronDown className="h-2.5 w-2.5" />
                    </button>
                  </Tooltip>
                </div>

                <button type="button" onClick={() => handleLineClick(line.id)} className="flex h-8 w-8 items-center justify-center rounded-sm border border-black/10 bg-white/70 text-[11px] font-semibold text-zinc-500 transition group-hover:text-zinc-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400 dark:group-hover:text-zinc-200">
                  {index + 1}
                </button>

                <LyricInput
                  value={line.text}
                  onChange={(e) => updateLineText(section.id, line.id, e.target.value)}
                  onKeyDown={(e) => handleLineKeyDown(e, section.id, line.id)}
                  onClick={() => handleLineClick(line.id)}
                  data-line-id={line.id}
                  placeholder={`${section.name} line ${index + 1}`}
                  className="text-base text-zinc-900 placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  style={{ width: '100%', minWidth: 0 }}
                />

                <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {line.rhyme ? (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRhymeColor(line.rhyme)}`}>
                      {line.rhyme}
                    </span>
                  ) : null}
                </span>
                <span style={{ textAlign: 'right', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  {line.syllables > 0 ? line.syllables : ''}
                </span>
                <span style={{ textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)', opacity: line.rhymingSyllables ? 1 : 0 }}>
                  {line.rhymingSyllables || '\u00a0'}
                </span>

                <Tooltip title={t.editor.deleteLine ?? 'Delete line'}>
                  <button type="button" onClick={() => deleteLineFromSection(section.id, line.id)} className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/25 hover:text-red-300">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Tooltip>
              </div>
            );
          })}
        </div>

        {section.postInstructions && section.postInstructions.length > 0 && (
          <div className="mt-2 px-3">
            <InstructionEditor
              instructions={section.postInstructions}
              sectionId={section.id}
              type="post"
              onChange={handleInstructionChange}
              onAdd={addInstruction}
              onRemove={removeInstruction}
              showAddButton={false}
            />
          </div>
        )}

        {/* pt-1 pb-1 instead of pt-1 pb-2: tighter bottom clearance before border */}
        <div className="flex items-center gap-2 pt-1 pb-1 px-3">
          <button type="button" onClick={() => addLineToSection(section.id)} className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-[var(--accent-color)] transition-colors px-2 py-1 rounded">
            <Plus className="w-3 h-3" />
            {t.editor.addLine ?? 'Add Line'}
          </button>
          <span className="text-zinc-700 dark:text-zinc-600 text-[10px]">|</span>
          <button type="button" onClick={() => addInstruction(section.id, 'post')} className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-[var(--accent-color)] transition-colors px-2 py-1 rounded">
            <Plus className="w-3 h-3" />
            {t.editor.addMusicalEffect ?? 'Add Musical / Modulation / Effect'}
          </button>
        </div>
      </div>
    </section>
  );
});
