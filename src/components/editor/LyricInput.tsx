import React, { useRef } from 'react';
import { Bot, User } from '../ui/icons';
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
  const { updateLineText, handleLineKeyDown } = editing;
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
  const textAreaOptionalProps = {
    ...(lineLanguage ? { lineLanguage } : {}),
    ...(sectionTargetLanguage ? { sectionTargetLanguage } : {}),
    ...(onLineBlur ? { onBlur: onLineBlur } : {}),
  };
  const controlsOptionalProps = {
    ...(lineLanguage ? { lineLanguage } : {}),
    ...(sectionTargetLanguage ? { sectionTargetLanguage } : {}),
    ...(adaptLineLanguage ? { adaptLineLanguage } : {}),
    ...(onQuantizeLine ? { onQuantizeLine } : {}),
  };

  // Syllable gauge — fill ratio capped at 1, hidden when no data.
  // Right offset accounts for: pr-8 (2rem) + COUNT w-[2.75rem] + spacer w-2 (0.5rem) + SCHEMA w-7 (1.75rem) = 7rem
  // Keeps the gauge within the lyric text zone only, columns on the right remain unaffected.
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
        'group relative flex items-center gap-1.5 rounded pl-1 pr-8 py-1 transition-all overflow-hidden',
        isSelected ? 'bg-black/[0.03] dark:bg-white/5' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]',
        isDraggedLine ? 'opacity-40' : '',
        isDragOverLine ? 'border-t border-[var(--accent-color)]/60' : '',
      ].join(' ')}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Syllable gauge — clipped to the lyric text zone, right columns excluded */}
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

      <Tooltip title={line.isManual ? (t.editor?.humanLine ?? 'Human line') : (t.editor?.aiLine ?? 'AI-generated line')}>
        <span className="flex-shrink-0 flex items-center justify-center w-3.5">
          {line.isManual
            ? <User className="h-2.5 w-2.5 text-zinc-500 dark:text-zinc-400" />
            : <Bot className="h-2.5 w-2.5 text-[var(--accent-color)]" />}
        </span>
      </Tooltip>

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

      <span className="flex-shrink-0 text-[9px] tabular-nums text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors w-[2.75rem] text-right">
        {line.syllables > 0 ? line.syllables : ''}
      </span>

      <span className="flex-shrink-0 w-2" />

      <span
        className={`flex-shrink-0 inline-flex h-4 w-7 items-center justify-center rounded border text-[9px] font-bold uppercase tracking-widest transition-all ${schemeLabel ? rhymeColor : 'opacity-0'}`}
      >
        {schemeLabel ?? ''}
      </span>
    </div>
  );
});
