import React, { useMemo } from 'react';
import { LyricInput } from './LyricInput';
import { MetaLine } from './MetaLine';
import { getRhymeColor, getSchemaLabelForLine, getSchemeLetterForLine } from '../../utils/songUtils';
import { isPureMetaLine } from '../../utils/metaUtils';
import { useDrag } from '../../contexts/DragContext';
import { useSongContext } from '../../contexts/SongContext';
import { useComposerContext } from '../../contexts/ComposerContext';
import { useSongMutation } from '../../contexts/SongMutationContext';
import type { Section } from '../../types';

type MetaGroup = { kind: 'meta'; lines: Section['lines'] };
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
      items.push({ kind: 'meta', lines: group });
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
  hasApiKey: boolean;
  lineNumberOffset?: number;
  adaptLineLanguage?: (sectionId: string, lineId: string, lang: string) => void;
  adaptingLineIds?: Set<string>;
  sectionTargetLanguage: string;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
  onLineBlur?: () => void;
}

export const SectionLineList = React.memo(function SectionLineList({
  section, hasApiKey,
  lineNumberOffset = 0,
  adaptLineLanguage, adaptingLineIds, sectionTargetLanguage,
  playAudioFeedback, onLineBlur,
}: SectionLineListProps) {
  const { rhymeScheme, lineLanguages } = useSongContext();
  const { selectedLineId, isGenerating, handleLineClick, updateLineText, handleLineKeyDown } = useComposerContext();
  const { moveLineUp, moveLineDown, addLineToSection, deleteLineFromSection } = useSongMutation();
  const { draggedLineInfo, dragOverLineInfo } = useDrag();

  const renderItems = useMemo(() => buildRenderItems(section.lines), [section.lines]);
  const effectiveRhymeScheme = section.rhymeScheme || rhymeScheme;

  return (
    <div className="flex flex-col gap-0.5">
      {renderItems.map((item, renderIdx) => {
        const globalLineNumber = lineNumberOffset + renderIdx + 1;
        if (item.kind === 'meta') {
          return (
            <MetaLine
              key={item.lines.map(l => l.id).join('-')}
              text={item.lines.map(l => l.text).join(' ')}
              lineNumber={globalLineNumber}
            />
          );
        }
        const { line, index: lyricIndex } = item;
        const rhymeFamily = getSchemeLetterForLine(section, lyricIndex, effectiveRhymeScheme);
        const schemeLabel = getSchemaLabelForLine(section, lyricIndex, effectiveRhymeScheme);
        const rhymeColor = getRhymeColor(schemeLabel);
        const rhymePeerTexts = rhymeFamily
          ? renderItems
            .filter((candidate): candidate is LyricItem =>
              candidate.kind === 'lyric'
              && candidate.line.id !== line.id
              && getSchemeLetterForLine(section, candidate.index, effectiveRhymeScheme) === rhymeFamily,
            )
            .map(candidate => candidate.line.text)
          : [];
        const isDraggedLine = draggedLineInfo?.sectionId === section.id && draggedLineInfo?.lineId === line.id;
        const isDragOverLine = dragOverLineInfo?.sectionId === section.id && dragOverLineInfo?.lineId === line.id;
        return (
          <LyricInput
            key={line.id}
            line={line}
            lineIndex={lyricIndex}
            globalLineNumber={globalLineNumber}
            sectionId={section.id}
            sectionLinesCount={section.lines.filter(l => !l.isMeta).length}
            rhymePeerTexts={rhymePeerTexts}
            selectedLineId={selectedLineId}
            schemeLabel={schemeLabel}
            rhymeColor={rhymeColor}
            isGenerating={isGenerating}
            hasApiKey={hasApiKey}
            isDraggedLine={isDraggedLine}
            isDragOverLine={isDragOverLine}
            lineLanguage={lineLanguages[line.id]}
            handleLineClick={handleLineClick}
            updateLineText={updateLineText}
            handleLineKeyDown={handleLineKeyDown}
            moveLineUp={moveLineUp}
            moveLineDown={moveLineDown}
            addLineToSection={addLineToSection}
            deleteLineFromSection={deleteLineFromSection}
            playAudioFeedback={playAudioFeedback}
            adaptLineLanguage={adaptLineLanguage}
            sectionTargetLanguage={sectionTargetLanguage}
            isAdaptingLine={adaptingLineIds?.has(line.id)}
            onLineBlur={onLineBlur}
          />
        );
      })}
    </div>
  );
});
