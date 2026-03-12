import { useCallback } from 'react';
import { Section } from '../types';
import { cleanSectionName, countSyllables } from '../utils/songUtils';
import { isPureMetaLine } from '../utils/metaUtils';
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
        markupTextareaRef.current.focus();
        markupTextareaRef.current.setSelectionRange(index, index + searchStr.length);
        markupTextareaRef.current.scrollTop = (markupText.substring(0, index).split('\n').length - 2) * 20;
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
      // ── MARKUP → STRUCTURED ────────────────────────────────────
      const blocks = markupText.split(/\n\s*\n/);
      const usedSectionIds = new Set<string>();
      const usedLineIds = new Set<string>();

      const newSections: Section[] = blocks.map((block, index) => {
        const lines = block.trim().split('\n');
        if (lines.length === 0 || (lines.length === 1 && !(lines[0] ?? '').trim())) return null;

        let name = 'Verse';
        let remainingLines = lines;
        const firstLine = (lines[0] ?? '').trim();

        // First line is a section header if it's [SectionName] or **[SectionName]**
        if ((firstLine.startsWith('**[') && firstLine.endsWith(']**')) || (firstLine.startsWith('[') && firstLine.endsWith(']'))) {
          // Only treat as section header if it IS a known section keyword
          const inner = firstLine.replace(/^\*\*\[|\]\*\*$|^\[|\]$/g, '').trim();
          if (!isPureMetaLine(`[${inner}]`)) {
            // It's a structural section header
            name = cleanSectionName(firstLine);
            remainingLines = lines.slice(1);
          }
          // else: it's a meta-instruction on the first line — keep it in remainingLines
        }

        const preInstructions: string[] = [];
        const postInstructions: string[] = [];
        const lyricLines: string[] = [];
        const metaLineTexts = new Set<string>(); // track meta lines to skip from preInstructions
        let foundLyrics = false;

        remainingLines.forEach(line => {
          const trimmed = line.trim();
          if (!trimmed) return;

          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            if (isPureMetaLine(trimmed)) {
              // This is a meta-instruction — treat as a lyric line with isMeta flag
              foundLyrics = true;
              lyricLines.push(line);
              metaLineTexts.add(trimmed);
            } else {
              // Structural bracket (e.g. [Anthemic] used as pre/post instruction)
              if (foundLyrics) postInstructions.push(trimmed);
              else preInstructions.push(trimmed);
            }
          } else if (trimmed !== '') {
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
      // ── STRUCTURED → MARKUP ────────────────────────────────────
      // line.text is already preserved with brackets for isMeta lines — no transformation needed
      const fmt = (i: string) => { const tr = i.trim(); return (tr.startsWith('[') && tr.endsWith(']')) ? tr : `[${tr}]`; };
      const text = song.map(sec => {
        const pre = (sec.preInstructions || []).map(fmt).join('\n');
        const post = (sec.postInstructions || []).map(fmt).join('\n');
        return `[${sec.name}]\n${pre ? pre + '\n' : ''}${sec.lines.map(l => l.text).join('\n')}${post ? '\n' + post : ''}`;
      }).join('\n\n');
      setMarkupText(text);
      setIsMarkupMode(true);
    }
  }, [song, isMarkupMode, markupText, setIsMarkupMode, setMarkupText, updateSongAndStructureWithHistory]);

  return { scrollToSection, handleMarkupToggle };
}
