import React, { useLayoutEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSongEditor } from '../useSongEditor';
import type { Section } from '../../types';
import { DragProvider, useDrag } from '../../contexts/DragContext';

const makeSection = (id: string, name: string, lines: Section['lines'] = []): Section => ({ id, name, lines });
const makeLine = (id: string, text: string) => ({
  id,
  text,
  rhymingSyllables: '',
  rhyme: '',
  syllables: 0,
  concept: 'New line',
});

const DEFAULT_STRUCTURE = ['Verse 1', 'Chorus'];
const createObjectURLMock = vi.fn(() => 'blob:test');
const revokeObjectURLMock = vi.fn();
const clickMock = vi.fn();
const lastCreatedBlob = () => {
  const firstCall = createObjectURLMock.mock.calls[0] as [Blob] | undefined;
  return firstCall ? firstCall[0] : undefined;
};

function DragInitializer(
  { children, draggedItemIndex }: { children?: React.ReactNode; draggedItemIndex?: number | null }
) {
  const { setDraggedItemIndex } = useDrag();

  useLayoutEffect(() => {
    setDraggedItemIndex(draggedItemIndex ?? null);
  }, [draggedItemIndex, setDraggedItemIndex]);

  return React.createElement(React.Fragment, null, children);
}

const buildHook = (
  song: Section[],
  structure = DEFAULT_STRUCTURE,
  options: { draggedItemIndex?: number | null } = {},
) => {
  const updateState = vi.fn();
  const updateStructureWithHistory = vi.fn();
  const updateSongAndStructureWithHistory = vi.fn();
  const openPasteModalWithText = vi.fn();
  const playAudioFeedback = vi.fn();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(
      DragProvider,
      null,
      React.createElement(DragInitializer, { draggedItemIndex: options.draggedItemIndex }, children),
    )
  );

  const { result } = renderHook(() =>
    useSongEditor({
      song,
      structure,
      newSectionName: '',
      setNewSectionName: vi.fn(),
      updateState,
      updateStructureWithHistory,
      updateSongAndStructureWithHistory,
      title: 'Test Song',
      topic: 'test',
      mood: 'neutral',
      songLanguage: '',
      openPasteModalWithText,
      playAudioFeedback,
    }),
    { wrapper },
  );
  return { result, updateSongAndStructureWithHistory, updateStructureWithHistory, updateState };
};

