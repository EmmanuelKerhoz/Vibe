import { useState } from 'react';
import { DEFAULT_TITLE, DEFAULT_TOPIC, DEFAULT_MOOD } from '../utils/songDefaults';
import type { SessionSnapshot } from '../lib/sessionPersistence';

export function useSongMeta(initialSession?: Partial<SessionSnapshot>) {
  const [title, setTitle] = useState(initialSession?.title ?? DEFAULT_TITLE);
  const [titleOrigin, setTitleOrigin] = useState<'user' | 'ai'>(initialSession?.titleOrigin ?? 'user');
  const [topic, setTopic] = useState(initialSession?.topic ?? DEFAULT_TOPIC);
  const [mood, setMood] = useState(initialSession?.mood ?? DEFAULT_MOOD);
  const [rhymeScheme, setRhymeScheme] = useState(initialSession?.rhymeScheme ?? 'AABB');
  const [targetSyllables, setTargetSyllables] = useState(initialSession?.targetSyllables ?? 10);
  const [newSectionName, setNewSectionName] = useState('');
  const [shouldAutoGenerateTitle, setShouldAutoGenerateTitle] = useState(false);
  const [songLanguage, setSongLanguage] = useState(initialSession?.songLanguage ?? 'English');
  const [detectedLanguages, setDetectedLanguages] = useState<string[]>([]);
  const [lineLanguages, setLineLanguages] = useState<Record<string, string>>({});
  const [genre, setGenre] = useState(initialSession?.genre ?? '');
  const [tempo, setTempo] = useState(initialSession?.tempo ?? 120);
  const [songDurationSeconds, setSongDurationSeconds] = useState(initialSession?.songDurationSeconds ?? 180);
  const [timeSignature, setTimeSignature] = useState<[number, number]>(initialSession?.timeSignature ?? [4, 4]);
  const [instrumentation, setInstrumentation] = useState(initialSession?.instrumentation ?? '');
  const [rhythm, setRhythm] = useState(initialSession?.rhythm ?? '');
  const [narrative, setNarrative] = useState(initialSession?.narrative ?? '');
  const [musicalPrompt, setMusicalPrompt] = useState(initialSession?.musicalPrompt ?? '');

  return {
    title, setTitle,
    titleOrigin, setTitleOrigin,
    topic, setTopic,
    mood, setMood,
    rhymeScheme, setRhymeScheme,
    targetSyllables, setTargetSyllables,
    newSectionName, setNewSectionName,
    shouldAutoGenerateTitle, setShouldAutoGenerateTitle,
    songLanguage, setSongLanguage,
    detectedLanguages, setDetectedLanguages,
    lineLanguages, setLineLanguages,
    genre, setGenre,
    tempo, setTempo,
    songDurationSeconds, setSongDurationSeconds,
    timeSignature, setTimeSignature,
    instrumentation, setInstrumentation,
    rhythm, setRhythm,
    narrative, setNarrative,
    musicalPrompt, setMusicalPrompt,
  };
}
