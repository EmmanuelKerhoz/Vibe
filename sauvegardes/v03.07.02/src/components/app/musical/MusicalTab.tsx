import React from 'react';
import { LyricsMusicAnalysis } from './LyricsMusicAnalysis';
import { MusicalParamsPanel } from './MusicalParamsPanel';
import { MusicalPromptBuilder } from './MusicalPromptBuilder';
import type { Section } from '../../../types';

interface Props {
  song: Section[];
  title: string;
  topic: string;
  mood: string;
  genre: string; setGenre: (v: string) => void;
  tempo: string; setTempo: (v: string) => void;
  instrumentation: string; setInstrumentation: (v: string) => void;
  rhythm: string; setRhythm: (v: string) => void;
  narrative: string; setNarrative: (v: string) => void;
  musicalPrompt: string; setMusicalPrompt: (v: string) => void;
  isGeneratingMusicalPrompt: boolean;
  isAnalyzingLyrics: boolean;
  hasApiKey: boolean;
  generateMusicalPrompt: () => void;
  analyzeLyricsForMusic: () => void;
}

export function MusicalTab({
  song, title, topic, mood,
  genre, setGenre, tempo, setTempo,
  instrumentation, setInstrumentation,
  rhythm, setRhythm, narrative, setNarrative,
  musicalPrompt, setMusicalPrompt,
  isGeneratingMusicalPrompt, isAnalyzingLyrics,
  hasApiKey, generateMusicalPrompt, analyzeLyricsForMusic,
}: Props) {
  const hasLyrics  = song.some(s => s.lines.some(l => l.text.trim() !== ''));
  const hasContext = !!(title || topic || mood || hasLyrics);
    const canGenerate = hasApiKey && !!(hasContext || genre || instrumentation);

  return (
    <div className="flex flex-col h-full overflow-y-auto fluent-fade-in">
      <LyricsMusicAnalysis
        title={title} topic={topic} mood={mood}
        hasContext={hasContext} hasApiKey={hasApiKey}
        isAnalyzingLyrics={isAnalyzingLyrics}
        isGeneratingMusicalPrompt={isGeneratingMusicalPrompt}
        analyzeLyricsForMusic={analyzeLyricsForMusic}
      />
      <div className="flex-1 p-6 space-y-5">
        <MusicalParamsPanel
          genre={genre} setGenre={setGenre}
          tempo={tempo} setTempo={setTempo}
          instrumentation={instrumentation} setInstrumentation={setInstrumentation}
          rhythm={rhythm} setRhythm={setRhythm}
          narrative={narrative} setNarrative={setNarrative}
        />
        <MusicalPromptBuilder
          musicalPrompt={musicalPrompt} setMusicalPrompt={setMusicalPrompt}
          isGeneratingMusicalPrompt={isGeneratingMusicalPrompt}
          isAnalyzingLyrics={isAnalyzingLyrics}
          canGenerate={canGenerate}
          generateMusicalPrompt={generateMusicalPrompt}
        />
      </div>
    </div>
  );
}
