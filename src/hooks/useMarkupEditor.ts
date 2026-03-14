import { useCallback } from 'react';
import { Section } from '../types';
import { cleanSectionName, countSyllables } from '../utils/songUtils';
import { isPureMetaLine, isEmptyBracketLine } from '../utils/metaUtils';
import { generateId } from '../utils/idUtils';

interface UseMarkupEditorParams {
  song: Section[];
  isMarkupMode: boolean;
  markupText: string;
  markupTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  setIsMarkupMode: (v: boolean) => void;
  setMarkupText: (v: string) => void;
  updateSongAndStructureWithHistory: (song: Section[], structure: string[]) => void;
}

/** Returns true if a line text is an artifact that should be excluded from processing. */
const isArtifact = (text: string): boolean => {
  const t = text.trim();
  return t === '' || isEmptyBracketLine(t);
};

export function useMarkupEditor(params: UseMarkupEditorParams) {
  const {
    song, isMarkupMode, markupText, markupTextareaRef,
    setIsMarkupMode, setMarkupText, updateSongAndStructureWithHistory,
  } = params;

  const scrollToSection = useCallback((section: Section) => {
    if (isMarkupMode) {
      if (!markupTextareaRef.current) return;
      let searchStr = `**[${section.name}]**`;
      let index = markupText.indexOf(searchStr);
      if (index === -1) { searchStr = `[${section.name}]`; index = markupText.indexOf(searchStr); }
      if (index !== -1) {
        const ta = markupTextareaRef.current;
        ta.focus();
        ta.setSelectionRange(index, index + searchStr.length);
        // Use actual line height from computed style for accurate scroll
        const lineHeight = parseInt(window.getComputedStyle(ta).lineHeight, 10) || 20;
        ta.scrollTop = (markupText.substring(0, index).split('\n').length - 2) * lineHeight;
      }
    } else {
      const el = document.getElementById(`section-${section.id}`);
      if (el) {
        const container = el.closest('.overflow-y-auto');
        if (container) container.scrollTo({ top: (el as HTMLElement).offsetTop - 20, behavior: 'smooth' });
        else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [isMarkupMode, markupText, markupTextareaRef]);

  const handleMarkupToggle = useCallback(() => {
    if (isMarkupMode) {
      // MARKUP → STRUCTURED
      const blocks = markupText.split(/\n\s*\n/);
      const usedSectionIds = new Set<string>();
      const usedLineIds = new Set<string>();

      const newSections: Section[] = blocks.map((block, index) => {
        const lines = block.trim().split('\n');
        if (lines.length === 0 || (lines.length === 1 && !(lines[0] ?? '').trim())) return null;

        let name = 'Verse';
        let remainingLines = lines;
        const firstLine = (lines[0] ?? '').trim();

        if ((firstLine.startsWith('**[') && firstLine.endsWith(']**')) || (firstLine.startsWith('[') && firstLine.endsWith(']'))) {
          const inner = firstLine.replace(/^\*\*\[|\]\*\*$|^\[|\]$/g, '').trim();
          if (inner && !isPureMetaLine(`[${inner}]`)) {
            name = cleanSectionName(firstLine);
            remainingLines = lines.slice(1);
          }
        }

        const preInstructions: string[] = [];
        const postInstructions: string[] = [];
        const lyricLines: string[] = [];
        let foundLyrics = false;

        remainingLines.forEach(line => {
          if (isArtifact(line)) return;
          const trimmed = line.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            if (isPureMetaLine(trimmed)) {
              foundLyrics = true;
              lyricLines.push(line);
            } else {
              if (foundLyrics) postInstructions.push(trimmed);
              else preInstructions.push(trimmed);
            }
          } else {
            foundLyrics = true;
            lyricLines.push(line);
          }
        });

        let existingSection = (song[index] && song[index].name === name)
          ? song[index]
          : song.find(s => s.name === name && !usedSectionIds.has(s.id));
        let sectionId = existingSection?.id || generateId();
        if (usedSectionIds.has(sectionId)) sectionId = generateId();
        usedSectionIds.add(sectionId);

        return {
          id: sectionId,
          name,
          rhymeScheme: existingSection?.rhymeScheme || 'AABB',
          targetSyllables: existingSection?.targetSyllables || 8,
          mood: existingSection?.mood || '',
          preInstructions: preInstructions.length > 0 ? preInstructions : (existingSection?.preInstructions || []),
          postInstructions: postInstructions.length > 0 ? postInstructions : (existingSection?.postInstructions || []),
          lines: lyricLines.map((text, lIdx) => {
            const isMeta = isPureMetaLine(text.trim());
            const existingLine = existingSection?.lines.find(l => l.text === text && !usedLineIds.has(l.id))
              || (existingSection?.lines[lIdx] && !usedLineIds.has(existingSection.lines[lIdx]!.id)
                ? existingSection.lines[lIdx]
                : null);
            let lineId = existingLine?.id || generateId();
            if (usedLineIds.has(lineId)) lineId = generateId();
            usedLineIds.add(lineId);
            return {
              id: lineId,
              text,
              rhymingSyllables: existingLine?.rhymingSyllables || '',
              rhyme: existingLine?.rhyme || '',
              syllables: isMeta
                ? 0
                : text.split(/\s+/).reduce((acc, word) => acc + (word ? countSyllables(word) : 0), 0),
              concept: existingLine?.concept || (isMeta ? 'Meta' : 'New line'),
              isManual: true,
              isMeta,
            };
          }),
        };
      }).filter(s => s !== null) as Section[];

      if (newSections.length > 0) updateSongAndStructureWithHistory(newSections, newSections.map(s => s.name));
      setIsMarkupMode(false);
    } else {
      // STRUCTURED → MARKUP
      const fmt = (i: string) => { const tr = i.trim(); return (tr.startsWith('[') && tr.endsWith(']')) ? tr : `[${tr}]`; };
      const text = song.map(sec => {
        const pre = (sec.preInstructions || []).map(fmt).join('\n');
        const post = (sec.postInstructions || []).map(fmt).join('\n');
        const lyricText = sec.lines
          .filter(l => !isArtifact(l.text))
          .map(l => l.text)
          .join('\n');
        return `[${sec.name}]\n${pre ? pre + '\n' : ''}${lyricText}${post ? '\n' + post : ''}`;
      }).join('\n\n');
      setMarkupText(text);
      setIsMarkupMode(true);
    }
  }, [song, isMarkupMode, markupText, setIsMarkupMode, setMarkupText, updateSongAndStructureWithHistory]);

  return { scrollToSection, handleMarkupToggle };
}
