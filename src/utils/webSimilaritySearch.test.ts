import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Section } from '../types';
import { PROVIDERS, runSearchTree } from './webSimilaritySearch';

const originalProviders = {
  ddg: PROVIDERS.ddg,
  wikipedia: PROVIDERS.wikipedia,
};

const makeSection = (id: string, name: string, text: string): Section => ({
  id,
  name,
  lines: [{
    id: `${id}-line-1`,
    text,
    syllables: 0,
    concept: '',
    rhyme: '',
    rhymingSyllables: '',
  }],
});

describe('runSearchTree', () => {
  afterEach(() => {
    PROVIDERS.ddg = originalProviders.ddg;
    PROVIDERS.wikipedia = originalProviders.wikipedia;
  });

  it('returns a match when the song title matches a web result title', async () => {
    const providerMock = vi.fn(async () => ([
      {
        title: 'Existing Title',
        snippet: 'An encyclopedic entry with unrelated body text.',
        url: 'https://example.com/existing-title',
        source: 'wikipedia' as const,
      },
    ]));
    PROVIDERS.ddg = providerMock;
    PROVIDERS.wikipedia = providerMock;

    const candidates = await runSearchTree(
      [makeSection('verse-1', 'Verse 1', 'totally different lyrics with no overlap at all')],
      'Existing Title',
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.title).toBe('Existing Title');
    expect(candidates[0]?.score).toBeGreaterThan(5);
    expect(candidates[0]?.matchedSegments).toContain('Title: Existing Title');
  });
});
