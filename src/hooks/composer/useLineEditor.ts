import { useCallback } from 'react';
import type { KeyboardEvent } from 'react';
import type { Section } from '../../types';
import { syncLinkedChorusSections } from '../../utils/songMergeUtils';
import { detectRhymeSchemeLocally } from '../../utils/rhymeSchemeUtils';
import { generateId } from '../../utils/idUtils';
import { isPureMetaLine } from '../../utils/metaUtils';
import { countSyllables } from '../../utils/syllableUtils';
import { useRefs } from '../../contexts/RefsContext';

const computeSyllables = (text: string) =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .reduce((acc, word) => acc + countSyllables(word), 0);

/**
 * Recomputes the rhyme scheme for a section based on its current lyric lines.
 *
 * FREE is treated as any other scheme value (option B): if rhymes emerge
 * while editing a FREE section, the scheme updates automatically.
 * The user can still manually set FREE at any time via the selector.
 *
 * Returns the existing scheme unchanged if:
 *   - fewer than 2 lyric lines exist (detection meaningless)
 *   - detection yields null (no pattern found)
 *   - detected scheme equals current scheme (no change needed)
 */
const redetectScheme = (section: Section): string | undefined => {
  const lyricTexts = section.lines
    .filter(l => !(l.isMeta ?? isPureMetaLine(l.text)) && l.text.trim().length > 0)
    .map(l => l.text);
  if (lyricTexts.length < 2) return section.rhymeScheme;
  const detected = detectRhymeSchemeLocally(lyricTexts);
  if (!detected) return section.rhymeScheme;
  if (detected === section.rhymeScheme) return section.rhymeScheme;
  return detected;
};

type UseLineEditorParams = {
  song: Section[];
  updateState: (
    recipe: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] },
  ) => void;
  selectedLineId: string | null;
  setSelectedLineId: (id: string | null) => void;
  generateSuggestions: (lineId: string) => void;
  setSuggestions: (suggestions: string[]) => void;
};

