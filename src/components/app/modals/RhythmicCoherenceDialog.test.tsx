import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RhythmicCoherenceDialog } from './RhythmicCoherenceDialog';
import type { CoherenceResult } from '../../../lib/rhythmicCoherence';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: {
      tooltips: {
        closeDialog: 'Close dialog',
      },
      rhythmicCoherence: {
        title: 'Rhythmic Coherence Check',
        scoreLabel: 'Match Score',
        optionA: 'Prioritise Lyrics',
        optionADescription: 'Adjust the prompt.',
        optionB: 'Adjust Lyrics',
        optionBDescription: 'Trim dense lines.',
        apply: 'Apply',
        skip: 'Skip',
        suggestedBpm: 'Suggested BPM range: {min}–{max}',
        tooLongLines: 'Lines that may be too dense:',
      },
    },
  }),
}));

const result: CoherenceResult = {
  score: 42,
  totalSyllables: 40,
  estimatedCapacity: 20,
  suggestedBpmRange: [90, 120],
  needsReview: true,
  lineDiffs: [{
    lineIndex: 1,
    text: 'beautiful melancholy everlasting',
    syllables: 10,
    maxSyllablesPerBar: 4,
    isTooLong: true,
  }],
};

describe('RhythmicCoherenceDialog', () => {
  it('renders an accessible labelled dialog', () => {
    render(<RhythmicCoherenceDialog result={result} onApply={vi.fn()} onSkip={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Rhythmic Coherence Check' })).toBeTruthy();
    expect(screen.getByText('42%')).toBeTruthy();
    expect(screen.getByText('Suggested BPM range: 90–120')).toBeTruthy();
  });

  it('switches radio options and applies the selected option', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<RhythmicCoherenceDialog result={result} onApply={onApply} onSkip={vi.fn()} />);

    await user.click(screen.getByRole('radio', { name: /adjust lyrics/i }));
    expect(screen.getByText('beautiful melancholy everlasting')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith('b', result);
  });

  it('calls onSkip from skip and backdrop interactions', () => {
    const onSkip = vi.fn();
    const { container } = render(<RhythmicCoherenceDialog result={result} onApply={vi.fn()} onSkip={onSkip} />);

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    fireEvent.click(container.querySelector('.absolute.inset-0') as HTMLElement);

    expect(onSkip).toHaveBeenCalledTimes(2);
  });

  it('keeps tab focus trapped inside the dialog', async () => {
    const user = userEvent.setup();
    render(<RhythmicCoherenceDialog result={result} onApply={vi.fn()} onSkip={vi.fn()} />);

    const firstRadio = screen.getByRole('radio', { name: /prioritise lyrics/i });
    const skipButton = screen.getByRole('button', { name: 'Skip' });
    const applyButton = screen.getByRole('button', { name: 'Apply' });

    await user.click(firstRadio);
    await user.tab();
    expect(skipButton).toHaveFocus();
    await user.tab();
    expect(applyButton).toHaveFocus();
    await user.tab();
    expect(firstRadio).toHaveFocus();

    await user.tab({ shift: true });
    expect(applyButton).toHaveFocus();
  });
});
