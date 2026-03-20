import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../i18n';
import { buildGenreTooltip, MusicalParamsPanel } from './MusicalParamsPanel';

describe('MusicalParamsPanel', () => {
  it('shows category summaries beneath the category title and builds genre hover details', () => {
    render(
      <LanguageProvider>
        <MusicalParamsPanel
          genre=""
          setGenre={vi.fn()}
          tempo="120"
          setTempo={vi.fn()}
          instrumentation=""
          setInstrumentation={vi.fn()}
          rhythm=""
          setRhythm={vi.fn()}
          narrative=""
          setNarrative={vi.fn()}
        />
      </LanguageProvider>,
    );

    const heading = screen.getByText('ÉLECTRONIQUE');
    const summary = screen.getByText('Synthetic textures, club energy, and precise pulse-driven production.');
    expect(heading.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(buildGenreTooltip('Synthetic textures, club energy, and precise pulse-driven production.', {
      name: 'House',
      bpm: 128,
      rhythm: 'Electronic (4/4)',
      instruments: ['Synthesizer', 'Sampler', 'TR-909'],
    })).toContain('128 BPM · Electronic (4/4)');
  });

  it('offers the expanded percussion instrument suggestions', () => {
    render(
      <LanguageProvider>
        <MusicalParamsPanel
          genre=""
          setGenre={vi.fn()}
          tempo="120"
          setTempo={vi.fn()}
          instrumentation=""
          setInstrumentation={vi.fn()}
          rhythm=""
          setRhythm={vi.fn()}
          narrative=""
          setNarrative={vi.fn()}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Percussion/i }));

    expect(screen.getByRole('button', { name: 'Tambourine' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Guiro' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Triangle' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Shaker' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Tubular Bells/i })).toBeTruthy();
  });
});
