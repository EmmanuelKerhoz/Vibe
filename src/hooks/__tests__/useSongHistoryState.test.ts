import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSongHistoryState } from '../useSongHistoryState';
import type { Section } from '../../types';

const makeSection = (id: string, name: string): Section => ({
  id,
  name,
  lines: [],
});

const S1 = makeSection('s1', 'Verse 1');
const S2 = makeSection('s2', 'Chorus');
const S3 = makeSection('s3', 'Bridge');

describe('useSongHistoryState', () => {
  it('initialises with provided song and structure', () => {
    const { result } = renderHook(() =>
      useSongHistoryState([S1, S2], ['Verse 1', 'Chorus'])
    );
    expect(result.current.song).toHaveLength(2);
    expect(result.current.structure).toEqual(['Verse 1', 'Chorus']);
    expect(result.current.past).toHaveLength(0);
    expect(result.current.future).toHaveLength(0);
  });

  it('updateSongWithHistory pushes to past and clears future', () => {
    const { result } = renderHook(() =>
      useSongHistoryState([S1], ['Verse 1'])
    );
    act(() => result.current.updateSongWithHistory([S1, S2]));
    expect(result.current.song).toHaveLength(2);
    expect(result.current.past).toHaveLength(1);
    expect(result.current.future).toHaveLength(0);
  });

  it('undo restores previous state', () => {
    const { result } = renderHook(() =>
      useSongHistoryState([S1], ['Verse 1'])
    );
    act(() => result.current.updateSongWithHistory([S1, S2]));
    act(() => result.current.undo());
    expect(result.current.song).toHaveLength(1);
    expect(result.current.past).toHaveLength(0);
    expect(result.current.future).toHaveLength(1);
  });

  it('redo re-applies undone state', () => {
    const { result } = renderHook(() =>
      useSongHistoryState([S1], ['Verse 1'])
    );
    act(() => result.current.updateSongWithHistory([S1, S2]));
    act(() => result.current.undo());
    act(() => result.current.redo());
    expect(result.current.song).toHaveLength(2);
    expect(result.current.future).toHaveLength(0);
  });

  it('undo is a no-op when past is empty', () => {
    const { result } = renderHook(() =>
      useSongHistoryState([S1], ['Verse 1'])
    );
    act(() => result.current.undo());
    expect(result.current.song).toHaveLength(1);
    expect(result.current.past).toHaveLength(0);
  });

  it('redo is a no-op when future is empty', () => {
    const { result } = renderHook(() =>
      useSongHistoryState([S1], ['Verse 1'])
    );
    act(() => result.current.redo());
    expect(result.current.future).toHaveLength(0);
  });

  it('new update after undo clears future', () => {
    const { result } = renderHook(() =>
      useSongHistoryState([S1], ['Verse 1'])
    );
    act(() => result.current.updateSongWithHistory([S1, S2]));
    act(() => result.current.undo());
    act(() => result.current.updateSongWithHistory([S1, S3]));
    expect(result.current.song[1]?.id).toBe('s3');
    expect(result.current.future).toHaveLength(0);
  });

  it('replaceStateWithoutHistory does not push to past', () => {
    const { result } = renderHook(() =>
      useSongHistoryState([S1], ['Verse 1'])
    );
    act(() => result.current.replaceStateWithoutHistory([S1, S2], ['Verse 1', 'Chorus']));
    expect(result.current.past).toHaveLength(0);
    expect(result.current.song).toHaveLength(2);
  });

  it('clearHistory empties past and future', () => {
    const { result } = renderHook(() =>
      useSongHistoryState([S1], ['Verse 1'])
    );
    act(() => result.current.updateSongWithHistory([S1, S2]));
    act(() => result.current.undo());
    act(() => result.current.clearHistory());
    expect(result.current.past).toHaveLength(0);
    expect(result.current.future).toHaveLength(0);
  });

  it('updateSongAndStructureWithHistory updates both atomically', () => {
    const { result } = renderHook(() =>
      useSongHistoryState([S1], ['Verse 1'])
    );
    act(() =>
      result.current.updateSongAndStructureWithHistory([S1, S2], ['Verse 1', 'Chorus'])
    );
    expect(result.current.song).toHaveLength(2);
    expect(result.current.structure).toEqual(['Verse 1', 'Chorus']);
    expect(result.current.past).toHaveLength(1);
  });

  it('normalises section names on insert', () => {
    const dirty = makeSection('s4', '  Verse 2  ');
    const { result } = renderHook(() =>
      useSongHistoryState([dirty], ['  Verse 2  '])
    );
    expect(result.current.song[0]?.name).toBe('Verse 2');
    expect(result.current.structure[0]).toBe('Verse 2');
  });
});
