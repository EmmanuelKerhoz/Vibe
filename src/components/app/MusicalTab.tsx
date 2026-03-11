import React, { useState, useCallback } from 'react';
import { Music, Activity, Wand2, ListMusic, Sparkles, Loader2, Copy, Check, Zap, Guitar, Drum, Radio } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { Section } from '../../types';

interface Props {
  song: Section[];
  title: string;
  topic: string;
  mood: string;
  genre: string;
  setGenre: (v: string) => void;
  tempo: string;
  setTempo: (v: string) => void;
  instrumentation: string;
  setInstrumentation: (v: string) => void;
  rhythm: string;
  setRhythm: (v: string) => void;
  narrative: string;
  setNarrative: (v: string) => void;
  musicalPrompt: string;
  setMusicalPrompt: (v: string) => void;
  isGeneratingMusicalPrompt: boolean;
  isAnalyzingLyrics: boolean;
  hasApiKey: boolean;
  generateMusicalPrompt: () => void;
  analyzeLyricsForMusic: () => void;
}

const GENRE_PRESETS = [
  'Pop', 'Hip-Hop', 'R&B', 'Indie Folk', 'Synthwave', 'Trap',
  'Rock', 'Electronic', 'Jazz', 'Cinematic', 'Ambient', 'Soul',
];

const BPM_PRESETS = [
  { label: 'Very Slow', value: '60' },
  { label: 'Slow', value: '80' },
  { label: 'Moderate', value: '100' },
  { label: 'Upbeat', value: '120' },
  { label: 'Fast', value: '140' },
  { label: 'Very Fast', value: '160' },
];

