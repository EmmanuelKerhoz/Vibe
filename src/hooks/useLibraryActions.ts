import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Section } from '../types';
import type { SimilarityMatch } from '../utils/similarityUtils';
import {
  findSimilarAssetsInLibrary,
  saveAssetToLibrary,
  loadLibraryAssets,
  deleteAssetFromLibrary,
  purgeLibrary,
  loadAssetIntoEditor,
  type LibraryAsset,
} from '../utils/libraryUtils';
import { safeJsonGet } from '../utils/safeStorage';

const lyricalKey = (song: Section[]): string => {
  return song
    .map(section => section.lines.filter(line => !line.isMeta).map(line => line.text).join('|'))
    .join('//');
};

type UseLibraryActionsParams = {
  song: Section[];
  title: string;
  topic: string;
  mood: string;
  genre: string;
  tempo: number;
  instrumentation: string;
  rhythm: string;
  narrative: string;
  musicalPrompt: string;
  rhymeScheme: string;
  targetSyllables: number;
  replaceStateWithoutHistory: (song: Section[], structure: string[]) => void;
  clearHistory: () => void;
  setTitle: (v: string) => void;
  setTitleOrigin: (v: 'user' | 'ai') => void;
  setTopic: (v: string) => void;
  setMood: (v: string) => void;
  setRhymeScheme: (v: string) => void;
  setTargetSyllables: (v: number) => void;
  setGenre: (v: string) => void;
  setTempo: (v: number) => void;
  setInstrumentation: (v: string) => void;
  setRhythm: (v: string) => void;
  setNarrative: (v: string) => void;
  setMusicalPrompt: (v: string) => void;
  setSimilarityMatches: Dispatch<SetStateAction<SimilarityMatch[]>>;
  setLibraryCount: Dispatch<SetStateAction<number>>;
  setLibraryAssets: Dispatch<SetStateAction<LibraryAsset[]>>;
  setIsSavingToLibrary: (v: boolean) => void;
  setIsSaveToLibraryModalOpen: (v: boolean) => void;
};

export const useLibraryActions = ({
  song,
  title,
  topic,
  mood,
  genre,
  tempo,
  instrumentation,
  rhythm,
  narrative,
  musicalPrompt,
  rhymeScheme,
  targetSyllables,
  replaceStateWithoutHistory,
  clearHistory,
  setTitle,
  setTitleOrigin,
  setTopic,
  setMood,
  setRhymeScheme,
  setTargetSyllables,
  setGenre,
  setTempo,
  setInstrumentation,
  setRhythm,
  setNarrative,
  setMusicalPrompt,
  setSimilarityMatches,
  setLibraryCount,
  setLibraryAssets,
  setIsSavingToLibrary,
  setIsSaveToLibraryModalOpen,
}: UseLibraryActionsParams) => {
  const currentLyricalKey = useMemo(() => lyricalKey(song), [song]);
  const similarityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSimilarityKeyRef = useRef('');

  useEffect(() => {
    if (currentLyricalKey === lastSimilarityKeyRef.current) return;
    if (similarityDebounceRef.current) clearTimeout(similarityDebounceRef.current);
    let isCancelled = false;
    similarityDebounceRef.current = setTimeout(() => {
      lastSimilarityKeyRef.current = currentLyricalKey;
      const runSimilarity = async () => {
        if (song.length === 0) {
          setSimilarityMatches([]);
          return;
        }
        const matches = await findSimilarAssetsInLibrary(song, 0, 3);
        if (!isCancelled) setSimilarityMatches(matches);
      };
      void runSimilarity();
    }, 800);
    return () => {
      isCancelled = true;
      if (similarityDebounceRef.current) clearTimeout(similarityDebounceRef.current);
    };
  }, [currentLyricalKey, song, setSimilarityMatches]);

  useEffect(() => {
    const assets = safeJsonGet<unknown[]>('lyricist_library');
    if (Array.isArray(assets)) setLibraryCount(assets.length);
  }, [setLibraryCount]);

  const handleSaveToLibrary = useCallback(async () => {
    if (song.length === 0) return;
    setIsSavingToLibrary(true);
    try {
      await saveAssetToLibrary({
        title: title || 'Untitled Song',
        type: 'song',
        sections: song,
        metadata: {
          topic,
          mood,
          genre,
          tempo: tempo || 120,
          instrumentation,
          rhythm,
          narrative,
          musicalPrompt,
        },
      });
      const updated = await loadLibraryAssets();
      setLibraryCount(updated.length);
      setLibraryAssets(updated);
    } catch (error) {
      console.error('Failed to save to library:', error);
    } finally {
      setIsSavingToLibrary(false);
    }
  }, [
    genre,
    instrumentation,
    mood,
    musicalPrompt,
    narrative,
    rhythm,
    setIsSavingToLibrary,
    setLibraryAssets,
    setLibraryCount,
    song,
    tempo,
    title,
    topic,
  ]);

  const handleLoadLibraryAsset = useCallback((asset: LibraryAsset) => {
    const loadedAsset = loadAssetIntoEditor(asset);
    replaceStateWithoutHistory(loadedAsset.song, loadedAsset.structure);
    clearHistory();
    setTitle(loadedAsset.title);
    setTitleOrigin('user');
    setTopic(loadedAsset.topic);
    setMood(loadedAsset.mood);
    setRhymeScheme(loadedAsset.rhymeScheme);
    setTargetSyllables(loadedAsset.targetSyllables);
    setGenre(loadedAsset.genre);
    setTempo(loadedAsset.tempo);
    setInstrumentation(loadedAsset.instrumentation);
    setRhythm(loadedAsset.rhythm);
    setNarrative(loadedAsset.narrative);
    setMusicalPrompt(loadedAsset.musicalPrompt);
    setIsSaveToLibraryModalOpen(false);
  }, [
    clearHistory,
    replaceStateWithoutHistory,
    setGenre,
    setInstrumentation,
    setIsSaveToLibraryModalOpen,
    setMood,
    setMusicalPrompt,
    setNarrative,
    setRhymeScheme,
    setRhythm,
    setTargetSyllables,
    setTempo,
    setTitle,
    setTitleOrigin,
    setTopic,
  ]);

  const handleDeleteLibraryAsset = useCallback(async (versionId: string) => {
    try {
      await deleteAssetFromLibrary(versionId);
      setLibraryAssets(prev => prev.filter(asset => asset.id !== versionId));
      setSimilarityMatches(prev => prev.filter(match => match.versionId !== versionId));
      setLibraryCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to delete library asset:', error);
    }
  }, [setLibraryAssets, setLibraryCount, setSimilarityMatches]);

  const handlePurgeLibrary = useCallback(async () => {
    try {
      await purgeLibrary();
      setLibraryAssets([]);
      setSimilarityMatches([]);
      setLibraryCount(0);
    } catch (error) {
      console.error('Failed to purge library:', error);
    }
  }, [setLibraryAssets, setLibraryCount, setSimilarityMatches]);

  const handleOpenSaveToLibraryModal = useCallback(async () => {
    setLibraryAssets(await loadLibraryAssets());
    setIsSaveToLibraryModalOpen(true);
  }, [setIsSaveToLibraryModalOpen, setLibraryAssets]);

  return {
    handleSaveToLibrary,
    handleLoadLibraryAsset,
    handleDeleteLibraryAsset,
    handlePurgeLibrary,
    handleOpenSaveToLibraryModal,
  };
};
