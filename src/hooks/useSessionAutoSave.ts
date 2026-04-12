/**
 * useSessionAutoSave
 *
 * Watches song + meta state and persists a SessionSnapshot to OPFS
 * with a 2-second debounce.  Calls onSaved() after the first successful write.
 */
import { useEffect, useRef } from 'react';
import { saveSession } from '../lib/sessionPersistence';
import type { SessionSnapshot } from '../lib/sessionPersistence';
import type { Section } from '../types';

interface AutoSavePayload {
  song: Section[];
  structure: string[];
  title: string;
  titleOrigin: 'user' | 'ai';
  topic: string;
  mood: string;
  rhymeScheme: string;
  targetSyllables: number;
  songLanguage: string;
  genre: string;
  tempo: number;
  instrumentation: string;
  rhythm: string;
  narrative: string;
  musicalPrompt: string;
  activeTab: 'lyrics' | 'musical';
  isStructureOpen: boolean;
  isLeftPanelOpen: boolean;
  /** Called once after the first successful OPFS write. */
  onSaved?: () => void;
}

export function useSessionAutoSave(payload: AutoSavePayload): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const payloadRef = useRef<AutoSavePayload>(payload);
  payloadRef.current = payload;

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const p = payloadRef.current;
      const snapshot: SessionSnapshot = {
        schemaVersion: 1,
        savedAt: Date.now(),
        song: p.song,
        structure: p.structure,
        title: p.title,
        titleOrigin: p.titleOrigin,
        topic: p.topic,
        mood: p.mood,
        rhymeScheme: p.rhymeScheme,
        targetSyllables: p.targetSyllables,
        songLanguage: p.songLanguage,
        genre: p.genre,
        tempo: p.tempo,
        instrumentation: p.instrumentation,
        rhythm: p.rhythm,
        narrative: p.narrative,
        musicalPrompt: p.musicalPrompt,
        activeTab: p.activeTab,
        isStructureOpen: p.isStructureOpen,
        isLeftPanelOpen: p.isLeftPanelOpen,
      };
      await saveSession(snapshot);
      payloadRef.current.onSaved?.();
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    payload.song,
    payload.structure,
    payload.title,
    payload.titleOrigin,
    payload.topic,
    payload.mood,
    payload.rhymeScheme,
    payload.targetSyllables,
    payload.songLanguage,
    payload.genre,
    payload.tempo,
    payload.instrumentation,
    payload.rhythm,
    payload.narrative,
    payload.musicalPrompt,
    payload.activeTab,
    payload.isStructureOpen,
    payload.isLeftPanelOpen,
  ]);
}
