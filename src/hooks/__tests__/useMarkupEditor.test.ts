import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Section } from '../../types';
import { useMarkupEditor } from '../useMarkupEditor';

const mockSongContextValues = vi.hoisted(() => ({
  song: [] as Section[],
  songLanguage: 'en',
}));

vi.mock('../../contexts/SongContext', () => ({
  useSongContext: () => mockSongContextValues,
}));

const baseParams = () => ({
  editMode: 'section' as const,
  markupText: '',
  markupTextareaRef: { current: null } as React.RefObject<HTMLTextAreaElement | null>,
  setEditMode: vi.fn(),
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
    const setEditMode = vi.fn();

    const { result } = renderHook(() => useMarkupEditor({
      ...baseParams(),
      setMarkupText,
      setEditMode,
    }));

    act(() => {
      result.current.handleMarkupToggle();
    });

    expect(setMarkupText).toHaveBeenCalledWith('[Verse]\n[Whispered]\nCity lights glow\n[Ad-lib]');
    expect(setEditMode).toHaveBeenCalledWith('markdown');
  });

  it('hydrates markdown mode from the current song when the markup buffer starts empty', () => {
    const song: Section[] = [{
      id: 'section-1',
      name: 'Verse',
      rhymeScheme: 'AABB',
      preInstructions: [],
      postInstructions: [],
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

    renderHook(() => useMarkupEditor({
      ...baseParams(),
      editMode: 'markdown',
      setMarkupText,
    }));

    expect(setMarkupText).toHaveBeenCalledWith('[Verse]\nCity lights glow');
  });

  it('hydrates text mode once the song loads while the markup buffer is still empty', () => {
    mockSongContextValues.song = [] as Section[];
    mockSongContextValues.songLanguage = 'en';

    const setMarkupText = vi.fn();

    const { rerender } = renderHook(() => useMarkupEditor({
      ...baseParams(),
      editMode: 'text',
      setMarkupText,
    }));

    expect(setMarkupText).not.toHaveBeenCalled();

    mockSongContextValues.song = [{
      id: 'section-1',
      name: 'Verse',
      rhymeScheme: 'AABB',
      preInstructions: [],
      postInstructions: [],
      lines: [{
        id: 'line-1',
        text: 'Neon dreams rise',
        rhymingSyllables: '',
        rhyme: '',
        syllables: 4,
        concept: 'scene',
        isMeta: false,
      }],
    }];

    rerender();

    expect(setMarkupText).toHaveBeenCalledWith('[Verse]\nNeon dreams rise');
  });

  it('parses valid markdown back into sections when leaving markup mode', () => {
    mockSongContextValues.song = [] as Section[];
    mockSongContextValues.songLanguage = 'en';

    const updateSongAndStructureWithHistory = vi.fn();
    const setEditMode = vi.fn();

    const { result } = renderHook(() => useMarkupEditor({
      ...baseParams(),
      editMode: 'markdown',
      markupText: '[Verse]\n[Whispered]\nCity lights glow\n[Ad-lib]',
      setEditMode,
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
    expect(setEditMode).toHaveBeenCalledWith('section');
  });

  it('parses non-ASCII bracketed section headers when leaving markup mode', () => {
    mockSongContextValues.song = [] as Section[];
    mockSongContextValues.songLanguage = 'ja';

    const updateSongAndStructureWithHistory = vi.fn();

    const { result } = renderHook(() => useMarkupEditor({
      ...baseParams(),
      editMode: 'markdown',
      markupText: '\u3010Verse\u3011\nNeon lights',
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
    const setEditMode = vi.fn();

    const { result } = renderHook(() => useMarkupEditor({
      ...baseParams(),
      editMode: 'markdown',
      markupText: '   \n\n   ',
      setEditMode,
      updateSongAndStructureWithHistory,
    }));

    expect(() => {
      act(() => {
        result.current.handleMarkupToggle();
      });
    }).not.toThrow();

    expect(updateSongAndStructureWithHistory).not.toHaveBeenCalled();
    expect(setEditMode).toHaveBeenCalledWith('section');
  });

  it('serializes song into markup when switchEditMode is called from section to text', () => {
    const song: Section[] = [{
      id: 'section-1',
      name: 'Verse',
      rhymeScheme: 'AABB',
      preInstructions: [],
      postInstructions: [],
      lines: [{
        id: 'line-1',
        text: 'Hello world',
        rhymingSyllables: '',
        rhyme: '',
        syllables: 4,
        concept: 'greeting',
        isMeta: false,
      }],
    }];
    mockSongContextValues.song = song;
    mockSongContextValues.songLanguage = 'en';

    const setMarkupText = vi.fn();
    const setEditMode = vi.fn();

    const { result } = renderHook(() => useMarkupEditor({
      ...baseParams(),
      setMarkupText,
      setEditMode,
    }));

    act(() => {
      result.current.switchEditMode('text');
    });

    expect(setMarkupText).toHaveBeenCalledWith('[Verse]\nHello world');
    expect(setEditMode).toHaveBeenCalledWith('text');
  });

  it('returns rtl direction for rtl song languages', () => {
    mockSongContextValues.song = [] as Section[];
    mockSongContextValues.songLanguage = 'Arabic';

    const { result } = renderHook(() => useMarkupEditor(baseParams()));

    expect(result.current.markupDirection).toBe('rtl');
  });
});
