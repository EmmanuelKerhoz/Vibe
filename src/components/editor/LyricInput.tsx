import React, { useRef, useEffect, useState, useMemo } from 'react';
import { GripVertical, ChevronUp, ChevronDown, Plus, Trash2, Bot, User, Languages, Loader2, Ruler, Check } from '../ui/icons';
import type { Line } from '../../types';
import { useDrag } from '../../contexts/DragContext';
import { useDragHandlersContext } from '../../contexts/DragHandlersContext';
import { Tooltip } from '../ui/Tooltip';
import { EmojiSign } from '../ui/EmojiSign';
import { useTranslation } from '../../i18n';
import { getLanguageDisplay } from '../../i18n';
import { getRhymeTextColor } from '../../utils/songUtils';
import { splitRhymingSuffix } from '../../utils/rhymeDetection';
import { useRefs } from '../../contexts/RefsContext';
import type { AdaptationLangId } from '../../i18n/constants';
import { supportsSyllableHeuristics } from '../../lib/quantize';

export interface LyricInputProps {
  line: Line;
  lineIndex: number;
  globalLineNumber?: number;
  sectionId: string;
  sectionLinesCount: number;
  rhymePeerTexts: string[];
  selectedLineId: string | null;
  schemeLabel: string | null;
  rhymeColor: string;
  isGenerating: boolean;
  hasApiKey: boolean;
  isDraggedLine: boolean;
  isDragOverLine: boolean;
  lineLanguage?: string;
  handleLineClick: (lineId: string) => void;
  updateLineText: (sectionId: string, lineId: string, text: string) => void;
  handleLineKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, sectionId: string, lineId: string) => void;
  moveLineUp: (sectionId: string, lineId: string) => void;
  moveLineDown: (sectionId: string, lineId: string) => void;
  addLineToSection: (sectionId: string, afterLineId?: string) => void;
  deleteLineFromSection: (sectionId: string, lineId: string) => void;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
  adaptLineLanguage?: (sectionId: string, lineId: string, lang: AdaptationLangId) => void;
  sectionTargetLanguage?: string;
  isAdaptingLine?: boolean;
  onLineBlur?: () => void;
  /** Quantize the line against current song BPM + time signature. */
  onQuantizeLine?: (sectionId: string, lineId: string) => void;
}

