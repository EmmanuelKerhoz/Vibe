import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider } from '../../i18n';
import { LyriaPreviewPanel } from './LyriaPreviewPanel';
import { generateAndPoll } from '../../services/lyriaService';

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
    vi.mocked(generateAndPoll).mockClear();
    vi.mocked(generateAndPoll).mockResolvedValue({
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
    });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders musical badges with accessible labels and removal controls', () => {
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

    // Tags render visible text with emoji prefix — no aria-label on Tag root.
    expect(screen.getByText('🎵 afrobeats')).toBeTruthy();
    expect(screen.getByText('🌈 joyful')).toBeTruthy();
    expect(screen.getByText('♩ 100 BPM')).toBeTruthy();
    expect(screen.getByText('🎸 talking drum')).toBeTruthy();
    // Dismiss button aria-label matches dismissIcon: { 'aria-label': 'Remove instrumentation' }
    expect(screen.getByRole('button', { name: 'Remove instrumentation' })).toBeTruthy();
  });

  // NOTE: 'syncs the Lyria style prompt with instrumentation to the prompt container'
  // test REMOVED — onPromptReady no longer fires on mount or param change.
  // It fires only in handleGenerate (explicit user action). See 'removes prompt badges' below.

  it('removes prompt badges from the next Lyria prompt', async () => {
    const user = userEvent.setup();
    const onPromptReady = vi.fn();

    render(
      <LanguageProvider>
        <LyriaPreviewPanel
          lyrics="Sing it"
          initialGenre="afrobeats"
          initialMood="joyful"
          initialTempo={100}
          initialInstrumentation="talking drum"
          onPromptReady={onPromptReady}
        />
      </LanguageProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Remove instrumentation' }));

    // onPromptReady not called yet — fires only on Generate
    expect(onPromptReady).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Alt+A to generate quickly' }));

    await waitFor(() => {
      expect(generateAndPoll).toHaveBeenCalled();
    });
    expect(generateAndPoll).toHaveBeenLastCalledWith(
      expect.objectContaining({
        style: expect.not.stringContaining('talking drum'),
      }),
      expect.any(Object),
    );
    // onPromptReady called with style string that excludes instrumentation
    await waitFor(() => {
      expect(onPromptReady).toHaveBeenCalledWith(expect.not.stringContaining('talking drum'));
    });
  });

  it('relies on native audio controls without adding a second play button', async () => {
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <LyriaPreviewPanel lyrics="Sing it" initialGenre="afrobeats" />
      </LanguageProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Alt+A to generate quickly' }));

    await waitFor(() => {
      expect(generateAndPoll).toHaveBeenCalled();
    });
    // aria-label matches `Preview — ${doneClip.title}` in LyriaPreviewPanel
    await screen.findByLabelText('Preview — Preview Clip');
    expect(screen.queryByRole('button', { name: 'Play' })).toBeNull();
  });
});
