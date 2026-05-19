import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '../../i18n';
import { LyriaPreviewPanel } from './LyriaPreviewPanel';

vi.mock('../../services/lyriaService', () => ({
  getLyriaKPISnapshot: () => ({
    totalRequests: 1,
    successCount: 1,
    errorCount: 0,
    pendingCount: 0,
    lastGenerationMs: 1200,
    lastError: null,
  }),
  generateAndPoll: vi.fn().mockResolvedValue({
    id: 'clip-1',
    title: 'Preview Clip',
    status: 'complete',
    audioUrl: 'data:audio/wav;base64,abc',
    synthIdWatermarked: true,
    durationSeconds: null,
    model: 'lyria-3-clip-preview',
    prompt: 'prompt',
    createdAt: '2026-05-19T00:00:00.000Z',
    errorMessage: null,
  }),
}));

describe('LyriaPreviewPanel', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders keyboard-focusable musical badges with accessible labels', () => {
    render(
      <LanguageProvider>
        <LyriaPreviewPanel
          lyrics="Sing it"
          initialGenre="afrobeats"
          initialMood="joyful"
          initialTempo={100}
          initialInstrumentation="talking drum"
        />
      </LanguageProvider>,
    );

    expect(screen.getByLabelText('Genre: afrobeats').getAttribute('tabindex')).toBe('0');
    expect(screen.getByLabelText('Mood: joyful').getAttribute('tabindex')).toBe('0');
    expect(screen.getByLabelText('Tempo: 100 BPM').getAttribute('tabindex')).toBe('0');
    expect(screen.getByLabelText('Instrumentation: talking drum').getAttribute('tabindex')).toBe('0');
  });
});
