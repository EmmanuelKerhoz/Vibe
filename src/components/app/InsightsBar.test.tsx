import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../i18n';
import type { WebSimilarityIndex } from '../../types/webSimilarity';
import { InsightsBar } from './InsightsBar';

vi.mock('../ui/Tooltip', () => ({
  Tooltip: ({ title, children }: { title: string | React.ReactElement; children: React.ReactElement }) => (
    <div data-testid="tooltip" data-title={typeof title === 'string' ? title : '[react-element]'}>
      {children}
    </div>
  ),
}));

vi.mock('../../contexts/SongContext', () => ({
  useSongContext: () => ({
    song: [
      {
        id: 'section-1',
        name: 'Intro',
        lines: [{
          id: 'line-1',
          text: 'Hello world',
          rhymingSyllables: '',
          rhyme: '',
          syllables: 0,
          concept: '',
          isMeta: false,
        }],
      },
    ],
    songLanguage: 'English',
    detectedLanguages: ['English'],
    lineLanguages: {},
  }),
}));

vi.mock('../../contexts/ComposerContext', () => ({
  useComposerContext: () => ({
    isGenerating: false,
  }),
}));

vi.mock('../../hooks/useAppKpis', () => ({
  useAppKpis: () => ({
    sectionCount: 1,
    wordCount: 2,
    charCount: 11,
    lineCount: 1,
    lyricsKpis: { sections: 1, lines: 1, words: 2, characters: 11 },
  }),
}));

describe('InsightsBar', () => {
  it('renders single-row layout with detect, adaptation, markup, analyze, and similarity buttons', () => {
    const webSimilarityIndex: WebSimilarityIndex = {
      candidates: [],
      status: 'idle',
      lastUpdated: null,
      error: null,
    };

    render(
      <LanguageProvider>
        <InsightsBar
          targetLanguage="English"
          setTargetLanguage={vi.fn()}
          isAdaptingLanguage={false}
          isDetectingLanguage={false}
          isAnalyzing={false}
          isMarkupMode={false}
          webSimilarityIndex={webSimilarityIndex}
          webBadgeLabel={null}
          libraryCount={0}
          adaptSongLanguage={vi.fn()}
          detectLanguage={vi.fn()}
          analyzeCurrentSong={vi.fn()}
          handleMarkupToggle={vi.fn()}
          setIsSimilarityModalOpen={vi.fn()}
        />
      </LanguageProvider>,
    );

    const tooltips = screen.getAllByTestId('tooltip');
    // Verify all expected tooltips: Detect, Adaptation, Markup, Analyze, Similarity
    expect(tooltips.length).toBe(5);
    // First tooltip should be the detect button (before language dropdown)
    expect(tooltips[0]!.getAttribute('data-title')).toContain('Detected');
    // Second should be adaptation
    expect(tooltips[1]!.getAttribute('data-title')).toContain('adapt');
    // Third should be markup toggle
    expect(tooltips[2]!.getAttribute('data-title')).toContain('Mode');
    // Fourth should be analyze
    expect(tooltips[3]!.getAttribute('data-title')).toContain('Analyze');
    // Fifth should be similarity
    expect(tooltips[4]!.getAttribute('data-title')).toContain('Compare');
  });
});
