import React, { useState, useCallback } from 'react';
import { Music, Activity, Wand2, ListMusic, Sparkles, Loader2, Copy, Check, Zap, Guitar, Drum, Radio, Play, Pause } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useMetronome } from '../../hooks/useMetronome';
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

// Amber palette for the Musical tab (B1)
const AMBER_PRIMARY   = '#f59e0b';
const AMBER_SECONDARY = '#fbbf24';

// Genre presets
const GENRE_PRESETS = [
  'Pop', 'Hip-Hop', 'R&B', 'Indie Folk', 'Synthwave', 'Trap',
  'Rock', 'Electronic', 'Jazz', 'Cinematic', 'Ambient', 'Soul',
];

// BPM presets
const BPM_PRESETS = [
  { label: 'Very Slow', value: '60' },
  { label: 'Slow',      value: '80' },
  { label: 'Moderate',  value: '100' },
  { label: 'Upbeat',    value: '120' },
  { label: 'Fast',      value: '140' },
  { label: 'Very Fast', value: '160' },
];

// Instrument families (B2)
const INSTRUMENT_FAMILIES: { emoji: string; label: string; instruments: string[] }[] = [
  { emoji: '🎺', label: 'Brass',      instruments: ['Trumpet', 'Trombone', 'French Horn', 'Tuba'] },
  { emoji: '🎻', label: 'Strings',    instruments: ['Violin', 'Viola', 'Cello', 'Double Bass', 'Harp'] },
  { emoji: '🎸', label: 'Guitar',     instruments: ['Acoustic Guitar', 'Electric Guitar', 'Bass Guitar'] },
  { emoji: '🎹', label: 'Keys',       instruments: ['Piano', 'Rhodes', 'Organ', 'Synth'] },
  { emoji: '🎷', label: 'Woodwinds',  instruments: ['Saxophone', 'Flute', 'Clarinet', 'Oboe'] },
  { emoji: '🥁', label: 'Percussion', instruments: ['Standard Drum Kit', 'Afrobeat Kit', 'Electronic Kit', 'Orchestral Percussion', 'Latin Percussion'] },
  { emoji: '🎤', label: 'Vocals',     instruments: ['Lead Vocals', 'Backing Vocals', 'Choir'] },
  { emoji: '🎛️', label: 'Electronic', instruments: ['Synthesizer', 'Sampler', '808', 'TR-909'] },
];

