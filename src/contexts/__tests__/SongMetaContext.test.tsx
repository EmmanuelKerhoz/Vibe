import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { SongMetaProvider, useSongMetaContext } from '../SongMetaContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SongMetaProvider>{children}</SongMetaProvider>
);

describe('SongMetaContext', () => {
  describe('useSongMetaContext', () => {
    it('throws when used outside SongMetaProvider', () => {
      const originalError = console.error;
      console.error = () => {};
      expect(() => renderHook(() => useSongMetaContext())).toThrow(
        'useSongMetaContext must be used inside <SongMetaProvider>',
      );
      console.error = originalError;
    });

    it('provides initial meta values', () => {
      const { result } = renderHook(() => useSongMetaContext(), { wrapper });
      expect(typeof result.current.title).toBe('string');
      expect(typeof result.current.topic).toBe('string');
      expect(typeof result.current.mood).toBe('string');
      expect(typeof result.current.rhymeScheme).toBe('string');
      expect(typeof result.current.targetSyllables).toBe('number');
      expect(typeof result.current.genre).toBe('string');
      expect(typeof result.current.tempo).toBe('number');
    });

    it('exposes setter functions', () => {
      const { result } = renderHook(() => useSongMetaContext(), { wrapper });
      expect(typeof result.current.setTitle).toBe('function');
      expect(typeof result.current.setTopic).toBe('function');
      expect(typeof result.current.setMood).toBe('function');
      expect(typeof result.current.setRhymeScheme).toBe('function');
      expect(typeof result.current.setTargetSyllables).toBe('function');
      expect(typeof result.current.setGenre).toBe('function');
      expect(typeof result.current.setSongLanguage).toBe('function');
    });

    it('updates title when setTitle is called', () => {
      const { result } = renderHook(() => useSongMetaContext(), { wrapper });

      act(() => {
        result.current.setTitle('My New Song');
      });

      expect(result.current.title).toBe('My New Song');
    });

    it('updates rhymeScheme when setRhymeScheme is called', () => {
      const { result } = renderHook(() => useSongMetaContext(), { wrapper });

      act(() => {
        result.current.setRhymeScheme('ABAB');
      });

      expect(result.current.rhymeScheme).toBe('ABAB');
    });

    it('updates songLanguage when setSongLanguage is called', () => {
      const { result } = renderHook(() => useSongMetaContext(), { wrapper });

      act(() => {
        result.current.setSongLanguage('fr');
      });

      expect(result.current.songLanguage).toBe('fr');
    });

    it('updates shouldAutoGenerateTitle flag', () => {
      const { result } = renderHook(() => useSongMetaContext(), { wrapper });

      act(() => {
        result.current.setShouldAutoGenerateTitle(true);
      });

      expect(result.current.shouldAutoGenerateTitle).toBe(true);
    });

    it('provides detectedLanguages and lineLanguages arrays/objects', () => {
      const { result } = renderHook(() => useSongMetaContext(), { wrapper });
      expect(Array.isArray(result.current.detectedLanguages)).toBe(true);
      expect(typeof result.current.lineLanguages).toBe('object');
    });
  });
});
