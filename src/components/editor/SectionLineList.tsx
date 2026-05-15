import React, { useMemo, useCallback } from 'react';
import { LyricInput } from './LyricInput';
import { MetaLine } from './MetaLine';
import { RhymeSuggestPanel } from './RhymeSuggestPanel';
import { getSchemaLabelForLine, getSchemeLetterForLine } from '../../utils/songUtils';
import { isPureMetaLine } from '../../utils/metaUtils';
import { useDragState } from '../../contexts/DragContext';
import { useSongContext } from '../../contexts/SongContext';
import { useComposerContext } from '../../contexts/ComposerContext';
import { useSongMutation } from '../../contexts/SongMutationContext';
import { useRhymeSuggestions } from '../../hooks/useRhymeSuggestions';
import { quantizeLine, supportsSyllableHeuristics } from '../../lib/quantize';
import type { Section } from '../../types';
import type { SchemeResult } from '../../lib/rhyme/types';
import type { AdaptationLangId } from '../../i18n/constants';

type MetaGroup = { kind: 'meta'; lines: Section['lines']; physicalCount: number };
type LyricItem = { kind: 'lyric'; line: Section['lines'][number]; index: number };
type RenderItem = MetaGroup | LyricItem;

function buildRenderItems(lines: Section['lines']): RenderItem[] {
  const items: RenderItem[] = [];
  let lyricIdx = 0;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    const isMeta = line.isMeta ?? isPureMetaLine(line.text);
    if (isMeta) {
      const group: Section['lines'] = [line];
      while (i + 1 < lines.length) {
        const next = lines[i + 1]!;
        const nextIsMeta = next.isMeta ?? isPureMetaLine(next.text);
        if (!nextIsMeta) break;
        i++; group.push(lines[i]!);
      }
      items.push({ kind: 'meta', lines: group, physicalCount: group.length });
    } else {
      items.push({ kind: 'lyric', line, index: lyricIdx++ });
    }
    i++;
  }
  return items;
}

/** Returns the number of visual rows rendered for a section (lyric lines + meta groups). */
export function countSectionRenderItems(lines: Section['lines']): number {
  return buildRenderItems(lines).length;
}

interface SectionLineListProps {
  section: Section;
  lineNumberOffset?: number;
  adaptLineLanguage?: (sectionId: string, lineId: string, lang: AdaptationLangId) => void;
  adaptingLineIds?: Set<string>;
  sectionTargetLanguage: string;
  /** Pre-computed scheme result from parent SectionEditor (single hook instance). */
  schemeResult: SchemeResult | null;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
  onLineBlur?: () => void;
}

// ─── Inner: rhyme panel wired to a single line ────────────────────────────────

interface LinePanelProps {
  line: Section['lines'][number];
  lang: string;
  updateLineText: (sectionId: string, lineId: string, text: string) => void;
  sectionId: string;
  onClose: () => void;
}

