import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SongVersion } from '../../../types';
import { AnalysisModal } from './AnalysisModal';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: {
      analysis: {
        title: 'Analysis',
        deepAnalysis: 'Deep analysis running',
        summary: 'Summary',
        close: 'Close analysis',
        theme: 'Theme',
        emotionalArc: 'Emotional arc',
        strengths: 'Strengths',
        improvements: 'Improvements',
        musicalSuggestions: 'Musical suggestions',
        noData: 'No analysis data',
        revert: 'Revert analysis changes',
        apply: 'Apply selected',
      },
      tooltips: {
        revertAnalysis: 'Revert applied analysis changes',
        applyAnalysis: 'Apply the selected analysis items',
        closeAnalysis: 'Close the analysis modal',
      },
    },
  }),
}));

vi.mock('../../ui/icons', () => ({
  X: () => null,
  BarChart2: () => null,
  Sparkles: () => null,
  Loader2: () => null,
  BookOpen: () => null,
  Activity: () => null,
  CheckCircle2: () => null,
  Target: () => null,
  Music: () => null,
  Plus: () => null,
  Check: () => null,
  Undo2: () => null,
}));

const baseVersion: SongVersion = {
  id: 'version-1',
  timestamp: 1710000000000,
  song: [],
  structure: [],
  title: 'Song title',
  titleOrigin: 'user',
  topic: 'Topic',
  mood: 'Moody',
  name: 'Before Analysis Improvements',
};

const analysisReport = {
  theme: 'A hopeful anthem about change.',
  emotionalArc: 'It rises from doubt into confidence.',
  strengths: ['Strong opening image'],
  improvements: ['Tighten the chorus'],
  musicalSuggestions: ['Add a softer bridge'],
  summary: 'The song has a clear emotional payoff.',
};

const createProps = () => ({
  isOpen: true,
  onClose: vi.fn(),
  isAnalyzing: false,
  analysisReport,
  analysisSteps: ['Parsing structure', 'Scoring themes'],
  appliedAnalysisItems: new Set<string>(),
  selectedAnalysisItems: new Set<string>(),
  isApplyingAnalysis: null,
  toggleAnalysisItemSelection: vi.fn(),
  applySelectedAnalysisItems: vi.fn(),
  clearAppliedAnalysisItems: vi.fn(),
  versions: [baseVersion],
  rollbackToVersion: vi.fn(),
});

describe('AnalysisModal', () => {
  it('renders nothing when the modal is closed', () => {
    render(<AnalysisModal {...createProps()} isOpen={false} />);

    expect(screen.queryByRole('dialog', { name: 'Analysis' })).toBeNull();
  });

  it('renders the dialog and closes from the close action when it is open', () => {
    const props = createProps();

    render(<AnalysisModal {...props} />);

    expect(screen.getByRole('dialog', { name: 'Analysis' })).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Close analysis' })[0]!);

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('renders the analyzing state with the current progress steps', () => {
    render(
      <AnalysisModal
        {...createProps()}
        isAnalyzing
        analysisReport={null}
      />,
    );

    expect(screen.getAllByText('Deep analysis running')).toHaveLength(2);
    expect(screen.getByText('Parsing structure')).toBeTruthy();
    expect(screen.getByText('Scoring themes')).toBeTruthy();
  });

  it('renders the empty state when no analysis report is available', () => {
    render(
      <AnalysisModal
        {...createProps()}
        analysisReport={null}
      />,
    );

    expect(screen.getByText('No analysis data')).toBeTruthy();
  });

  it('toggles selections and applies the selected analysis items', () => {
    const props = createProps();

    render(
      <AnalysisModal
        {...props}
        selectedAnalysisItems={new Set(['Tighten the chorus', 'Add a softer bridge'])}
      />,
    );

    fireEvent.click(screen.getByText('Tighten the chorus').parentElement?.querySelector('button') as HTMLButtonElement);
    fireEvent.click(screen.getByText('Add a softer bridge'));
    fireEvent.click(screen.getByRole('button', { name: 'Apply the selected analysis items' }));

    expect(props.toggleAnalysisItemSelection).toHaveBeenCalledWith('Tighten the chorus');
    expect(props.toggleAnalysisItemSelection).toHaveBeenCalledWith('Add a softer bridge');
    expect(props.applySelectedAnalysisItems).toHaveBeenCalledTimes(1);
  });

  it('rolls back the saved analysis version and clears applied items', () => {
    const props = createProps();

    render(
      <AnalysisModal
        {...props}
        appliedAnalysisItems={new Set(['Tighten the chorus'])}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Revert applied analysis changes' }));

    expect(props.rollbackToVersion).toHaveBeenCalledWith(baseVersion);
    expect(props.clearAppliedAnalysisItems).toHaveBeenCalledTimes(1);
  });
});
