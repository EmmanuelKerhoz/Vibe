import React, { useRef, useState, useCallback } from 'react';
import type { Line } from '../../types';
import { useDragActions } from '../../contexts/DragContext';
import { useDragHandlersContext } from '../../contexts/DragHandlersContext';
import { Tooltip } from '../ui/Tooltip';
import { EmojiSign } from '../ui/EmojiSign';
import { useTranslation } from '../../i18n';
import { getLanguageDisplay } from '../../i18n';
import type { AdaptationLangId } from '../../i18n/constants';
import { getRhymeColor, getRhymeTextColor } from '../../utils/songUtils';
import { LyricDragHandle } from './LyricDragHandle';
import { LyricTextArea } from './LyricTextArea';
import { LyricLineControls } from './LyricLineControls';

interface LyricInputRhymeProps {
  peerTexts: string[];
  schemeLabel: string | null;
}

interface LyricInputSelectionProps {
  selectedLineId: string | null;
  onLineClick: (lineId: string) => void;
  onLineBlur?: () => void;
}

interface LyricInputEditingProps {
  updateLineText: (sectionId: string, lineId: string, text: string) => void;
  handleLineKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, sectionId: string, lineId: string) => void;
  updateLineSyllables?: (sectionId: string, lineId: string, count: number) => void;
}

interface LyricInputControlsProps {
  sectionLinesCount: number;
  isGenerating: boolean;
  hasApiKey: boolean;
  moveLineUp: (sectionId: string, lineId: string) => void;
  moveLineDown: (sectionId: string, lineId: string) => void;
  addLineToSection: (sectionId: string, afterLineId?: string) => void;
  deleteLineFromSection: (sectionId: string, lineId: string) => void;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
  onQuantizeLine?: (sectionId: string, lineId: string) => void;
}

interface LyricInputLanguageProps {
  lineLanguage?: string;
  sectionTargetLanguage?: string;
  adaptLineLanguage?: (sectionId: string, lineId: string, lang: AdaptationLangId) => void;
  isAdaptingLine: boolean;
}

interface LyricInputDragStateProps {
  isDraggedLine: boolean;
  isDragOverLine: boolean;
}

