import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SourceType } from '../domain/enums';
import { RiskLevel } from '../domain/enums';
import type {
  ReferenceLyricDocument,
  RiskAssessment,
} from '../domain/types';
import { buildNormalizedDocumentFields } from '../utils/normalizeLyrics';
import { InMemoryReferenceRepository } from '../services/repository/ReferenceCorpusRepository';
import {
  DEFAULT_MAX_LYRICS_LENGTH,
  normalizeLanguageCode,
  useCopyrightChecker,
} from '../hooks/useCopyrightChecker';

const buildReference = (
  id: string,
  title: string,
  text: string,
): ReferenceLyricDocument => ({
  id,
  sourceType: SourceType.LICENSED_REFERENCE,
  title,
  language: 'en',
  ...buildNormalizedDocumentFields(text, { language: 'en' }),
});

const HOOK_TEXT =
  'neon ghosts dance under tangerine skies\nverse one here\nneon ghosts dance under tangerine skies';

const buildRepoWithHook = (): InMemoryReferenceRepository =>
  new InMemoryReferenceRepository([
    buildReference(
      'r1',
      'Hook Ref',
      `${HOOK_TEXT}\nfiller line one\n${HOOK_TEXT}`,
    ),
  ]);

describe('normalizeLanguageCode', () => {
  it('returns undefined for undefined / blank input (unspecified)', () => {
    expect(normalizeLanguageCode(undefined)).toBeUndefined();
    expect(normalizeLanguageCode('')).toBeUndefined();
    expect(normalizeLanguageCode('   ')).toBeUndefined();
  });

  it('lowercases a bare base tag', () => {
    expect(normalizeLanguageCode('EN')).toBe('en');
    expect(normalizeLanguageCode('Fr')).toBe('fr');
    expect(normalizeLanguageCode('eng')).toBe('eng');
  });

  it('normalizes BCP 47 region subtag to upper-case', () => {
    expect(normalizeLanguageCode('pt-br')).toBe('pt-BR');
    expect(normalizeLanguageCode('EN-us')).toBe('en-US');
  });

  it('returns null for invalid codes', () => {
    expect(normalizeLanguageCode('english')).toBeNull();
    expect(normalizeLanguageCode('e')).toBeNull();
    expect(normalizeLanguageCode('en_US')).toBeNull();
    expect(normalizeLanguageCode('en-USA')).toBeNull();
    expect(normalizeLanguageCode('123')).toBeNull();
  });
});

describe('useCopyrightChecker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in idle state', () => {
    const repo = buildRepoWithHook();
    const { result } = renderHook(() =>
      useCopyrightChecker({ repository: repo }),
    );
    expect(result.current.status).toBe('idle');
    expect(result.current.assessment).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('debounces runCheck and returns an assessment', async () => {
    const repo = buildRepoWithHook();
    const { result } = renderHook(() =>
      useCopyrightChecker({ repository: repo, debounceMs: 50 }),
    );

    act(() => {
      result.current.runCheck({ text: HOOK_TEXT, language: 'en' });
    });
    // Still pending: the debounce window has not elapsed yet.
    expect(result.current.status).toBe('idle');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60);
    });

    // Switch to real timers to let the engine micro-tasks resolve.
    vi.useRealTimers();
    await waitFor(() => {
      expect(['running', 'done']).toContain(result.current.status);
    });
    await waitFor(() => {
      expect(result.current.status).toBe('done');
    });
    expect(result.current.assessment).not.toBeNull();
    const assessment = result.current.assessment as RiskAssessment;
    expect(assessment.flaggedMatches.length).toBeGreaterThan(0);
    expect([
      RiskLevel.MODERATE,
      RiskLevel.HIGH,
      RiskLevel.ESCALATE,
    ]).toContain(assessment.level);
  });

  it('rejects an over-length submission with an error status', () => {
    const repo = buildRepoWithHook();
    const { result } = renderHook(() =>
      useCopyrightChecker({
        repository: repo,
        debounceMs: 10,
        maxLyricsLength: 32,
      }),
    );

    act(() => {
      result.current.runCheck({ text: 'a'.repeat(64), language: 'en' });
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatch(/exceed maximum length of 32/);
    expect(result.current.assessment).toBeNull();
  });

  it('rejects an invalid language code without scheduling a run', () => {
    const repo = buildRepoWithHook();
    const { result } = renderHook(() =>
      useCopyrightChecker({ repository: repo, debounceMs: 10 }),
    );

    act(() => {
      result.current.runCheck({ text: HOOK_TEXT, language: 'english' });
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatch(/Invalid language code "english"/);
    // No timer was queued — advancing fake timers must not change state.
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current.status).toBe('error');
  });

  it('exposes the configured default max length', () => {
    expect(DEFAULT_MAX_LYRICS_LENGTH).toBeGreaterThan(0);
  });

  it('reset() clears state and cancels a pending debounce', () => {
    const repo = buildRepoWithHook();
    const { result } = renderHook(() =>
      useCopyrightChecker({ repository: repo, debounceMs: 100 }),
    );

    act(() => {
      result.current.runCheck({ text: HOOK_TEXT, language: 'en' });
    });
    act(() => {
      result.current.reset();
    });

    // The pending timer must not fire after reset.
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.assessment).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('treats an empty / whitespace-only text as a reset', () => {
    const repo = buildRepoWithHook();
    const { result } = renderHook(() =>
      useCopyrightChecker({ repository: repo, debounceMs: 10 }),
    );

    act(() => {
      result.current.runCheck({ text: '   \n\t  ' });
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
  });

  it('cleans up pending timers on unmount (no setState after unmount)', () => {
    const repo = buildRepoWithHook();
    const { result, unmount } = renderHook(() =>
      useCopyrightChecker({ repository: repo, debounceMs: 100 }),
    );
    act(() => {
      result.current.runCheck({ text: HOOK_TEXT, language: 'en' });
    });

    expect(() => {
      unmount();
      vi.advanceTimersByTime(1_000);
    }).not.toThrow();
  });
});