export function MusicalTab({
  song,
  title,
  topic,
  mood,
  genre, setGenre,
  tempo, setTempo,
  instrumentation, setInstrumentation,
  rhythm, setRhythm,
  narrative, setNarrative,
  musicalPrompt, setMusicalPrompt,
  isGeneratingMusicalPrompt,
  isAnalyzingLyrics,
  hasApiKey,
  generateMusicalPrompt,
  analyzeLyricsForMusic,
}: Props) {
  const { t } = useTranslation();
  const m = t.musical;
  const [copied, setCopied] = useState(false);

  const hasLyrics = song.some(s => s.lines.some(l => l.text.trim() !== ''));
  const hasContext = !!(title || topic || mood || hasLyrics);
  const canGenerate = hasApiKey && (hasContext || genre || instrumentation);

  const handleCopy = useCallback(() => {
    if (!musicalPrompt) return;
    navigator.clipboard.writeText(musicalPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [musicalPrompt]);

  const bpmValue = parseInt(tempo) || 120;
  const bpmPercent = Math.min(100, Math.max(0, ((bpmValue - 40) / (220 - 40)) * 100));

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--accent-color)] bg-opacity-15 shrink-0">
              <Music className="w-5 h-5 text-[var(--accent-color)]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-widest uppercase text-[var(--text-primary)]">{m.title}</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{m.description}</p>
            </div>
          </div>

          {/* Auto-Suggest button */}
          {hasApiKey && (
            <button
              onClick={analyzeLyricsForMusic}
              disabled={isAnalyzingLyrics || isGeneratingMusicalPrompt}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium tracking-wide transition-all
                bg-[var(--accent-color)] bg-opacity-10 border border-[var(--accent-color)] border-opacity-30
                text-[var(--accent-color)] hover:bg-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isAnalyzingLyrics ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{isAnalyzingLyrics ? m.analyzing : m.analyzeLyricsShort}</span>
            </button>
          )}
        </div>

        {/* Context info pill */}
        {hasContext && (
          <div className="mt-3 flex items-center gap-2 text-[10px] text-[var(--text-secondary)] bg-[var(--accent-color)] bg-opacity-5 border border-[var(--accent-color)] border-opacity-15 rounded-lg px-3 py-1.5">
            <Zap className="w-3 h-3 text-[var(--accent-color)] shrink-0" />
            <span>{m.contextInfo}</span>
            <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">
              {title && <span className="bg-[var(--accent-color)] bg-opacity-10 text-[var(--accent-color)] px-1.5 py-0.5 rounded-md font-medium">{title}</span>}
              {topic && <span className="bg-zinc-500 bg-opacity-10 text-[var(--text-secondary)] px-1.5 py-0.5 rounded-md">{topic}</span>}
              {mood && <span className="bg-zinc-500 bg-opacity-10 text-[var(--text-secondary)] px-1.5 py-0.5 rounded-md">{mood}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Main controls grid */}
      <div className="flex-1 p-6 space-y-5">

        {/* Row 1: Genre + Tempo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Genre / Style */}
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[var(--accent-color)]" />
              <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.genre}</label>
            </div>
            <input
              type="text"
              value={genre}
              onChange={e => setGenre(e.target.value)}
              placeholder={m.genrePlaceholder}
              className="w-full bg-transparent border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-color)] transition-colors"
            />
            <div className="flex flex-wrap gap-1.5">
              {GENRE_PRESETS.map(preset => (
                <button
                  key={preset}
                  onClick={() => setGenre(genre === preset ? '' : preset)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wide transition-all border ${
                    genre === preset
                      ? 'bg-[var(--accent-color)] text-[var(--on-accent-color)] border-[var(--accent-color)]'
                      : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Tempo */}
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--accent-color)]" />
                <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.tempo}</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={tempo}
                  onChange={e => setTempo(e.target.value)}
                  min="40"
                  max="220"
                  className="w-16 bg-transparent border border-[var(--border-color)] rounded-lg px-2 py-1 text-sm text-center text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)] transition-colors"
                />
                <span className="text-xs text-[var(--text-secondary)]">BPM</span>
              </div>
            </div>
            {/* BPM slider */}
            <div className="relative h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-[var(--accent-color)] transition-all"
                style={{ width: `${bpmPercent}%` }}
              />
            </div>
            <input
              type="range"
              min="40"
              max="220"
              value={bpmValue}
              onChange={e => setTempo(e.target.value)}
              className="w-full h-2 opacity-0 cursor-pointer -mt-4 relative z-10"
            />
            <div className="flex flex-wrap gap-1.5">
              {BPM_PRESETS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setTempo(value)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wide transition-all border ${
                    tempo === value
                      ? 'bg-[var(--accent-color)] text-[var(--on-accent-color)] border-[var(--accent-color)]'
                      : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Instrumentation + Rhythm */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Instrumentation */}
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Guitar className="w-4 h-4 text-[var(--accent-color)]" />
              <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.instrumentation}</label>
            </div>
            <textarea
              value={instrumentation}
              onChange={e => setInstrumentation(e.target.value)}
              placeholder={m.instrumentationPlaceholder}
              rows={3}
              className="w-full bg-transparent border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-color)] transition-colors resize-none"
            />
          </div>

          {/* Rhythm & Groove */}
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Drum className="w-4 h-4 text-[var(--accent-color)]" />
              <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.rhythm}</label>
            </div>
            <textarea
              value={rhythm}
              onChange={e => setRhythm(e.target.value)}
              placeholder={m.rhythmPlaceholder}
              rows={3}
              className="w-full bg-transparent border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-color)] transition-colors resize-none"
            />
          </div>
        </div>

        {/* Narrative / Vibe */}
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-[var(--accent-color)]" />
            <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.narrative}</label>
          </div>
          <textarea
            value={narrative}
            onChange={e => setNarrative(e.target.value)}
            placeholder={m.narrativePlaceholder}
            rows={2}
            className="w-full bg-transparent border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-color)] transition-colors resize-none"
          />
        </div>

        {/* Generate button */}
        <button
          onClick={generateMusicalPrompt}
          disabled={!canGenerate || isGeneratingMusicalPrompt || isAnalyzingLyrics}
          className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all
            bg-[var(--accent-color)] text-[var(--on-accent-color)]
            hover:opacity-90 active:scale-[0.99]
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isGeneratingMusicalPrompt ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {m.generatePrompt}
        </button>

        {/* Master Prompt output */}
        {(musicalPrompt || isGeneratingMusicalPrompt) && (
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--accent-color)]" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.promptLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-[var(--text-secondary)] opacity-60">{m.optimizedFor}</span>
                {musicalPrompt && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium tracking-wide transition-all
                      border border-[var(--border-color)] text-[var(--text-secondary)]
                      hover:border-[var(--accent-color)] hover:text-[var(--accent-color)]"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? m.copied : m.copyPrompt}
                  </button>
                )}
              </div>
            </div>

            {isGeneratingMusicalPrompt && !musicalPrompt ? (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-color)]" />
                <span className="text-sm text-[var(--text-secondary)]">{m.analyzing}</span>
              </div>
            ) : (
              <div className="relative">
                <textarea
                  value={musicalPrompt}
                  onChange={e => setMusicalPrompt(e.target.value)}
                  rows={6}
                  className="w-full bg-transparent border border-[var(--accent-color)] border-opacity-30 rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)] transition-colors resize-none leading-relaxed"
                />
              </div>
            )}
          </div>
        )}

        {/* Empty prompt placeholder */}
        {!musicalPrompt && !isGeneratingMusicalPrompt && (
          <div className="glass-panel rounded-xl p-6 text-center space-y-2 border-dashed">
            <Music className="w-8 h-8 text-[var(--text-secondary)] opacity-30 mx-auto" />
            <p className="text-sm text-[var(--text-secondary)] opacity-50">{m.promptPlaceholder}</p>
          </div>
        )}

      </div>
    </div>
  );
}
