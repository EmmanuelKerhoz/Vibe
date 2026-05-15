import React, { useRef, useEffect, useState, useMemo } from 'react';
import { GripVertical, ChevronUp, ChevronDown, Plus, Trash2, Bot, User, Languages, Loader2, Ruler, Check } from '../ui/icons';
import type { Line } from '../../types';
import { useDragActions } from '../../contexts/DragContext';
import { useDragHandlersContext } from '../../contexts/DragHandlersContext';
import { Tooltip } from '../ui/Tooltip';
import { EmojiSign } from '../ui/EmojiSign';
import { useTranslation } from '../../i18n';
import { getLanguageDisplay } from '../../i18n';
import { getRhymeTextColor } from '../../utils/songUtils';
import { splitRhymingSuffix } from '../../utils/rhymeDetection';
import { useRefs } from '../../contexts/RefsContext';
import type { AdaptationLangId } from '../../i18n/constants';
import { migrateAdaptationToLangId } from '../../i18n/constants';
import { supportsSyllableHeuristics } from '../../lib/quantize';

type PlayAudioFeedback = (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;

type LyricInputRhymeProps = {
  peerTexts: string[];
  schemeLabel: string | null;
};

type LyricInputSelectionProps = {
  selectedLineId: string | null;
  onLineClick: (lineId: string) => void;
  onLineBlur?: () => void;
};

type LyricInputEditingProps = {
  updateLineText: (sectionId: string, lineId: string, text: string) => void;
  handleLineKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, sectionId: string, lineId: string) => void;
};

type LyricInputControlProps = {
  sectionLinesCount: number;
  isGenerating: boolean;
  moveLineUp: (sectionId: string, lineId: string) => void;
  moveLineDown: (sectionId: string, lineId: string) => void;
  addLineToSection: (sectionId: string, afterLineId?: string) => void;
  deleteLineFromSection: (sectionId: string, lineId: string) => void;
  playAudioFeedback: PlayAudioFeedback;
  onQuantizeLine?: (sectionId: string, lineId: string) => void;
};

type LyricInputLanguageProps = {
  lineLanguage?: string | undefined;
  sectionTargetLanguage?: string | undefined;
  adaptLineLanguage?: ((sectionId: string, lineId: string, lang: AdaptationLangId) => void) | undefined;
  isAdaptingLine?: boolean;
};

type LyricInputDragStateProps = {
  isDraggedLine: boolean;
  isDragOverLine: boolean;
};

export interface LyricInputProps {
  line: Line;
  lineIndex: number;
  globalLineNumber?: number | undefined;
  sectionId: string;
  rhyme: LyricInputRhymeProps;
  selection: LyricInputSelectionProps;
  editing: LyricInputEditingProps;
  controls: LyricInputControlProps;
  language?: LyricInputLanguageProps;
  dragState: LyricInputDragStateProps;
}

interface LineBadgesProps {
  line: Line;
  lineLanguageDisplay: ReturnType<typeof getLanguageDisplay> | null;
  schemeLabel: string | null;
  t: ReturnType<typeof useTranslation>['t'];
}

const LineBadges = React.memo(function LineBadges({ line, lineLanguageDisplay, schemeLabel, t }: LineBadgesProps) {
  return (
    <>
      <Tooltip title={line.isManual ? (t.editor?.humanLine ?? 'Human line') : (t.editor?.aiLine ?? 'AI-generated line')}>
        <span className="flex-shrink-0 flex items-center justify-center w-3.5">
          {line.isManual
            ? <User className="h-2.5 w-2.5 text-[var(--text-secondary)]" />
            : <Bot className="h-2.5 w-2.5 text-[var(--accent-color)]" />}
        </span>
      </Tooltip>

      {lineLanguageDisplay && (
        <Tooltip title={lineLanguageDisplay.label}>
          <span className="flex-shrink-0 text-[11px] leading-none select-none" aria-hidden="true">
            {lineLanguageDisplay.sign}
          </span>
        </Tooltip>
      )}

      {schemeLabel && (
        <Tooltip title={`Rhyme scheme: ${schemeLabel}`}>
          <EmojiSign sign={schemeLabel} />
        </Tooltip>
      )}
    </>
  );
});

