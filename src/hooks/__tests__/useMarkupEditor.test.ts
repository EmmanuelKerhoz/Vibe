import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Section } from '../../types';
import { useMarkupEditor } from '../useMarkupEditor';

describe('useMarkupEditor', () => {
  it('parses non-ASCII bracketed section headers when leaving markup mode', () => {
    const updateSongAndStructureWithHistory = vi.fn();
    const { result } = renderHook(() => useMarkupEditor({
      song: [] as Section[],
      songLanguage: 'ja',
      isMarkupMode: true,
      markupText: '【Verse】\nNeon lights',
      markupTextareaRef: { current: null },
      setIsMarkupMode: vi.fn(),
      setMarkupText: vi.fn(),
      updateSongAndStructureWithHistory,
    }));

    act(() => {
      result.current.handleMarkupToggle();
    });

    expect(updateSongAndStructureWithHistory).toHaveBeenCalledOnce();
    const [song, structure] = updateSongAndStructureWithHistory.mock.calls[0] as [Section[], string[]];
    expect(structure).toEqual(['Verse']);
    expect(song[0]?.name).toBe('Verse');
    expect(song[0]?.lines[0]?.text).toBe('Neon lights');
  });

  it('returns rtl direction for rtl song languages', () => {
    const { result } = renderHook(() => useMarkupEditor({
      song: [] as Section[],
      songLanguage: 'Arabic',
      isMarkupMode: false,
      markupText: '',
      markupTextareaRef: { current: null },
      setIsMarkupMode: vi.fn(),
      setMarkupText: vi.fn(),
      updateSongAndStructureWithHistory: vi.fn(),
    }));

    expect(result.current.markupDirection).toBe('rtl');
  });
});
