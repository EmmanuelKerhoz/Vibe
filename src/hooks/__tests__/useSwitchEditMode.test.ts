import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Section } from '../../types';
import { useSwitchEditMode } from '../useSwitchEditMode';

const mockSongContextValues = vi.hoisted(() => ({
  song: [] as Section[],
}));

vi.mock('../../contexts/SongContext', () => ({
  useSongContext: () => mockSongContextValues,
}));

const baseParams = () => ({
  editMode: 'section' as const,
  markupText: '',
  setEditMode: vi.fn(),
  setMarkupText: vi.fn(),
  updateSongAndStructureWithHistory: vi.fn(),
});

describe('useSwitchEditMode', () => {
  it('uses the shared serializer when switching from section to markup text', () => {
    const setEditMode = vi.fn();
    const setMarkupText = vi.fn();
    const serializeSong = vi.fn(() => '[Verse]\nShared serializer');

    const { result } = renderHook(() => useSwitchEditMode({
      ...baseParams(),
      setEditMode,
      setMarkupText,
      serializeSong,
    }));

    act(() => {
      result.current.switchEditMode('markdown');
    });

    expect(serializeSong).toHaveBeenCalledOnce();
    expect(setMarkupText).toHaveBeenCalledWith('[Verse]\nShared serializer');
    expect(setEditMode).toHaveBeenCalledWith('markdown');
  });

  it('parses markup and updates song plus structure when returning to section mode', () => {
    mockSongContextValues.song = [] as Section[];
    const updateSongAndStructureWithHistory = vi.fn();
    const setEditMode = vi.fn();

    const { result } = renderHook(() => useSwitchEditMode({
      ...baseParams(),
      editMode: 'markdown',
      markupText: '[Verse]\nNeon lights',
      setEditMode,
      updateSongAndStructureWithHistory,
    }));

    act(() => {
      result.current.switchEditMode('section');
    });

    expect(updateSongAndStructureWithHistory).toHaveBeenCalledOnce();
    const [song, structure] = updateSongAndStructureWithHistory.mock.calls[0] as [Section[], string[]];
    expect(structure).toEqual(['Verse']);
    expect(song[0]).toEqual(expect.objectContaining({
      name: 'Verse',
      lines: [expect.objectContaining({ text: 'Neon lights' })],
    }));
    expect(setEditMode).toHaveBeenCalledWith('section');
  });
});
