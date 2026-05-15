import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Plus, Trash2, Languages, Loader2, Ruler, Check } from '../ui/icons';
import { Tooltip } from '../ui/Tooltip';
import { useTranslation } from '../../i18n';
import { supportsSyllableHeuristics } from '../../lib/quantize';
import { migrateAdaptationToLangId } from '../../i18n/constants';
import type { Line } from '../../types';
import type { AdaptationLangId } from '../../i18n/constants';

interface LyricLineControlsProps {
  line: Line;
  sectionId: string;
  lineIndex: number;
  sectionLinesCount: number;
  hasApiKey: boolean;
  isGenerating: boolean;
  isAdaptingLine: boolean;
  lineLanguage?: string;
  sectionTargetLanguage?: string;
  adaptLineLanguage?: (sectionId: string, lineId: string, lang: AdaptationLangId) => void;
  onQuantizeLine?: (sectionId: string, lineId: string) => void;
  moveLineUp: (sectionId: string, lineId: string) => void;
  moveLineDown: (sectionId: string, lineId: string) => void;
  addLineToSection: (sectionId: string, afterLineId?: string) => void;
  deleteLineFromSection: (sectionId: string, lineId: string) => void;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
}

export const LyricLineControls = React.memo(function LyricLineControls({
  line,
  sectionId,
  lineIndex,
  sectionLinesCount,
  hasApiKey,
  isGenerating,
  isAdaptingLine,
  lineLanguage,
  sectionTargetLanguage,
  adaptLineLanguage,
  onQuantizeLine,
  moveLineUp,
  moveLineDown,
  addLineToSection,
  deleteLineFromSection,
  playAudioFeedback,
}: LyricLineControlsProps) {
  const { t } = useTranslation();
  const [quantized, setQuantized] = useState(false);
  const quantizedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isQuantizeSupported = supportsSyllableHeuristics(
    line.text,
    lineLanguage || sectionTargetLanguage || '',
  );

  const quantizeTooltip = !isQuantizeSupported
    ? (t.editor?.quantize_line_unsupported ?? 'Quantize supports Latin-script lyrics only')
    : quantized
      ? (t.editor?.quantize_line_done ?? 'Line quantized')
      : (t.editor?.quantize_line ?? 'Quantize line');

  const controlsWidth = useMemo(() => {
    if (adaptLineLanguage && onQuantizeLine) return 'w-24';
    if (adaptLineLanguage || onQuantizeLine) return 'w-20';
    return 'w-16';
  }, [adaptLineLanguage, onQuantizeLine]);

  // Reset quantized feedback when line changes
  useEffect(() => {
    if (quantizedTimeoutRef.current) clearTimeout(quantizedTimeoutRef.current);
    setQuantized(false);
  }, [line.id]);

  useEffect(() => () => {
    if (quantizedTimeoutRef.current) clearTimeout(quantizedTimeoutRef.current);
  }, []);

  return (
    <div className={`flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${controlsWidth}`}>
      {adaptLineLanguage && (
        <Tooltip title={hasApiKey ? (t.editor?.adaptLine ?? `Adapt line to ${sectionTargetLanguage ?? 'target language'}`) : (t.tooltips.aiUnavailable ?? 'AI unavailable')}>
          <button
            type="button"
            onClick={() => {
              adaptLineLanguage(
                sectionId,
                line.id,
                migrateAdaptationToLangId(sectionTargetLanguage ?? 'English') as AdaptationLangId,
              );
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
        <button
          type="button"
          onClick={() => { moveLineUp(sectionId, line.id); playAudioFeedback('click'); }}
          disabled={lineIndex === 0}
          className="flex h-4 w-4 items-center justify-center text-zinc-500 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed transition"
        >
          <ChevronUp className="h-2.5 w-2.5" />
        </button>
      </Tooltip>
      <Tooltip title={t.editor?.moveLineDown ?? 'Move line down'}>
        <button
          type="button"
          onClick={() => { moveLineDown(sectionId, line.id); playAudioFeedback('click'); }}
          disabled={lineIndex === sectionLinesCount - 1}
          className="flex h-4 w-4 items-center justify-center text-zinc-500 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed transition"
        >
          <ChevronDown className="h-2.5 w-2.5" />
        </button>
      </Tooltip>
      <Tooltip title={t.editor?.addLineAfter ?? 'Add line after'}>
        <button
          type="button"
          onClick={() => { addLineToSection(sectionId, line.id); playAudioFeedback('click'); }}
          className="flex h-4 w-4 items-center justify-center text-zinc-500 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200 transition"
        >
          <Plus className="h-2.5 w-2.5" />
        </button>
      </Tooltip>
      <Tooltip title={t.editor?.deleteLine ?? 'Delete line'}>
        <button
          type="button"
          onClick={() => { deleteLineFromSection(sectionId, line.id); playAudioFeedback('click'); }}
          disabled={sectionLinesCount <= 1}
          className="flex h-4 w-4 items-center justify-center text-zinc-500 dark:text-zinc-600 hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed transition"
        >
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      </Tooltip>
    </div>
  );
});
