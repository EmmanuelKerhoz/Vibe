/**
 * LeftSettingsPanel tests — adapted for the post-refactor shell signature.
 *
 * LeftSettingsPanel now receives only 5 props (isLeftPanelOpen,
 * setIsLeftPanelOpen, isMobileOverlay, onGenerateSong, onRegenerateSong).
 * All song meta state is sourced from ComposerParamsContext, which is mocked
 * below alongside SongContext and ComposerContext.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../i18n';
import { LeftSettingsPanel } from './LeftSettingsPanel';

// ── Context mocks ──────────────────────────────────────────────────────────

const mockSong = vi.hoisted(() => ({
  current: [] as Array<{ id: string; name: string; lines: Array<{ id: string; text: string; isMeta: boolean }> }>,
}));

const mockComposerParams = vi.hoisted(() => ({
  title: 'Test',
  setTitle: vi.fn(),
  titleOrigin: 'user' as 'user' | 'ai',
  setTitleOrigin: vi.fn(),
  topic: '',
  setTopic: vi.fn(),
  mood: '',
  setMood: vi.fn(),
  rhymeScheme: 'AABB',
  setRhymeScheme: vi.fn(),
  targetSyllables: 8,
  setTargetSyllables: vi.fn(),
  get song() { return mockSong.current; },
  isGenerating: false,
  quantizeSyllables: vi.fn(),
  isGeneratingTitle: false,
  onGenerateTitle: vi.fn(),
  isSurprising: false,
  onSurprise: vi.fn(),
  hasApiKey: true,
}));

vi.mock('../../contexts/ComposerParamsContext', () => ({
  useComposerParamsContext: () => mockComposerParams,
  ComposerParamsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../contexts/SongContext', () => ({
  useSongContext: () => ({ song: mockSong.current }),
}));

vi.mock('../../contexts/ComposerContext', () => ({
  useComposerContext: () => ({ isGenerating: false, quantizeSyllables: vi.fn() }),
}));

vi.mock('../ui/Tooltip', () => ({
  Tooltip: ({ title, children }: { title: React.ReactNode; children: React.ReactElement }) => (
    <div data-testid="tooltip" data-title={typeof title === 'string' ? title : '[react-element]'}>
      {children}
    </div>
  ),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function renderPanel(
  setIsLeftPanelOpen = vi.fn(),
  onGenerateSong = vi.fn(),
  onRegenerateSong?: () => void,
) {
  return render(
    <LanguageProvider>
      <LeftSettingsPanel
        isLeftPanelOpen
        setIsLeftPanelOpen={setIsLeftPanelOpen}
        onGenerateSong={onGenerateSong}
        onRegenerateSong={onRegenerateSong}
      />
    </LanguageProvider>,
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('LeftSettingsPanel', () => {
  beforeEach(() => {
    mockSong.current = [];
    mockComposerParams.isGenerating = false;
    mockComposerParams.hasApiKey = true;
    mockComposerParams.isSurprising = false;
    mockComposerParams.isGeneratingTitle = false;
    mockComposerParams.quantizeSyllables.mockReset();
    mockComposerParams.onGenerateTitle.mockReset();
    mockComposerParams.onSurprise.mockReset();
  });

  it('disables quantize when the song context is empty', () => {
    renderPanel();
    expect(screen.getByText('Quantize Syllables (GLOBAL)').closest('button')).toHaveProperty('disabled', true);
  });

  it('uses composer context for quantize and generating button state', () => {
    mockSong.current = [{ id: 'verse-1', name: 'Verse', lines: [{ id: 'line-1', text: 'Hello world', isMeta: false }] }];
    mockComposerParams.isGenerating = true;

    const { rerender } = renderPanel();

    expect(screen.getByRole('button', { name: 'Regenerate Lyrics' })).toHaveProperty('disabled', true);
    expect(screen.getByText('Quantize Syllables (GLOBAL)').closest('button')).toHaveProperty('disabled', true);

    mockComposerParams.isGenerating = false;
    rerender(
      <LanguageProvider>
        <LeftSettingsPanel
          isLeftPanelOpen
          setIsLeftPanelOpen={vi.fn()}
          onGenerateSong={vi.fn()}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByText('Quantize Syllables (GLOBAL)').closest('button') as HTMLButtonElement);
    expect(mockComposerParams.quantizeSyllables).toHaveBeenCalledTimes(1);
  });

  it('shows Generate Lyrics when no lyrics exist and calls the generate handler', () => {
    const onGenerateSong = vi.fn();
    renderPanel(vi.fn(), onGenerateSong, vi.fn());

    fireEvent.click(screen.getByRole('button', { name: 'Generate Lyrics' }));
    expect(onGenerateSong).toHaveBeenCalledTimes(1);
  });

  it('shows Regenerate Lyrics when lyrics exist and calls the regenerate handler', () => {
    mockSong.current = [{ id: 'verse-1', name: 'Verse', lines: [{ id: 'line-1', text: 'Hello world', isMeta: false }] }];
    const onRegenerateSong = vi.fn();
    const onGenerateSong = vi.fn();

    renderPanel(vi.fn(), onGenerateSong, onRegenerateSong);

    fireEvent.click(screen.getByRole('button', { name: 'Regenerate Lyrics' }));
    expect(onRegenerateSong).toHaveBeenCalledTimes(1);
    expect(onGenerateSong).not.toHaveBeenCalled();
  });

  it('shows Free Verse first in the default rhyme scheme selector', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'AABB (Couplets)' }));
    expect(screen.getAllByRole('option')[0]?.textContent).toContain('Free Verse');
  });

  it('closes the panel from the header control', () => {
    const setIsLeftPanelOpen = vi.fn();
    renderPanel(setIsLeftPanelOpen);
    fireEvent.click(screen.getByRole('button', { name: 'Close lyrics generation panel' }));
    expect(setIsLeftPanelOpen).toHaveBeenCalledWith(false);
  });

  it('uses the standard styled Suggest button tooltip without AI wording', () => {
    renderPanel();
    const suggestButton = screen.getByRole('button', { name: 'Suggest' });
    const suggestTooltip = screen.getAllByTestId('tooltip').find(tooltip =>
      /Suggest a random topic, mood .* title/.test(tooltip.getAttribute('data-title') ?? ''));
    expect(suggestButton.className).toContain('ux-interactive');
    expect(suggestTooltip).toBeTruthy();
  });

  it('disables AI-only actions when AI is unavailable', () => {
    mockSong.current = [{ id: 'verse-1', name: 'Verse', lines: [{ id: 'line-1', text: 'Hello world', isMeta: false }] }];
    mockComposerParams.hasApiKey = false;

    renderPanel();

    expect(screen.getByRole('button', { name: 'Suggest' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Generate title from lyrics' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Regenerate Lyrics' })).toHaveProperty('disabled', true);
  });

  it('hides the generate title button until lyrics exist', () => {
    const { rerender } = renderPanel();
    expect(screen.queryByRole('button', { name: 'Generate title from lyrics' })).toBeNull();

    mockSong.current = [{ id: 'verse-1', name: 'Verse', lines: [{ id: 'line-1', text: 'Hello world', isMeta: false }] }];
    rerender(
      <LanguageProvider>
        <LeftSettingsPanel
          isLeftPanelOpen
          setIsLeftPanelOpen={vi.fn()}
          onGenerateSong={vi.fn()}
        />
      </LanguageProvider>,
    );

    expect(screen.getByRole('button', { name: 'Generate title from lyrics' })).toBeTruthy();
  });
});
