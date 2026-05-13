import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAutoSaveCoordinator } from '../useAutoSaveCoordinator';

// ── Mocks ────────────────────────────────────────────────────────────────────

// Stable song-context payload mutated per-test before render.
const songContextMock = vi.hoisted(() => ({
  song: [{ id: 'sec-1', name: 'Verse 1', lines: [] }],
  structure: ['Verse 1'],
  title: 'My Song',
  titleOrigin: 'user' as const,
  topic: 'love',
  mood: 'happy',
  rhymeScheme: 'AABB',
  targetSyllables: 8,
  songLanguage: 'en',
  genre: 'pop',
  tempo: 120,
  songDurationSeconds: 180,
  timeSignature: [4, 4] as [number, number],
  instrumentation: 'guitar',
  rhythm: 'steady',
  narrative: 'first-person',
  musicalPrompt: 'A bright pop song',
}));

vi.mock('../../contexts/SongContext', () => ({
  useSongContext: () => songContextMock,
}));

const useSessionAutoSaveMock = vi.hoisted(() => vi.fn());

vi.mock('../useSessionAutoSave', () => ({
  useSessionAutoSave: useSessionAutoSaveMock,
}));

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useAutoSaveCoordinator', () => {
  beforeEach(() => {
    useSessionAutoSaveMock.mockReturnValue({ saveStatus: 'idle', lastSavedAt: null });
  });

  afterEach(() => {
    useSessionAutoSaveMock.mockReset();
  });

  it('forwards every SongContext field together with the panel UI flags', () => {
    renderHook(() =>
      useAutoSaveCoordinator({
        activeTab: 'lyrics',
        isStructureOpen: true,
        isLeftPanelOpen: false,
      }),
    );

    expect(useSessionAutoSaveMock).toHaveBeenCalledTimes(1);
    const payload = useSessionAutoSaveMock.mock.calls[0][0];

    expect(payload).toMatchObject({
      song: songContextMock.song,
      structure: songContextMock.structure,
      title: songContextMock.title,
      titleOrigin: songContextMock.titleOrigin,
      topic: songContextMock.topic,
      mood: songContextMock.mood,
      rhymeScheme: songContextMock.rhymeScheme,
      targetSyllables: songContextMock.targetSyllables,
      songLanguage: songContextMock.songLanguage,
      genre: songContextMock.genre,
      tempo: songContextMock.tempo,
      songDurationSeconds: songContextMock.songDurationSeconds,
      timeSignature: songContextMock.timeSignature,
      instrumentation: songContextMock.instrumentation,
      rhythm: songContextMock.rhythm,
      narrative: songContextMock.narrative,
      musicalPrompt: songContextMock.musicalPrompt,
      activeTab: 'lyrics',
      isStructureOpen: true,
      isLeftPanelOpen: false,
    });
  });

  it('returns the SessionAutoSaveResult produced by useSessionAutoSave', () => {
    useSessionAutoSaveMock.mockReturnValue({ saveStatus: 'saved', lastSavedAt: 1234 });

    const { result } = renderHook(() =>
      useAutoSaveCoordinator({
        activeTab: 'musical',
        isStructureOpen: false,
        isLeftPanelOpen: true,
      }),
    );

    expect(result.current).toEqual({ saveStatus: 'saved', lastSavedAt: 1234 });
  });

  it('passes a stable onSaved callback that always calls the latest handler', () => {
    const first = vi.fn();
    const second = vi.fn();

    const { rerender } = renderHook(
      ({ onSaved }: { onSaved: () => void }) =>
        useAutoSaveCoordinator({
          activeTab: 'lyrics',
          isStructureOpen: false,
          isLeftPanelOpen: false,
          onSaved,
        }),
      { initialProps: { onSaved: first } },
    );

    const firstStableOnSaved = useSessionAutoSaveMock.mock.calls[0][0].onSaved as () => void;
    expect(typeof firstStableOnSaved).toBe('function');

    rerender({ onSaved: second });
    const secondStableOnSaved = useSessionAutoSaveMock.mock.calls[1][0].onSaved as () => void;

    // Same function identity across renders — prevents useSessionAutoSave from
    // re-running its effect just because the parent passed a new handler.
    expect(secondStableOnSaved).toBe(firstStableOnSaved);

    // …but the latest handler is the one that actually fires.
    secondStableOnSaved();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('tolerates an undefined onSaved without throwing', () => {
    renderHook(() =>
      useAutoSaveCoordinator({
        activeTab: 'lyrics',
        isStructureOpen: false,
        isLeftPanelOpen: false,
      }),
    );

    const stableOnSaved = useSessionAutoSaveMock.mock.calls[0][0].onSaved as () => void;
    expect(() => stableOnSaved()).not.toThrow();
  });

  it('reflects updated panel UI flags on subsequent renders', () => {
    const { rerender } = renderHook(
      (props: { activeTab: 'lyrics' | 'musical'; isStructureOpen: boolean; isLeftPanelOpen: boolean }) =>
        useAutoSaveCoordinator(props),
      {
        initialProps: { activeTab: 'lyrics', isStructureOpen: false, isLeftPanelOpen: false },
      },
    );

    rerender({ activeTab: 'musical', isStructureOpen: true, isLeftPanelOpen: true });

    const lastCall = useSessionAutoSaveMock.mock.calls.at(-1)![0];
    expect(lastCall).toMatchObject({
      activeTab: 'musical',
      isStructureOpen: true,
      isLeftPanelOpen: true,
    });
  });
});
