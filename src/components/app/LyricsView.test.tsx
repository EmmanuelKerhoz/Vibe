import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../i18n';
import { DragProvider } from '../../contexts/DragContext';
import { LyricsView } from './LyricsView';

describe('LyricsView empty state', () => {
  it('offers quick actions for library, paste, and generation', () => {
    const onOpenLibrary = vi.fn();
    const onPasteLyrics = vi.fn();
    const onGenerateSong = vi.fn();

    render(
      <DragProvider>
        <LanguageProvider>
          <LyricsView
            song={[]}
            rhymeScheme="AABB"
            updateState={() => ({ song: [], structure: [] })}
            updateSongAndStructureWithHistory={() => {}}
            selectedLineId={null}
            isGenerating={false}
            isAnalyzing={false}
            isRegeneratingSection={() => false}
            handleLineClick={() => {}}
            updateLineText={() => {}}
            handleLineKeyDown={() => {}}
            handleInstructionChange={() => {}}
            addInstruction={() => {}}
            removeInstruction={() => {}}
            regenerateSection={() => {}}
            playAudioFeedback={() => {}}
            handleDrop={() => {}}
            handleLineDragStart={() => {}}
            handleLineDrop={() => {}}
            isMarkupMode={false}
            setIsMarkupMode={() => {}}
            markupText=""
            setMarkupText={() => {}}
            markupTextareaRef={{ current: null }}
            onOpenLibrary={onOpenLibrary}
            onPasteLyrics={onPasteLyrics}
            onGenerateSong={onGenerateSong}
          />
        </LanguageProvider>
      </DragProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open your library and manage saved songs' }));
    fireEvent.click(screen.getByRole('button', { name: 'Import and analyze existing lyrics' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate a new song with AI' }));

    expect(onOpenLibrary).toHaveBeenCalledTimes(1);
    expect(onPasteLyrics).toHaveBeenCalledTimes(1);
    expect(onGenerateSong).toHaveBeenCalledTimes(1);
  });

  it('uses the shared gradient container surface in markup mode', () => {
    const { container } = render(
      <DragProvider>
        <LanguageProvider>
          <LyricsView
            song={[]}
            rhymeScheme="AABB"
            updateState={() => ({ song: [], structure: [] })}
            updateSongAndStructureWithHistory={() => {}}
            selectedLineId={null}
            isGenerating={false}
            isAnalyzing={false}
            isRegeneratingSection={() => false}
            handleLineClick={() => {}}
            updateLineText={() => {}}
            handleLineKeyDown={() => {}}
            handleInstructionChange={() => {}}
            addInstruction={() => {}}
            removeInstruction={() => {}}
            regenerateSection={() => {}}
            playAudioFeedback={() => {}}
            handleDrop={() => {}}
            handleLineDragStart={() => {}}
            handleLineDrop={() => {}}
            isMarkupMode
            setIsMarkupMode={() => {}}
            markupText="[Verse]\nHello"
            setMarkupText={() => {}}
            markupTextareaRef={{ current: null }}
            onOpenLibrary={() => {}}
            onPasteLyrics={() => {}}
            onGenerateSong={() => {}}
          />
        </LanguageProvider>
      </DragProvider>,
    );

    expect(container.querySelector('.lcars-gradient-container')).not.toBeNull();
  });
});
