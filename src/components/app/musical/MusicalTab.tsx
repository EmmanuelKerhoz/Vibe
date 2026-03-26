import React, { useState, useCallback } from 'react';
import { LyricsMusicAnalysis } from './LyricsMusicAnalysis';
import { MusicalParamsPanel } from './MusicalParamsPanel';
import { MusicalPromptBuilder } from './MusicalPromptBuilder';
import { useSongHistoryContext } from '../../../contexts/SongHistoryContext';
import { useSongMetaContext } from '../../../contexts/SongMetaContext';
import { useComposerContext } from '../../../contexts/ComposerContext';

interface Props {
  hasApiKey: boolean;
}

export function MusicalTab({
  hasApiKey,
}: Props) {
  const {
    title, topic, mood,
    genre, setGenre, tempo, setTempo,
    instrumentation, setInstrumentation,
    rhythm, setRhythm,
    narrative, setNarrative,
    musicalPrompt, setMusicalPrompt,
  } = useSongMetaContext();
  const { song } = useSongHistoryContext();
  const {
    isGeneratingMusicalPrompt,
    isAnalyzingLyrics,
    generateMusicalPrompt,
    analyzeLyricsForMusic,
  } = useComposerContext();
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const handleWorkflowStepComplete = useCallback((step: number) => {
    setCompletedSteps(prev => new Set(prev).add(step));
  }, []);

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
        completedSteps={completedSteps}
      />
      <div className="flex-1 p-6 space-y-5">
        <MusicalParamsPanel
          genre={genre} setGenre={setGenre}
          tempo={tempo} setTempo={setTempo}
          instrumentation={instrumentation} setInstrumentation={setInstrumentation}
          rhythm={rhythm} setRhythm={setRhythm}
          narrative={narrative} setNarrative={setNarrative}
          onWorkflowStepComplete={handleWorkflowStepComplete}
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
