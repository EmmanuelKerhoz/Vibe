import React, { useState, useCallback } from 'react';
import { Music, Activity, Wand2, ListMusic, Sparkles, Loader2, Copy, Check, Zap, Guitar, Drum, Play, Pause } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useMetronome } from '../../hooks/useMetronome';
import type { Section } from '../../types';
import { RHYTHM_BPM } from '../../constants/rhythmBpm';

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

// Curated palette for the Musical tab: keep orange as the lead, but balance it with cooler accents.
const AMBER_PRIMARY = '#f59e0b';
const AMBER_SECONDARY = '#38bdf8';
const AMBER_MUTED = '#c4b5fd';

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

// Vibe Board data types
interface VibeTile {
  name: string;
  emoji: string;
  bpm: number;
  rhythm: string;
  instruments: string[];
}
interface VibeCategory {
  id: string;
  label: string;
  color: string;
  summary: string;
  artists: string[];
  moods: string[];
  era: string;
  tiles: VibeTile[];
}

const MUSICAL_GUIDE_STEPS = [
  {
    title: 'Start broad',
    description: 'Choose the family that gets closest to the track before refining the micro-scene.',
  },
  {
    title: 'Refine the niche',
    description: 'Use a sub-style to tell whether it leans indie, club-ready, cinematic, soulful, or hybrid.',
  },
  {
    title: 'Give references',
    description: 'Artist touchpoints, mood words, and era cues help define the intended lane instantly.',
  },
  {
    title: 'Lock the production',
    description: 'Confirm BPM, groove, and instruments so the prompt sounds intentional instead of generic.',
  },
];