// Rhythm presets (B3)
const RHYTHM_PRESETS = [
  'Samba', 'Bossa Nova', 'Rock', 'Hard Rock', 'Reggae', 'Ska',
  'Disco', 'Funk', 'Hip-Hop', 'Trap', 'Jazz Swing', 'Blues',
  'Waltz', 'Tango', 'Afrobeat', 'Rumba', 'Cumbia', 'Flamenco',
  'Electronic (4/4)', 'Breakbeat',
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
  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);

  const bpmValue   = parseInt(tempo) || 120;
  const metronome  = useMetronome(bpmValue);
  const bpmPercent = Math.min(100, Math.max(0, ((bpmValue - 40) / (220 - 40)) * 100));

  const selectedInstruments: string[] = instrumentation
    ? instrumentation.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const hasLyrics   = song.some(s => s.lines.some(l => l.text.trim() !== ''));
  const hasContext  = !!(title || topic || mood || hasLyrics);
  const canGenerate = hasApiKey && (hasContext || genre || instrumentation);

  const handleCopy = useCallback(() => {
    if (!musicalPrompt) return;
    navigator.clipboard.writeText(musicalPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [musicalPrompt]);

  const toggleInstrument = useCallback((instrument: string) => {
    const current = instrumentation
      ? instrumentation.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const idx = current.indexOf(instrument);
    const next = idx >= 0 ? current.filter(i => i !== instrument) : [...current, instrument];
    setInstrumentation(next.join(', '));
  }, [instrumentation, setInstrumentation]);

  const toggleRhythm = useCallback((preset: string) => {
    setRhythm(rhythm === preset ? '' : preset);
  }, [rhythm, setRhythm]);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${AMBER_PRIMARY}22` }}>
              <Music className="w-5 h-5" style={{ color: AMBER_PRIMARY }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-widest uppercase"
                style={{ color: AMBER_PRIMARY }}>{m.title}</h2>
              <p className="text-xs mt-0.5" style={{ color: AMBER_SECONDARY }}>{m.description}</p>
            </div>
          </div>

          {hasApiKey && (
            <button
              onClick={analyzeLyricsForMusic}
              disabled={isAnalyzingLyrics || isGeneratingMusicalPrompt}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium tracking-wide transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed border"
              style={{ background: `${AMBER_PRIMARY}1a`, borderColor: `${AMBER_PRIMARY}55`, color: AMBER_PRIMARY }}
            >
              {isAnalyzingLyrics ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isAnalyzingLyrics ? m.analyzing : m.analyzeLyricsShort}</span>
            </button>
          )}
        </div>

        {hasContext && (
          <div className="mt-3 flex items-center gap-2 text-[10px] rounded-lg px-3 py-1.5 border"
            style={{ background: `${AMBER_PRIMARY}0d`, borderColor: `${AMBER_PRIMARY}2a`, color: AMBER_SECONDARY }}>
            <Zap className="w-3 h-3 shrink-0" style={{ color: AMBER_PRIMARY }} />
            <span>{m.contextInfo}</span>
            <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">
              {title && <span className="px-1.5 py-0.5 rounded-md font-medium"
                style={{ background: `${AMBER_PRIMARY}22`, color: AMBER_PRIMARY }}>{title}</span>}
              {topic && <span className="bg-zinc-500/10 text-[var(--text-secondary)] px-1.5 py-0.5 rounded-md">{topic}</span>}
              {mood  && <span className="bg-zinc-500/10 text-[var(--text-secondary)] px-1.5 py-0.5 rounded-md">{mood}</span>}
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
              <Radio className="w-4 h-4" style={{ color: AMBER_PRIMARY }} />
              <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.genre}</label>
            </div>
            <input
              type="text"
              value={genre}
              onChange={e => setGenre(e.target.value)}
              placeholder={m.genrePlaceholder}
              className="w-full bg-transparent border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] lcars-glow-focus transition-colors"
            />
            <div className="flex flex-wrap gap-1.5">
              {GENRE_PRESETS.map(preset => (
                <button
                  key={preset}
                  onClick={() => setGenre(genre === preset ? '' : preset)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wide transition-all border ${
                    genre === preset
                      ? 'border-transparent'
                      : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:text-amber-400 hover:border-amber-400'
                  }`}
                  style={genre === preset ? { background: AMBER_PRIMARY, borderColor: AMBER_PRIMARY, color: '#000' } : {}}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Tempo + Metronome (B4) */}
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: AMBER_PRIMARY }} />
                <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.tempo}</label>
              </div>
              <div className="flex items-center gap-2">
                {/* BPM badge — flashes amber on each beat */}
                <span
                  className="inline-flex items-center justify-center rounded-lg px-2 py-1 text-sm font-mono font-bold border transition-all"
                  style={metronome.isBeat
                    ? { color: AMBER_PRIMARY, borderColor: AMBER_PRIMARY, boxShadow: `0 0 8px ${AMBER_PRIMARY}88`, background: `${AMBER_PRIMARY}22` }
                    : { color: 'var(--text-primary)', borderColor: 'var(--border-color)', background: 'transparent' }
                  }
                >
                  {bpmValue}
                </span>
                <input
                  type="number"
                  value={tempo}
                  onChange={e => setTempo(e.target.value)}
                  min="40" max="220"
                  className="w-16 bg-transparent border border-[var(--border-color)] rounded-lg px-2 py-1 text-sm text-center text-[var(--text-primary)] lcars-glow-focus transition-colors"
                />
                <span className="text-xs text-[var(--text-secondary)]">BPM</span>
                {/* Metronome toggle button */}
                <button
                  onClick={metronome.toggle}
                  title={metronome.isPlaying ? (m.metronomeStop ?? 'Stop Metronome') : (m.metronomeStart ?? 'Start Metronome')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium tracking-wide transition-all border ${
                    metronome.isPlaying
                      ? 'border-transparent metronome-active'
                      : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-amber-400 hover:text-amber-400'
                  }`}
                  style={metronome.isPlaying ? { background: AMBER_PRIMARY, borderColor: AMBER_PRIMARY, color: '#000' } : {}}
                >
                  {metronome.isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span className="hidden sm:inline">{m.metronome ?? 'Metronome'}</span>
                </button>
              </div>
            </div>
            {/* BPM slider visual track */}
            <div className="relative h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all"
                style={{ width: `${bpmPercent}%`, background: AMBER_PRIMARY }}
              />
            </div>
            <input
              type="range"
              min="40" max="220"
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
                      ? 'border-transparent'
                      : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:text-amber-400 hover:border-amber-400'
                  }`}
                  style={tempo === value ? { background: AMBER_PRIMARY, borderColor: AMBER_PRIMARY, color: '#000' } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Instrument Builder + Rhythm Presets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* B2 — Instrument Builder */}
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Guitar className="w-4 h-4" style={{ color: AMBER_PRIMARY }} />
              <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.instruments ?? 'INSTRUMENTS'}</label>
              {selectedInstruments.length > 0 && (
                <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{ background: `${AMBER_PRIMARY}22`, color: AMBER_PRIMARY }}>
                  {selectedInstruments.length}
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {INSTRUMENT_FAMILIES.map(family => {
                const isExpanded = expandedFamily === family.label;
                const familySelected = family.instruments.filter(i => selectedInstruments.includes(i));
                return (
                  <div key={family.label}>
                    <button
                      onClick={() => setExpandedFamily(isExpanded ? null : family.label)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-medium tracking-wide transition-all border text-left"
                      style={familySelected.length > 0
                        ? { background: `${AMBER_PRIMARY}1a`, borderColor: `${AMBER_PRIMARY}55`, color: AMBER_PRIMARY }
                        : { background: 'transparent', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
                      }
                    >
                      <span>{family.emoji}</span>
                      <span>{family.label}</span>
                      {familySelected.length > 0 && (
                        <span className="ml-1 text-[9px] font-bold px-1 rounded"
                          style={{ background: AMBER_PRIMARY, color: '#000' }}>
                          {familySelected.length}
                        </span>
                      )}
                      <span className="ml-auto opacity-50">{isExpanded ? '▾' : '▸'}</span>
                    </button>
                    {isExpanded && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5 pl-2">
                        {family.instruments.map(instrument => {
                          const sel = selectedInstruments.includes(instrument);
                          return (
                            <button
                              key={instrument}
                              onClick={() => toggleInstrument(instrument)}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wide transition-all border ${
                                sel
                                  ? 'border-transparent'
                                  : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:text-amber-400 hover:border-amber-400'
                              }`}
                              style={sel ? { background: `${AMBER_PRIMARY}33`, borderColor: AMBER_PRIMARY, color: AMBER_PRIMARY } : {}}
                            >
                              {instrument}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Free-text field to display / edit the full instrumentation string */}
            <textarea
              value={instrumentation}
              onChange={e => setInstrumentation(e.target.value)}
              placeholder={m.instrumentationPlaceholder}
              rows={2}
              className="w-full bg-transparent border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] lcars-glow-focus transition-colors resize-none"
            />
          </div>

          {/* B3 — Rhythm Presets */}
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Drum className="w-4 h-4" style={{ color: AMBER_PRIMARY }} />
              <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.rhythmPresets ?? 'RHYTHM PRESETS'}</label>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
              {RHYTHM_PRESETS.map(preset => {
                const sel = rhythm === preset;
                return (
                  <button
                    key={preset}
                    onClick={() => toggleRhythm(preset)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide transition-all border ${
                      sel
                        ? 'border-transparent'
                        : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:text-amber-400 hover:border-amber-400'
                    }`}
                    style={sel ? { background: AMBER_PRIMARY, borderColor: AMBER_PRIMARY, color: '#000' } : {}}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
            <textarea
              value={rhythm}
              onChange={e => setRhythm(e.target.value)}
              placeholder={m.rhythmPlaceholder}
              rows={2}
              className="w-full bg-transparent border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] lcars-glow-focus transition-colors resize-none"
            />
          </div>
        </div>

        {/* Narrative / Vibe */}
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4" style={{ color: AMBER_PRIMARY }} />
            <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.narrative}</label>
          </div>
          <textarea
            value={narrative}
            onChange={e => setNarrative(e.target.value)}
            placeholder={m.narrativePlaceholder}
            rows={2}
            className="w-full bg-transparent border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] lcars-glow-focus transition-colors resize-none"
          />
        </div>

        {/* Generate button */}
        <button
          onClick={generateMusicalPrompt}
          disabled={!canGenerate || isGeneratingMusicalPrompt || isAnalyzingLyrics}
          className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]"
          style={{ background: AMBER_PRIMARY, color: '#000' }}
        >
          {isGeneratingMusicalPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {m.generatePrompt}
        </button>

        {/* Master Prompt output */}
        {(musicalPrompt || isGeneratingMusicalPrompt) && (
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: AMBER_PRIMARY }} />
                <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.promptLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-[var(--text-secondary)] opacity-60">{m.optimizedFor}</span>
                {musicalPrompt && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium tracking-wide transition-all border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-amber-400 hover:text-amber-400"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? m.copied : m.copyPrompt}
                  </button>
                )}
              </div>
            </div>

            {isGeneratingMusicalPrompt && !musicalPrompt ? (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: AMBER_PRIMARY }} />
                <span className="text-sm text-[var(--text-secondary)]">{m.analyzing}</span>
              </div>
            ) : (
              <div className="relative">
                <textarea
                  value={musicalPrompt}
                  onChange={e => setMusicalPrompt(e.target.value)}
                  rows={6}
                  className="w-full bg-transparent rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] lcars-glow-focus transition-colors resize-none leading-relaxed border"
                  style={{ borderColor: `${AMBER_PRIMARY}55` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Empty prompt placeholder */}
        {!musicalPrompt && !isGeneratingMusicalPrompt && (
          <div className="glass-panel rounded-xl p-6 text-center space-y-2 border-dashed">
            <Music className="w-8 h-8 opacity-30 mx-auto" style={{ color: AMBER_PRIMARY }} />
            <p className="text-sm text-[var(--text-secondary)] opacity-50">{m.promptPlaceholder}</p>
          </div>
        )}

      </div>
    </div>
  );
}
