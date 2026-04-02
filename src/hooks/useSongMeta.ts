import { useState } from 'react';
import { DEFAULT_TITLE, DEFAULT_TOPIC, DEFAULT_MOOD } from '../utils/songDefaults';

export function useSongMeta() {
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [titleOrigin, setTitleOrigin] = useState<'user' | 'ai'>('user');
  const [topic, setTopic] = useState(DEFAULT_TOPIC);
  const [mood, setMood] = useState(DEFAULT_MOOD);
  const [rhymeScheme, setRhymeScheme] = useState('AABB');
  const [targetSyllables, setTargetSyllables] = useState(10);
  const [newSectionName, setNewSectionName] = useState('');
  const [shouldAutoGenerateTitle, setShouldAutoGenerateTitle] = useState(false);
  // Elevated from useLanguageAdapter — shared between useSongAnalysis and useSongComposer
  const [songLanguage, setSongLanguage] = useState('English');
  const [detectedLanguages, setDetectedLanguages] = useState<string[]>([]);
  const [lineLanguages, setLineLanguages] = useState<Record<string, string>>({});
  const [genre, setGenre] = useState('');
  const [tempo, setTempo] = useState(120);
  const [instrumentation, setInstrumentation] = useState('');
  const [rhythm, setRhythm] = useState('');
  const [narrative, setNarrative] = useState('');
  const [musicalPrompt, setMusicalPrompt] = useState('');

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
    instrumentation, setInstrumentation,
    rhythm, setRhythm,
    narrative, setNarrative,
    musicalPrompt, setMusicalPrompt,
  };
}