// Vibe Board categories
const VIBE_CATEGORIES: VibeCategory[] = [
  {
    id: 'electronic',
    label: 'ÉLECTRONIQUE',
    color: '#06b6d4',
    summary: 'Synthetic textures, club energy, and precise pulse-driven production.',
    artists: ['Fred again..', 'BICEP', 'Justice'],
    moods: ['Driving', 'Futuristic', 'Late-night'],
    era: '90s club DNA → modern festival polish',
    tiles: [
      { name: 'House',       emoji: '🏠', bpm: 128, rhythm: 'Electronic (4/4)', instruments: ['Synthesizer', 'Sampler', 'TR-909'] },
      { name: 'Techno',      emoji: '⚙️', bpm: 140, rhythm: 'Electronic (4/4)', instruments: ['Synthesizer', 'TR-909', 'Electronic Kit'] },
      { name: 'Trap',        emoji: '🔊', bpm: 70,  rhythm: 'Trap',             instruments: ['808', 'Electronic Kit', 'Sampler'] },
      { name: 'Synthwave',   emoji: '🌆', bpm: 110, rhythm: 'Electronic (4/4)', instruments: ['Synthesizer', 'Sampler'] },
      { name: 'Drum & Bass', emoji: '🥁', bpm: 174, rhythm: 'Breakbeat',        instruments: ['Electronic Kit', 'Synthesizer', 'Sampler'] },
    ],
  },
  {
    id: 'urban',
    label: 'URBAIN',
    color: '#ec4899',
    summary: 'Beat-first songwriting with vocal attitude, bounce, and contemporary crossover appeal.',
    artists: ['SZA', 'Travis Scott', 'Burna Boy'],
    moods: ['Confident', 'Sensual', 'Hypnotic'],
    era: 'Streaming-era polish with roots in 90s/2000s rhythm culture',
    tiles: [
      { name: 'Hip-Hop',   emoji: '🎤', bpm: 90,  rhythm: 'Hip-Hop',  instruments: ['808', 'Electronic Kit', 'Sampler', 'Lead Vocals'] },
      { name: 'R&B',       emoji: '💜', bpm: 90,  rhythm: 'Funk',     instruments: ['Rhodes', 'Electronic Kit', 'Lead Vocals', 'Backing Vocals'] },
      { name: 'Afrobeat',  emoji: '🌍', bpm: 100, rhythm: 'Afrobeat', instruments: ['Afrobeat Kit', 'Electric Guitar', 'Lead Vocals'] },
      { name: 'Reggaeton', emoji: '🔥', bpm: 95,  rhythm: 'Cumbia',   instruments: ['Electronic Kit', 'Sampler', 'Lead Vocals'] },
    ],
  },
  {
    id: 'rock',
    label: 'ROCK',
    color: '#ef4444',
    summary: 'Live-band impact, punchy drums, and guitar-forward arrangements with edge.',
    artists: ['Arctic Monkeys', 'Foo Fighters', 'Paramore'],
    moods: ['Raw', 'Anthemic', 'Restless'],
    era: '70s riffs through 2000s alt-rock urgency',
    tiles: [
      { name: 'Rock',      emoji: '🎸', bpm: 120, rhythm: 'Rock',      instruments: ['Electric Guitar', 'Standard Drum Kit', 'Bass Guitar'] },
      { name: 'Hard Rock', emoji: '🤘', bpm: 140, rhythm: 'Hard Rock', instruments: ['Electric Guitar', 'Standard Drum Kit', 'Bass Guitar'] },
      { name: 'Punk',      emoji: '⚡', bpm: 180, rhythm: 'Rock',      instruments: ['Electric Guitar', 'Standard Drum Kit', 'Bass Guitar', 'Lead Vocals'] },
      { name: 'Metal',     emoji: '💀', bpm: 160, rhythm: 'Rock',      instruments: ['Electric Guitar', 'Standard Drum Kit', 'Bass Guitar'] },
      { name: 'Grunge',    emoji: '🌧️', bpm: 100, rhythm: 'Rock',      instruments: ['Electric Guitar', 'Standard Drum Kit', 'Bass Guitar', 'Lead Vocals'] },
    ],
  },
  {
    id: 'soul-jazz',
    label: 'SOUL / JAZZ',
    color: '#8b5cf6',
    summary: 'Expressive harmony, groove depth, and human warmth anchored by feel.',
    artists: ['Amy Winehouse', 'Anderson .Paak', 'Esperanza Spalding'],
    moods: ['Warm', 'Playful', 'Intimate'],
    era: 'Timeless heritage with modern neo-soul finesse',
    tiles: [
      { name: 'Jazz',   emoji: '🎷', bpm: 165, rhythm: 'Jazz Swing', instruments: ['Saxophone', 'Piano', 'Double Bass', 'Standard Drum Kit'] },
      { name: 'Blues',  emoji: '🎵', bpm: 75,  rhythm: 'Blues',      instruments: ['Electric Guitar', 'Piano', 'Standard Drum Kit'] },
      { name: 'Soul',   emoji: '❤️', bpm: 80,  rhythm: 'Funk',       instruments: ['Rhodes', 'Lead Vocals', 'Backing Vocals'] },
      { name: 'Funk',   emoji: '🕺', bpm: 105, rhythm: 'Funk',       instruments: ['Electric Guitar', 'Standard Drum Kit', 'Bass Guitar', 'Rhodes'] },
      { name: 'Gospel', emoji: '🙏', bpm: 85,  rhythm: 'Blues',      instruments: ['Piano', 'Choir', 'Lead Vocals'] },
    ],
  },
  {
    id: 'world',
    label: 'WORLD',
    color: '#14b8a6',
    summary: 'Regional rhythms and acoustic character blended with strong cultural signatures.',
    artists: ['Buena Vista Social Club', 'Rosalía', 'Fela Kuti'],
    moods: ['Organic', 'Sunlit', 'Transportive'],
    era: 'Tradition-informed grooves with global-pop openness',
    tiles: [
      { name: 'Reggae',     emoji: '🌴', bpm: 75,  rhythm: 'Reggae',     instruments: ['Electric Guitar', 'Standard Drum Kit', 'Bass Guitar'] },
      { name: 'Samba',      emoji: '🥁', bpm: 100, rhythm: 'Samba',      instruments: ['Latin Percussion', 'Standard Drum Kit'] },
      { name: 'Bossa Nova', emoji: '🎸', bpm: 130, rhythm: 'Bossa Nova', instruments: ['Acoustic Guitar', 'Double Bass'] },
      { name: 'Flamenco',   emoji: '💃', bpm: 120, rhythm: 'Flamenco',   instruments: ['Acoustic Guitar', 'Latin Percussion'] },
      { name: 'Tango',      emoji: '🌹', bpm: 120, rhythm: 'Tango',      instruments: ['Violin', 'Piano', 'Double Bass'] },
    ],
  },
  {
    id: 'pop',
    label: 'POP',
    color: '#f59e0b',
    summary: 'Direct hooks, polished toplines, and wide-audience accessibility.',
    artists: ['Dua Lipa', 'The Weeknd', 'Caroline Polachek'],
    moods: ['Bright', 'Catchy', 'Cinematic'],
    era: '80s sheen to current chart-ready production',
    tiles: [
      { name: 'Pop',       emoji: '⭐', bpm: 120, rhythm: 'Disco',            instruments: ['Synthesizer', 'Electronic Kit', 'Lead Vocals', 'Backing Vocals'] },
      { name: 'Indie Pop', emoji: '🌟', bpm: 110, rhythm: 'Rock',             instruments: ['Acoustic Guitar', 'Electronic Kit', 'Lead Vocals'] },
      { name: 'K-Pop',     emoji: '✨', bpm: 128, rhythm: 'Electronic (4/4)', instruments: ['Synthesizer', 'Electronic Kit', 'Lead Vocals', 'Backing Vocals'] },
      { name: 'Synth-Pop', emoji: '🎹', bpm: 120, rhythm: 'Disco',            instruments: ['Synthesizer', 'Sampler', 'Lead Vocals'] },
    ],
  },
  {
    id: 'classical',
    label: 'CLASSIQUE',
    color: '#6366f1',
    summary: 'Composed dynamics, orchestral detail, and cinematic movement over groove-first writing.',
    artists: ['Max Richter', 'Ólafur Arnalds', 'Hans Zimmer'],
    moods: ['Elegant', 'Expansive', 'Reflective'],
    era: 'Classical foundations with modern soundtrack sensibility',
    tiles: [
      { name: 'Orchestral',   emoji: '🎻', bpm: 100, rhythm: 'Waltz', instruments: ['Violin', 'Viola', 'Cello', 'French Horn', 'Trumpet'] },
      { name: 'Baroque',      emoji: '🎼', bpm: 120, rhythm: 'Waltz', instruments: ['Violin', 'Cello', 'Organ', 'Flute'] },
      { name: 'Contemporary', emoji: '🎵', bpm: 80,  rhythm: 'Waltz', instruments: ['Piano', 'Violin', 'Cello'] },
    ],
  },
];

