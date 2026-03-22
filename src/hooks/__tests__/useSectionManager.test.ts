import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Section } from '../../types';
import { useSectionManager } from '../useSectionManager';

const makeSection = (id: string, name: string, lines: Section['lines'] = []): Section => ({ id, name, lines });

const buildHook = (
  song: Section[],
  structure: string[],
  newSectionName = '',
) => {
  const updateState = vi.fn();
  const updateStructureWithHistory = vi.fn();
  const updateSongAndStructureWithHistory = vi.fn();
  const setNewSectionName = vi.fn();

  const { result } = renderHook(() =>
    useSectionManager({
      song,
      structure,
      newSectionName,
      setNewSectionName,
      updateState,
      updateStructureWithHistory,
      updateSongAndStructureWithHistory,
    })
  );

  return {
    result,
    setNewSectionName,
    updateStructureWithHistory,
    updateSongAndStructureWithHistory,
  };
};

describe('useSectionManager', () => {
  describe('addStructureItem', () => {
    it('adds a new section in the nominal case', () => {
      const { result, updateSongAndStructureWithHistory } = buildHook(
        [makeSection('s1', 'Verse 1')],
        ['Verse 1'],
      );

      act(() => result.current.addStructureItem('Bridge'));

      expect(updateSongAndStructureWithHistory).toHaveBeenCalledOnce();
      const [newSong, newStructure] = updateSongAndStructureWithHistory.mock.calls[0] as [Section[], string[]];
      expect(newStructure).toEqual(['Verse 1', 'Bridge']);
      expect(newSong.map(section => section.name)).toEqual(['Verse 1', 'Bridge']);
    });

    it('does not add a unique section that is already present', () => {
      const { result, updateSongAndStructureWithHistory } = buildHook(
        [makeSection('s1', 'Verse 1'), makeSection('s2', 'Final Chorus')],
        ['Verse 1', 'Final Chorus'],
      );

      act(() => result.current.addStructureItem('Final Chorus'));

      expect(updateSongAndStructureWithHistory).not.toHaveBeenCalled();
    });

    it('auto-numbers sections when needed', () => {
      const { result, updateSongAndStructureWithHistory } = buildHook(
        [makeSection('s1', 'Verse 1'), makeSection('s2', 'Chorus')],
        ['Verse 1', 'Chorus'],
      );

      act(() => result.current.addStructureItem('Verse'));

      expect(updateSongAndStructureWithHistory).toHaveBeenCalledOnce();
      const [newSong, newStructure] = updateSongAndStructureWithHistory.mock.calls[0] as [Section[], string[]];
      expect(newStructure).toEqual(['Verse 1', 'Chorus', 'Verse 2']);
      expect(newSong[2]?.name).toBe('Verse 2');
    });
  });

  describe('removeStructureItem', () => {
    it('removes the requested structure item and matching section', () => {
      const { result, updateSongAndStructureWithHistory } = buildHook(
        [makeSection('s1', 'Verse 1'), makeSection('s2', 'Chorus')],
        ['Verse 1', 'Chorus'],
      );

      act(() => result.current.removeStructureItem(0));

      expect(updateSongAndStructureWithHistory).toHaveBeenCalledOnce();
      const [newSong, newStructure] = updateSongAndStructureWithHistory.mock.calls[0] as [Section[], string[]];
      expect(newStructure).toEqual(['Chorus']);
      expect(newSong.map(section => section.name)).toEqual(['Chorus']);
    });
  });
});
