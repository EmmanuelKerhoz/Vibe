import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SimilarityMatch } from '../../../utils/similarityUtils';
import type { WebSimilarityIndex } from '../../../types/webSimilarity';
import { SimilarityModal } from './SimilarityModal';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: {
      similarity: {
        title: 'Similarity checker',
        subtitle: 'Compare against the web and your library',
        webTitle: 'Web matches',
        webRefresh: 'Refresh web search',
        webIdle: 'Run a web search to see external matches.',
        webRunning: 'Searching the web for similar lyrics.',
        webNoMatches: 'No web matches found.',
        nGramScoring: 'n-gram scoring',
        libraryTitle: 'Library matches',
        thresholdHint: 'Only strong matches are shown from your library.',
        noCandidates: 'No library candidates available',
        empty: 'No similar lyrics found',
        score: 'Score',
        sharedWords: 'Shared words',
        sharedLines: 'Shared lines',
        matchedSections: 'Matched sections',
        sharedKeywords: 'Shared keywords',
      },
      saveToLibrary: {
        close: 'Close similarity checker',
      },
    },
  }),
}));

vi.mock('../../ui/icons', () => ({
  Search: () => null,
  X: () => null,
  Activity: () => null,
  Globe: () => null,
  ExternalLink: () => null,
  RefreshCw: () => null,
  AlertCircle: () => null,
  Clock: () => null,
  Loader2: () => null,
  Trash2: () => null,
}));

const match: SimilarityMatch = {
  versionId: 'library-1',
  versionName: 'Draft A',
  title: 'Song in library',
  timestamp: 1710000000000,
  score: 48,
  sharedWords: 12,
  sharedLines: 3,
  sharedKeywords: ['midnight', 'city'],
  matchedSections: [{ name: 'Verse', score: 48 }],
};

const idleIndex: WebSimilarityIndex = {
  candidates: [],
  status: 'idle',
  lastUpdated: null,
  error: null,
};

describe('SimilarityModal', () => {
  const createProps = () => ({
    isOpen: true,
    onClose: vi.fn(),
    matches: [] as SimilarityMatch[],
    candidateCount: 0,
    webIndex: idleIndex,
    onWebRefresh: vi.fn(),
    onDeleteLibraryAsset: vi.fn(),
  });

  it('renders nothing when the modal is closed', () => {
    const { container } = render(<SimilarityModal {...createProps()} isOpen={false} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders the similarity surface and idle empty states when it is open', () => {
    const { container } = render(<SimilarityModal {...createProps()} />);

    expect(container.querySelector('.dialog-surface')).toBeTruthy();
    expect(screen.getByText('Similarity checker')).toBeTruthy();
    expect(screen.getByText('Run a web search to see external matches.')).toBeTruthy();
    expect(screen.getByText('No library candidates available')).toBeTruthy();
  });

  it('runs the main callbacks for refreshing, deleting, and closing', () => {
    const props = createProps();

    render(
      <SimilarityModal
        {...props}
        matches={[match]}
        candidateCount={1}
        webIndex={{
          candidates: [],
          status: 'done',
          lastUpdated: 1710000000000,
          error: null,
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Refresh web search' }));
    fireEvent.click(screen.getByTitle('Remove from library'));
    fireEvent.click(screen.getByRole('button', { name: 'Close similarity checker' }));

    expect(props.onWebRefresh).toHaveBeenCalledTimes(1);
    expect(props.onDeleteLibraryAsset).toHaveBeenCalledWith('library-1');
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('renders the running, error, no-match, and populated result branches', () => {
    const { rerender } = render(
      <SimilarityModal
        {...createProps()}
        webIndex={{
          candidates: [],
          status: 'running',
          lastUpdated: null,
          error: null,
        }}
      />,
    );

    expect(screen.getByText('Searching the web for similar lyrics.')).toBeTruthy();

    rerender(
      <SimilarityModal
        {...createProps()}
        webIndex={{
          candidates: [],
          status: 'error',
          lastUpdated: null,
          error: 'Search failed',
        }}
      />,
    );
    expect(screen.getByText('Search failed')).toBeTruthy();

    rerender(
      <SimilarityModal
        {...createProps()}
        webIndex={{
          candidates: [],
          status: 'done',
          lastUpdated: null,
          error: null,
        }}
      />,
    );
    expect(screen.getByText('No web matches found.')).toBeTruthy();

    rerender(
      <SimilarityModal
        {...createProps()}
        matches={[match]}
        candidateCount={1}
        webIndex={{
          candidates: [{
            title: 'External result',
            snippet: 'A similar public lyric snippet',
            url: 'https://example.com/song',
            source: 'ddg',
            score: 62,
            matchedSegments: ['midnight city'],
          }],
          status: 'done',
          lastUpdated: 1710000000000,
          error: null,
        }}
      />,
    );

    expect(screen.getByText('External result')).toBeTruthy();
    expect(screen.getByText('62%')).toBeTruthy();
    expect(screen.getByText('Song in library')).toBeTruthy();
    expect(screen.getByText('midnight')).toBeTruthy();
  });
});