// Sub-styles per genre
const SUB_STYLES: Record<string, string[]> = {
  'Rock':       ['Classic', 'Indie', 'Psychedelic', 'Prog', 'Alternative'],
  'Jazz':       ['Swing', 'Bebop', 'Fusion', 'Smooth', 'Latin'],
  'Hip-Hop':    ['Trap', 'Boom Bap', 'Lo-Fi', 'Cloud Rap', 'Drill'],
  'Pop':        ['Indie Pop', 'K-Pop', 'Synth-Pop', 'Dance Pop'],
  'R&B':        ['Neo Soul', 'Contemporary', 'Future R&B'],
  'Metal':      ['Heavy', 'Death', 'Thrash', 'Progressive'],
  'Funk':       ['Classic', 'P-Funk', 'Neo-Funk', 'Electro-Funk'],
  'Reggae':     ['Roots', 'Dancehall', 'Dub'],
  'Blues':      ['Delta', 'Chicago', 'Electric', 'Texas'],
  'Electronic': ['House', 'Techno', 'Ambient', 'IDM'],
  'Synthwave':  ['Retrowave', 'Darksynth', 'Chillwave'],
  'Soul':       ['Classic', 'Neo Soul', 'Northern Soul'],
  'Afrobeat':   ['Afrobeats', 'Highlife', 'Jùjú'],
};

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
  const [selectedVibeTile, setSelectedVibeTile] = useState<VibeTile | null>(null);
  const [selectedSubStyle, setSelectedSubStyle] = useState<string>('');
  const selectedCategory = selectedVibeTile
    ? VIBE_CATEGORIES.find(category => category.tiles.some(tile => tile.name === selectedVibeTile.name)) ?? null
    : null;
  const selectedAccent = selectedCategory?.color ?? AMBER_PRIMARY;
  const genreBlueprint = selectedVibeTile
    ? selectedSubStyle
      ? `${selectedVibeTile.name} / ${selectedSubStyle}`
      : selectedVibeTile.name
    : genre;
  const suggestedSubStyles = selectedVibeTile ? (SUB_STYLES[selectedVibeTile.name] as string[] | undefined) ?? [] : [];

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

  // Handle Vibe Board tile selection — sets genre, tempo, rhythm, instruments
  const handleVibeTileSelect = useCallback((tile: VibeTile) => {
    if (selectedVibeTile?.name === tile.name) {
      setSelectedVibeTile(null);
      setSelectedSubStyle('');
      return;
    }
    setSelectedVibeTile(tile);
    setSelectedSubStyle('');
    setGenre(tile.name);
    // Use canonical RHYTHM_BPM if available, otherwise tile's own BPM
    const canonicalBpm = RHYTHM_BPM[tile.rhythm] ?? tile.bpm;
    setTempo(canonicalBpm.toString());
    setRhythm(tile.rhythm);
    setInstrumentation(tile.instruments.join(', '));
  }, [selectedVibeTile, setGenre, setTempo, setRhythm, setInstrumentation]);

  // Handle sub-style selection — refines the rhythm field
  const handleSubStyleSelect = useCallback((subStyle: string) => {
    const next = selectedSubStyle === subStyle ? '' : subStyle;
    setSelectedSubStyle(next);
    if (selectedVibeTile) {
      setGenre(next ? `${selectedVibeTile.name} / ${next}` : selectedVibeTile.name);
    }
    setRhythm(next || (selectedVibeTile?.rhythm ?? ''));
  }, [selectedSubStyle, selectedVibeTile, setGenre, setRhythm]);

  return (
    <div className="flex flex-col h-full overflow-y-auto fluent-fade-in">
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
              className="ux-interactive flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium tracking-wide shrink-0 disabled:opacity-50 disabled:cursor-not-allowed border"
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
              {topic && <span className="px-1.5 py-0.5 rounded-md text-[var(--text-secondary)] bg-[var(--border-color)]/40">{topic}</span>}
              {mood  && <span className="px-1.5 py-0.5 rounded-md text-[var(--text-secondary)] bg-[var(--border-color)]/40">{mood}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Main controls grid */}
        <div className="flex-1 p-6 space-y-5">

          <div className="grid gap-2 lg:grid-cols-4">
            {MUSICAL_GUIDE_STEPS.map((step, index) => (
              <div
                key={step.title}
                className="ux-interactive rounded-xl border px-3 py-2.5"
                style={{ background: `${AMBER_SECONDARY}10`, borderColor: `${AMBER_SECONDARY}30` }}
              >
                <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] uppercase" style={{ color: index === 0 ? AMBER_PRIMARY : AMBER_SECONDARY }}>
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border text-[9px]" style={{ borderColor: `${AMBER_SECONDARY}45` }}>
                    {index + 1}
                  </span>
                  {step.title}
                </div>
                <p className="mt-2 text-[11px] leading-5 text-[var(--text-secondary)]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Vibe Board — fuses Genre + Rhythm */}
          <div className="glass-panel rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4" style={{ color: AMBER_PRIMARY }} />
            <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">
              {m.vibeBoard ?? 'VIBE BOARD'}
            </label>
                {selectedVibeTile && (
                  <span className="ml-auto flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-md"
                    style={{ background: `${selectedAccent}22`, color: selectedAccent }}>
                    {selectedVibeTile.emoji} {genreBlueprint}
                  </span>
                )}
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] opacity-70">
            {m.vibeBoardDescription ?? 'Select your genre to auto-set BPM & instruments'}
          </p>

          {/* Genre categories */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {VIBE_CATEGORIES.map(category => (
                <div key={category.id}>
                  <div className="mb-1.5 flex items-end justify-between gap-3 px-0.5">
                    <div className="text-[9px] font-bold tracking-widest uppercase"
                      style={{ color: category.color }}>
                      {category.label}
                    </div>
                    <p className="text-[10px] text-right leading-4 text-[var(--text-secondary)] opacity-75">
                      {category.summary}
                    </p>
                  </div>
                  {/* Genre tiles */}
                  <div className="flex flex-wrap gap-1.5">
                  {category.tiles.map(tile => {
                    const isSelected = selectedVibeTile?.name === tile.name;
                    return (
                      <button
                        key={tile.name}
                        onClick={() => handleVibeTileSelect(tile)}
                        className="ux-interactive flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium tracking-wide border"
                        style={isSelected
                          ? {
                              borderRadius: '12px 4px 12px 4px',
                              background: `${category.color}22`,
                              borderColor: category.color,
                              color: category.color,
                              boxShadow: `0 0 8px ${category.color}55`,
                              transform: 'scale(1.04)',
                            }
                          : {
                              borderRadius: '12px 4px 12px 4px',
                              background: 'transparent',
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-secondary)',
                            }
                        }
                      >
                        <span>{tile.emoji}</span>
                        <span>{tile.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sub-style selector */}
            {selectedVibeTile && SUB_STYLES[selectedVibeTile.name] && (
              <div className="pt-2 border-t border-[var(--border-color)]">
                <div className="text-[9px] font-bold tracking-widest uppercase mb-1.5 text-[var(--text-secondary)]">
                {m.subStyle ?? 'SUB-STYLE'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(SUB_STYLES[selectedVibeTile.name] as string[]).map(sub => {
                  const isSel = selectedSubStyle === sub;
                  return (
                    <button
                      key={sub}
                      onClick={() => handleSubStyleSelect(sub)}
                      className="ux-interactive px-2.5 py-1 text-[10px] font-medium tracking-wide border"
                      style={isSel
                        ? { borderRadius: '6px 2px 6px 2px', background: selectedAccent, borderColor: selectedAccent, color: '#000' }
                        : { borderRadius: '6px 2px 6px 2px', background: 'transparent', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
                      }
                    >
                      {sub}
                    </button>
                  );
                })}
                </div>
              </div>
            )}

            {selectedVibeTile && selectedCategory && (
              <div className="grid gap-2 pt-2 border-t border-[var(--border-color)] lg:grid-cols-4 sm:grid-cols-2">
                <div className="rounded-xl border px-3 py-2.5" style={{ background: `${selectedCategory.color}14`, borderColor: `${selectedCategory.color}40` }}>
                  <div className="text-[9px] font-bold tracking-widest uppercase" style={{ color: selectedCategory.color }}>
                    Broad lane
                  </div>
                  <p className="mt-2 text-xs font-semibold text-[var(--text-primary)]">{selectedCategory.label}</p>
                  <p className="mt-1 text-[11px] leading-5 text-[var(--text-secondary)]">{selectedCategory.summary}</p>
                </div>
                <div className="rounded-xl border px-3 py-2.5" style={{ background: `${selectedAccent}10`, borderColor: `${selectedAccent}33` }}>
                  <div className="text-[9px] font-bold tracking-widest uppercase" style={{ color: selectedAccent }}>
                    Sub-style clues
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {suggestedSubStyles.map(sub => (
                      <span
                        key={sub}
                        className="rounded-full px-2 py-1 text-[10px] font-medium"
                        style={{ background: `${selectedAccent}1c`, color: selectedAccent }}
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border px-3 py-2.5" style={{ background: `${AMBER_MUTED}18`, borderColor: `${AMBER_SECONDARY}33` }}>
                  <div className="text-[9px] font-bold tracking-widest uppercase" style={{ color: AMBER_SECONDARY }}>
                    For fans of
                  </div>
                  <p className="mt-2 text-xs font-semibold text-[var(--text-primary)]">
                    {selectedCategory.artists.join(' · ')}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-[var(--text-secondary)]">
                    Use references to position the song quickly for collaborators and music tools.
                  </p>
                </div>
                <div className="rounded-xl border px-3 py-2.5" style={{ background: `${selectedCategory.color}12`, borderColor: `${selectedCategory.color}33` }}>
                  <div className="text-[9px] font-bold tracking-widest uppercase" style={{ color: selectedCategory.color }}>
                    Mood + era cues
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedCategory.moods.map(moodTag => (
                      <span
                        key={moodTag}
                        className="rounded-full px-2 py-1 text-[10px] font-medium"
                        style={{ background: `${selectedCategory.color}1a`, color: selectedCategory.color }}
                      >
                        {moodTag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-[var(--text-secondary)]">{selectedCategory.era}</p>
                </div>
              </div>
            )}
          </div>

        {/* Row 1: Tempo + Instruments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

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
                  className={`ux-interactive flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium tracking-wide border ${
                    metronome.isPlaying
                      ? 'border-transparent metronome-active'
                      : 'border-[var(--border-color)] text-[var(--text-secondary)]'
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
                  className={`ux-interactive px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wide border ${
                    tempo === value
                      ? 'border-transparent'
                      : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)]'
                  }`}
                  style={tempo === value ? { background: AMBER_PRIMARY, borderColor: AMBER_PRIMARY, color: '#000' } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

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
                      className="ux-interactive w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-medium tracking-wide border text-left"
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
                              className={`ux-interactive px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wide border ${
                                sel
                                  ? 'border-transparent'
                                  : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)]'
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
        </div>

        {/* Row 2: Rhythm & Groove + Narrative */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* B3 — Rhythm & Groove (free-form, auto-populated by Vibe Board) */}
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Drum className="w-4 h-4" style={{ color: AMBER_PRIMARY }} />
              <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.rhythm}</label>
            </div>
            <textarea
              value={rhythm}
              onChange={e => setRhythm(e.target.value)}
              placeholder={m.rhythmPlaceholder}
              rows={3}
              className="w-full bg-transparent border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] lcars-glow-focus transition-colors resize-none"
            />
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
              rows={3}
              className="w-full bg-transparent border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] lcars-glow-focus transition-colors resize-none"
            />
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generateMusicalPrompt}
          disabled={!canGenerate || isGeneratingMusicalPrompt || isAnalyzingLyrics}
          className="ux-interactive w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]"
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
                      className="ux-interactive flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium tracking-wide border border-[var(--border-color)] text-[var(--text-secondary)]"
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
