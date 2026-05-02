import { useCallback } from 'react';
import type { Section } from '../types';
import { cleanSectionName } from '../utils/songUtils';
import { generateId } from '../utils/idUtils';
import {
  getSectionTypeKey,
  isAnchoredEndSection,
  isAnchoredStartSection,
  isLinkedChorusSectionName,
  isLinkedPreChorusPair,
  isPreChorusSectionName,
  isSectionType,
  isUniqueSectionType,
  shouldAutoNumberSection,
} from '../constants/sections';
import { useSongContext } from '../contexts/SongContext';

export const makeEmptyLines = () =>
  Array(4).fill(null).map(() => ({
    id: generateId(),
    text: '',
    rhymingSyllables: '',
    rhyme: '',
    syllables: 0,
    concept: 'New line',
  }));

export const makeEmptySection = (name: string): Section => ({
  id: generateId(),
  name,
  rhymeScheme: '',
  lines: makeEmptyLines(),
});

export const getTiedSectionRange = (items: string[], index: number) => {
  if (index < 0 || index >= items.length) return { start: index, end: index };
  const current = items[index] ?? '';
  if (index + 1 < items.length && isLinkedPreChorusPair(current, items[index + 1])) {
    return { start: index, end: index + 1 };
  }
  if (isLinkedChorusSectionName(current) && index > 0 && isPreChorusSectionName(items[index - 1] ?? '')) {
    return { start: index - 1, end: index };
  }
  return { start: index, end: index };
};

export const useSectionManager = () => {
  const {
    song,
    structure,
    newSectionName,
    setNewSectionName,
    updateStructureWithHistory,
    updateSongAndStructureWithHistory,
  } = useSongContext();
  const removeStructureItem = useCallback((index: number) => {
    const newStructure = structure.filter((_, i) => i !== index);
    if (song.length > index) {
      const newSong = song.filter((_, i) => i !== index);
      updateSongAndStructureWithHistory(newSong, newStructure);
    } else {
      updateStructureWithHistory(newStructure);
    }
  }, [song, structure, updateSongAndStructureWithHistory, updateStructureWithHistory]);

  const addStructureItem = useCallback((name?: string) => {
    const itemToAdd = cleanSectionName(name || newSectionName.trim());
    if (!itemToAdd) return;

    const itemTypeKey = getSectionTypeKey(itemToAdd);
    if (isUniqueSectionType(itemToAdd)) {
      if (structure.some(s => getSectionTypeKey(s) === itemTypeKey)) return;
    }

    let finalName = itemToAdd;
    if (shouldAutoNumberSection(itemToAdd)) {
      const count = structure.filter(s => getSectionTypeKey(s) === itemTypeKey).length;
      if (itemToAdd === 'Verse' || count > 0) finalName = `${itemToAdd} ${count + 1}`;
    }

    let insertIndex = structure.length;
    if (isAnchoredStartSection(itemToAdd)) {
      insertIndex = 0;
    } else if (isSectionType(itemToAdd, 'pre-chorus')) {
      const nextChorusIndex = structure.findIndex(s => isSectionType(s, 'chorus'));
      if (nextChorusIndex !== -1) insertIndex = nextChorusIndex;
    } else if (isSectionType(itemToAdd, 'chorus')) {
      const lastPreChorusIndex = [...structure].reverse().findIndex(s => isSectionType(s, 'pre-chorus'));
      const lastVerseIndex = [...structure].reverse().findIndex(s => isSectionType(s, 'verse'));
      if (lastPreChorusIndex !== -1) insertIndex = structure.length - 1 - lastPreChorusIndex + 1;
      else if (lastVerseIndex !== -1) insertIndex = structure.length - 1 - lastVerseIndex + 1;
    }

    const anchoredEndIndex = structure.findIndex(isAnchoredEndSection);
    if (anchoredEndIndex !== -1 && insertIndex > anchoredEndIndex && !isAnchoredEndSection(itemToAdd)) insertIndex = anchoredEndIndex;

    const newStructure = [...structure];
    const newSong = [...song];
    newStructure.splice(insertIndex, 0, finalName);
    newSong.splice(insertIndex, 0, makeEmptySection(finalName));
    updateSongAndStructureWithHistory(newSong, newStructure);
    if (!name) setNewSectionName('');
  }, [song, structure, newSectionName, setNewSectionName, updateSongAndStructureWithHistory]);

  const normalizeStructure = useCallback(() => {
    const intros = structure.filter(isAnchoredStartSection);
    const verses = structure.filter(s => isSectionType(s, 'verse'));
    const preChoruses = structure.filter(s => isSectionType(s, 'pre-chorus'));
    const choruses = structure.filter(s => ['chorus', 'refrain', 'final-chorus'].includes(getSectionTypeKey(s) ?? ''));
    const bridges = structure.filter(s => ['bridge', 'middle-8'].includes(getSectionTypeKey(s) ?? ''));
    const outros = structure.filter(isAnchoredEndSection);
    const others = structure.filter(s => {
      const key = getSectionTypeKey(s);
      return !isAnchoredStartSection(s)
        && key !== 'verse'
        && key !== 'pre-chorus'
        && key !== 'chorus'
        && key !== 'refrain'
        && key !== 'final-chorus'
        && key !== 'bridge'
        && key !== 'middle-8'
        && !isAnchoredEndSection(s);
    });

    const newStructure: string[] = [];
    newStructure.push(...intros);
    const hasPreChorus = preChoruses.length > 0;
    let preChorusCount = 0;
    const maxVPC = Math.max(verses.length, choruses.length);
    for (let i = 0; i < maxVPC; i++) {
      if (i < verses.length) newStructure.push(verses[i]!);
      if (i < choruses.length) {
        if (hasPreChorus) {
          const existingPreChorus = preChoruses[preChorusCount];
          newStructure.push(existingPreChorus ?? `Pre-Chorus ${preChorusCount + 1}`);
          preChorusCount++;
        }
        newStructure.push(choruses[i]!);
      }
    }
    newStructure.push(...bridges, ...others, ...outros);

    const songCopy = [...song];
    const newSong: Section[] = newStructure.map(structName => {
      const index = songCopy.findIndex(s => s.name === structName);
      if (index !== -1) {
        const [matched] = songCopy.splice(index, 1);
        return matched!;
      }
      return makeEmptySection(structName);
    });
    updateSongAndStructureWithHistory(newSong, newStructure);
  }, [song, structure, updateSongAndStructureWithHistory]);

  return {
    removeStructureItem,
    addStructureItem,
    normalizeStructure,
  };
};