export interface LyricInputProps {
  line: Line;
  lineIndex: number;
  globalLineNumber?: number;
  sectionId: string;
  rhyme: LyricInputRhymeProps;
  selection: LyricInputSelectionProps;
  editing: LyricInputEditingProps;
  controls: LyricInputControlsProps;
  language: LyricInputLanguageProps;
  dragState: LyricInputDragStateProps;
  /** Max syllables in the section — used to compute the background gauge fill. */
  sectionMaxSyllables: number;
}

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
  sectionMaxSyllables,
}: LyricInputProps) {
  const { t } = useTranslation();
  const { setDraggedLineInfo, setDragOverLineInfo } = useDragActions();
  const { handleLineDrop } = useDragHandlersContext();
  const { peerTexts: rhymePeerTexts, schemeLabel } = rhyme;
  const { selectedLineId, onLineClick, onLineBlur } = selection;
  const { updateLineText, handleLineKeyDown, updateLineSyllables } = editing;
  const {
    sectionLinesCount,
    isGenerating,
    hasApiKey,
    moveLineUp,
    moveLineDown,
    addLineToSection,
    deleteLineFromSection,
    playAudioFeedback,
    onQuantizeLine,
  } = controls;
  const { lineLanguage, sectionTargetLanguage, adaptLineLanguage, isAdaptingLine } = language;
  const { isDraggedLine, isDragOverLine } = dragState;
  const lineLanguageDisplay = lineLanguage ? getLanguageDisplay(lineLanguage) : null;
  const rhymeColor = getRhymeColor(schemeLabel);
  const rhymeHexColor = getRhymeTextColor(schemeLabel);
  const isSelected = selectedLineId === line.id;
  const dragEndRef = useRef<() => void>(() => setDraggedLineInfo(null));
  dragEndRef.current = () => setDraggedLineInfo(null);

  // COUNT editable state
  const [countEditing, setCountEditing] = useState(false);
  const [countDraft, setCountDraft] = useState('');
  // quantize offer: 'idle' | 'asking'
  const [quantizeState, setQuantizeState] = useState<'idle' | 'asking'>('idle');
  const pendingCountRef = useRef<number>(0);

  const handleCountFocus = useCallback(() => {
    setCountDraft(line.syllables > 0 ? String(line.syllables) : '');
    setCountEditing(true);
  }, [line.syllables]);

  const commitCount = useCallback(() => {
    setCountEditing(false);
    const parsed = parseInt(countDraft, 10);
    if (isNaN(parsed) || parsed <= 0 || parsed === line.syllables) {
      setQuantizeState('idle');
      return;
    }
    if (onQuantizeLine && updateLineSyllables) {
      pendingCountRef.current = parsed;
      updateLineSyllables(sectionId, line.id, parsed);
      setQuantizeState('asking');
    } else if (updateLineSyllables) {
      updateLineSyllables(sectionId, line.id, parsed);
    }
  }, [countDraft, line.syllables, line.id, sectionId, onQuantizeLine, updateLineSyllables]);

  const handleCountKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commitCount(); }
    if (e.key === 'Escape') {
      e.preventDefault();
      setCountEditing(false);
      setCountDraft('');
    }
    // block propagation so editor key handlers don't intercept
    e.stopPropagation();
  }, [commitCount]);

  const acceptQuantize = useCallback(() => {
    setQuantizeState('idle');
    if (onQuantizeLine) onQuantizeLine(sectionId, line.id);
  }, [onQuantizeLine, sectionId, line.id]);

  const rejectQuantize = useCallback(() => {
    setQuantizeState('idle');
    // restore original syllable count (revert to computed)
    if (updateLineSyllables) {
      updateLineSyllables(sectionId, line.id, line.syllables);
    }
  }, [updateLineSyllables, sectionId, line.id, line.syllables]);

  const textAreaOptionalProps = {
    ...(lineLanguage ? { lineLanguage } : {}),
    ...(sectionTargetLanguage ? { sectionTargetLanguage } : {}),
    ...(onLineBlur ? { onBlur: onLineBlur } : {}),
  };
  const controlsOptionalProps = {
    ...(lineLanguage ? { lineLanguage } : {}),
    ...(sectionTargetLanguage ? { sectionTargetLanguage } : {}),
    ...(adaptLineLanguage ? { adaptLineLanguage } : {}),
  };

  // Syllable gauge
  const GAUGE_RIGHT_OFFSET = '7rem';
  const gaugePct = sectionMaxSyllables > 0 && line.syllables > 0
    ? Math.min(line.syllables / sectionMaxSyllables, 1)
    : 0;

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

  return (
    <div
      className={[
        'group relative flex items-center gap-1.5 rounded pl-1 pr-8 py-1 transition-all overflow-visible',
        isSelected ? 'bg-black/[0.03] dark:bg-white/5' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]',
        isDraggedLine ? 'opacity-40' : '',
        isDragOverLine ? 'border-t border-[var(--accent-color)]/60' : '',
      ].join(' ')}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Syllable gauge */}
      {gaugePct > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 rounded transition-all duration-300"
          style={{
            width: `calc(${gaugePct} * (100% - ${GAUGE_RIGHT_OFFSET}))`,
            background: 'var(--accent-color)',
            opacity: 0.20,
            boxShadow: 'inset -2px 0 0 0 var(--accent-color)',
          }}
        />
      )}

      <span
        className="flex-shrink-0 w-6 text-right text-[9px] tabular-nums font-mono text-zinc-600 dark:text-zinc-400 select-none"
        aria-hidden="true"
      >
        {globalLineNumber ?? ''}
      </span>

      <LyricDragHandle
        sectionId={sectionId}
        lineId={line.id}
        onDragEnd={dragEndRef.current}
      />

      {lineLanguageDisplay && (
        <Tooltip title={lineLanguageDisplay.label}>
          <span className="flex-shrink-0 flex items-center justify-center w-3.5">
            <EmojiSign sign={lineLanguageDisplay.sign} />
          </span>
        </Tooltip>
      )}

      <LyricTextArea
        line={line}
        sectionId={sectionId}
        isGenerating={isGenerating}
        isSelected={isSelected}
        rhymePeerTexts={rhymePeerTexts}
        schemeLabel={schemeLabel}
        rhymeColor={rhymeColor}
        rhymeHexColor={rhymeHexColor}
        onUpdate={updateLineText}
        onKeyDown={handleLineKeyDown}
        onClick={() => onLineClick(line.id)}
        {...textAreaOptionalProps}
      />

      <LyricLineControls
        line={line}
        sectionId={sectionId}
        lineIndex={lineIndex}
        sectionLinesCount={sectionLinesCount}
        hasApiKey={hasApiKey}
        isGenerating={isGenerating}
        isAdaptingLine={isAdaptingLine}
        moveLineUp={moveLineUp}
        moveLineDown={moveLineDown}
        addLineToSection={addLineToSection}
        deleteLineFromSection={deleteLineFromSection}
        playAudioFeedback={playAudioFeedback}
        {...controlsOptionalProps}
      />

      {/* COUNT column — editable input */}
      <div className="relative flex-shrink-0 w-[2.75rem] flex justify-end">
        {countEditing ? (
          <input
            type="number"
            min={1}
            max={99}
            value={countDraft}
            onChange={e => setCountDraft(e.target.value)}
            onBlur={commitCount}
            onKeyDown={handleCountKeyDown}
            autoFocus
            className={[
              'w-full text-right text-[9px] tabular-nums font-mono bg-transparent border-b',
              'border-[var(--accent-color)] text-zinc-900 dark:text-zinc-100 outline-none',
              '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            ].join(' ')}
            aria-label={t.editor?.syllableCount ?? 'Syllable count'}
          />
        ) : (
          <Tooltip title={t.editor?.editSyllableCount ?? 'Edit syllable count'}>
            <button
              type="button"
              onClick={handleCountFocus}
              className="w-full text-right text-[9px] tabular-nums font-mono text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 hover:text-[var(--accent-color)] dark:hover:text-[var(--accent-color)] transition-colors bg-transparent cursor-text"
              aria-label={t.editor?.editSyllableCount ?? 'Edit syllable count'}
            >
              {line.syllables > 0 ? line.syllables : ''}
            </button>
          </Tooltip>
        )}

        {/* Quantize offer popover */}
        {quantizeState === 'asking' && (
          <div
            className="absolute bottom-full right-0 mb-1 z-50 flex items-center gap-1 rounded px-2 py-1 shadow-lg text-[9px] whitespace-nowrap"
            style={{ background: 'var(--color-surface, #1c1b19)', border: '1px solid var(--accent-color)' }}
          >
            <span className="text-zinc-300">{t.editor?.quantizeOffer ?? 'Quantize?'}</span>
            <button
              type="button"
              onClick={acceptQuantize}
              className="px-1 rounded text-[var(--accent-color)] hover:text-white font-semibold transition-colors"
            >
              {t.editor?.yes ?? 'Yes'}
            </button>
            <button
              type="button"
              onClick={rejectQuantize}
              className="px-1 rounded text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              {t.editor?.no ?? 'No'}
            </button>
          </div>
        )}
      </div>

      <span className="flex-shrink-0 w-2" />

      <span
        className={`flex-shrink-0 inline-flex h-4 w-7 items-center justify-center rounded border text-[9px] font-bold uppercase tracking-widest transition-all ${schemeLabel ? rhymeColor : 'opacity-0'}`}
      >
        {schemeLabel ?? ''}
      </span>
    </div>
  );
});
