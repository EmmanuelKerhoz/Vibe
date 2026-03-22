import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../i18n';
import { DragProvider } from '../../contexts/DragContext';
import type { Section } from '../../types';
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

  it('passes section editing handlers directly to rendered sections', () => {
    const updateState = vi.fn();
    const song: Section[] = [{
      id: 'section-1',
      name: 'Verse',
      lines: [{
        id: 'line-1',
        text: 'Hello world',
        rhymingSyllables: '',
        rhyme: '',
        syllables: 2,
        concept: '',
      }],
      preInstructions: [],
      postInstructions: [],
    }];

    render(
      <DragProvider>
        <LanguageProvider>
          <LyricsView
            song={song}
            rhymeScheme="AABB"
            updateState={updateState}
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
            onOpenLibrary={() => {}}
            onPasteLyrics={() => {}}
            onGenerateSong={() => {}}
          />
        </LanguageProvider>
      </DragProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add Line' }));

    expect(updateState).toHaveBeenCalledTimes(1);
    const updater = updateState.mock.calls[0]?.[0];
    expect(typeof updater).toBe('function');
    expect(updater({
      song,
      structure: ['Verse'],
    })).toMatchObject({
      structure: ['Verse'],
      song: [{
        id: 'section-1',
        name: 'Verse',
        lines: expect.arrayContaining([
          expect.objectContaining({ id: 'line-1', text: 'Hello world' }),
          expect.objectContaining({ text: '', isManual: true }),
        ]),
      }],
    });
  });
});
