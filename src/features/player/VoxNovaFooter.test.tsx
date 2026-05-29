import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createRef } from 'react';
import { LCARSBackground, VoxNovaFooter } from './VoxNovaFooter';
import type { FrequencyAnalyserState } from './useFrequencyAnalyser';

function makeAnalyser(): FrequencyAnalyserState {
  return {
    analyserRef: createRef<AnalyserNode | null>(),
    dataArrayRef: createRef<Uint8Array | null>(),
    initAnalyser: vi.fn(),
  };
}

describe('VoxNovaFooter', () => {
  it('renders the singularity status and reflects the paused state', () => {
    render(<VoxNovaFooter isPlaying={false} analyser={makeAnalyser()} wideWidth="800px" />);
    expect(screen.getByText('SINGULARITY STATUS')).toBeInTheDocument();
    expect(screen.getByText('EVENT HORIZON STABLE')).toBeInTheDocument();
  });

  it('reflects the playing state', () => {
    render(<VoxNovaFooter isPlaying analyser={makeAnalyser()} wideWidth="800px" />);
    expect(screen.getByText('ACCRETION ACTIVE')).toBeInTheDocument();
  });
});

describe('LCARSBackground', () => {
  it('renders a decorative, aria-hidden backdrop', () => {
    const { container } = render(<LCARSBackground />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute('aria-hidden', 'true');
  });
});