export const LyricInput = React.memo(function LyricInput({
  line,
  lineIndex,
  globalLineNumber,
  sectionId,
  sectionLinesCount,
  rhymePeerTexts,
  selectedLineId,
  schemeLabel,
  rhymeColor,
  isGenerating,
  hasApiKey,
  isDraggedLine,
  isDragOverLine,
  lineLanguage,
  handleLineClick,
  updateLineText,
  handleLineKeyDown,
  moveLineUp,
  moveLineDown,
  addLineToSection,
  deleteLineFromSection,
  playAudioFeedback,
  adaptLineLanguage,
  sectionTargetLanguage,
  isAdaptingLine = false,
  onLineBlur,
  onQuantizeLine,
}: LyricInputProps) {
  const { t } = useTranslation();
  const { setDraggedLineInfo, setDragOverLineInfo } = useDrag();
  const { handleLineDragStart, handleLineDrop } = useDragHandlersContext();
  const { registerRef } = useRefs();
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelected = selectedLineId === line.id;
  const rhymeTextColor = getRhymeTextColor(schemeLabel);
  const lineLanguageDisplay = lineLanguage ? getLanguageDisplay(lineLanguage) : null;
  const [quantized, setQuantized] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quantizedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isQuantizeSupported = supportsSyllableHeuristics(line.text, lineLanguage || sectionTargetLanguage || '');
  const quantizeTooltip = !isQuantizeSupported
    ? (t.editor?.quantize_line_unsupported ?? 'Quantize supports Latin-script lyrics only')
    : quantized ? (t.editor?.quantize_line_done ?? 'Line quantized') : (t.editor?.quantize_line ?? 'Quantize line');
  const controlsWidth = useMemo(() => {
    if (adaptLineLanguage && onQuantizeLine) return 'w-24';
    if (adaptLineLanguage || onQuantizeLine) return 'w-20';
    return 'w-16';
  }, [adaptLineLanguage, onQuantizeLine]);

  useEffect(() => {
    if (isSelected && inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected]);

  useEffect(() => {
    registerRef(line.id, inputRef.current);
    return () => registerRef(line.id, null);
  }, [line.id, registerRef]);

  useEffect(() => {
    if (quantizedTimeoutRef.current) clearTimeout(quantizedTimeoutRef.current);
    setQuantized(false);
  }, [line.id]);

  useEffect(() => () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    if (quantizedTimeoutRef.current) clearTimeout(quantizedTimeoutRef.current);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => updateLineText(sectionId, line.id, e.target.value);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => handleLineKeyDown(e, sectionId, line.id);
  const handleClick = () => handleLineClick(line.id);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!onLineBlur) return;
    const related = e.relatedTarget as HTMLElement | null;
    if (related) {
      // Focus moving to another line input — handleLineClick will set the new selection
      if (related.dataset.lineId) return;
      // Focus moving into the suggestions panel — keep it open
      if (related.closest('[data-suggestions-panel]')) return;
    }
    // Allow time for click handlers on suggestion items to fire before clearing selection
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(onLineBlur, 80);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    handleLineDragStart(sectionId, line.id);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragOverLineInfo({ sectionId, lineId: line.id });
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragOverLineInfo(null);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    handleLineDrop(sectionId, line.id);
    playAudioFeedback('drop');
  };
  const handleDragEnd = () => { setDraggedLineInfo(null); setDragOverLineInfo(null); };

  /**
   * Renders the styled text overlay:
   *  - Parenthesised stage directions: amber (intentional accent, both themes)
   *  - Rhyming suffix of last word: rhymeTextColor
   *  - Everything else: var(--text-primary) — readable in both light and dark themes
   */
  const renderStyledOverlay = (text: string) => {
    if (!text) return null;

    const parts = text.split(/(\([^)]*\))/g);

    return parts.map((part, i) => {
      if (part.startsWith('(') && part.endsWith(')')) {
        return <span key={i} className="text-amber-400">{part}</span>;
      }

      const isLastPart = i === parts.length - 1;
      if (isLastPart && rhymeTextColor) {
        const langHint = lineLanguage || sectionTargetLanguage;
        const split = splitRhymingSuffix(part, rhymePeerTexts, langHint);
        if (split) {
          return (
            <span key={i}>
              <span className="text-[var(--text-primary)]">{split.before}</span>
              <span style={{ color: rhymeTextColor, fontWeight: 600 }}>{split.rhyme}</span>
            </span>
          );
        }
      }

      return <span key={i} className="text-[var(--text-primary)]">{part}</span>;
    });
  };

  return (
    <div
      className={[
        'group relative flex items-center gap-1.5 rounded pl-1 pr-8 py-1 transition-all',
        isSelected ? 'bg-black/[0.03] dark:bg-white/5' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]',
        isDraggedLine ? 'opacity-40' : '',
        isDragOverLine ? 'border-t border-[var(--accent-color)]/60' : '',
      ].join(' ')}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Line number */}
      <span className="flex-shrink-0 w-6 text-right text-[9px] tabular-nums font-mono text-zinc-600 dark:text-zinc-400 select-none" aria-hidden="true">
        {globalLineNumber ?? ''}
      </span>

      {/* Drag handle */}
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="cursor-grab opacity-0 group-hover:opacity-40 hover:!opacity-80 flex-shrink-0 touch-none transition-opacity"
      >
        <GripVertical className="h-3.5 w-3.5 text-zinc-500" />
      </div>

      {/* AI / Human origin indicator */}
      <Tooltip title={line.isManual ? (t.editor?.humanLine ?? 'Human line') : (t.editor?.aiLine ?? 'AI-generated line')}>
        <span className="flex-shrink-0 flex items-center justify-center w-3.5">
          {line.isManual
            ? <User className="h-2.5 w-2.5 text-zinc-500 dark:text-zinc-400" />
            : <Bot className="h-2.5 w-2.5 text-[var(--accent-color)]" />}
        </span>
      </Tooltip>

      {/* Per-line language flag */}
      {lineLanguageDisplay && (
        <Tooltip title={lineLanguageDisplay.label}>
          <span className="flex-shrink-0 flex items-center justify-center w-3.5">
            <EmojiSign sign={lineLanguageDisplay.sign} />
          </span>
        </Tooltip>
      )}

      {/* Text input with styled overlay */}
      <div className="relative flex-1 min-w-0" onClick={handleClick}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center text-sm font-mono overflow-hidden whitespace-pre"
          style={{ font: 'inherit', letterSpacing: 'inherit' }}
        >
          {renderStyledOverlay(line.text)}
        </div>
        <input
          ref={inputRef}
          data-line-id={line.id}
          type="text"
          value={line.text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isGenerating}
          placeholder={t.editor?.linePlaceholder ?? 'Write a lyric line…'}
          className="w-full bg-transparent text-sm font-mono text-transparent caret-[color:var(--text-primary)] outline-none border-none focus:ring-0 placeholder:text-[var(--text-secondary)] disabled:cursor-not-allowed relative z-10"
          style={{ font: 'inherit', letterSpacing: 'inherit' }}
          spellCheck
          autoComplete="off"
        />
      </div>

      {/* Line controls — visible on hover */}
      <div className={`flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${controlsWidth}`}>
        {adaptLineLanguage && (
          <Tooltip title={hasApiKey ? (t.editor?.adaptLine ?? `Adapt line to ${sectionTargetLanguage ?? 'target language'}`) : (t.tooltips.aiUnavailable ?? 'AI unavailable')}>
            <button
              type="button"
              onClick={() => {
                // TODO: sectionTargetLanguage comes from the UI selector as a plain string.
                // Replace this cast with a runtime guard (isSupportedAdaptationLangId)
                // once the selector enforces AdaptationLangId at the source.
                adaptLineLanguage(sectionId, line.id, (sectionTargetLanguage ?? 'English') as AdaptationLangId);
                playAudioFeedback('click');
              }}
              disabled={!hasApiKey || isAdaptingLine || isGenerating}
              className="flex h-4 w-4 items-center justify-center text-cyan-600 hover:text-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {isAdaptingLine
                ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                : <Languages className="h-2.5 w-2.5" />}
            </button>
          </Tooltip>
        )}
        {onQuantizeLine && (
          <Tooltip title={quantizeTooltip}>
            <button
              type="button"
              onClick={() => {
                if (!isQuantizeSupported) return;
                onQuantizeLine(sectionId, line.id);
                playAudioFeedback('success');
                setQuantized(true);
                if (quantizedTimeoutRef.current) clearTimeout(quantizedTimeoutRef.current);
                quantizedTimeoutRef.current = setTimeout(() => setQuantized(false), 1500);
              }}
              disabled={isGenerating || !line.text.trim() || !isQuantizeSupported}
              className="flex h-4 w-4 items-center justify-center text-violet-500 hover:text-violet-300 disabled:opacity-20 disabled:cursor-not-allowed transition"
            >
              {quantized
                ? <Check className="h-2.5 w-2.5" />
                : <Ruler className="h-2.5 w-2.5" />}
            </button>
          </Tooltip>
        )}
        <Tooltip title={t.editor?.moveLineUp ?? 'Move line up'}>
          <button type="button" onClick={() => { moveLineUp(sectionId, line.id); playAudioFeedback('click'); }} disabled={lineIndex === 0}
            className="flex h-4 w-4 items-center justify-center text-zinc-500 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed transition">
            <ChevronUp className="h-2.5 w-2.5" />
          </button>
        </Tooltip>
        <Tooltip title={t.editor?.moveLineDown ?? 'Move line down'}>
          <button type="button" onClick={() => { moveLineDown(sectionId, line.id); playAudioFeedback('click'); }} disabled={lineIndex === sectionLinesCount - 1}
            className="flex h-4 w-4 items-center justify-center text-zinc-500 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed transition">
            <ChevronDown className="h-2.5 w-2.5" />
          </button>
        </Tooltip>
        <Tooltip title={t.editor?.addLineAfter ?? 'Add line after'}>
          <button type="button" onClick={() => { addLineToSection(sectionId, line.id); playAudioFeedback('click'); }}
            className="flex h-4 w-4 items-center justify-center text-zinc-500 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200 transition">
            <Plus className="h-2.5 w-2.5" />
          </button>
        </Tooltip>
        <Tooltip title={t.editor?.deleteLine ?? 'Delete line'}>
          <button type="button" onClick={() => { deleteLineFromSection(sectionId, line.id); playAudioFeedback('click'); }} disabled={sectionLinesCount <= 1}
            className="flex h-4 w-4 items-center justify-center text-zinc-500 dark:text-zinc-600 hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed transition">
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        </Tooltip>
      </div>

      {/* COL: COUNT */}
      <span className="flex-shrink-0 text-[9px] tabular-nums text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors w-[2.75rem] text-right">
        {line.syllables > 0 ? line.syllables : ''}
      </span>

      {/* COL: SPACER */}
      <span className="flex-shrink-0 w-2" />

      {/* COL: SCHEMA */}
      <span
        className={`flex-shrink-0 inline-flex h-4 w-7 items-center justify-center rounded border text-[9px] font-bold uppercase tracking-widest transition-all ${schemeLabel ? rhymeColor : 'opacity-0'}`}
      >
        {schemeLabel ?? ''}
      </span>
    </div>
  );
});