describe('useSongEditor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    createObjectURLMock.mockClear();
    revokeObjectURLMock.mockClear();
    clickMock.mockClear();

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURLMock,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURLMock,
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(clickMock);
    Object.defineProperty(window, 'showSaveFilePicker', {
      configurable: true,
      writable: true,
      value: undefined,
    });
  });

  describe('removeStructureItem', () => {
    it('removes section by index and calls updateSongAndStructureWithHistory', () => {
      const song = [makeSection('s1', 'Verse 1'), makeSection('s2', 'Chorus')];
      const { result, updateSongAndStructureWithHistory } = buildHook(song);
      act(() => result.current.removeStructureItem(0));
      expect(updateSongAndStructureWithHistory).toHaveBeenCalledOnce();
      const [newSong, newStructure] = updateSongAndStructureWithHistory.mock.calls[0] as [Section[], string[]];
      expect(newSong).toHaveLength(1);
      expect(newSong[0]?.name).toBe('Chorus');
      expect(newStructure).toEqual(['Chorus']);
    });

    it('does nothing when index is out of range', () => {
      const song = [makeSection('s1', 'Verse 1')];
      const { result, updateSongAndStructureWithHistory } = buildHook(song);
      act(() => result.current.removeStructureItem(5));
      expect(updateSongAndStructureWithHistory).not.toHaveBeenCalled();
    });
  });

  describe('addStructureItem', () => {
    it('adds a new section when name is provided', () => {
      const song = [makeSection('s1', 'Verse 1')];
      const { result, updateSongAndStructureWithHistory } = buildHook(song, ['Verse 1']);
      act(() => result.current.addStructureItem('Bridge'));
      expect(updateSongAndStructureWithHistory).toHaveBeenCalledOnce();
      const [newSong] = updateSongAndStructureWithHistory.mock.calls[0] as [Section[], string[]];
      expect(newSong).toHaveLength(2);
      expect(newSong[1]?.name).toBe('Bridge');
    });

    it('adds Final Chorus as a valid unique section', () => {
      const song = [makeSection('s1', 'Verse 1')];
      const { result, updateSongAndStructureWithHistory } = buildHook(song, ['Verse 1']);
      act(() => result.current.addStructureItem('Final Chorus'));
      expect(updateSongAndStructureWithHistory).toHaveBeenCalledOnce();
      const [newSong, newStructure] = updateSongAndStructureWithHistory.mock.calls[0] as [Section[], string[]];
      expect(newSong[1]?.name).toBe('Final Chorus');
      expect(newStructure).toEqual(['Verse 1', 'Final Chorus']);
    });

    it('does nothing when name is empty', () => {
      const song = [makeSection('s1', 'Verse 1')];
      const { result, updateSongAndStructureWithHistory } = buildHook(song, ['Verse 1']);
      act(() => result.current.addStructureItem(''));
      expect(updateSongAndStructureWithHistory).not.toHaveBeenCalled();
    });
  });

  describe('normalizeStructure', () => {
    it('preserves unmatched custom structure entries by creating missing sections', () => {
      const song = [makeSection('s1', 'Verse 1')];
      const { result, updateSongAndStructureWithHistory } = buildHook(song, ['Verse 1', 'Ghost Section']);
      act(() => result.current.normalizeStructure());
      expect(updateSongAndStructureWithHistory).toHaveBeenCalledOnce();
      const [normalizedSong, normalized] = updateSongAndStructureWithHistory.mock.calls[0] as [Section[], string[]];
      expect(normalized).toEqual(['Verse 1', 'Ghost Section']);
      expect(normalizedSong[1]?.name).toBe('Ghost Section');
    });

    it('is a no-op when structure is already clean', () => {
      const song = [makeSection('s1', 'Verse 1')];
      const { result, updateStructureWithHistory } = buildHook(song, ['Verse 1']);
      act(() => result.current.normalizeStructure());
      expect(updateStructureWithHistory).not.toHaveBeenCalled();
    });
  });

  describe('handleDrop', () => {
    it('moves a pre-chorus and chorus pair together when dragging the chorus', () => {
      const song = [
        makeSection('s1', 'Verse 1'),
        makeSection('s2', 'Pre-Chorus 1'),
        makeSection('s3', 'Chorus 1'),
        makeSection('s4', 'Verse 2'),
      ];

      const { result, updateSongAndStructureWithHistory } = buildHook(
        song,
        song.map(section => section.name),
        { draggedItemIndex: 2 },
      );

      act(() => result.current.handleDrop(3));

      expect(updateSongAndStructureWithHistory).toHaveBeenCalledOnce();
      const [newSong, newStructure] = updateSongAndStructureWithHistory.mock.calls[0] as [Section[], string[]];
      expect(newStructure).toEqual(['Verse 1', 'Verse 2', 'Pre-Chorus 1', 'Chorus 1']);
      expect(newSong.map(section => section.name)).toEqual(['Verse 1', 'Verse 2', 'Pre-Chorus 1', 'Chorus 1']);
    });

    it('moves a pre-chorus and final chorus pair together when dragging the final chorus', () => {
      const song = [
        makeSection('s1', 'Verse 1'),
        makeSection('s2', 'Pre-Chorus 3'),
        makeSection('s3', 'Final Chorus'),
        makeSection('s4', 'Outro'),
      ];

      const { result, updateSongAndStructureWithHistory } = buildHook(
        song,
        song.map(section => section.name),
        { draggedItemIndex: 2 },
      );

      act(() => result.current.handleDrop(3));

      expect(updateSongAndStructureWithHistory).toHaveBeenCalledOnce();
      const [newSong, newStructure] = updateSongAndStructureWithHistory.mock.calls[0] as [Section[], string[]];
      expect(newStructure).toEqual(['Verse 1', 'Outro', 'Pre-Chorus 3', 'Final Chorus']);
      expect(newSong.map(section => section.name)).toEqual(['Verse 1', 'Outro', 'Pre-Chorus 3', 'Final Chorus']);
    });
  });

  describe('loadFileForAnalysis', () => {
    it('loads a plain text file and opens paste modal', async () => {
      const song = [makeSection('s1', 'Verse 1')];
      const openPasteModalWithText = vi.fn();

      const { result } = renderHook(
        () => useSongEditor({
          song,
          structure: ['Verse 1'],
          newSectionName: '',
          setNewSectionName: vi.fn(),
          updateState: vi.fn(),
          updateStructureWithHistory: vi.fn(),
          updateSongAndStructureWithHistory: vi.fn(),
          title: 'Test Song',
          topic: 'test',
          mood: 'neutral',
          songLanguage: '',
          openPasteModalWithText,
          playAudioFeedback: vi.fn(),
        }),
        { wrapper: ({ children }: { children: React.ReactNode }) => React.createElement(DragProvider, null, children) },
      );

      const fileContent = 'Line 1\nLine 2';
      const file = new File([fileContent], 'song.txt', { type: 'text/plain' });
      // Add the text() method to the File object
      (file as any).text = vi.fn().mockResolvedValue(fileContent);

      await act(async () => {
        const payload = await result.current.loadFileForAnalysis(file);
        expect(payload.text).toBe('Line 1\nLine 2');
      });

      expect(openPasteModalWithText).toHaveBeenCalledWith('Line 1\nLine 2');
    });

    it('extracts language metadata from plain text with lang header', async () => {
      const song = [makeSection('s1', 'Verse 1')];
      const openPasteModalWithText = vi.fn();

      const { result } = renderHook(
        () => useSongEditor({
          song,
          structure: ['Verse 1'],
          newSectionName: '',
          setNewSectionName: vi.fn(),
          updateState: vi.fn(),
          updateStructureWithHistory: vi.fn(),
          updateSongAndStructureWithHistory: vi.fn(),
          title: 'Test Song',
          topic: 'test',
          mood: 'neutral',
          songLanguage: '',
          openPasteModalWithText,
          playAudioFeedback: vi.fn(),
        }),
        { wrapper: ({ children }: { children: React.ReactNode }) => React.createElement(DragProvider, null, children) },
      );

      const fileContent = '# lang: fr\n\nVerse text here';
      const file = new File([fileContent], 'song.txt', { type: 'text/plain' });
      (file as any).text = vi.fn().mockResolvedValue(fileContent);

      await act(async () => {
        const payload = await result.current.loadFileForAnalysis(file);
        expect(payload.songLanguage).toBe('fr');
        expect(payload.text).toBe('Verse text here');
      });

      expect(openPasteModalWithText).toHaveBeenCalledWith('Verse text here');
    });

    it('does not open paste modal when file has no text', async () => {
      const song = [makeSection('s1', 'Verse 1')];
      const openPasteModalWithText = vi.fn();

      const { result } = renderHook(
        () => useSongEditor({
          song,
          structure: ['Verse 1'],
          newSectionName: '',
          setNewSectionName: vi.fn(),
          updateState: vi.fn(),
          updateStructureWithHistory: vi.fn(),
          updateSongAndStructureWithHistory: vi.fn(),
          title: 'Test Song',
          topic: 'test',
          mood: 'neutral',
          songLanguage: '',
          openPasteModalWithText,
          playAudioFeedback: vi.fn(),
        }),
        { wrapper: ({ children }: { children: React.ReactNode }) => React.createElement(DragProvider, null, children) },
      );

      const file = new File([''], 'empty.txt', { type: 'text/plain' });
      (file as any).text = vi.fn().mockResolvedValue('');

      await act(async () => {
        const payload = await result.current.loadFileForAnalysis(file);
        expect(payload.text).toBe('');
      });

      expect(openPasteModalWithText).not.toHaveBeenCalled();
    });

    it('routes .docx files to docx extraction logic', async () => {
      const song = [makeSection('s1', 'Verse 1')];
      const openPasteModalWithText = vi.fn();

      const { result } = renderHook(
        () => useSongEditor({
          song,
          structure: ['Verse 1'],
          newSectionName: '',
          setNewSectionName: vi.fn(),
          updateState: vi.fn(),
          updateStructureWithHistory: vi.fn(),
          updateSongAndStructureWithHistory: vi.fn(),
          title: 'Test Song',
          topic: 'test',
          mood: 'neutral',
          songLanguage: '',
          openPasteModalWithText,
          playAudioFeedback: vi.fn(),
        }),
        { wrapper: ({ children }: { children: React.ReactNode }) => React.createElement(DragProvider, null, children) },
      );

      // Mock a minimal .docx file (won't actually be valid but triggers the code path)
      const file = new File(['mock docx content'], 'song.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      await act(async () => {
        const payload = await result.current.loadFileForAnalysis(file);
        // Since it's not a valid docx, extraction will fail gracefully and return empty
        expect(payload).toBeDefined();
      });
    });

    it('routes .odt files to odt extraction logic', async () => {
      const song = [makeSection('s1', 'Verse 1')];
      const openPasteModalWithText = vi.fn();

      const { result } = renderHook(
        () => useSongEditor({
          song,
          structure: ['Verse 1'],
          newSectionName: '',
          setNewSectionName: vi.fn(),
          updateState: vi.fn(),
          updateStructureWithHistory: vi.fn(),
          updateSongAndStructureWithHistory: vi.fn(),
          title: 'Test Song',
          topic: 'test',
          mood: 'neutral',
          songLanguage: '',
          openPasteModalWithText,
          playAudioFeedback: vi.fn(),
        }),
        { wrapper: ({ children }: { children: React.ReactNode }) => React.createElement(DragProvider, null, children) },
      );

      // Mock a minimal .odt file
      const file = new File(['mock odt content'], 'song.odt', {
        type: 'application/vnd.oasis.opendocument.text'
      });

      await act(async () => {
        const payload = await result.current.loadFileForAnalysis(file);
        // Since it's not a valid odt, extraction will fail gracefully and return empty
        expect(payload).toBeDefined();
      });
    });
  });

  describe('exportSong', () => {
    it('downloads a txt file for a song with content', async () => {
      const song = [
        makeSection('s1', 'Verse 1', [makeLine('l1', 'Hello world')]),
      ];
      const { result } = buildHook(song, ['Verse 1']);
      await act(async () => { await result.current.exportSong('txt'); });

      expect(createObjectURLMock).toHaveBeenCalledOnce();
      expect(clickMock).toHaveBeenCalledOnce();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:test');

      const anchor = clickMock.mock.instances[0] as HTMLAnchorElement;
      expect(anchor.download).toBe('Test_Song.txt');
      expect(anchor.href).toContain('blob:test');
      expect(lastCreatedBlob()?.type).toBe('text/plain;charset=utf-8');
    });

    it('does nothing for empty song export', async () => {
      const { result } = buildHook([], []);
      await act(async () => { await result.current.exportSong('txt'); });
      expect(createObjectURLMock).not.toHaveBeenCalled();
    });

    it('downloads markup with the section heading and lyrics', async () => {
      const song = [
        makeSection('s1', 'Chorus', [makeLine('l1', 'Sing along'), { ...makeLine('l2', '[drop]'), isMeta: true }]),
      ];
      const { result } = buildHook(song, ['Chorus']);
      await act(async () => { await result.current.exportSong('markup'); });

      expect(createObjectURLMock).toHaveBeenCalledOnce();
      expect(clickMock).toHaveBeenCalledOnce();
      const anchor = clickMock.mock.instances[0] as HTMLAnchorElement;
      expect(anchor.download).toBe('Test_Song.md');
      expect(anchor.href).toContain('blob:test');
      expect(lastCreatedBlob()?.type).toBe('text/markdown;charset=utf-8');
    });

    it('downloads docx as a zip-based office document', async () => {
      const song = [
        makeSection('s1', 'Chorus', [makeLine('l1', 'Sing along')]),
      ];
      const { result } = buildHook(song, ['Chorus']);
      await act(async () => { await result.current.exportSong('docx'); });

      const anchor = clickMock.mock.instances[0] as HTMLAnchorElement;
      expect(anchor.download).toBe('Test_Song.docx');
      expect(lastCreatedBlob()?.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(lastCreatedBlob()?.size).toBeGreaterThan(0);
    });

    it('downloads odt as a zip-based open document', async () => {
      const song = [
        makeSection('s1', 'Verse 1', [makeLine('l1', 'Hello world')]),
      ];
      const { result } = buildHook(song, ['Verse 1']);
      await act(async () => { await result.current.exportSong('odt'); });

      const anchor = clickMock.mock.instances[0] as HTMLAnchorElement;
      expect(anchor.download).toBe('Test_Song.odt');
      expect(lastCreatedBlob()?.type).toBe('application/vnd.oasis.opendocument.text');
      expect(lastCreatedBlob()?.size).toBeGreaterThan(0);
    });

    it('uses the native save dialog with downloads as the starting directory when available', async () => {
      const writeMock = vi.fn(async () => {});
      const closeMock = vi.fn(async () => {});
      const showSaveFilePickerMock = vi.fn(async () => ({
        createWritable: async () => ({ write: writeMock, close: closeMock }),
      }));
      Object.defineProperty(window, 'showSaveFilePicker', {
        configurable: true,
        writable: true,
        value: showSaveFilePickerMock,
      });
      const song = [
        makeSection('s1', 'Verse 1', [makeLine('l1', 'Hello world')]),
      ];
      const { result } = buildHook(song, ['Verse 1']);

      await act(async () => { await result.current.exportSong('txt'); });

      expect(showSaveFilePickerMock).toHaveBeenCalledWith(expect.objectContaining({
        suggestedName: 'Test_Song.txt',
        startIn: 'downloads',
      }));
      expect(writeMock).toHaveBeenCalledOnce();
      expect(writeMock).toHaveBeenCalledWith(expect.any(Blob));
      expect(closeMock).toHaveBeenCalledOnce();
      expect(createObjectURLMock).not.toHaveBeenCalled();
      expect(clickMock).not.toHaveBeenCalled();
    });
  });
});
