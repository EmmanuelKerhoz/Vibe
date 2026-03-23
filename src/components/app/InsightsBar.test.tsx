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
  }),
}));

vi.mock('../../contexts/ComposerContext', () => ({
  useComposerContext: () => ({
    isGenerating: false,
  }),
}));

describe('InsightsBar section chip tooltips', () => {
  it('provides section type explanations on the upper ribbon chips', () => {
    const webSimilarityIndex: WebSimilarityIndex = {
      candidates: [],
      status: 'idle',
      lastUpdated: null,
      error: null,
    };

    render(
      <LanguageProvider>
        <InsightsBar
          sectionCount={1}
          wordCount={2}
          charCount={11}
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
          handleGlobalRegenerate={vi.fn()}
          handleMarkupToggle={vi.fn()}
          setIsSimilarityModalOpen={vi.fn()}
          scrollToSection={vi.fn()}
        />
      </LanguageProvider>,
    );

    const introChip = screen.getByRole('button', { name: 'Intro' });
    expect(introChip.parentElement?.getAttribute('data-title')).toBe(
      'Ouvre le morceau et pose l’atmosphère.\nRepère : presque toujours au début, souvent courte.',
    );
  });
});
