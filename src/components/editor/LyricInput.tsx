import React, { useRef } from 'react';
import { Bot, User } from '../ui/icons';
import type { Line } from '../../types';
import { useDrag } from '../../contexts/DragContext';
import { useDragHandlersContext } from '../../contexts/DragHandlersContext';
import { Tooltip } from '../ui/Tooltip';
import { EmojiSign } from '../ui/EmojiSign';
import { useTranslation } from '../../i18n';
import { getLanguageDisplay } from '../../i18n';
import type { AdaptationLangId } from '../../i18n/constants';
import { LyricDragHandle } from './LyricDragHandle';
import { LyricTextArea } from './LyricTextArea';
import { LyricLineControls } from './LyricLineControls';

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
  const { handleLineDrop } = useDragHandlersContext();
  const lineLanguageDisplay = lineLanguage ? getLanguageDisplay(lineLanguage) : null;
  const isSelected = selectedLineId === line.id;
  const dragEndRef = useRef<() => void>(() => setDraggedLineInfo(null));
  dragEndRef.current = () => setDraggedLineInfo(null);

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

      {/* AI / Human origin indicator */}
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
        lineLanguage={lineLanguage}
        sectionTargetLanguage={sectionTargetLanguage}
        onUpdate={updateLineText}
        onKeyDown={handleLineKeyDown}
        onClick={() => handleLineClick(line.id)}
        onBlur={onLineBlur}
      />

      <LyricLineControls
        line={line}
        sectionId={sectionId}
        lineIndex={lineIndex}
        sectionLinesCount={sectionLinesCount}
        hasApiKey={hasApiKey}
        isGenerating={isGenerating}
        isAdaptingLine={isAdaptingLine}
        lineLanguage={lineLanguage}
        sectionTargetLanguage={sectionTargetLanguage}
        adaptLineLanguage={adaptLineLanguage}
        onQuantizeLine={onQuantizeLine}
        moveLineUp={moveLineUp}
        moveLineDown={moveLineDown}
        addLineToSection={addLineToSection}
        deleteLineFromSection={deleteLineFromSection}
        playAudioFeedback={playAudioFeedback}
      />

      {/* Syllable count */}
      <span className="flex-shrink-0 text-[9px] tabular-nums text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors w-[2.75rem] text-right">
        {line.syllables > 0 ? line.syllables : ''}
      </span>

      <span className="flex-shrink-0 w-2" />

      {/* Rhyme scheme badge */}
      <span
        className={`flex-shrink-0 inline-flex h-4 w-7 items-center justify-center rounded border text-[9px] font-bold uppercase tracking-widest transition-all ${schemeLabel ? rhymeColor : 'opacity-0'}`}
      >
        {schemeLabel ?? ''}
      </span>
    </div>
  );
});
