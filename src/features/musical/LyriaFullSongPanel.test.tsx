import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LyriaFullSongPanel } from './LyriaFullSongPanel';

vi.mock('../../services/lyriaService', () => ({
  getLyriaKPISnapshot: () => ({
    totalRequests: 1,
    successCount: 0,
    errorCount: 0,
    pendingCount: 1,
    lastGenerationMs: null,
    lastError: null,
  }),
  generateAndPoll: vi.fn(() => new Promise(() => undefined)),
}));

describe('LyriaFullSongPanel', () => {
  it('labels the progress indicator while full-song generation is running', async () => {
    const user = userEvent.setup();
    render(
      <LyriaFullSongPanel
        approvedPrompt="afrobeats, joyful"
        clipTitle="Approved preview"
        lyrics="Sing it"
      />,
    );

    await user.click(screen.getByRole('button', { name: /générer le titre complet/i }));

    expect(screen.getByLabelText('Génération Lyria 3 Pro en cours')).toBeTruthy();
  });
});
