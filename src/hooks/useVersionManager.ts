import { useState, useEffect, useCallback, useRef } from 'react';
import { Section, SongVersion } from '../types';
import { generateId } from '../utils/idUtils';
import { VersionSnapshot } from '../utils/songDefaults';

interface UseVersionManagerParams {
  song: Section[];
  structure: string[];
  title: string;
  titleOrigin: 'user' | 'ai';
  topic: string;
  mood: string;
  updateSongAndStructureWithHistory: (song: Section[], structure: string[]) => void;
  setIsVersionsModalOpen: (open: boolean) => void;
  setPromptModal: (modal: { open: boolean; onConfirm: (value: string) => void } | null) => void;
  setTitle: (v: string) => void;
  setTitleOrigin: (v: 'user' | 'ai') => void;
  setTopic: (v: string) => void;
  setMood: (v: string) => void;
}

export function useVersionManager(params: UseVersionManagerParams) {
  const {
    song, structure, title, titleOrigin, topic, mood,
    updateSongAndStructureWithHistory,
    setIsVersionsModalOpen, setPromptModal,
    setTitle, setTitleOrigin, setTopic, setMood,
  } = params;

  const [versions, setVersions] = useState<SongVersion[]>([]);
  const previousLyricsSnapshotRef = useRef<VersionSnapshot | null>(null);

  const createVersion = useCallback((
    snapshot: VersionSnapshot,
    name: string,
    previousVersions: SongVersion[],
    options?: { allowDuplicate?: boolean },
  ): SongVersion[] => {
    const latestVersion = previousVersions[0];
    const normalizedSnapshot = JSON.stringify({
      song: snapshot.song, structure: snapshot.structure,
      title: snapshot.title, titleOrigin: snapshot.titleOrigin,
      topic: snapshot.topic, mood: snapshot.mood,
    });
    if (!options?.allowDuplicate && latestVersion) {
      const normalizedLatest = JSON.stringify({
        song: latestVersion.song, structure: latestVersion.structure,
        title: latestVersion.title, titleOrigin: latestVersion.titleOrigin,
        topic: latestVersion.topic, mood: latestVersion.mood,
      });
      if (normalizedLatest === normalizedSnapshot) return previousVersions;
    }
    return [
      {
        id: generateId(), timestamp: Date.now(),
        song: JSON.parse(JSON.stringify(snapshot.song)),
        structure: [...snapshot.structure],
        title: snapshot.title, titleOrigin: snapshot.titleOrigin,
        topic: snapshot.topic, mood: snapshot.mood, name,
      },
      ...previousVersions,
    ];
  }, []);

  const saveVersion = useCallback((name: string, snapshot?: VersionSnapshot) => {
    const versionSnapshot = snapshot || { song, structure, title, titleOrigin, topic, mood };
    setVersions(prev => createVersion(versionSnapshot, name || `Version ${prev.length + 1}`, prev, { allowDuplicate: true }));
  }, [createVersion, song, structure, title, titleOrigin, topic, mood]);

  const rollbackToVersion = useCallback((version: SongVersion) => {
    updateSongAndStructureWithHistory(version.song, version.structure);
    setTitle(version.title);
    setTitleOrigin(version.titleOrigin);
    setTopic(version.topic);
    setMood(version.mood);
    setIsVersionsModalOpen(false);
  }, [updateSongAndStructureWithHistory, setTitle, setTitleOrigin, setTopic, setMood, setIsVersionsModalOpen]);

  const handleRequestVersionName = useCallback((callback: (name: string) => void) => {
    setPromptModal({
      open: true,
      onConfirm: (name) => { setPromptModal(null); callback(name); },
    });
  }, [setPromptModal]);

  // Auto-restore-point: captures the snapshot *before* each lyrics/structure change
  // so the user can always roll back to the state just prior to an AI generation.
  // Note: title/topic/mood are included in the dep array because they are stored
  // in the snapshot, but lyricsChanged only compares song+structure intentionally —
  // a metadata-only change does not warrant a restore point.
  useEffect(() => {
    const currentSnapshot = { song, structure, title, titleOrigin, topic, mood };
    if (!previousLyricsSnapshotRef.current) {
      previousLyricsSnapshotRef.current = currentSnapshot;
      return;
    }
    const previousSnapshot = previousLyricsSnapshotRef.current;
    const lyricsChanged =
      JSON.stringify(previousSnapshot.song) !== JSON.stringify(song) ||
      JSON.stringify(previousSnapshot.structure) !== JSON.stringify(structure);
    if (lyricsChanged && previousSnapshot.song.length > 0) {
      setVersions(prev => createVersion(previousSnapshot, 'Auto Restore Point', prev));
    }
    previousLyricsSnapshotRef.current = currentSnapshot;
  }, [createVersion, song, structure, title, titleOrigin, topic, mood]);

  return { versions, saveVersion, rollbackToVersion, handleRequestVersionName };
}
