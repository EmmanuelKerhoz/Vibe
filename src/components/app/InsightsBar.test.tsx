import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../i18n';
import type { WebSimilarityIndex } from '../../types/webSimilarity';
import { InsightsBarProvider, type InsightsBarContextValue } from '../../contexts/InsightsBarContext';
import { InsightsBar } from './InsightsBar';

vi.mock('../ui/Tooltip', () => ({
  Tooltip: ({ title, children }: { title: string | React.ReactElement; children: React.ReactElement }) => (
    <div data-testid="tooltip" data-title={typeof title === 'string' ? title : '[react-element]'}>
      {children}
    </div>
  ),
}));

const songContextConfig = {
  detectedLanguages: ['English'] as string[],
  songLanguage: 'English',
};

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
    songLanguage: songContextConfig.songLanguage,
    detectedLanguages: songContextConfig.detectedLanguages,
    lineLanguages: {},
  }),
}));

vi.mock('../../contexts/ComposerContext', () => ({
  useComposerContext: () => ({
    isGenerating: false,
  }),
}));

vi.mock('../../contexts/TranslationAdaptationContext', () => ({
  useTranslationAdaptationContext: () => ({
    sectionTargetLanguages: {},
    onSectionTargetLanguageChange: vi.fn(),
    adaptSectionLanguage: vi.fn(),
    adaptLineLanguage: vi.fn(),
    adaptingLineIds: new Set<string>(),
    showTranslationFeatures: true,
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

vi.mock('../../contexts/SimilarityContext', () => ({
  useSimilarityContext: () => ({
    index: {
      candidates: [],
      status: 'idle' as const,
      lastUpdated: null,
      error: null,
    },
    triggerNow: vi.fn(),
    resetIndex: vi.fn(),
  }),
}));

function buildInsightsBarContextValue(overrides?: Partial<InsightsBarContextValue>): InsightsBarContextValue {
  const webSimilarityIndex: WebSimilarityIndex = {
    candidates: [],
    status: 'idle',
    lastUpdated: null,
    error: null,
  };
  return {
    targetLanguage: 'English',
    setTargetLanguage: vi.fn(),
    isAdaptingLanguage: false,
    isDetectingLanguage: false,
    adaptSongLanguage: vi.fn(),
    detectLanguage: vi.fn(),
    adaptationProgress: { active: 'idle' as const, steps: [], label: '' },
    adaptationResult: null,
    isAnalyzing: false,
    analyzeCurrentSong: vi.fn(),
    editMode: 'section' as const,
    switchEditMode: vi.fn(),
    webSimilarityIndex,
    webBadgeLabel: null,
    setIsSimilarityModalOpen: vi.fn(),
    libraryCount: 0,
    onOpenSearch: vi.fn(),
    onToggleAnalysisPanel: vi.fn(),
    isAnalysisPanelOpen: false,
    hasApiKey: true,
    ...overrides,
  };
}

describe('InsightsBar', () => {
  it('renders single-row layout with adaptation, editor toggles, detect, analyze, and similarity buttons', () => {
    const ctxValue = buildInsightsBarContextValue();

    render(
      <LanguageProvider>
        <InsightsBarProvider value={ctxValue}>
          <InsightsBar />
        </InsightsBarProvider>
      </LanguageProvider>,
    );

    const tooltips = screen.getAllByTestId('tooltip');
    // Verify all expected tooltips: Detect, Adaptation, Analyze, Similarity, Analysis Panel, Search
    // (edit mode buttons are now in a single View dropdown, no individual tooltips)
    expect(tooltips.length).toBe(6);
    // First should be the detect button (now before adaptation)
    expect(tooltips[0]!.getAttribute('data-title')).toContain('Detected');
    // Second should be adaptation
    expect(tooltips[1]!.getAttribute('data-title')).toContain('adapt');
    // Third should be analyze
    expect(tooltips[2]!.getAttribute('data-title')).toContain('Analyze');
    // Fourth should be similarity
    expect(tooltips[3]!.getAttribute('data-title')).toContain('Compare');
    // Fifth should be analysis panel
    expect(tooltips[4]!.getAttribute('data-title')).toContain('Phonological');
    // Sixth should be search
    expect(tooltips[5]!.getAttribute('data-title')).toContain('Search');

    expect(screen.getByRole('button', { name: /English/i }).className).toContain('text-[11px]');
    expect(screen.getByText(/^View$/).className).toContain('text-[11px]');
    expect(tooltips[1]!.querySelector('span.truncate')?.className).toContain('text-[11px]');
  });

  it('detect button shows only the primary (first) detected language', () => {
    songContextConfig.detectedLanguages = ['French', 'English', 'Spanish', 'Portuguese'];
    songContextConfig.songLanguage = 'French';

    const ctxValue = buildInsightsBarContextValue();

    render(
      <LanguageProvider>
        <InsightsBarProvider value={ctxValue}>
          <InsightsBar />
        </InsightsBarProvider>
      </LanguageProvider>,
    );

    const detectTooltip = screen.getAllByTestId('tooltip')[0]!;
    const tooltipTitle = detectTooltip.getAttribute('data-title') ?? '';

    // Tooltip should list at most 3 detected languages
    const langMatches = tooltipTitle.match(/French|English|Spanish|Portuguese/g) ?? [];
    expect(langMatches.length).toBeLessThanOrEqual(3);
    expect(langMatches).toContain('French');

    // Button content: only the primary language label should appear (not all 4)
    const detectButton = detectTooltip.querySelector('button')!;
    expect(detectButton.textContent).toContain('French');
    expect(detectButton.textContent).not.toContain('Portuguese');
  });

  it('detect tooltip shows at most 3 detected languages', () => {
    songContextConfig.detectedLanguages = ['French', 'English', 'Spanish'];
    songContextConfig.songLanguage = 'French';

    const ctxValue = buildInsightsBarContextValue();

    render(
      <LanguageProvider>
        <InsightsBarProvider value={ctxValue}>
          <InsightsBar />
        </InsightsBarProvider>
      </LanguageProvider>,
    );

    const detectTooltip = screen.getAllByTestId('tooltip')[0]!;
    const tooltipTitle = detectTooltip.getAttribute('data-title') ?? '';
    expect(tooltipTitle).toContain('French');
    expect(tooltipTitle).toContain('English');
    expect(tooltipTitle).toContain('Spanish');
  });
});
