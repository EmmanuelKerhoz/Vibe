import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSongEditor } from '../useSongEditor';
import type { Section } from '../../types';

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

const buildHook = (song: Section[], structure = DEFAULT_STRUCTURE) => {
  const updateState = vi.fn();
  
  const updateStructureWithHistory = vi.fn();
  const updateSongAndStructureWithHistory = vi.fn();
  const openPasteModalWithText = vi.fn();
  const playAudioFeedback = vi.fn();

  const { result } = renderHook(() =>
    useSongEditor({
      song,
      structure,
      newSectionName: '',
      setNewSectionName: vi.fn(),
      draggedItemIndex: null,
      setDraggedItemIndex: vi.fn(),
      setDragOverIndex: vi.fn(),
      draggedLineInfo: null,
      setDraggedLineInfo: vi.fn(),
      setDragOverLineInfo: vi.fn(),
      updateState,
      
      updateStructureWithHistory,
      updateSongAndStructureWithHistory,
      title: 'Test Song',
      topic: 'test',
      mood: 'neutral',
      openPasteModalWithText,
      playAudioFeedback,
    })
  );
  return { result, updateSongAndStructureWithHistory, updateStructureWithHistory,  updateState };
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
