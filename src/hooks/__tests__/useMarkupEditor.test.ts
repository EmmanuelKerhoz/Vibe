import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Section } from '../../types';
import { useMarkupEditor } from '../useMarkupEditor';

const defaultSong: Section[] = [];
const defaultSongLanguage = 'en';

const mockSongContextValues = vi.hoisted(() => ({
  song: defaultSong as Section[],
  songLanguage: defaultSongLanguage,
}));

vi.mock('../../contexts/SongContext', () => ({
  useSongContext: () => mockSongContextValues,
}));

const baseParams = () => ({
  isMarkupMode: false,
  markupText: '',
  markupTextareaRef: { current: null } as React.RefObject<HTMLTextAreaElement | null>,
  setIsMarkupMode: vi.fn(),
  setMarkupText: vi.fn(),
  updateSongAndStructureWithHistory: vi.fn(),
});

describe('useMarkupEditor', () => {
  it('serializes the current song into markdown when entering markup mode', () => {
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
    mockSongContextValues.song = song;
    mockSongContextValues.songLanguage = 'en';

    const setMarkupText = vi.fn();
    const setIsMarkupMode = vi.fn();

    const { result } = renderHook(() => useMarkupEditor({
      ...baseParams(),
      setMarkupText,
      setIsMarkupMode,
    }));

    act(() => {
      result.current.handleMarkupToggle();
    });

    expect(setMarkupText).toHaveBeenCalledWith('[Verse]\n[Whispered]\nCity lights glow\n[Ad-lib]');
    expect(setIsMarkupMode).toHaveBeenCalledWith(true);
  });

  it('parses valid markdown back into sections when leaving markup mode', () => {
    mockSongContextValues.song = [] as Section[];
    mockSongContextValues.songLanguage = 'en';

    const updateSongAndStructureWithHistory = vi.fn();
    const setIsMarkupMode = vi.fn();

    const { result } = renderHook(() => useMarkupEditor({
      ...baseParams(),
      isMarkupMode: true,
      markupText: '[Verse]\n[Whispered]\nCity lights glow\n[Ad-lib]',
      setIsMarkupMode,
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
          expect.objectContaining({ text: '[Whispered]', isMeta: true }),
          expect.objectContaining({ text: 'City lights glow', isMeta: false }),
          expect.objectContaining({ text: '[Ad-lib]', isMeta: true }),
        ],
      })],
      ['Verse'],
    );
    expect(setIsMarkupMode).toHaveBeenCalledWith(false);
  });

  it('parses non-ASCII bracketed section headers when leaving markup mode', () => {
    mockSongContextValues.song = [] as Section[];
    mockSongContextValues.songLanguage = 'ja';

    const updateSongAndStructureWithHistory = vi.fn();

    const { result } = renderHook(() => useMarkupEditor({
      ...baseParams(),
      isMarkupMode: true,
      markupText: '【Verse】\nNeon lights',
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
    mockSongContextValues.song = previousSong;
    mockSongContextValues.songLanguage = 'en';

    const updateSongAndStructureWithHistory = vi.fn();
    const setIsMarkupMode = vi.fn();

    const { result } = renderHook(() => useMarkupEditor({
      ...baseParams(),
      isMarkupMode: true,
      markupText: '   \n\n   ',
      setIsMarkupMode,
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
    mockSongContextValues.song = [] as Section[];
    mockSongContextValues.songLanguage = 'Arabic';

    const { result } = renderHook(() => useMarkupEditor(baseParams()));

    expect(result.current.markupDirection).toBe('rtl');
  });
});