function LineRhymePanel({ line, lang, updateLineText, sectionId, onClose }: LinePanelProps) {
  const { suggestions, query, isLoading } = useRhymeSuggestions(line.text, lang, true);
  return (
    <RhymeSuggestPanel
      query={query}
      suggestions={suggestions}
      isLoading={isLoading}
      lineText={line.text}
      onAccept={(newText) => updateLineText(sectionId, line.id, newText)}
      onClose={onClose}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const SectionLineList = React.memo(function SectionLineList({
  section,
  lineNumberOffset = 0,
  adaptLineLanguage, adaptingLineIds, sectionTargetLanguage,
  schemeResult,
  playAudioFeedback, onLineBlur,
}: SectionLineListProps) {
  const { rhymeScheme, lineLanguages, tempo, timeSignature } = useSongContext();
  const { selectedLineId, isGenerating, handleLineClick, updateLineText, handleLineKeyDown, clearSelection } = useComposerContext();
  const { moveLineUp, moveLineDown, addLineToSection, deleteLineFromSection } = useSongMutation();
  const { draggedLineInfo, dragOverLineInfo } = useDragState();

  // Wrap delete to clear selection when the deleted line is active
  const handleDeleteLine = useCallback((sectionId: string, lineId: string) => {
    if (selectedLineId === lineId) clearSelection();
    deleteLineFromSection(sectionId, lineId);
  }, [selectedLineId, clearSelection, deleteLineFromSection]);

  // Quantize a lyric line against current song BPM + time signature
  const handleQuantizeLine = useCallback((sectionId: string, lineId: string) => {
    const line = section.lines.find(l => l.id === lineId);
    if (!line || !line.text.trim()) return;
    const language = lineLanguages[line.id] ?? sectionTargetLanguage;
    if (!supportsSyllableHeuristics(line.text, language)) return;
    const safeTempo = (tempo ?? 0) > 0 ? (tempo ?? 120) : 120;
    const result = quantizeLine(line.text, safeTempo, timeSignature, language);
    if (result.markedText !== line.text) {
      updateLineText(sectionId, lineId, result.markedText);
    }
  }, [lineLanguages, section.lines, sectionTargetLanguage, tempo, timeSignature, updateLineText]);

  const renderItems = useMemo(() => buildRenderItems(section.lines), [section.lines]);
  const effectiveRhymeScheme = section.rhymeScheme || rhymeScheme;

  // Derive per-lyric-index letters from the hoisted schemeResult prop.
  // Falls back to static scheme when schemeResult is null (< 2 lines, error).
  const dynamicLetters = useMemo<string[]>(() => {
    if (schemeResult) return schemeResult.letters;
    return renderItems
      .filter((it): it is LyricItem => it.kind === 'lyric')
      .map(it => getSchemeLetterForLine(section, it.index, effectiveRhymeScheme) ?? '');
  }, [schemeResult, renderItems, section, effectiveRhymeScheme]);

  const selectedLine = useMemo(() => {
    if (!selectedLineId) return null;
    const item = renderItems.find(
      (it): it is LyricItem => it.kind === 'lyric' && it.line.id === selectedLineId,
    );
    return item?.line ?? null;
  }, [selectedLineId, renderItems]);

  // panelLang: prefer the resolved line object; fall back to lineLanguages map
  // (keyed by ID, survives section mutations) so the rhyme panel keeps the
  // correct language when selectedLine temporarily becomes null.
  // Use || (not ??) to guard against empty string sectionTargetLanguage.
  const panelLang = selectedLine
    ? (lineLanguages[selectedLine.id] || sectionTargetLanguage || 'auto')
    : selectedLineId
      ? (lineLanguages[selectedLineId] || sectionTargetLanguage || 'auto')
      : 'auto';

  const handlePanelClose = () => { if (onLineBlur) onLineBlur(); };

  // Track physical line count across render items for accurate globalLineNumber
  let physicalLineCount = lineNumberOffset;

  return (
    <div className="flex flex-col gap-0.5">
      {renderItems.map((item) => {
        if (item.kind === 'meta') {
          physicalLineCount += item.physicalCount;
          const globalLineNumber = physicalLineCount - item.physicalCount + 1;
          return (
            <MetaLine
              key={item.lines.map(l => l.id).join('-')}
              text={item.lines.map(l => l.text).join(' ')}
              lineNumber={globalLineNumber}
            />
          );
        }

        physicalLineCount += 1;
        const globalLineNumber = physicalLineCount;
        const { line, index: lyricIndex } = item;
        const isActive = selectedLineId === line.id;

        const dynamicLetter = dynamicLetters[lyricIndex] ?? null;
        const schemeLabel = dynamicLetter || getSchemaLabelForLine(section, lyricIndex, effectiveRhymeScheme);
        const rhymeFamily = dynamicLetter || getSchemeLetterForLine(section, lyricIndex, effectiveRhymeScheme);
        const rhymePeerTexts = rhymeFamily
          ? renderItems
            .filter((candidate): candidate is LyricItem =>
              candidate.kind === 'lyric'
              && candidate.line.id !== line.id
              && (dynamicLetters[candidate.index] ?? getSchemeLetterForLine(section, candidate.index, effectiveRhymeScheme)) === rhymeFamily,
            )
            .map(candidate => candidate.line.text)
          : [];

        const isDraggedLine = draggedLineInfo?.sectionId === section.id && draggedLineInfo?.lineId === line.id;
        const isDragOverLine = dragOverLineInfo?.sectionId === section.id && dragOverLineInfo?.lineId === line.id;

        // sectionLinesCount: exclude meta lines consistently using both flags
        const sectionLinesCount = section.lines.filter(l => !(l.isMeta ?? isPureMetaLine(l.text))).length;

        const resolvedLineLanguage = lineLanguages[line.id] ?? sectionTargetLanguage;
        const languageProps = {
          ...(resolvedLineLanguage ? { lineLanguage: resolvedLineLanguage } : {}),
          sectionTargetLanguage,
          ...(adaptLineLanguage ? { adaptLineLanguage } : {}),
          isAdaptingLine: adaptingLineIds?.has(line.id) ?? false,
        };

        return (
          <React.Fragment key={line.id}>
            <LyricInput
              line={line}
              lineIndex={lyricIndex}
              globalLineNumber={globalLineNumber}
              sectionId={section.id}
              rhyme={{ peerTexts: rhymePeerTexts, schemeLabel }}
              selection={{
                selectedLineId,
                onLineClick: handleLineClick,
                ...(onLineBlur ? { onLineBlur } : {}),
              }}
              editing={{ updateLineText, handleLineKeyDown }}
              controls={{
                sectionLinesCount,
                isGenerating,
                moveLineUp,
                moveLineDown,
                addLineToSection,
                deleteLineFromSection: handleDeleteLine,
                playAudioFeedback,
                onQuantizeLine: handleQuantizeLine,
              }}
              language={languageProps}
              dragState={{ isDraggedLine, isDragOverLine }}
            />
            {isActive && selectedLine && (
              <LineRhymePanel
                line={selectedLine}
                lang={panelLang}
                updateLineText={updateLineText}
                sectionId={section.id}
                onClose={handlePanelClose}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
});
