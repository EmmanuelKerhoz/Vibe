import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import type { Section } from '../types';
import { cleanSectionName } from '../utils/songUtils';
import { generateId } from '../utils/idUtils';

type LineDragInfo = { sectionId: string; lineId: string } | null;

type UseSongEditorParams = {
  song: Section[];
  structure: string[];
  newSectionName: string;
  setNewSectionName: Dispatch<SetStateAction<string>>;
  draggedItemIndex: number | null;
  setDraggedItemIndex: Dispatch<SetStateAction<number | null>>;
  setDragOverIndex: Dispatch<SetStateAction<number | null>>;
  draggedLineInfo: LineDragInfo;
  setDraggedLineInfo: Dispatch<SetStateAction<LineDragInfo>>;
  setDragOverLineInfo: Dispatch<SetStateAction<LineDragInfo>>;
  updateSongWithHistory: (newSong: Section[]) => void;
  updateStructureWithHistory: (newStructure: string[]) => void;
  updateSongAndStructureWithHistory: (newSong: Section[], newStructure: string[]) => void;
  title: string;
  topic: string;
  mood: string;
  openPasteModalWithText: (text: string) => void;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
};

export const useSongEditor = ({
  song,
  structure,
  newSectionName,
  setNewSectionName,
  draggedItemIndex,
  setDraggedItemIndex,
  setDragOverIndex,
  draggedLineInfo,
  setDraggedLineInfo,
  setDragOverLineInfo,
  updateSongWithHistory,
  updateStructureWithHistory,
  updateSongAndStructureWithHistory,
  title,
  topic,
  mood,
  openPasteModalWithText,
  playAudioFeedback,
}: UseSongEditorParams) => {
  const removeStructureItem = (index: number) => {
    const newStructure = structure.filter((_, i) => i !== index);

    if (song.length > index) {
      const newSong = song.filter((_, i) => i !== index);
      updateSongAndStructureWithHistory(newSong, newStructure);
    } else {
      updateStructureWithHistory(newStructure);
    }
  };

  const addStructureItem = (name?: string) => {
    const itemToAdd = cleanSectionName(name || newSectionName.trim());
    if (!itemToAdd) return;

    if (['Intro', 'Bridge', 'Outro'].includes(itemToAdd)) {
      if (structure.some(s => s.toLowerCase() === itemToAdd.toLowerCase())) {
        return;
      }
    }

    let finalName = itemToAdd;
    if (['Verse', 'Pre-Chorus', 'Chorus'].includes(itemToAdd)) {
      const count = structure.filter(s => s.startsWith(itemToAdd)).length;
      if (itemToAdd === 'Verse' || count > 0) {
        finalName = `${itemToAdd} ${count + 1}`;
      }
    }

    let insertIndex = structure.length;

    if (itemToAdd === 'Intro') {
      insertIndex = 0;
    } else if (itemToAdd === 'Pre-Chorus') {
      const nextChorusIndex = structure.findIndex(s => s.startsWith('Chorus'));
      if (nextChorusIndex !== -1) {
        insertIndex = nextChorusIndex;
      }
    } else if (itemToAdd === 'Chorus') {
      const lastPreChorusIndex = [...structure].reverse().findIndex(s => s.startsWith('Pre-Chorus'));
      const lastVerseIndex = [...structure].reverse().findIndex(s => s.startsWith('Verse'));
      if (lastPreChorusIndex !== -1) {
        insertIndex = structure.length - 1 - lastPreChorusIndex + 1;
      } else if (lastVerseIndex !== -1) {
        insertIndex = structure.length - 1 - lastVerseIndex + 1;
      }
    }

    const outroIndex = structure.findIndex(s => s.toLowerCase().includes('outro'));
    if (outroIndex !== -1 && insertIndex > outroIndex) {
      insertIndex = outroIndex;
    }

    const newStructure = [...structure];
    const newSong = [...song];

    const newSection: Section = {
      id: generateId(),
      name: finalName,
      lines: Array(4)
        .fill(null)
        .map(() => ({
          id: generateId(),
          text: '',
          rhymingSyllables: '',
          rhyme: '',
          syllables: 0,
          concept: 'New line',
        })),
    };

    newStructure.splice(insertIndex, 0, finalName);
    if (song.length > 0) {
      newSong.splice(insertIndex, 0, newSection);
    }

    updateSongAndStructureWithHistory(newSong, newStructure);

    if (!name) setNewSectionName('');
  };

  const normalizeStructure = () => {
    const intros = structure.filter(s => s.toLowerCase().includes('intro'));
    const verses = structure.filter(s => s.toLowerCase().includes('verse'));
    const preChoruses = structure.filter(s => s.toLowerCase().includes('pre-chorus') || s.toLowerCase().includes('prechorus'));
    const choruses = structure.filter(s => s.toLowerCase().includes('chorus') && !s.toLowerCase().includes('pre'));
    const bridges = structure.filter(s => s.toLowerCase().includes('bridge'));
    const outros = structure.filter(s => s.toLowerCase().includes('outro'));

    const others = structure.filter(s => {
      const l = s.toLowerCase();
      return !l.includes('intro') && !l.includes('verse') && !l.includes('pre-chorus') && !l.includes('prechorus') && !l.includes('chorus') && !l.includes('bridge') && !l.includes('outro');
    });

    const newStructure: string[] = [];
    newStructure.push(...intros);

    const hasPreChorus = preChoruses.length > 0;
    let preChorusCount = 0;

    const maxVPC = Math.max(verses.length, choruses.length);
    for (let i = 0; i < maxVPC; i++) {
      if (i < verses.length) newStructure.push(verses[i]);

      if (i < choruses.length) {
        if (hasPreChorus) {
          preChorusCount++;
          newStructure.push(`Pre-Chorus ${preChorusCount}`);
        }
        newStructure.push(choruses[i]);
      }
    }

    newStructure.push(...bridges);
    newStructure.push(...others);
    newStructure.push(...outros);

    let newSong: Section[] = [];
    if (song.length > 0) {
      const songCopy = [...song];
      newStructure.forEach(structName => {
        const index = songCopy.findIndex(s => s.name === structName);
        if (index !== -1) {
          newSong.push(songCopy[index]);
          songCopy.splice(index, 1);
        } else {
          newSong.push({
            id: generateId(),
            name: structName,
            lines: Array(4)
              .fill(null)
              .map(() => ({
                id: generateId(),
                text: '',
                rhymingSyllables: '',
                rhyme: '',
                syllables: 0,
                concept: 'New line',
              })),
          });
        }
      });
    }

    updateSongAndStructureWithHistory(newSong, newStructure);
  };

  const handleDrop = (dropIndex: number) => {
    setDragOverIndex(null);
    if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;

    const draggedItemName = structure[draggedItemIndex];

    const getBaseAndNumber = (name: string) => {
      const match = name.match(/^(.+?)\s+(\d+)$/);
      if (match) {
        return { base: match[1], num: parseInt(match[2], 10) };
      }
      return { base: name, num: null };
    };

    const draggedInfo = getBaseAndNumber(draggedItemName);

    if (draggedItemName.toLowerCase().includes('intro') && dropIndex !== 0) return;

    if (draggedItemName.toLowerCase().includes('outro')) {
      if (dropIndex !== structure.length - 1) return;
    } else {
      const outroIndex = structure.findIndex(s => s.toLowerCase().includes('outro'));
      if (outroIndex !== -1) {
        if (dropIndex > outroIndex && draggedItemIndex !== outroIndex) return;
        if (draggedItemIndex === outroIndex && dropIndex !== structure.length - 1) return;
      }
    }

    const tempStructure = [...structure];
    tempStructure.splice(draggedItemIndex, 1);
    tempStructure.splice(dropIndex, 0, draggedItemName);

    if (draggedInfo.num !== null) {
      const sameBaseSections = tempStructure
        .map((name, index) => ({ name, index, ...getBaseAndNumber(name) }))
        .filter(item => item.base === draggedInfo.base && item.num !== null);

      for (let i = 0; i < sameBaseSections.length - 1; i++) {
        if (sameBaseSections[i].num! > sameBaseSections[i + 1].num!) {
          return;
        }
      }
    }

    const newStructure = [...structure];
    const [draggedItem] = newStructure.splice(draggedItemIndex, 1);
    newStructure.splice(dropIndex, 0, draggedItem);

    const newSong = [...song];
    if (newSong.length > 0) {
      const [draggedSection] = newSong.splice(draggedItemIndex, 1);
      newSong.splice(dropIndex, 0, draggedSection);
    }

    updateSongAndStructureWithHistory(newSong, newStructure);
    setDraggedItemIndex(null);
  };

  const handleLineDragStart = (sectionId: string, lineId: string) => {
    setDraggedLineInfo({ sectionId, lineId });
    playAudioFeedback('drag');
  };

  const handleLineDrop = (targetSectionId: string, targetLineId: string) => {
    setDragOverLineInfo(null);
    if (!draggedLineInfo) return;
    if (draggedLineInfo.sectionId === targetSectionId && draggedLineInfo.lineId === targetLineId) {
      setDraggedLineInfo(null);
      return;
    }

    const newSong = [...song];
    const sourceSectionIndex = newSong.findIndex(s => s.id === draggedLineInfo.sectionId);
    const targetSectionIndex = newSong.findIndex(s => s.id === targetSectionId);

    if (sourceSectionIndex === -1 || targetSectionIndex === -1) return;

    const sourceSection = { ...newSong[sourceSectionIndex], lines: [...newSong[sourceSectionIndex].lines] };
    const targetSection = sourceSectionIndex === targetSectionIndex ? sourceSection : { ...newSong[targetSectionIndex], lines: [...newSong[targetSectionIndex].lines] };

    const sourceLineIndex = sourceSection.lines.findIndex(l => l.id === draggedLineInfo.lineId);
    const targetLineIndex = targetSection.lines.findIndex(l => l.id === targetLineId);

    if (sourceLineIndex === -1 || targetLineIndex === -1) return;

    const [draggedLine] = sourceSection.lines.splice(sourceLineIndex, 1);
    targetSection.lines.splice(targetLineIndex, 0, draggedLine);

    newSong[sourceSectionIndex] = sourceSection;
    if (sourceSectionIndex !== targetSectionIndex) {
      newSong[targetSectionIndex] = targetSection;
    }

    updateSongWithHistory(newSong);
    setDraggedLineInfo(null);
    playAudioFeedback('drop');
  };

  const exportTxt = () => {
    if (song.length === 0) return;
    let content = `${title}\n\n`;
    song.forEach(section => {
      content += `[${section.name}]\n`;
      section.lines.forEach(line => {
        content += `${line.text}\n`;
      });
      content += '\n';
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportMd = () => {
    if (song.length === 0) return;
    let content = `# ${title}\n\n`;
    content += `**Topic:** ${topic}\n`;
    content += `**Mood:** ${mood}\n\n`;

    song.forEach(section => {
      content += `### ${section.name}\n\n`;
      section.lines.forEach(line => {
        content += `${line.text}  \n`;
      });
      content += '\n';
    });

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      const text = event.target?.result as string;
      if (text) {
        openPasteModalWithText(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return {
    removeStructureItem,
    addStructureItem,
    normalizeStructure,
    handleDrop,
    handleLineDragStart,
    handleLineDrop,
    exportTxt,
    exportMd,
    handleImport,
  };
};
