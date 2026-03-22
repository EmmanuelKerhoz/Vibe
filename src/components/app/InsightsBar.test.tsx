import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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
          song={[
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
          ]}
          sectionCount={1}
          wordCount={2}
          charCount={11}
          targetLanguage="English"
          setTargetLanguage={vi.fn()}
          isAdaptingLanguage={false}
          isDetectingLanguage={false}
          songLanguage="English"
          isGenerating={false}
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

  it('shows a non-blocking imported language suggestion banner', () => {
    const webSimilarityIndex: WebSimilarityIndex = {
      candidates: [],
      status: 'idle',
      lastUpdated: null,
      error: null,
    };
    const applyImportLanguageSuggestion = vi.fn();
    const dismissImportLanguageSuggestion = vi.fn();

    render(
      <LanguageProvider>
        <InsightsBar
          song={[
            {
              id: 'section-1',
              name: 'Verse 1',
              lines: [{
                id: 'line-1',
                text: 'Bonjour la ville',
                rhymingSyllables: '',
                rhyme: '',
                syllables: 0,
                concept: '',
                isMeta: false,
              }],
            },
          ]}
          sectionCount={1}
          wordCount={3}
          charCount={17}
          targetLanguage="English"
          setTargetLanguage={vi.fn()}
          isAdaptingLanguage={false}
          isDetectingLanguage={false}
          songLanguage="English"
          isGenerating={false}
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
          importLanguageSuggestion="French"
          applyImportLanguageSuggestion={applyImportLanguageSuggestion}
          dismissImportLanguageSuggestion={dismissImportLanguageSuggestion}
        />
      </LanguageProvider>,
    );

    expect(screen.getByText(/Imported lyrics look like/i).textContent).toContain('🇫🇷 French');

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(applyImportLanguageSuggestion).toHaveBeenCalledWith('French');

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(dismissImportLanguageSuggestion).toHaveBeenCalled();
  });
});