export const useLineEditor = ({
  song,
  updateState,
  selectedLineId,
  setSelectedLineId,
  generateSuggestions,
  setSuggestions,
}: UseLineEditorParams) => {
  const { getRef } = useRefs();
  const updateSong = useCallback(
    (transform: (currentSong: Section[]) => Section[]) => {
      updateState(current => ({
        song: transform(current.song),
        structure: current.structure,
      }));
    },
    [updateState],
  );

  const updateLineText = useCallback(
    (sectionId: string, lineId: string, newText: string) => {
      updateSong(currentSong =>
        syncLinkedChorusSections(currentSong.map(section => {
          if (section.id !== sectionId) return section;
          const updatedLines = section.lines.map(line => {
            if (line.id !== lineId) return line;
            return {
              ...line,
              text: newText,
              syllables: computeSyllables(newText),
              isManual: true,
            };
          });
          const updatedSection: Section = { ...section, lines: updatedLines };
          const newScheme = redetectScheme(updatedSection);
          return newScheme !== section.rhymeScheme
            ? { ...updatedSection, rhymeScheme: newScheme }
            : updatedSection;
        }), sectionId),
      );
    },
    [updateSong],
  );

  const handleLineKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, sectionId: string, lineId: string) => {
      const target = e.currentTarget;
      const selectionStart = target.selectionStart;
      const selectionEnd = target.selectionEnd;
      const value = target.value;

      if (e.key === 'Delete' && selectionStart === value.length && selectionEnd === value.length) {
        const sectionIndex = song.findIndex(s => s.id === sectionId);
        if (sectionIndex === -1) return;
        const section = song[sectionIndex]!;
        const lineIndex = section.lines.findIndex(l => l.id === lineId);
        if (lineIndex === -1 || lineIndex === section.lines.length - 1) return;
        e.preventDefault();
        const nextLine = section.lines[lineIndex + 1]!;
        const mergedText = value + nextLine.text;
        updateSong(currentSong =>
          syncLinkedChorusSections(currentSong.map(s => {
            if (s.id !== sectionId) return s;
            const newLines = [...s.lines];
            newLines[lineIndex] = {
              ...newLines[lineIndex]!,
              text: mergedText,
              syllables: computeSyllables(mergedText),
              isManual: true,
            };
            newLines.splice(lineIndex + 1, 1);
            const updatedSection: Section = { ...s, lines: newLines };
            const newScheme = redetectScheme(updatedSection);
            return newScheme !== s.rhymeScheme ? { ...updatedSection, rhymeScheme: newScheme } : updatedSection;
          }), sectionId),
        );
        setTimeout(() => {
          const currentInput = getRef(lineId);
          if (currentInput) {
            currentInput.focus();
            currentInput.setSelectionRange(value.length, value.length);
          }
        }, 0);
      } else if (e.key === 'Backspace' && selectionStart === 0 && selectionEnd === 0) {
        const sectionIndex = song.findIndex(s => s.id === sectionId);
        if (sectionIndex === -1) return;
        const section = song[sectionIndex]!;
        const lineIndex = section.lines.findIndex(l => l.id === lineId);
        if (lineIndex <= 0) return;
        e.preventDefault();
        const prevLine = section.lines[lineIndex - 1]!;
        const mergedText = prevLine.text + value;
        const prevLineId = prevLine.id;
        updateSong(currentSong =>
          syncLinkedChorusSections(currentSong.map(s => {
            if (s.id !== sectionId) return s;
            const newLines = [...s.lines];
            newLines[lineIndex - 1] = {
              ...newLines[lineIndex - 1]!,
              text: mergedText,
              syllables: computeSyllables(mergedText),
              isManual: true,
            };
            newLines.splice(lineIndex, 1);
            const updatedSection: Section = { ...s, lines: newLines };
            const newScheme = redetectScheme(updatedSection);
            return newScheme !== s.rhymeScheme ? { ...updatedSection, rhymeScheme: newScheme } : updatedSection;
          }), sectionId),
        );
        setSelectedLineId(prevLineId);
        setTimeout(() => {
          const prevInput = getRef(prevLineId);
          if (prevInput) {
            prevInput.focus();
            prevInput.setSelectionRange(prevLine.text.length, prevLine.text.length);
          }
        }, 0);
      } else if (e.key === 'Enter') {
        const sectionIndex = song.findIndex(s => s.id === sectionId);
        if (sectionIndex === -1) return;
        const section = song[sectionIndex]!;
        const lineIndex = section.lines.findIndex(l => l.id === lineId);
        if (lineIndex === -1) return;
        e.preventDefault();
        const textBefore = value.substring(0, selectionStart || 0);
        const textAfter = value.substring(selectionEnd || 0);
        const newLineId = generateId();
        updateSong(currentSong =>
          syncLinkedChorusSections(currentSong.map(s => {
            if (s.id !== sectionId) return s;
            const newLines = [...s.lines];
            newLines[lineIndex] = {
              ...newLines[lineIndex]!,
              text: textBefore,
              syllables: computeSyllables(textBefore),
              isManual: true,
            };
            newLines.splice(lineIndex + 1, 0, {
              id: newLineId,
              text: textAfter,
              rhymingSyllables: '',
              rhyme: '',
              syllables: computeSyllables(textAfter),
              concept: 'New line',
              isManual: true,
            });
            const updatedSection: Section = { ...s, lines: newLines };
            const newScheme = redetectScheme(updatedSection);
            return newScheme !== s.rhymeScheme ? { ...updatedSection, rhymeScheme: newScheme } : updatedSection;
          }), sectionId),
        );
        setSelectedLineId(newLineId);
        setTimeout(() => {
          const nextInput = getRef(newLineId);
          if (nextInput) {
            nextInput.focus();
            nextInput.setSelectionRange(0, 0);
          }
        }, 0);
      } else if (e.key === 'ArrowUp') {
        const sectionIndex = song.findIndex(s => s.id === sectionId);
        if (sectionIndex === -1) return;
        const section = song[sectionIndex]!;
        const lineIndex = section.lines.findIndex(l => l.id === lineId);
        let targetLineId = '';
        if (lineIndex > 0) {
          targetLineId = section.lines[lineIndex - 1]!.id;
        } else if (sectionIndex > 0) {
          const prevSection = song[sectionIndex - 1]!;
          if (prevSection.lines.length > 0) targetLineId = prevSection.lines[prevSection.lines.length - 1]!.id;
        }
        if (targetLineId) {
          e.preventDefault();
          setSelectedLineId(targetLineId);
          setTimeout(() => {
            const input = getRef(targetLineId);
            if (input) {
              input.focus();
              const pos = Math.min(selectionStart || 0, input.value.length);
              input.setSelectionRange(pos, pos);
            }
          }, 0);
        }
      } else if (e.key === 'ArrowDown') {
        const sectionIndex = song.findIndex(s => s.id === sectionId);
        if (sectionIndex === -1) return;
        const section = song[sectionIndex]!;
        const lineIndex = section.lines.findIndex(l => l.id === lineId);
        let targetLineId = '';
        if (lineIndex < section.lines.length - 1) {
          targetLineId = section.lines[lineIndex + 1]!.id;
        } else if (sectionIndex < song.length - 1) {
          const nextSection = song[sectionIndex + 1]!;
          if (nextSection.lines.length > 0) targetLineId = nextSection.lines[0]!.id;
        }
        if (targetLineId) {
          e.preventDefault();
          setSelectedLineId(targetLineId);
          setTimeout(() => {
            const input = getRef(targetLineId);
            if (input) {
              input.focus();
              const pos = Math.min(selectionStart || 0, input.value.length);
              input.setSelectionRange(pos, pos);
            }
          }, 0);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [song, updateSong, setSelectedLineId],
  );

  const handleLineClick = useCallback(
    (lineId: string) => {
      if (selectedLineId === lineId) return;
      setSelectedLineId(lineId);
      generateSuggestions(lineId);
    },
    [selectedLineId, setSelectedLineId, generateSuggestions],
  );

  const handleInstructionChange = useCallback(
    (sectionId: string, type: 'pre' | 'post', index: number, value: string) => {
      updateSong(currentSong =>
        currentSong.map(section => {
          if (section.id !== sectionId) return section;
          const key = type === 'pre' ? 'preInstructions' : 'postInstructions';
          const instructions = [...(section[key] || [])];
          instructions[index] = value;
          return { ...section, [key]: instructions };
        }),
      );
    },
    [updateSong],
  );

  const addInstruction = useCallback(
    (sectionId: string, type: 'pre' | 'post') => {
      updateSong(currentSong =>
        currentSong.map(section => {
          if (section.id !== sectionId) return section;
          const key = type === 'pre' ? 'preInstructions' : 'postInstructions';
          return { ...section, [key]: [...(section[key] || []), ''] };
        }),
      );
    },
    [updateSong],
  );

  const removeInstruction = useCallback(
    (sectionId: string, type: 'pre' | 'post', index: number) => {
      updateSong(currentSong =>
        currentSong.map(section => {
          if (section.id !== sectionId) return section;
          const key = type === 'pre' ? 'preInstructions' : 'postInstructions';
          const instructions = [...(section[key] || [])];
          instructions.splice(index, 1);
          return { ...section, [key]: instructions };
        }),
      );
    },
    [updateSong],
  );

  const clearSelection = useCallback(() => {
    setSelectedLineId(null);
    setSuggestions([]);
  }, [setSelectedLineId, setSuggestions]);

  return {
    updateLineText,
    handleLineKeyDown,
    handleLineClick,
    addInstruction,
    removeInstruction,
    handleInstructionChange,
    clearSelection,
  };
};
