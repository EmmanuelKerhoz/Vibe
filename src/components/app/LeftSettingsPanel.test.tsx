import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../i18n';
import { LeftSettingsPanel } from './LeftSettingsPanel';

const mockSongContext = vi.hoisted(() => ({
  song: [] as Array<{ id: string; name: string; lines: Array<{ id: string; text: string; isMeta: boolean }> }>,
}));

const mockComposerContext = vi.hoisted(() => ({
  isGenerating: false,
  quantizeSyllables: vi.fn(),
}));

vi.mock('../../contexts/SongContext', () => ({
  useSongContext: () => mockSongContext,
}));

vi.mock('../../contexts/ComposerContext', () => ({
  useComposerContext: () => mockComposerContext,
}));

vi.mock('../ui/Tooltip', () => ({
  Tooltip: ({ title, children }: { title: React.ReactNode; children: React.ReactElement }) => (
    <div data-testid="tooltip" data-title={typeof title === 'string' ? title : '[react-element]'}>
      {children}
    </div>
  ),
}));

function renderPanel(setIsLeftPanelOpen = vi.fn()) {
  return render(
    <LanguageProvider>
      <LeftSettingsPanel
        title="Test"
        setTitle={vi.fn()}
        titleOrigin="user"
        onGenerateTitle={vi.fn()}
        isGeneratingTitle={false}
        topic=""
        setTopic={vi.fn()}
        mood=""
        setMood={vi.fn()}
        rhymeScheme="AABB"
        setRhymeScheme={vi.fn()}
        targetSyllables={8}
        setTargetSyllables={vi.fn()}
        isLeftPanelOpen
        setIsLeftPanelOpen={setIsLeftPanelOpen}
        onSurprise={vi.fn()}
        isSurprising={false}
        onGenerateSong={vi.fn()}
        isSessionHydrated
      />
    </LanguageProvider>,
  );
}

describe('LeftSettingsPanel', () => {
  beforeEach(() => {
    mockSongContext.song = [];
    mockComposerContext.isGenerating = false;
    mockComposerContext.quantizeSyllables.mockReset();
  });

  it('disables quantize when the song context is empty', () => {
    renderPanel();

    expect(screen.getByText('Quantize Syllables (GLOBAL)').closest('button')).toHaveProperty('disabled', true);
  });

  it('uses composer context for quantize and generating button state', () => {
    mockSongContext.song = [{
      id: 'verse-1',
      name: 'Verse',
      lines: [{ id: 'line-1', text: 'Hello world', isMeta: false }],
    }];
    mockComposerContext.isGenerating = true;

    const { rerender } = renderPanel();

    expect(screen.getByRole('button', { name: 'Regenerate Lyrics' })).toHaveProperty('disabled', true);
    expect(screen.getByText('Quantize Syllables (GLOBAL)').closest('button')).toHaveProperty('disabled', true);

    mockComposerContext.isGenerating = false;
    rerender(
      <LanguageProvider>
        <LeftSettingsPanel
          title="Test"
          setTitle={vi.fn()}
          titleOrigin="user"
          onGenerateTitle={vi.fn()}
          isGeneratingTitle={false}
          topic=""
          setTopic={vi.fn()}
          mood=""
          setMood={vi.fn()}
          rhymeScheme="AABB"
          setRhymeScheme={vi.fn()}
          targetSyllables={8}
          setTargetSyllables={vi.fn()}
          isLeftPanelOpen
          setIsLeftPanelOpen={vi.fn()}
          onSurprise={vi.fn()}
          isSurprising={false}
          onGenerateSong={vi.fn()}
          isSessionHydrated
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByText('Quantize Syllables (GLOBAL)').closest('button') as HTMLButtonElement);
    expect(mockComposerContext.quantizeSyllables).toHaveBeenCalledTimes(1);
  });

  it('shows Generate Lyrics when no lyrics exist and calls the generate handler', () => {
    const onGenerateSong = vi.fn();

    render(
      <LanguageProvider>
        <LeftSettingsPanel
          title="Test"
          setTitle={vi.fn()}
          titleOrigin="user"
          onGenerateTitle={vi.fn()}
          isGeneratingTitle={false}
          topic=""
          setTopic={vi.fn()}
          mood=""
          setMood={vi.fn()}
          rhymeScheme="AABB"
          setRhymeScheme={vi.fn()}
          targetSyllables={8}
          setTargetSyllables={vi.fn()}
          isLeftPanelOpen
          setIsLeftPanelOpen={vi.fn()}
          onSurprise={vi.fn()}
          isSurprising={false}
          onGenerateSong={onGenerateSong}
          onRegenerateSong={vi.fn()}
          isSessionHydrated
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Generate Lyrics' }));

    expect(onGenerateSong).toHaveBeenCalledTimes(1);
  });

  it('shows Regenerate Lyrics when lyrics exist and calls the regenerate handler', () => {
    mockSongContext.song = [{
      id: 'verse-1',
      name: 'Verse',
      lines: [{ id: 'line-1', text: 'Hello world', isMeta: false }],
    }];

    const onRegenerateSong = vi.fn();
    const onGenerateSong = vi.fn();

    render(
      <LanguageProvider>
        <LeftSettingsPanel
          title="Test"
          setTitle={vi.fn()}
          titleOrigin="user"
          onGenerateTitle={vi.fn()}
          isGeneratingTitle={false}
          topic=""
          setTopic={vi.fn()}
          mood=""
          setMood={vi.fn()}
          rhymeScheme="AABB"
          setRhymeScheme={vi.fn()}
          targetSyllables={8}
          setTargetSyllables={vi.fn()}
          isLeftPanelOpen
          setIsLeftPanelOpen={vi.fn()}
          onSurprise={vi.fn()}
          isSurprising={false}
          onGenerateSong={onGenerateSong}
          onRegenerateSong={onRegenerateSong}
          isSessionHydrated
        />
      </LanguageProvider>,
    );

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
      tooltip.getAttribute('data-title') === 'Suggest a random topic, mood & title');

    expect(suggestButton.className).toContain('ux-interactive');
    expect(suggestTooltip).toBeTruthy();
  });

  it('hides the generate title button until lyrics exist', () => {
    const { rerender } = renderPanel();

    expect(screen.queryByRole('button', { name: 'Generate title from lyrics' })).toBeNull();

    mockSongContext.song = [{
      id: 'verse-1',
      name: 'Verse',
      lines: [{ id: 'line-1', text: 'Hello world', isMeta: false }],
    }];

    rerender(
      <LanguageProvider>
        <LeftSettingsPanel
          title="Test"
          setTitle={vi.fn()}
          titleOrigin="user"
          onGenerateTitle={vi.fn()}
          isGeneratingTitle={false}
          topic=""
          setTopic={vi.fn()}
          mood=""
          setMood={vi.fn()}
          rhymeScheme="AABB"
          setRhymeScheme={vi.fn()}
          targetSyllables={8}
          setTargetSyllables={vi.fn()}
          isLeftPanelOpen
          setIsLeftPanelOpen={vi.fn()}
          onSurprise={vi.fn()}
          isSurprising={false}
          onGenerateSong={vi.fn()}
          isSessionHydrated
        />
      </LanguageProvider>,
    );

    expect(screen.getByRole('button', { name: 'Generate title from lyrics' })).toBeTruthy();
  });
});
