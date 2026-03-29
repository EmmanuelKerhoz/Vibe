import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../i18n';
import { DragProvider } from '../../contexts/DragContext';
import { RefsProvider } from '../../contexts/RefsContext';
import type { Section } from '../../types';
import { LyricsView } from './LyricsView';

const editorContextState = vi.hoisted(() => ({
  editMode: 'section' as 'text' | 'markdown' | 'section' | 'phonetic',
  setEditMode: vi.fn(),
  markupText: '',
  setMarkupText: vi.fn(),
  markupTextareaRef: { current: null } as React.RefObject<HTMLTextAreaElement | null>,
  markupDirection: 'ltr' as const,
  playAudioFeedback: vi.fn(),
}));

const mockUpdateState = vi.fn();
const mockSong: Section[] = [];

const mockPhoneticState = {
  text: '[Verse]\n/ipa/',
  status: 'ready' as const,
  languageLabel: 'English',
  error: null,
};

vi.mock('../../hooks/usePhoneticTranscription', () => ({
  usePhoneticTranscription: vi.fn(() => mockPhoneticState),
}));

vi.mock('../../contexts/SongContext', () => ({
  useSongContext: () => ({
    song: mockSong,
    rhymeScheme: 'AABB',
    updateState: mockUpdateState,
    updateSongAndStructureWithHistory: vi.fn(),
    lineLanguages: {},
  }),
}));

vi.mock('../../contexts/ComposerContext', () => ({
  useComposerContext: () => ({
    selectedLineId: null,
    isGenerating: false,
    isRegeneratingSection: () => false,
    handleLineClick: vi.fn(),
    updateLineText: vi.fn(),
    handleLineKeyDown: vi.fn(),
    handleInstructionChange: vi.fn(),
    addInstruction: vi.fn(),
    removeInstruction: vi.fn(),
    regenerateSection: vi.fn(),
  }),
}));

vi.mock('../../contexts/EditorContext', () => ({
  useEditorContext: () => editorContextState,
}));

describe('LyricsView empty state', () => {
  it('offers quick actions for library, paste, and generation', () => {
    editorContextState.editMode = 'section';
    editorContextState.markupText = '';
    const onOpenLibrary = vi.fn();
    const onPasteLyrics = vi.fn();
    const onGenerateSong = vi.fn();

    render(
      <DragProvider>
        <LanguageProvider>
          <RefsProvider>
            <LyricsView
              isAnalyzing={false}
              handleDrop={() => {}}
              handleLineDragStart={() => {}}
              handleLineDrop={() => {}}
              canPasteLyrics={true}
              onOpenLibrary={onOpenLibrary}
              onPasteLyrics={onPasteLyrics}
              onGenerateSong={onGenerateSong}
            />
          </RefsProvider>
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

  it('disables the paste action when there is no text available to paste', () => {
    editorContextState.editMode = 'section';
    editorContextState.markupText = '';
    render(
      <DragProvider>
        <LanguageProvider>
          <RefsProvider>
            <LyricsView
              isAnalyzing={false}
              handleDrop={() => {}}
              handleLineDragStart={() => {}}
              handleLineDrop={() => {}}
              canPasteLyrics={false}
              onOpenLibrary={() => {}}
              onPasteLyrics={() => {}}
              onGenerateSong={() => {}}
            />
          </RefsProvider>
        </LanguageProvider>
      </DragProvider>,
    );

    expect((screen.getByRole('button', { name: 'Import and analyze existing lyrics' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('uses the shared gradient container surface in markup mode', () => {
    editorContextState.editMode = 'markdown';
    editorContextState.markupText = '[Verse]\nHello';
    const { container } = render(
      <DragProvider>
        <LanguageProvider>
          <RefsProvider>
            <LyricsView
              isAnalyzing={false}
              handleDrop={() => {}}
              handleLineDragStart={() => {}}
              handleLineDrop={() => {}}
              canPasteLyrics={true}
              onOpenLibrary={() => {}}
              onPasteLyrics={() => {}}
              onGenerateSong={() => {}}
            />
          </RefsProvider>
        </LanguageProvider>
      </DragProvider>,
    );

    expect(container.querySelector('.lcars-gradient-container')).not.toBeNull();
  });

  it('renders phonetic mode with IPA output and hint', () => {
    editorContextState.editMode = 'phonetic';
    editorContextState.markupText = '';
    mockSong.length = 0;
    mockSong.push({
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
    });

    render(
      <DragProvider>
        <LanguageProvider>
          <LyricsView
            isAnalyzing={false}
            handleDrop={() => {}}
            handleLineDragStart={() => {}}
            handleLineDrop={() => {}}
            canPasteLyrics={true}
            onOpenLibrary={() => {}}
            onPasteLyrics={() => {}}
            onGenerateSong={() => {}}
          />
        </LanguageProvider>
      </DragProvider>,
    );

    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toContain('/ipa/');
    expect(screen.getByText(/selected language/i)).not.toBeNull();
  });

  it('passes section editing handlers directly to rendered sections', () => {
    editorContextState.editMode = 'section';
    editorContextState.markupText = '';
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

    // Update the mock to return the song with content
    mockSong.length = 0;
    mockSong.push(...song);
    mockUpdateState.mockClear();

    render(
      <DragProvider>
        <LanguageProvider>
          <RefsProvider>
            <LyricsView
              isAnalyzing={false}
              handleDrop={() => {}}
              handleLineDragStart={() => {}}
              handleLineDrop={() => {}}
              canPasteLyrics={true}
              onOpenLibrary={() => {}}
              onPasteLyrics={() => {}}
              onGenerateSong={() => {}}
            />
          </RefsProvider>
        </LanguageProvider>
      </DragProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add Line' }));

    expect(mockUpdateState).toHaveBeenCalledTimes(1);
    const updater = mockUpdateState.mock.calls[0]?.[0];
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

    // Reset for other tests
    mockSong.length = 0;
  });

  it('shows Free Verse first in the section rhyme scheme selector', () => {
    editorContextState.editMode = 'section';
    editorContextState.markupText = '';
    mockSong.length = 0;
    mockSong.push({
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
      rhymeScheme: 'AABB',
    });

    render(
      <DragProvider>
        <LanguageProvider>
          <RefsProvider>
            <LyricsView
              isAnalyzing={false}
              handleDrop={() => {}}
              handleLineDragStart={() => {}}
              handleLineDrop={() => {}}
              canPasteLyrics={true}
              onOpenLibrary={() => {}}
              onPasteLyrics={() => {}}
              onGenerateSong={() => {}}
            />
          </RefsProvider>
        </LanguageProvider>
      </DragProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'AABB (Couplets)' }));

    expect(screen.getAllByRole('option')[0]?.textContent).toContain('Free Verse');

    mockSong.length = 0;
  });
});
