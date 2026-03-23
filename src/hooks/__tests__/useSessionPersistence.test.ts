import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_STRUCTURE } from '../../constants/editor';
import { useSessionPersistence } from '../useSessionPersistence';
import { createEmptySong } from '../../utils/songDefaults';

const songContextSetters = vi.hoisted(() => ({
  setTitle: vi.fn(),
  setTitleOrigin: vi.fn(),
  setTopic: vi.fn(),
  setMood: vi.fn(),
  setRhymeScheme: vi.fn(),
  setTargetSyllables: vi.fn(),
  setGenre: vi.fn(),
  setTempo: vi.fn(),
  setInstrumentation: vi.fn(),
  setRhythm: vi.fn(),
  setNarrative: vi.fn(),
  setMusicalPrompt: vi.fn(),
  setSongLanguage: vi.fn(),
}));

vi.mock('../../contexts/SongContext', () => ({
  useSongContext: () => songContextSetters,
}));

const createMemoryStorage = (): Storage => {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
};

const createParams = () => ({
  song: createEmptySong(DEFAULT_STRUCTURE, 'AABB'),
  structure: [...DEFAULT_STRUCTURE],
  title: '',
  titleOrigin: 'user' as const,
  topic: '',
  mood: '',
  rhymeScheme: 'AABB',
  targetSyllables: 10,
  genre: '',
  tempo: 120,
  instrumentation: '',
  rhythm: '',
  narrative: '',
  musicalPrompt: '',
  songLanguage: 'en',
  isSessionHydrated: false,
  setIsSessionHydrated: vi.fn(),
  setHasSavedSession: vi.fn(),
  replaceStateWithoutHistory: vi.fn(),
  clearHistory: vi.fn(),
});

describe('useSessionPersistence', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    Object.values(songContextSetters).forEach((spy) => spy.mockReset());
  });

  it('uses defaults when no stored session exists and hydrates the session', () => {
    const params = createParams();

    renderHook(() => useSessionPersistence(params));

    expect(params.replaceStateWithoutHistory).not.toHaveBeenCalled();
    expect(params.clearHistory).not.toHaveBeenCalled();
    expect(songContextSetters.setTitle).not.toHaveBeenCalled();
    expect(songContextSetters.setTopic).not.toHaveBeenCalled();
    expect(songContextSetters.setMood).not.toHaveBeenCalled();
    expect(params.setHasSavedSession).not.toHaveBeenCalled();
    expect(params.setIsSessionHydrated).toHaveBeenCalledWith(true);
  });

  it('restores all persisted fields from a valid stored session and normalizes stored names', () => {
    const params = createParams();
    localStorage.setItem('lyricist_session', JSON.stringify({
      song: [{
        id: 'stored-section',
        name: ' Verse 1 ',
        rhymeScheme: 'ABAB',
        lines: [{
          id: 'stored-line',
          text: 'City lights are calling',
          rhymingSyllables: 'alling',
          rhyme: 'A',
          syllables: 6,
          concept: 'hook',
        }],
      }],
      structure: [' Verse 1 '],
      title: 'Midnight Echo',
      titleOrigin: 'ai',
      topic: 'Night drive',
      mood: 'Electric',
      rhymeScheme: 'ABAB',
      targetSyllables: 8,
      genre: 'Synthwave',
      tempo: '98',
      instrumentation: 'Analog synths',
      rhythm: 'Pulse',
      narrative: 'Chasing neon',
      musicalPrompt: 'Wide cinematic chorus',
      songLanguage: 'fr',
    }));

    renderHook(() => useSessionPersistence(params));

    expect(params.setHasSavedSession).toHaveBeenCalledWith(true);
    expect(params.replaceStateWithoutHistory).toHaveBeenCalledWith(
      [expect.objectContaining({
        id: 'stored-section',
        name: 'Verse 1',
        rhymeScheme: 'ABAB',
        lines: [expect.objectContaining({
          id: 'stored-line',
          text: 'City lights are calling',
          concept: 'hook',
        })],
      })],
      ['Verse 1'],
    );
    expect(songContextSetters.setTitle).toHaveBeenCalledWith('Midnight Echo');
    expect(songContextSetters.setTitleOrigin).toHaveBeenCalledWith('ai');
    expect(songContextSetters.setTopic).toHaveBeenCalledWith('Night drive');
    expect(songContextSetters.setMood).toHaveBeenCalledWith('Electric');
    expect(songContextSetters.setRhymeScheme).toHaveBeenCalledWith('ABAB');
    expect(songContextSetters.setTargetSyllables).toHaveBeenCalledWith(8);
    expect(songContextSetters.setGenre).toHaveBeenCalledWith('Synthwave');
    expect(songContextSetters.setTempo).toHaveBeenCalledWith(98);
    expect(songContextSetters.setInstrumentation).toHaveBeenCalledWith('Analog synths');
    expect(songContextSetters.setRhythm).toHaveBeenCalledWith('Pulse');
    expect(songContextSetters.setNarrative).toHaveBeenCalledWith('Chasing neon');
    expect(songContextSetters.setMusicalPrompt).toHaveBeenCalledWith('Wide cinematic chorus');
    expect(songContextSetters.setSongLanguage).toHaveBeenCalledWith('fr');
    expect(params.clearHistory).toHaveBeenCalledOnce();
    expect(params.setIsSessionHydrated).toHaveBeenCalledWith(true);
  });

  it('gracefully degrades when the stored session is corrupt', () => {
    const params = createParams();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('lyricist_session', '{not-valid-json');

    expect(() => {
      renderHook(() => useSessionPersistence(params));
    }).not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(params.replaceStateWithoutHistory).not.toHaveBeenCalled();
    expect(params.clearHistory).not.toHaveBeenCalled();
    expect(params.setHasSavedSession).not.toHaveBeenCalled();
    expect(params.setIsSessionHydrated).toHaveBeenCalledWith(true);
  });
});
