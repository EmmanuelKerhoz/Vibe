import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Section } from '../types';
import { jaccardScore, PROVIDERS, runSearchTree } from './webSimilaritySearch';

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

  it('does not surface a candidate when only the title matches', async () => {
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

    expect(candidates).toEqual([]);
  });

  it('caps the title contribution at three percent when lyrics also overlap', async () => {
    const title = 'Midnight Echoes';
    const lyrics = 'neon skyline midnight heartbeat and chrome reflections';
    const snippet = 'neon skyline midnight heartbeat under chrome reflections';
    const providerMock = vi.fn(async () => ([
      {
        title,
        snippet,
        url: 'https://example.com/midnight-echoes',
        source: 'wikipedia' as const,
      },
    ]));
    PROVIDERS.ddg = providerMock;
    PROVIDERS.wikipedia = providerMock;

    const candidates = await runSearchTree(
      [makeSection('verse-1', 'Verse 1', lyrics)],
      title,
    );

    const lyricScore = Math.min(1, jaccardScore(lyrics, snippet) * 0.6 + jaccardScore(lyrics, title) * 0.4);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.title).toBe(title);
    expect(candidates[0]?.score).toBeLessThanOrEqual(Math.round(Math.min(1, lyricScore + 0.03) * 100));
    expect(candidates[0]?.matchedSegments).toContain(`Title: ${title}`);
  });
});
