import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../i18n';
import type { WebSimilarityIndex } from '../../types/webSimilarity';
import { InsightsBar } from './InsightsBar';

const editorContextState = vi.hoisted(() => ({
  editMode: 'section' as 'text' | 'markdown' | 'section' | 'phonetic',
  switchEditMode: vi.fn(),
}));

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

vi.mock('../../contexts/EditorContext', () => ({
  useEditorContext: () => editorContextState,
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
  it('renders single-row layout with adaptation, editor toggles, detect, analyze, and similarity buttons', () => {
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
          webSimilarityIndex={webSimilarityIndex}
          webBadgeLabel={null}
          libraryCount={0}
          adaptSongLanguage={vi.fn()}
          detectLanguage={vi.fn()}
          analyzeCurrentSong={vi.fn()}
          setIsSimilarityModalOpen={vi.fn()}
        />
      </LanguageProvider>,
    );

    const tooltips = screen.getAllByTestId('tooltip');
    // Verify all expected tooltips: Adaptation, Text, Markdown, Phonetic, Editor, Detect, Analyze, Similarity
    expect(tooltips.length).toBe(8);
    // First should be adaptation
    expect(tooltips[0]!.getAttribute('data-title')).toContain('adapt');
    // Second-Fifth should be edit mode buttons (Text, Markdown, Phonetic, Editor)
    expect(tooltips[1]!.getAttribute('data-title')).toContain('Text');
    expect(tooltips[2]!.getAttribute('data-title')).toContain('Mode');
    expect(tooltips[3]!.getAttribute('data-title')).toContain('Phonetic');
    expect(tooltips[4]!.getAttribute('data-title')).toContain('Editor');
    // Sixth should be the detect button, immediately before analyze in the insights group
    expect(tooltips[5]!.getAttribute('data-title')).toContain('Detected');
    // Seventh should be analyze
    expect(tooltips[6]!.getAttribute('data-title')).toContain('Analyze');
    // Eighth should be similarity
    expect(tooltips[7]!.getAttribute('data-title')).toContain('Compare');
  });

  it('detect button shows only the primary (first) detected language', () => {
    songContextConfig.detectedLanguages = ['French', 'English', 'Spanish', 'Portuguese'];
    songContextConfig.songLanguage = 'French';

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
          webSimilarityIndex={webSimilarityIndex}
          webBadgeLabel={null}
          libraryCount={0}
          adaptSongLanguage={vi.fn()}
          detectLanguage={vi.fn()}
          analyzeCurrentSong={vi.fn()}
          setIsSimilarityModalOpen={vi.fn()}
        />
      </LanguageProvider>,
    );

    const detectTooltip = screen.getAllByTestId('tooltip')[5]!;
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
          webSimilarityIndex={webSimilarityIndex}
          webBadgeLabel={null}
          libraryCount={0}
          adaptSongLanguage={vi.fn()}
          detectLanguage={vi.fn()}
          analyzeCurrentSong={vi.fn()}
          setIsSimilarityModalOpen={vi.fn()}
        />
      </LanguageProvider>,
    );

    const detectTooltip = screen.getAllByTestId('tooltip')[5]!;
    const tooltipTitle = detectTooltip.getAttribute('data-title') ?? '';
    expect(tooltipTitle).toContain('French');
    expect(tooltipTitle).toContain('English');
    expect(tooltipTitle).toContain('Spanish');
  });
});
