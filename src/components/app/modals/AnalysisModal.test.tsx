import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalysisModal } from './AnalysisModal';

// Minimal i18n mock matching AnalysisModal usage
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: {
      analysis: {
        title: 'Analysis',
        deepAnalysis: 'Deep Analysis',
        summary: 'Summary',
        theme: 'Theme',
        emotionalArc: 'Emotional Arc',
        strengths: 'Strengths',
        improvements: 'Improvements',
        musicalSuggestions: 'Musical Suggestions',
        noData: 'No data',
        apply: 'Apply',
        close: 'Close',
        revert: 'Revert',
      },
      tooltips: {
        revertAnalysis: 'Revert analysis',
        applyAnalysis: 'Apply analysis',
        closeAnalysis: 'Close analysis',
      },
    },
  }),
}));

// Minimal icon mocks — AnalysisModal uses named SVG icons
vi.mock('../../ui/icons', () => ({
  X: () => <svg data-testid="icon-x" />, 
  BarChart2: () => <svg data-testid="icon-bar-chart" />, 
  Sparkles: () => <svg data-testid="icon-sparkles" />, 
  Loader2: ({ className }: { className?: string }) => <svg data-testid="icon-loader" className={className} />, 
  BookOpen: () => <svg data-testid="icon-book" />, 
  Activity: () => <svg data-testid="icon-activity" />, 
  CheckCircle2: () => <svg data-testid="icon-check-circle" />, 
  Target: () => <svg data-testid="icon-target" />, 
  Music: () => <svg data-testid="icon-music" />, 
  Plus: () => <svg data-testid="icon-plus" />, 
  Check: () => <svg data-testid="icon-check" />, 
  Undo2: () => <svg data-testid="icon-undo" />, 
  Zap: () => <svg data-testid="icon-zap" />, 
}));

vi.mock('../../ui/Button', () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

vi.mock('../../ui/Tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const baseReport = {
  theme: 'Love and loss',
  emotionalArc: 'Rising then falling',
  strengths: ['Strong imagery'],
  improvements: ['Improve rhyme scheme', 'Add more metaphors'],
  musicalSuggestions: ['Try a minor key'],
  summary: 'A heartfelt song',
};

const baseVersions = [
  {
    id: '1',
    name: 'Before Analysis Improvements',
    song: [],
    structure: [],
    createdAt: 0,
    timestamp: 0,
    title: '',
    titleOrigin: 'user' as const,
    topic: '',
    mood: '',
  },
];

const noop = vi.fn();
const asyncNoop = vi.fn(async () => {});

const renderModal = (overrides: Record<string, unknown> = {}) =>
  render(
    <AnalysisModal
      isOpen={true}
      onClose={noop}
      isAnalyzing={false}
      isAnalyzingTheme={false}
      analysisReport={baseReport}
      analysisSteps={[]}
      appliedAnalysisItems={new Set()}
      selectedAnalysisItems={new Set()}
      isApplyingAnalysis={null}
      toggleAnalysisItemSelection={noop}
      applyAnalysisItem={asyncNoop}
      applySelectedAnalysisItems={noop}
      clearAppliedAnalysisItems={noop}
      versions={baseVersions}
      rollbackToVersion={noop}
      {...overrides}
    />, 
  );

describe('AnalysisModal', () => {
  beforeEach(() => {
    noop.mockClear();
    asyncNoop.mockClear();
  });

  describe('isAnalyzingTheme indicator', () => {
    it('shows pulse indicator when isAnalyzingTheme=true and isAnalyzing=false', () => {
      renderModal({ isAnalyzingTheme: true });
      expect(screen.getByLabelText('Background theme analysis running')).toBeTruthy();
    });

    it('hides pulse indicator when isAnalyzingTheme=false', () => {
      renderModal({ isAnalyzingTheme: false });
      expect(screen.queryByLabelText('Background theme analysis running')).toBeNull();
    });

    it('hides pulse indicator when isAnalyzing=true even if isAnalyzingTheme=true', () => {
      renderModal({ isAnalyzing: true, isAnalyzingTheme: true, analysisReport: null });
      expect(screen.queryByLabelText('Background theme analysis running')).toBeNull();
    });
  });

  describe('applyAnalysisItem one-click button', () => {
    it('renders a Zap button for each improvement item', () => {
      renderModal();
      // 2 improvement items → 2 Zap buttons
      const zapButtons = screen.getAllByLabelText(/^Apply: /);
      expect(zapButtons.length).toBe(2);
    });

    it('calls applyAnalysisItem with correct item text on click', () => {
      renderModal();
      const btn = screen.getByLabelText('Apply: Improve rhyme scheme');
      fireEvent.click(btn);
      expect(asyncNoop).toHaveBeenCalledWith('Improve rhyme scheme');
    });

    it('shows Loader2 spinner when isApplyingAnalysis matches item', () => {
      renderModal({ isApplyingAnalysis: 'Add more metaphors' });
      expect(screen.getByTestId('icon-loader')).toBeTruthy();
    });

    it('disables all Zap buttons when another item is applying', () => {
      renderModal({ isApplyingAnalysis: 'Improve rhyme scheme' });
      const zapButtons = screen.getAllByLabelText(/^Apply: /);
      zapButtons.forEach(btn => {
        expect((btn as HTMLButtonElement).disabled).toBe(true);
      });
    });

    it('does not render Zap button for already-applied items', () => {
      renderModal({ appliedAnalysisItems: new Set(['Improve rhyme scheme']) });
      expect(screen.queryByLabelText('Apply: Improve rhyme scheme')).toBeNull();
      expect(screen.getByLabelText('Apply: Add more metaphors')).toBeTruthy();
    });
  });

  describe('batch-select workflow unchanged', () => {
    it('calls toggleAnalysisItemSelection when checkbox is clicked', () => {
      renderModal();
      // First checkbox = first improvement item
      const checkboxes = screen.getAllByRole('button', { name: /Select for batch apply|Deselect|Applied/ });
      expect(checkboxes.length).toBeGreaterThan(0);
      fireEvent.click(checkboxes[0]!);
      expect(noop).toHaveBeenCalled();
    });
  });

  describe('closed state', () => {
    it('renders nothing when isOpen=false', () => {
      const { container } = render(
        <AnalysisModal
          isOpen={false}
          onClose={noop}
          isAnalyzing={false}
          analysisReport={null}
          analysisSteps={[]}
          appliedAnalysisItems={new Set()}
          selectedAnalysisItems={new Set()}
          isApplyingAnalysis={null}
          toggleAnalysisItemSelection={noop}
          applySelectedAnalysisItems={noop}
          clearAppliedAnalysisItems={noop}
          versions={[]}
          rollbackToVersion={noop}
        />, 
      );
      expect(container.firstChild).toBeNull();
    });
  });
});
