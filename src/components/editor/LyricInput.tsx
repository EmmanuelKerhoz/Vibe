import React, { useRef, useEffect } from 'react';
import { GripVertical, ChevronUp, ChevronDown, Plus, Trash2 } from 'lucide-react';
import type { Line } from '../../types';
import { Tooltip } from '../ui/Tooltip';
import { useTranslation } from '../../i18n';
import { getRhymeTextColor } from '../../utils/songUtils';

export interface LyricInputProps {
  line: Line;
  lineIndex: number;
  sectionId: string;
  sectionLinesCount: number;
  selectedLineId: string | null;
  schemeLabel: string | null;
  rhymeColor: string;
  isGenerating: boolean;
  isDraggedLine: boolean;
  isDragOverLine: boolean;
  handleLineClick: (lineId: string) => void;
  updateLineText: (sectionId: string, lineId: string, text: string) => void;
  handleLineKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, sectionId: string, lineId: string) => void;
  handleLineDragStart: (sectionId: string, lineId: string) => void;
  handleLineDrop: (sectionId: string, lineId: string) => void;
  setDraggedLineInfo: (info: { sectionId: string; lineId: string } | null) => void;
  setDragOverLineInfo: (info: { sectionId: string; lineId: string } | null) => void;
  moveLineUp: (sectionId: string, lineId: string) => void;
  moveLineDown: (sectionId: string, lineId: string) => void;
  addLineToSection: (sectionId: string, afterLineId?: string) => void;
  deleteLineFromSection: (sectionId: string, lineId: string) => void;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
}

/**
 * Extracts the rhyming suffix of a line's last word.
 *
 * Highlights from the LAST VOWEL NUCLEUS onward — no onset backtracking.
 * This gives the phonetically correct rhyme highlight:
 *   mentir  → "ir"
 *   partir  → "ir"
 *   chanter → "er"
 *   amour   → "our"  (last vowel=o, slice from o)
 *   transaction → "ion" (last vowel=o, but 'io' cluster → slice from i)
 *   vie     → "ie"
 *   nuit    → "uit"
 *
 * Algorithm:
 *   1. Strip trailing punctuation, extract last word (accented chars included).
 *   2. Normalize to ASCII to find last vowel index.
 *   3. Slice original word from that index.
 *   4. Right-anchor onto full text to get split position.
 */
function splitRhymingSuffix(text: string): { before: string; rhyme: string } | null {
  if (!text.trim()) return null;

  const stripped = text.trimEnd().replace(/[^\p{L}\p{N}]+$/u, '');
  if (!stripped) return null;

  const lastWordMatch = stripped.match(/[\p{L}\p{N}]+$/u);
  if (!lastWordMatch) return null;
  const lastWord = lastWordMatch[0];

  // Normalize to find vowel positions (strip accents)
  const normalized = lastWord
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const VOWELS = 'aeiouy';
  let lastVowelIdx = -1;
  for (let i = normalized.length - 1; i >= 0; i--) {
    if (VOWELS.includes(normalized[i]!)) {
      lastVowelIdx = i;
      break;
    }
  }
  if (lastVowelIdx < 0) return null;

  // Extend leftward to include adjacent vowels (vowel cluster)
  // e.g. "tion" → lastVowel='o' at idx 2, but 'io' is the cluster → go to idx 1
  let clusterStart = lastVowelIdx;
  while (clusterStart > 0 && VOWELS.includes(normalized[clusterStart - 1]!)) {
    clusterStart--;
  }

  // Slice the original word (with accents) from clusterStart
  const rhymeSuffix = lastWord.slice(clusterStart);

  // Right-anchor back onto full original text
  const suffixIdx = text.toLowerCase().lastIndexOf(
    rhymeSuffix.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  );
  // Fallback: search normalized version didn't match, try direct
  const directIdx = text.lastIndexOf(rhymeSuffix);
  const splitAt = directIdx >= 0 ? directIdx : suffixIdx;
  if (splitAt < 0) return null;

  return {
    before: text.slice(0, splitAt),
    rhyme: text.slice(splitAt),
  };
}

