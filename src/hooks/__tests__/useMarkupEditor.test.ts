import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Section } from '../../types';
import { useMarkupEditor } from '../useMarkupEditor';

describe('useMarkupEditor', () => {
  it('serializes the current song into markdown when entering markup mode', () => {
    const setMarkupText = vi.fn();
    const setIsMarkupMode = vi.fn();
    const song: Section[] = [{
      id: 'section-1',
      name: 'Verse',
      rhymeScheme: 'AABB',
      preInstructions: ['Whispered'],
      postInstructions: ['Ad-lib'],
      lines: [{
        id: 'line-1',
        text: 'City lights glow',
        rhymingSyllables: '',
        rhyme: '',
        syllables: 4,
        concept: 'scene',
        isMeta: false,
      }],
    }];

    const { result } = renderHook(() => useMarkupEditor({
      song,
      songLanguage: 'en',
      isMarkupMode: false,
      markupText: '',
      markupTextareaRef: { current: null },
      setIsMarkupMode,
      setMarkupText,
      updateSongAndStructureWithHistory: vi.fn(),
    }));

    act(() => {
      result.current.handleMarkupToggle();
    });

    expect(setMarkupText).toHaveBeenCalledWith('[Verse]\n[Whispered]\nCity lights glow\n[Ad-lib]');
    expect(setIsMarkupMode).toHaveBeenCalledWith(true);
  });

  it('parses valid markdown back into sections when leaving markup mode', () => {
    const updateSongAndStructureWithHistory = vi.fn();
    const setIsMarkupMode = vi.fn();

    const { result } = renderHook(() => useMarkupEditor({
      song: [] as Section[],
      songLanguage: 'en',
      isMarkupMode: true,
      markupText: '[Verse]\n[Whispered]\nCity lights glow\n[Ad-lib]',
      markupTextareaRef: { current: null },
      setIsMarkupMode,
      setMarkupText: vi.fn(),
      updateSongAndStructureWithHistory,
    }));

    act(() => {
      result.current.handleMarkupToggle();
    });

    expect(updateSongAndStructureWithHistory).toHaveBeenCalledWith(
      [expect.objectContaining({
        name: 'Verse',
        preInstructions: [],
        postInstructions: [],
        lines: [
          expect.objectContaining({
            text: '[Whispered]',
            isMeta: true,
          }),
          expect.objectContaining({
            text: 'City lights glow',
            isMeta: false,
          }),
          expect.objectContaining({
            text: '[Ad-lib]',
            isMeta: true,
          }),
        ],
      })],
      ['Verse'],
    );
    expect(setIsMarkupMode).toHaveBeenCalledWith(false);
  });

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

  it('preserves the previous song state on malformed markdown without throwing', () => {
    const updateSongAndStructureWithHistory = vi.fn();
    const setIsMarkupMode = vi.fn();
    const previousSong: Section[] = [{
      id: 'section-1',
      name: 'Verse',
      lines: [{
        id: 'line-1',
        text: 'Keep me safe',
        rhymingSyllables: '',
        rhyme: '',
        syllables: 4,
        concept: 'existing',
        isMeta: false,
      }],
    }];

    const { result } = renderHook(() => useMarkupEditor({
      song: previousSong,
      songLanguage: 'en',
      isMarkupMode: true,
      markupText: '   \n\n   ',
      markupTextareaRef: { current: null },
      setIsMarkupMode,
      setMarkupText: vi.fn(),
      updateSongAndStructureWithHistory,
    }));

    expect(() => {
      act(() => {
        result.current.handleMarkupToggle();
      });
    }).not.toThrow();

    expect(updateSongAndStructureWithHistory).not.toHaveBeenCalled();
    expect(setIsMarkupMode).toHaveBeenCalledWith(false);
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