interface LyricTextFieldProps {
  inputRef: React.RefObject<HTMLInputElement>;
  line: Line;
  lineIndex: number;
  globalLineNumber?: number | undefined;
  rhymeTextColor: string | null;
  rhymePeerTexts: string[];
  lineLanguage?: string | undefined;
  sectionTargetLanguage?: string | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClick: () => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const LyricTextField = React.memo(function LyricTextField({
  inputRef,
  line,
  lineIndex,
  globalLineNumber,
  rhymeTextColor,
  rhymePeerTexts,
  lineLanguage,
  sectionTargetLanguage,
  onChange,
  onKeyDown,
  onClick,
  onBlur,
}: LyricTextFieldProps) {
  const renderStyledOverlay = (text: string) => {
    if (!text) return null;

    const parts = text.split(/(\([^)]*\))/g);

    return parts.map((part, i) => {
      if (part.startsWith('(') && part.endsWith(')')) {
        return <span key={i} className="text-[var(--lcars-amber)]">{part}</span>;
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
    <div className="relative flex-1 min-w-0">
      <input
        ref={inputRef}
        type="text"
        value={line.text}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onClick={onClick}
        onBlur={onBlur}
        data-line-id={line.id}
        className="w-full bg-transparent border-none outline-none text-sm font-sans caret-[color:var(--text-primary)] text-transparent selection:bg-[var(--accent-color)]/20"
        style={{ font: 'inherit' }}
        aria-label={`Line ${(globalLineNumber ?? lineIndex + 1)}`}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
      <div
        className="absolute inset-0 pointer-events-none text-sm font-sans flex items-center overflow-hidden whitespace-pre"
        aria-hidden="true"
        style={{ font: 'inherit' }}
      >
        {renderStyledOverlay(line.text)}
      </div>
    </div>
  );
});

interface LyricLineControlsProps {
  line: Line;
  lineIndex: number;
  sectionId: string;
  sectionLinesCount: number;
  isGenerating: boolean;
  lineLanguage?: string | undefined;
  sectionTargetLanguage?: string | undefined;
  adaptLineLanguage?: ((sectionId: string, lineId: string, lang: AdaptationLangId) => void) | undefined;
  isAdaptingLine: boolean;
  onQuantizeLine?: ((sectionId: string, lineId: string) => void) | undefined;
  moveLineUp: (sectionId: string, lineId: string) => void;
  moveLineDown: (sectionId: string, lineId: string) => void;
  addLineToSection: (sectionId: string, afterLineId?: string) => void;
  deleteLineFromSection: (sectionId: string, lineId: string) => void;
  playAudioFeedback: PlayAudioFeedback;
  t: ReturnType<typeof useTranslation>['t'];
}

const LyricLineControls = React.memo(function LyricLineControls({
  line,
  lineIndex,
  sectionId,
  sectionLinesCount,
  isGenerating,
  lineLanguage,
  sectionTargetLanguage,
  adaptLineLanguage,
  isAdaptingLine,
  onQuantizeLine,
  moveLineUp,
  moveLineDown,
  addLineToSection,
  deleteLineFromSection,
  playAudioFeedback,
  t,
}: LyricLineControlsProps) {
  const [quantized, setQuantized] = useState(false);
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
    if (quantizedTimeoutRef.current) clearTimeout(quantizedTimeoutRef.current);
    setQuantized(false);
  }, [line.id]);

  useEffect(() => () => {
    if (quantizedTimeoutRef.current) clearTimeout(quantizedTimeoutRef.current);
  }, []);

  const handleAdaptLine = () => {
    if (!adaptLineLanguage) return;
    const migrated = sectionTargetLanguage ? migrateAdaptationToLangId(sectionTargetLanguage) : '';
    const lang = (migrated || 'adapt:FR') as AdaptationLangId;
    adaptLineLanguage(sectionId, line.id, lang);
    playAudioFeedback('click');
  };

  const handleQuantizeLine = () => {
    if (!onQuantizeLine || !isQuantizeSupported) return;
    onQuantizeLine(sectionId, line.id);
    setQuantized(true);
    if (quantizedTimeoutRef.current) clearTimeout(quantizedTimeoutRef.current);
    quantizedTimeoutRef.current = setTimeout(() => setQuantized(false), 2000);
    playAudioFeedback('click');
  };

  return (
    <div className={`absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 ${controlsWidth} justify-end pr-1`}>
      {adaptLineLanguage && (
        <Tooltip title={t.editor?.adaptLine ?? 'Adapt line language'}>
          <button
            onClick={handleAdaptLine}
            disabled={isAdaptingLine || isGenerating}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 flex-shrink-0 p-0.5 rounded transition-opacity disabled:opacity-30"
            aria-label={t.editor?.adaptLine ?? 'Adapt line language'}
          >
            {isAdaptingLine
              ? <Loader2 className="h-3 w-3 text-[var(--lcars-blue)] animate-spin" />
              : <Languages className="h-3 w-3 text-[var(--lcars-blue)] hover:text-[var(--accent-color)]" />}
          </button>
        </Tooltip>
      )}

      {onQuantizeLine && (
        <Tooltip title={quantizeTooltip}>
          <button
            onClick={handleQuantizeLine}
            disabled={!isQuantizeSupported}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 flex-shrink-0 p-0.5 rounded transition-opacity disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label={quantizeTooltip}
          >
            {quantized
              ? <Check className="h-3 w-3 text-[var(--accent-success)]" />
              : <Ruler className="h-3 w-3 text-[var(--lcars-violet)]" />}
          </button>
        </Tooltip>
      )}

      <Tooltip title={t.editor?.moveLineUp ?? 'Move up'}>
        <button
          onClick={() => { moveLineUp(sectionId, line.id); playAudioFeedback('click'); }}
          disabled={lineIndex === 0}
          className="opacity-0 group-hover:opacity-40 hover:!opacity-80 flex-shrink-0 p-0.5 rounded transition-opacity disabled:opacity-0"
          aria-label={t.editor?.moveLineUp ?? 'Move up'}
        >
          <ChevronUp className="h-3 w-3 text-[var(--text-secondary)]" />
        </button>
      </Tooltip>

      <Tooltip title={t.editor?.moveLineDown ?? 'Move down'}>
        <button
          onClick={() => { moveLineDown(sectionId, line.id); playAudioFeedback('click'); }}
          disabled={lineIndex === sectionLinesCount - 1}
          className="opacity-0 group-hover:opacity-40 hover:!opacity-80 flex-shrink-0 p-0.5 rounded transition-opacity disabled:opacity-0"
          aria-label={t.editor?.moveLineDown ?? 'Move down'}
        >
          <ChevronDown className="h-3 w-3 text-[var(--text-secondary)]" />
        </button>
      </Tooltip>

      <Tooltip title={`${t.editor?.addLine ?? 'Add line'} after current line`}>
        <button
          onClick={() => { addLineToSection(sectionId, line.id); playAudioFeedback('click'); }}
          className="opacity-0 group-hover:opacity-40 hover:!opacity-80 flex-shrink-0 p-0.5 rounded transition-opacity"
          aria-label={`${t.editor?.addLine ?? 'Add line'} after current line`}
        >
          <Plus className="h-3 w-3 text-[var(--text-secondary)]" />
        </button>
      </Tooltip>

      <Tooltip title={t.editor?.deleteLine ?? 'Delete line'}>
        <button
          onClick={() => { deleteLineFromSection(sectionId, line.id); playAudioFeedback('error'); }}
          className="opacity-0 group-hover:opacity-40 hover:!opacity-100 flex-shrink-0 p-0.5 rounded transition-opacity hover:text-[var(--accent-error)]"
          aria-label={t.editor?.deleteLine ?? 'Delete line'}
        >
          <Trash2 className="h-3 w-3 text-[var(--text-secondary)]" />
        </button>
      </Tooltip>
    </div>
  );
});

export const LyricInput = React.memo(function LyricInput({
  line,
  lineIndex,
  globalLineNumber,
  sectionId,
  rhyme,
  selection,
  editing,
  controls,
  language,
  dragState,
}: LyricInputProps) {
  const { t } = useTranslation();
  const { setDraggedLineInfo, setDragOverLineInfo } = useDragActions();
  const { handleLineDragStart, handleLineDrop } = useDragHandlersContext();
  const { registerRef } = useRefs();
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelected = selection.selectedLineId === line.id;
  const rhymeTextColor = getRhymeTextColor(rhyme.schemeLabel);
  const lineLanguage = language?.lineLanguage;
  const sectionTargetLanguage = language?.sectionTargetLanguage;
  const lineLanguageDisplay = lineLanguage ? getLanguageDisplay(lineLanguage) : null;

  useEffect(() => {
    if (isSelected && inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected]);

  useEffect(() => {
    registerRef(line.id, inputRef.current);
    return () => registerRef(line.id, null);
  }, [line.id, registerRef]);

  useEffect(() => () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => editing.updateLineText(sectionId, line.id, e.target.value);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => editing.handleLineKeyDown(e, sectionId, line.id);
  const handleClick = () => selection.onLineClick(line.id);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!selection.onLineBlur) return;
    const related = e.relatedTarget as HTMLElement | null;
    if (related) {
      if (related.dataset.lineId) return;
      if (related.closest('[data-suggestions-panel]')) return;
    }
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(selection.onLineBlur, 80);
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
    controls.playAudioFeedback('drop');
  };
  const handleDragEnd = () => { setDraggedLineInfo(null); setDragOverLineInfo(null); };

  return (
    <div
      className={[
        'group relative flex items-center gap-1.5 rounded pl-1 pr-8 py-1 transition-all',
        isSelected ? 'bg-black/[0.03] dark:bg-white/5' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]',
        dragState.isDraggedLine ? 'opacity-40' : '',
        dragState.isDragOverLine ? 'border-t border-[var(--accent-color)]/60' : '',
      ].join(' ')}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className="flex-shrink-0 w-6 text-right text-[9px] tabular-nums font-mono text-[var(--text-secondary)] select-none" aria-hidden="true">
        {globalLineNumber ?? ''}
      </span>

      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="cursor-grab opacity-0 group-hover:opacity-40 hover:!opacity-80 flex-shrink-0 touch-none transition-opacity"
      >
        <GripVertical className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
      </div>

      <LineBadges
        line={line}
        lineLanguageDisplay={lineLanguageDisplay}
        schemeLabel={rhyme.schemeLabel}
        t={t}
      />

      <LyricTextField
        inputRef={inputRef}
        line={line}
        lineIndex={lineIndex}
        globalLineNumber={globalLineNumber}
        rhymeTextColor={rhymeTextColor}
        rhymePeerTexts={rhyme.peerTexts}
        lineLanguage={lineLanguage}
        sectionTargetLanguage={sectionTargetLanguage}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onBlur={handleBlur}
      />

      <LyricLineControls
        line={line}
        lineIndex={lineIndex}
        sectionId={sectionId}
        sectionLinesCount={controls.sectionLinesCount}
        isGenerating={controls.isGenerating}
        lineLanguage={lineLanguage}
        sectionTargetLanguage={sectionTargetLanguage}
        adaptLineLanguage={language?.adaptLineLanguage}
        isAdaptingLine={language?.isAdaptingLine ?? false}
        onQuantizeLine={controls.onQuantizeLine}
        moveLineUp={controls.moveLineUp}
        moveLineDown={controls.moveLineDown}
        addLineToSection={controls.addLineToSection}
        deleteLineFromSection={controls.deleteLineFromSection}
        playAudioFeedback={controls.playAudioFeedback}
        t={t}
      />
    </div>
  );
});