export const LyricInput = React.memo(function LyricInput({
  line,
  lineIndex,
  sectionId,
  sectionLinesCount,
  selectedLineId,
  schemeLabel,
  rhymeColor,
  isGenerating,
  isDraggedLine,
  isDragOverLine,
  handleLineClick,
  updateLineText,
  handleLineKeyDown,
  handleLineDragStart,
  handleLineDrop,
  setDraggedLineInfo,
  setDragOverLineInfo,
  moveLineUp,
  moveLineDown,
  addLineToSection,
  deleteLineFromSection,
  playAudioFeedback,
}: LyricInputProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelected = selectedLineId === line.id;
  const rhymeTextColor = getRhymeTextColor(schemeLabel);

  useEffect(() => {
    if (isSelected && inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => updateLineText(sectionId, line.id, e.target.value);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => handleLineKeyDown(e, sectionId, line.id);
  const handleClick = () => handleLineClick(line.id);

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
   *  - Parenthesised stage directions: amber
   *  - Rhyming suffix of last word: rhymeTextColor
   *  - Everything else: zinc-200
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
        const split = splitRhymingSuffix(part);
        if (split) {
          return (
            <span key={i}>
              <span className="text-zinc-200">{split.before}</span>
              <span style={{ color: rhymeTextColor, fontWeight: 600 }}>{split.rhyme}</span>
            </span>
          );
        }
      }

      return <span key={i} className="text-zinc-200">{part}</span>;
    });
  };

  return (
    <div
      className={[
        'group relative flex items-center gap-1.5 rounded px-1 py-0.5 transition-all',
        isSelected ? 'bg-white/5' : 'hover:bg-white/[0.03]',
        isDraggedLine ? 'opacity-40' : '',
        isDragOverLine ? 'border-t border-[var(--accent-color)]/60' : '',
      ].join(' ')}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag handle */}
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="cursor-grab opacity-0 group-hover:opacity-40 hover:!opacity-80 flex-shrink-0 touch-none transition-opacity"
      >
        <GripVertical className="h-3.5 w-3.5 text-zinc-500" />
      </div>

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
          disabled={isGenerating}
          placeholder={t.editor?.linePlaceholder ?? 'Write a lyric line…'}
          className="w-full bg-transparent text-sm font-mono text-transparent caret-zinc-200 outline-none border-none focus:ring-0 placeholder:text-zinc-700 disabled:cursor-not-allowed relative z-10"
          style={{ font: 'inherit', letterSpacing: 'inherit' }}
          spellCheck
          autoComplete="off"
        />
      </div>

      {/* Line controls — visible on hover */}
      <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip title={t.editor?.moveLineUp ?? 'Move line up'}>
          <button type="button" onClick={() => { moveLineUp(sectionId, line.id); playAudioFeedback('click'); }} disabled={lineIndex === 0}
            className="flex h-4 w-4 items-center justify-center text-zinc-600 hover:text-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed transition">
            <ChevronUp className="h-2.5 w-2.5" />
          </button>
        </Tooltip>
        <Tooltip title={t.editor?.moveLineDown ?? 'Move line down'}>
          <button type="button" onClick={() => { moveLineDown(sectionId, line.id); playAudioFeedback('click'); }} disabled={lineIndex === sectionLinesCount - 1}
            className="flex h-4 w-4 items-center justify-center text-zinc-600 hover:text-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed transition">
            <ChevronDown className="h-2.5 w-2.5" />
          </button>
        </Tooltip>
        <Tooltip title={t.editor?.addLineAfter ?? 'Add line after'}>
          <button type="button" onClick={() => { addLineToSection(sectionId, line.id); playAudioFeedback('click'); }}
            className="flex h-4 w-4 items-center justify-center text-zinc-600 hover:text-zinc-200 transition">
            <Plus className="h-2.5 w-2.5" />
          </button>
        </Tooltip>
        <Tooltip title={t.editor?.deleteLine ?? 'Delete line'}>
          <button type="button" onClick={() => { deleteLineFromSection(sectionId, line.id); playAudioFeedback('click'); }} disabled={sectionLinesCount <= 1}
            className="flex h-4 w-4 items-center justify-center text-zinc-600 hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed transition">
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        </Tooltip>
      </div>

      {/* COL: COUNT */}
      <span className="flex-shrink-0 text-[9px] tabular-nums text-zinc-600 group-hover:text-zinc-400 transition-colors w-[2.25rem] text-right">
        {line.syllables > 0 ? line.syllables : ''}
      </span>

      {/* COL: SCHEMA */}
      <span
        className={`flex-shrink-0 inline-flex h-4 w-5 items-center justify-center rounded border text-[9px] font-bold uppercase tracking-widest transition-all ${schemeLabel ? rhymeColor : 'opacity-0'}`}
      >
        {schemeLabel ?? ''}
      </span>
    </div>
  );
});
