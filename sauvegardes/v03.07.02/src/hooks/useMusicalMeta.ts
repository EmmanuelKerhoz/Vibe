import { useState } from 'react';

export function useMusicalMeta() {
  const [genre, setGenre] = useState('');
  const [tempo, setTempo] = useState('120');
  const [instrumentation, setInstrumentation] = useState('');
  const [rhythm, setRhythm] = useState('');
  const [narrative, setNarrative] = useState('');
  const [musicalPrompt, setMusicalPrompt] = useState('');

  return {
    genre, setGenre,
    tempo, setTempo,
    instrumentation, setInstrumentation,
    rhythm, setRhythm,
    narrative, setNarrative,
    musicalPrompt, setMusicalPrompt,
  };
}
