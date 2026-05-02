import React, { useLayoutEffect } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Section } from '../../types';
import { SongProvider, useSongContext } from '../../contexts/SongContext';
import { useSectionManager } from '../useSectionManager';

const makeSection = (id: string, name: string, lines: Section['lines'] = []): Section => ({ id, name, lines });

function SongContextInitializer({
  song,
  structure,
  newSectionName = '',
  children,
}: {
  song: Section[];
  structure: string[];
  newSectionName?: string;
  children?: React.ReactNode;
}) {
  const { replaceStateWithoutHistory, setNewSectionName } = useSongContext();

  useLayoutEffect(() => {
    replaceStateWithoutHistory(song, structure);
    setNewSectionName(newSectionName);
  }, [replaceStateWithoutHistory, setNewSectionName, song, structure, newSectionName]);

  return React.createElement(React.Fragment, null, children);
}

const buildHook = (
  song: Section[],
  structure: string[],
  newSectionName = '',
) => {
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      SongProvider,
      null,
      React.createElement(SongContextInitializer, { song, structure, newSectionName }, children),
    );

  const { result } = renderHook(() => ({
    sectionManager: useSectionManager(),
    context: useSongContext(),
  }), { wrapper });

  return { result };
};

describe('useSectionManager', () => {
  describe('addStructureItem', () => {
    it('adds a new section in the nominal case', () => {
      const { result } = buildHook(
        [makeSection('s1', 'Verse 1')],
        ['Verse 1'],
      );

      act(() => result.current.sectionManager.addStructureItem('Bridge'));

      expect(result.current.context.structure).toEqual(['Verse 1', 'Bridge']);
      expect(result.current.context.song.map(s => s.name)).toEqual(['Verse 1', 'Bridge']);
    });

    it('does not add a unique section that is already present', () => {
      const { result } = buildHook(
        [makeSection('s1', 'Verse 1'), makeSection('s2', 'Final Chorus')],
        ['Verse 1', 'Final Chorus'],
      );

      const initialSong = result.current.context.song;
      const initialStructure = result.current.context.structure;

      act(() => result.current.sectionManager.addStructureItem('Final Chorus'));

      expect(result.current.context.song).toBe(initialSong);
      expect(result.current.context.structure).toBe(initialStructure);
    });

    it('auto-numbers sections when needed', () => {
      const { result } = buildHook(
        [makeSection('s1', 'Verse 1'), makeSection('s2', 'Chorus')],
        ['Verse 1', 'Chorus'],
      );

      act(() => result.current.sectionManager.addStructureItem('Verse'));

      expect(result.current.context.structure).toEqual(['Verse 1', 'Chorus', 'Verse 2']);
      expect(result.current.context.song[2]?.name).toBe('Verse 2');
    });
  });

  describe('removeStructureItem', () => {
    it('removes the requested structure item and matching section', () => {
      const { result } = buildHook(
        [makeSection('s1', 'Verse 1'), makeSection('s2', 'Chorus')],
        ['Verse 1', 'Chorus'],
      );

      act(() => result.current.sectionManager.removeStructureItem(0));

      expect(result.current.context.structure).toEqual(['Chorus']);
      expect(result.current.context.song.map(s => s.name)).toEqual(['Chorus']);
    });
  });
});

