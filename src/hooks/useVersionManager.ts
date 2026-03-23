import { useState, useEffect, useCallback, useRef } from 'react';
import { Section, SongVersion } from '../types';
import { generateId } from '../utils/idUtils';
import { VersionSnapshot } from '../utils/songDefaults';
import { useSongContext } from '../contexts/SongContext';

interface UseVersionManagerParams {
  updateSongAndStructureWithHistory: (song: Section[], structure: string[]) => void;
  setIsVersionsModalOpen: (open: boolean) => void;
  setPromptModal: (modal: { open: boolean; onConfirm: (value: string) => void } | null) => void;
}

/**
 * M5 fix: lightweight fingerprint for song+structure comparison.
 * Avoids full JSON.stringify on every render — O(n) on section count
 * instead of O(total characters). Collisions are astronomically unlikely
 * (would require identical ids+line-count with different content).
 */
const fingerprintSnapshot = (song: Section[], structure: string[]): string => {
  const songPrint = song.map(s => `${s.id}:${s.lines.length}:${s.lines.map(l => l.id).join(',')}`).join('|');
  return `${structure.join('-')}__${songPrint}`;
};

export function useVersionManager(params: UseVersionManagerParams) {
  const {
    updateSongAndStructureWithHistory,
    setIsVersionsModalOpen, setPromptModal,
  } = params;
  const {
    song,
    structure,
    title,
    titleOrigin,
    topic,
    mood,
    setTitle,
    setTitleOrigin,
    setTopic,
    setMood,
  } = useSongContext();

  const [versions, setVersions] = useState<SongVersion[]>([]);
  const previousLyricsSnapshotRef = useRef<VersionSnapshot | null>(null);
  // M5: store fingerprint separately to avoid re-serialising the full song.
  const previousFingerprintRef = useRef<string | null>(null);

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

  // Auto-restore-point: captures the snapshot *before* each lyrics/structure change.
  // M5: uses fingerprintSnapshot instead of JSON.stringify for the change-detection check.
  useEffect(() => {
    const currentSnapshot = { song, structure, title, titleOrigin, topic, mood };
    const currentFingerprint = fingerprintSnapshot(song, structure);

    if (!previousLyricsSnapshotRef.current) {
      previousLyricsSnapshotRef.current = currentSnapshot;
      previousFingerprintRef.current = currentFingerprint;
      return;
    }

    const previousSnapshot = previousLyricsSnapshotRef.current;
    const lyricsChanged = previousFingerprintRef.current !== currentFingerprint;

    if (lyricsChanged && previousSnapshot.song.length > 0) {
      setVersions(prev => createVersion(previousSnapshot, 'Auto Restore Point', prev));
    }
    previousLyricsSnapshotRef.current = currentSnapshot;
    previousFingerprintRef.current = currentFingerprint;
  }, [createVersion, song, structure, title, titleOrigin, topic, mood]);

  return { versions, saveVersion, rollbackToVersion, handleRequestVersionName };
}
