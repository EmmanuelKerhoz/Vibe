import { useEffect } from 'react';
import { Section } from '../types';
import { cleanSectionName, normalizeLoadedSection } from '../utils/songUtils';
import { DEFAULT_STRUCTURE } from '../constants/editor';
import { safeSetItem, safeGetItem } from '../utils/safeStorage';
import { isPristineDraft } from '../utils/songDefaults';
import { useSongContext } from '../contexts/SongContext';

interface UseSessionPersistenceParams {
  song: Section[];
  structure: string[];
  title: string;
  titleOrigin: 'user' | 'ai';
  topic: string;
  mood: string;
  rhymeScheme: string;
  targetSyllables: number;
  genre: string;
  tempo: number;
  instrumentation: string;
  rhythm: string;
  narrative: string;
  musicalPrompt: string;
  songLanguage: string;
  isSessionHydrated: boolean;
  setIsSessionHydrated: (v: boolean) => void;
  setHasSavedSession: (v: boolean) => void;
  replaceStateWithoutHistory: (song: Section[], structure: string[]) => void;
  clearHistory: () => void;
}

/** Normalize a raw section read from storage — ensures no field is undefined. */
const normalizeStoredSection = (s: Record<string, unknown>): Section => normalizeLoadedSection(s);

export function useSessionPersistence(params: UseSessionPersistenceParams): void {
  const {
    song, structure, title, titleOrigin, topic, mood, rhymeScheme, targetSyllables,
    genre, tempo, instrumentation, rhythm, narrative, musicalPrompt, songLanguage,
    isSessionHydrated, setIsSessionHydrated, setHasSavedSession,
    replaceStateWithoutHistory, clearHistory,
  } = params;
  const {
    setTitle, setTitleOrigin, setTopic, setMood, setRhymeScheme, setTargetSyllables,
    setGenre, setTempo, setInstrumentation, setRhythm, setNarrative, setMusicalPrompt,
    setSongLanguage,
  } = useSongContext();

  // Mount-only: hydrate state from localStorage.
  useEffect(() => {
    const savedRaw = safeGetItem('lyricist_session');
    if (savedRaw) {
      try {
        const parsed = JSON.parse(savedRaw);
        if (parsed.song && parsed.song.length > 0) {
          setHasSavedSession(true);
          const cleanedSong: Section[] = (parsed.song as Record<string, unknown>[]).map(normalizeStoredSection);
          const nextStructure = cleanedSong.length > 0
            ? cleanedSong.map((s: Section) => s.name)
            : (parsed.structure ? parsed.structure.map((s: string) => cleanSectionName(s)) : DEFAULT_STRUCTURE);
          replaceStateWithoutHistory(cleanedSong, nextStructure);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.titleOrigin) setTitleOrigin(parsed.titleOrigin);
          if (parsed.topic) setTopic(parsed.topic);
          if (parsed.mood) setMood(parsed.mood);
          if (parsed.rhymeScheme) setRhymeScheme(parsed.rhymeScheme);
          if (parsed.targetSyllables) setTargetSyllables(parsed.targetSyllables);
          if (parsed.genre) setGenre(parsed.genre);
          if (parsed.tempo) setTempo(parseInt(String(parsed.tempo), 10) || 120);
          if (parsed.instrumentation) setInstrumentation(parsed.instrumentation);
          if (parsed.rhythm) setRhythm(parsed.rhythm);
          if (parsed.narrative) setNarrative(parsed.narrative);
          if (parsed.musicalPrompt) setMusicalPrompt(parsed.musicalPrompt);
          if (parsed.songLanguage) setSongLanguage(parsed.songLanguage);
          clearHistory();
        }
      } catch (e) {
        console.error('Failed to parse saved session', e);
      }
    }
    setIsSessionHydrated(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- mount-only; all refs are stable dispatchers

  // Save session on every relevant change.
  useEffect(() => {
    if (isSessionHydrated && song.length > 0 && !isPristineDraft(song, structure, rhymeScheme)) {
      const sessionData = {
        song, structure, title, titleOrigin, topic, mood, rhymeScheme, targetSyllables,
        genre, tempo, instrumentation, rhythm, narrative, musicalPrompt, songLanguage,
      };
      safeSetItem('lyricist_session', JSON.stringify(sessionData));
      setHasSavedSession(true);
    }
  }, [
    song, structure, title, titleOrigin, topic, mood, rhymeScheme, targetSyllables,
    genre, tempo, instrumentation, rhythm, narrative, musicalPrompt, songLanguage,
    isSessionHydrated, setHasSavedSession,
  ]);
}
