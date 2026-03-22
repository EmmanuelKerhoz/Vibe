import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSongMeta } from '../useSongMeta';

describe('useSongMeta', () => {
  it('includes the former musical meta state', () => {
    const { result } = renderHook(() => useSongMeta());

    expect(result.current.genre).toBe('');
    expect(result.current.tempo).toBe('120');
    expect(result.current.instrumentation).toBe('');
    expect(result.current.rhythm).toBe('');
    expect(result.current.narrative).toBe('');
    expect(result.current.musicalPrompt).toBe('');

    act(() => {
      result.current.setGenre('Soul');
      result.current.setTempo('96');
      result.current.setInstrumentation('Piano');
      result.current.setRhythm('Swing');
      result.current.setNarrative('Story');
      result.current.setMusicalPrompt('Warm groove');
    });

    expect(result.current.genre).toBe('Soul');
    expect(result.current.tempo).toBe('96');
    expect(result.current.instrumentation).toBe('Piano');
    expect(result.current.rhythm).toBe('Swing');
    expect(result.current.narrative).toBe('Story');
    expect(result.current.musicalPrompt).toBe('Warm groove');
  });
});
