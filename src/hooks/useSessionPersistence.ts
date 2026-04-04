import { useEffect, useRef } from 'react';
import { Section } from '../types';
import { cleanSectionName, normalizeLoadedSection } from '../utils/songUtils';
import { DEFAULT_STRUCTURE } from '../constants/editor';
import { safeSetItem, safeGetItem } from '../utils/safeStorage';
import { isPristineDraft } from '../utils/songDefaults';
import { useSongContext } from '../contexts/SongContext';
import { SessionSchema } from '../schemas/sessionSchema';

/** Debounce delay for session persistence writes (ms). */
const SAVE_DEBOUNCE_MS = 500;

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
        const rawParsed: unknown = JSON.parse(savedRaw);
        const result = SessionSchema.safeParse(rawParsed);

        if (!result.success) {
          // Schema validation failed — session is corrupted or from an
          // incompatible version. Log in dev, skip hydration gracefully.
          if (import.meta.env.DEV) {
            console.warn('[useSessionPersistence] Invalid session schema:', result.error.flatten());
          }
        } else {
          const parsed = result.data;

          // Guard: parsed.song must be a non-empty array before mapping.
          if (Array.isArray(parsed.song) && parsed.song.length > 0) {
            setHasSavedSession(true);
            const cleanedSong: Section[] = (parsed.song as Record<string, unknown>[]).map(normalizeStoredSection);
            const nextStructure = cleanedSong.length > 0
              ? cleanedSong.map((s: Section) => s.name)
              : (parsed.structure
                ? parsed.structure.map((s: string) => cleanSectionName(s))
                : DEFAULT_STRUCTURE);
            replaceStateWithoutHistory(cleanedSong, nextStructure);

            if (parsed.title !== undefined)           setTitle(parsed.title);
            if (parsed.titleOrigin !== undefined)     setTitleOrigin(parsed.titleOrigin);
            if (parsed.topic !== undefined)            setTopic(parsed.topic);
            if (parsed.mood !== undefined)             setMood(parsed.mood);
            if (parsed.rhymeScheme !== undefined)     setRhymeScheme(parsed.rhymeScheme);
            if (parsed.targetSyllables !== undefined) setTargetSyllables(parsed.targetSyllables);
            if (parsed.genre !== undefined)            setGenre(parsed.genre);
            if (parsed.tempo !== undefined)            setTempo(parseInt(String(parsed.tempo), 10) || 120);
            if (parsed.instrumentation !== undefined) setInstrumentation(parsed.instrumentation);
            if (parsed.rhythm !== undefined)           setRhythm(parsed.rhythm);
            if (parsed.narrative !== undefined)        setNarrative(parsed.narrative);
            if (parsed.musicalPrompt !== undefined)   setMusicalPrompt(parsed.musicalPrompt);
            if (parsed.songLanguage !== undefined)    setSongLanguage(parsed.songLanguage);
            clearHistory();
          }
        }
      } catch (e) {
        console.error('[useSessionPersistence] Failed to parse saved session', e);
      }
    }
    setIsSessionHydrated(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- mount-only; all refs are stable dispatchers

  // Debounced save: avoid serialising the full song on every keystroke.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isSessionHydrated || song.length === 0 || isPristineDraft(song, structure, rhymeScheme)) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const sessionData = {
        song, structure, title, titleOrigin, topic, mood, rhymeScheme, targetSyllables,
        genre, tempo, instrumentation, rhythm, narrative, musicalPrompt, songLanguage,
      };
      safeSetItem('lyricist_session', JSON.stringify(sessionData));
      setHasSavedSession(true);
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [
    song, structure, title, titleOrigin, topic, mood, rhymeScheme, targetSyllables,
    genre, tempo, instrumentation, rhythm, narrative, musicalPrompt, songLanguage,
    isSessionHydrated, setHasSavedSession,
  ]);
}
