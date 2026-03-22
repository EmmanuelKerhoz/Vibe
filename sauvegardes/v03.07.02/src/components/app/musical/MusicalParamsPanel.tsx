import React, { useState, useCallback } from 'react';
import { Activity, Guitar, Drum, ListMusic, Play, Pause, Music } from '../../ui/icons';
import { useTranslation } from '../../../i18n';
import { useMetronome } from '../../../hooks/useMetronome';
import { RHYTHM_BPM } from '../../../constants/rhythmBpm';

const AMBER_PRIMARY = '#f59e0b';

const BPM_PRESETS = [
  { label: 'Very Slow', value: '60' },
  { label: 'Slow',      value: '80' },
  { label: 'Moderate',  value: '100' },
  { label: 'Upbeat',    value: '120' },
  { label: 'Fast',      value: '140' },
  { label: 'Very Fast', value: '160' },
];

const INSTRUMENT_FAMILIES: { emoji: string; label: string; instruments: string[] }[] = [
  { emoji: '\uD83C\uDFBA', label: 'Brass',       instruments: ['Trumpet', 'Trombone', 'French Horn', 'Tuba'] },
  { emoji: '\uD83C\uDFBB', label: 'Strings',     instruments: ['Violin', 'Alto Violin', 'Viola', 'Cello', 'Double Bass', 'Harp'] },
  { emoji: '\uD83C\uDFB8', label: 'Guitar',      instruments: ['Acoustic Guitar', 'Electric Guitar', 'Bass Guitar'] },
  { emoji: '\uD83C\uDFB9', label: 'Keys',        instruments: ['Grand Piano', 'Piano', 'Rhodes', 'Organ', 'Synth'] },
  { emoji: '\uD83C\uDFB7', label: 'Woodwinds',   instruments: ['Saxophone', 'Flute', 'Clarinet', 'Oboe'] },
  { emoji: '\uD83E\uDD41', label: 'Percussion',  instruments: ['Standard Drum Kit', 'Afrobeat Kit', 'Electronic Kit', 'Orchestral Percussion', 'Latin Percussion', 'Tribal Percussion'] },
  { emoji: '\uD83C\uDFA4', label: 'Vocals',      instruments: ['Lead Vocals', 'Backing Vocals', 'Choir'] },
  { emoji: '\uD83C\uDF9B\uFE0F', label: 'Electronic', instruments: ['Synthesizer', 'Sampler', '808', 'TR-909'] },
  { emoji: '\uD83E\uDE97', label: 'Folk / Ethnic', instruments: ['Alto Harmonica', 'Kazoo', 'Jaw Harp', 'Pan Flute', 'Tribal Percussion', 'Bouzouki', 'Sitar', 'Duduk'] },
];

interface VibeTile { name: string; emoji: string; bpm: number; rhythm: string; instruments: string[] }
interface VibeCategory {
  id: string; label: string; color: string; summary: string;
  artists: string[]; moods: string[]; era: string; tiles: VibeTile[];
}

const SUB_STYLES: Record<string, string[]> = {
  'Rock': ['Classic', 'Indie', 'Psychedelic', 'Prog', 'Alternative'],
  'Jazz': ['Swing', 'Bebop', 'Fusion', 'Smooth', 'Latin'],
  'Hip-Hop': ['Trap', 'Boom Bap', 'Lo-Fi', 'Cloud Rap', 'Drill'],
  'Pop': ['Indie Pop', 'K-Pop', 'Synth-Pop', 'Dance Pop'],
  'R&B': ['Neo Soul', 'Contemporary', 'Future R&B'],
  'Metal': ['Heavy', 'Death', 'Thrash', 'Progressive'],
  'Funk': ['Classic', 'P-Funk', 'Neo-Funk', 'Electro-Funk'],
  'Reggae': ['Roots', 'Dancehall', 'Dub'],
  'Blues': ['Delta', 'Chicago', 'Electric', 'Texas'],
  'Electronic': ['House', 'Techno', 'Ambient', 'IDM'],
  'Synthwave': ['Retrowave', 'Darksynth', 'Chillwave'],
  'Soul': ['Classic', 'Neo Soul', 'Northern Soul'],
  'Afrobeat': ['Afrobeats', 'Highlife', 'J\u00f9j\u00fa'],
};

const VIBE_CATEGORIES: VibeCategory[] = [
  { id: 'electronic', label: 'ÉLECTRONIQUE', color: '#06b6d4', summary: 'Synthetic textures, club energy, and precise pulse-driven production.', artists: ['Fred again..', 'BICEP', 'Justice'], moods: ['Driving', 'Futuristic', 'Late-night'], era: '90s club DNA → modern festival polish', tiles: [{ name: 'House', emoji: '\uD83C\uDFE0', bpm: 128, rhythm: 'Electronic (4/4)', instruments: ['Synthesizer', 'Sampler', 'TR-909'] }, { name: 'Techno', emoji: '\u2699\uFE0F', bpm: 140, rhythm: 'Electronic (4/4)', instruments: ['Synthesizer', 'TR-909', 'Electronic Kit'] }, { name: 'Trap', emoji: '\uD83D\uDD0A', bpm: 70, rhythm: 'Trap', instruments: ['808', 'Electronic Kit', 'Sampler'] }, { name: 'Synthwave', emoji: '\uD83C\uDF06', bpm: 110, rhythm: 'Electronic (4/4)', instruments: ['Synthesizer', 'Sampler'] }, { name: 'Drum & Bass', emoji: '\uD83E\uDD41', bpm: 174, rhythm: 'Breakbeat', instruments: ['Electronic Kit', 'Synthesizer', 'Sampler'] }] },
  { id: 'urban', label: 'URBAIN', color: '#ec4899', summary: 'Beat-first songwriting with vocal attitude, bounce, and contemporary crossover appeal.', artists: ['SZA', 'Travis Scott', 'Burna Boy'], moods: ['Confident', 'Sensual', 'Hypnotic'], era: 'Streaming-era polish with roots in 90s/2000s rhythm culture', tiles: [{ name: 'Hip-Hop', emoji: '\uD83C\uDFA4', bpm: 90, rhythm: 'Hip-Hop', instruments: ['808', 'Electronic Kit', 'Sampler', 'Lead Vocals'] }, { name: 'R&B', emoji: '\uD83D\uDC9C', bpm: 90, rhythm: 'Funk', instruments: ['Rhodes', 'Electronic Kit', 'Lead Vocals', 'Backing Vocals'] }, { name: 'Afrobeat', emoji: '\uD83C\uDF0D', bpm: 100, rhythm: 'Afrobeat', instruments: ['Afrobeat Kit', 'Electric Guitar', 'Lead Vocals'] }, { name: 'Reggaeton', emoji: '\uD83D\uDD25', bpm: 95, rhythm: 'Cumbia', instruments: ['Electronic Kit', 'Sampler', 'Lead Vocals'] }] },
  { id: 'rock', label: 'ROCK', color: '#ef4444', summary: 'Live-band impact, punchy drums, and guitar-forward arrangements with edge.', artists: ['Arctic Monkeys', 'Foo Fighters', 'Paramore'], moods: ['Raw', 'Anthemic', 'Restless'], era: '70s riffs through 2000s alt-rock urgency', tiles: [{ name: 'Rock', emoji: '\uD83C\uDFB8', bpm: 120, rhythm: 'Rock', instruments: ['Electric Guitar', 'Standard Drum Kit', 'Bass Guitar'] }, { name: 'Hard Rock', emoji: '\uD83E\uDD18', bpm: 140, rhythm: 'Hard Rock', instruments: ['Electric Guitar', 'Standard Drum Kit', 'Bass Guitar'] }, { name: 'Punk', emoji: '\u26A1', bpm: 180, rhythm: 'Rock', instruments: ['Electric Guitar', 'Standard Drum Kit', 'Bass Guitar', 'Lead Vocals'] }, { name: 'Metal', emoji: '\uD83D\uDC80', bpm: 160, rhythm: 'Rock', instruments: ['Electric Guitar', 'Standard Drum Kit', 'Bass Guitar'] }, { name: 'Grunge', emoji: '\uD83C\uDF27\uFE0F', bpm: 100, rhythm: 'Rock', instruments: ['Electric Guitar', 'Standard Drum Kit', 'Bass Guitar', 'Lead Vocals'] }] },
  { id: 'soul-jazz', label: 'SOUL / JAZZ', color: '#8b5cf6', summary: 'Expressive harmony, groove depth, and human warmth anchored by feel.', artists: ['Amy Winehouse', 'Anderson .Paak', 'Esperanza Spalding'], moods: ['Warm', 'Playful', 'Intimate'], era: 'Timeless heritage with modern neo-soul finesse', tiles: [{ name: 'Jazz', emoji: '\uD83C\uDFB7', bpm: 165, rhythm: 'Jazz Swing', instruments: ['Saxophone', 'Piano', 'Double Bass', 'Standard Drum Kit'] }, { name: 'Blues', emoji: '\uD83C\uDFB5', bpm: 75, rhythm: 'Blues', instruments: ['Electric Guitar', 'Piano', 'Standard Drum Kit'] }, { name: 'Soul', emoji: '\u2764\uFE0F', bpm: 80, rhythm: 'Funk', instruments: ['Rhodes', 'Lead Vocals', 'Backing Vocals'] }, { name: 'Funk', emoji: '\uD83D\uDD7A', bpm: 105, rhythm: 'Funk', instruments: ['Electric Guitar', 'Standard Drum Kit', 'Bass Guitar', 'Rhodes'] }, { name: 'Gospel', emoji: '\uD83D\uDE4F', bpm: 85, rhythm: 'Blues', instruments: ['Piano', 'Choir', 'Lead Vocals'] }] },
  { id: 'world', label: 'WORLD', color: '#14b8a6', summary: 'Regional rhythms and acoustic character blended with strong cultural signatures.', artists: ['Buena Vista Social Club', 'Rosalía', 'Fela Kuti'], moods: ['Organic', 'Sunlit', 'Transportive'], era: 'Tradition-informed grooves with global-pop openness', tiles: [{ name: 'Reggae', emoji: '\uD83C\uDF34', bpm: 75, rhythm: 'Reggae', instruments: ['Electric Guitar', 'Standard Drum Kit', 'Bass Guitar'] }, { name: 'Samba', emoji: '\uD83E\uDD41', bpm: 100, rhythm: 'Samba', instruments: ['Latin Percussion', 'Standard Drum Kit'] }, { name: 'Bossa Nova', emoji: '\uD83C\uDFB8', bpm: 130, rhythm: 'Bossa Nova', instruments: ['Acoustic Guitar', 'Double Bass'] }, { name: 'Flamenco', emoji: '\uD83D\uDC83', bpm: 120, rhythm: 'Flamenco', instruments: ['Acoustic Guitar', 'Latin Percussion'] }, { name: 'Tango', emoji: '\uD83C\uDF39', bpm: 120, rhythm: 'Tango', instruments: ['Violin', 'Piano', 'Double Bass'] }] },
  { id: 'pop', label: 'POP', color: '#f59e0b', summary: 'Direct hooks, polished toplines, and wide-audience accessibility.', artists: ['Dua Lipa', 'The Weeknd', 'Caroline Polachek'], moods: ['Bright', 'Catchy', 'Cinematic'], era: '80s sheen to current chart-ready production', tiles: [{ name: 'Pop', emoji: '\u2B50', bpm: 120, rhythm: 'Disco', instruments: ['Synthesizer', 'Electronic Kit', 'Lead Vocals', 'Backing Vocals'] }, { name: 'Indie Pop', emoji: '\uD83C\uDF1F', bpm: 110, rhythm: 'Rock', instruments: ['Acoustic Guitar', 'Electronic Kit', 'Lead Vocals'] }, { name: 'K-Pop', emoji: '\u2728', bpm: 128, rhythm: 'Electronic (4/4)', instruments: ['Synthesizer', 'Electronic Kit', 'Lead Vocals', 'Backing Vocals'] }, { name: 'Synth-Pop', emoji: '\uD83C\uDFB9', bpm: 120, rhythm: 'Disco', instruments: ['Synthesizer', 'Sampler', 'Lead Vocals'] }] },
  { id: 'classical', label: 'CLASSIQUE', color: '#6366f1', summary: 'Composed dynamics, orchestral detail, and cinematic movement over groove-first writing.', artists: ['Max Richter', 'Ólafur Arnalds', 'Hans Zimmer'], moods: ['Elegant', 'Expansive', 'Reflective'], era: 'Classical foundations with modern soundtrack sensibility', tiles: [{ name: 'Orchestral', emoji: '\uD83C\uDFBB', bpm: 100, rhythm: 'Waltz', instruments: ['Violin', 'Viola', 'Cello', 'French Horn', 'Trumpet'] }, { name: 'Baroque', emoji: '\uD83C\uDFBC', bpm: 120, rhythm: 'Waltz', instruments: ['Violin', 'Cello', 'Organ', 'Flute'] }, { name: 'Contemporary', emoji: '\uD83C\uDFB5', bpm: 80, rhythm: 'Waltz', instruments: ['Grand Piano', 'Violin', 'Cello'] }] },
];

function GBPanel({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`lcars-gb-panel ${className}`} style={style}>{children}</div>;
}

interface Props {
  genre: string; setGenre: (v: string) => void;
  tempo: string; setTempo: (v: string) => void;
  instrumentation: string; setInstrumentation: (v: string) => void;
  rhythm: string; setRhythm: (v: string) => void;
  narrative: string; setNarrative: (v: string) => void;
}

export function MusicalParamsPanel({ genre, setGenre, tempo, setTempo, instrumentation, setInstrumentation, rhythm, setRhythm, narrative, setNarrative }: Props) {
  const { t } = useTranslation();
  const m = t.musical;
  const AMBER_SECONDARY = '#38bdf8';
  const AMBER_MUTED = '#c4b5fd';

  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);
  const [selectedVibeTile, setSelectedVibeTile] = useState<VibeTile | null>(null);
  const [selectedSubStyle, setSelectedSubStyle] = useState<string>('');

  const selectedCategory = selectedVibeTile ? VIBE_CATEGORIES.find(cat => cat.tiles.some(t => t.name === selectedVibeTile.name)) ?? null : null;
  const selectedAccent = selectedCategory?.color ?? AMBER_PRIMARY;
  const genreBlueprint = selectedVibeTile ? (selectedSubStyle ? `${selectedVibeTile.name} / ${selectedSubStyle}` : selectedVibeTile.name) : genre;
  const suggestedSubStyles = selectedVibeTile ? (SUB_STYLES[selectedVibeTile.name] ?? []) : [];

  const bpmValue = parseInt(tempo) || 120;
  const metronome = useMetronome(bpmValue);
  const bpmPercent = Math.min(100, Math.max(0, ((bpmValue - 40) / (220 - 40)) * 100));
  const selectedInstruments = instrumentation ? instrumentation.split(',').map(s => s.trim()).filter(Boolean) : [];

  const toggleInstrument = useCallback((instrument: string) => {
    const current = instrumentation ? instrumentation.split(',').map(s => s.trim()).filter(Boolean) : [];
    const idx = current.indexOf(instrument);
    setInstrumentation(idx >= 0 ? current.filter(i => i !== instrument).join(', ') : [...current, instrument].join(', '));
  }, [instrumentation, setInstrumentation]);

  const handleVibeTileSelect = useCallback((tile: VibeTile) => {
    if (selectedVibeTile?.name === tile.name) { setSelectedVibeTile(null); setSelectedSubStyle(''); return; }
    setSelectedVibeTile(tile); setSelectedSubStyle('');
    setGenre(tile.name);
    setTempo((RHYTHM_BPM[tile.rhythm] ?? tile.bpm).toString());
    setRhythm(tile.rhythm);
    setInstrumentation(tile.instruments.join(', '));
  }, [selectedVibeTile, setGenre, setTempo, setRhythm, setInstrumentation]);

  const handleSubStyleSelect = useCallback((subStyle: string) => {
    const next = selectedSubStyle === subStyle ? '' : subStyle;
    setSelectedSubStyle(next);
    if (selectedVibeTile) setGenre(next ? `${selectedVibeTile.name} / ${next}` : selectedVibeTile.name);
    setRhythm(next || (selectedVibeTile?.rhythm ?? ''));
  }, [selectedSubStyle, selectedVibeTile, setGenre, setRhythm]);

  return (
    <div className="space-y-5">
      {/* Vibe Board */}
      <GBPanel>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4" style={{ color: AMBER_PRIMARY }} />
            <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.vibeBoard ?? 'VIBE BOARD'}</label>
            {selectedVibeTile && (
              <span className="ml-auto flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5" style={{ borderRadius: '8px 2px 8px 2px', background: `${selectedAccent}22`, color: selectedAccent }}>
                {selectedVibeTile.emoji} {genreBlueprint}
              </span>
            )}
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] opacity-70">{m.vibeBoardDescription ?? 'Select your genre to auto-set BPM & instruments'}</p>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
            {VIBE_CATEGORIES.map(category => (
              <div key={category.id}>
                <div className="mb-1.5 flex items-end justify-between gap-3 px-0.5">
                  <div className="text-[9px] font-bold tracking-widest uppercase" style={{ color: category.color }}>{category.label}</div>
                  <p className="text-[10px] text-right leading-4 text-[var(--text-secondary)] opacity-75">{category.summary}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {category.tiles.map(tile => {
                    const isSelected = selectedVibeTile?.name === tile.name;
                    return (
                      <button key={tile.name} onClick={() => handleVibeTileSelect(tile)}
                        className="ux-interactive flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium tracking-wide border"
                        style={isSelected
                          ? { borderRadius: '12px 4px 12px 4px', background: `${category.color}22`, borderColor: category.color, color: category.color, boxShadow: `0 0 8px ${category.color}55`, transform: 'scale(1.04)' }
                          : { borderRadius: '12px 4px 12px 4px', background: 'transparent', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                      >
                        <span>{tile.emoji}</span><span>{tile.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {selectedVibeTile && SUB_STYLES[selectedVibeTile.name] && (
            <div className="pt-2 border-t border-[var(--border-color)]">
              <div className="text-[9px] font-bold tracking-widest uppercase mb-1.5 text-[var(--text-secondary)]">{m.subStyle ?? 'SUB-STYLE'}</div>
              <div className="flex flex-wrap gap-1.5">
                {(SUB_STYLES[selectedVibeTile.name] as string[]).map(sub => (
                  <button key={sub} onClick={() => handleSubStyleSelect(sub)}
                    className="ux-interactive px-2.5 py-1 text-[10px] font-medium tracking-wide border"
                    style={selectedSubStyle === sub
                      ? { borderRadius: '8px 2px 8px 2px', background: selectedAccent, borderColor: selectedAccent, color: '#000' }
                      : { borderRadius: '8px 2px 8px 2px', background: 'transparent', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                  >{sub}</button>
                ))}
              </div>
            </div>
          )}
          {selectedVibeTile && selectedCategory && (
            <div className="grid gap-2 pt-2 border-t border-[var(--border-color)] lg:grid-cols-4 sm:grid-cols-2">
              {[{ title: 'Broad lane', color: selectedCategory.color, content: <><p className="mt-2 text-xs font-semibold text-[var(--text-primary)]">{selectedCategory.label}</p><p className="mt-1 text-[11px] leading-5 text-[var(--text-secondary)]">{selectedCategory.summary}</p></> },
                { title: 'Sub-style clues', color: selectedAccent, content: <div className="mt-2 flex flex-wrap gap-1.5">{suggestedSubStyles.map(sub => <span key={sub} className="px-2 py-1 text-[10px] font-medium" style={{ borderRadius: '999px', background: `${selectedAccent}1c`, color: selectedAccent }}>{sub}</span>)}</div> },
                { title: 'For fans of', color: AMBER_SECONDARY, content: <><p className="mt-2 text-xs font-semibold text-[var(--text-primary)]">{selectedCategory.artists.join(' · ')}</p><p className="mt-1 text-[11px] leading-5 text-[var(--text-secondary)]">Use references to position the song quickly for collaborators and music tools.</p></> },
                { title: 'Mood + era cues', color: selectedCategory.color, content: <><div className="mt-2 flex flex-wrap gap-1.5">{selectedCategory.moods.map(moodTag => <span key={moodTag} className="px-2 py-1 text-[10px] font-medium" style={{ borderRadius: '999px', background: `${selectedCategory.color}1a`, color: selectedCategory.color }}>{moodTag}</span>)}</div><p className="mt-2 text-[11px] leading-5 text-[var(--text-secondary)]">{selectedCategory.era}</p></> },
              ].map(card => (
                <div key={card.title} className="border px-3 py-2.5" style={{ borderRadius: '14px 4px 14px 4px', background: `${card.color}14`, borderColor: `${card.color}40` }}>
                  <div className="text-[9px] font-bold tracking-widest uppercase" style={{ color: card.color }}>{card.title}</div>
                  {card.content}
                </div>
              ))}
            </div>
          )}
        </div>
      </GBPanel>

      {/* Tempo + Instruments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GBPanel>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: AMBER_PRIMARY }} />
                <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.tempo}</label>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center px-2 py-1 text-sm font-mono font-bold border transition-all"
                  style={metronome.isBeat
                    ? { borderRadius: '8px 2px 8px 2px', color: AMBER_PRIMARY, borderColor: AMBER_PRIMARY, boxShadow: `0 0 8px ${AMBER_PRIMARY}88`, background: `${AMBER_PRIMARY}22` }
                    : { borderRadius: '8px 2px 8px 2px', color: 'var(--text-primary)', borderColor: 'var(--border-color)', background: 'transparent' }}>
                  {bpmValue}
                </span>
                <input type="number" value={tempo} onChange={e => setTempo(e.target.value)} min="40" max="220"
                  className="w-16 bg-transparent border border-[var(--border-color)] px-2 py-1 text-sm text-center text-[var(--text-primary)] lcars-glow-focus transition-colors"
                  style={{ borderRadius: '8px 2px 8px 2px' }}
                />
                <span className="text-xs text-[var(--text-secondary)]">BPM</span>
                <button onClick={metronome.toggle}
                  className={`ux-interactive flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium tracking-wide border ${metronome.isPlaying ? 'border-transparent metronome-active' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}
                  style={metronome.isPlaying ? { borderRadius: '10px 3px 10px 3px', background: AMBER_PRIMARY, borderColor: AMBER_PRIMARY, color: '#000' } : { borderRadius: '10px 3px 10px 3px' }}
                >
                  {metronome.isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span className="hidden sm:inline">{m.metronome ?? 'Metronome'}</span>
                </button>
              </div>
            </div>
            <div className="relative h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
              <div className="absolute left-0 top-0 h-full rounded-full transition-all" style={{ width: `${bpmPercent}%`, background: AMBER_PRIMARY }} />
            </div>
            <input type="range" min="40" max="220" value={bpmValue} onChange={e => setTempo(e.target.value)} className="w-full h-2 opacity-0 cursor-pointer -mt-4 relative z-10" />
            <div className="flex flex-wrap gap-1.5">
              {BPM_PRESETS.map(({ label, value }) => (
                <button key={value} onClick={() => setTempo(value)}
                  className={`ux-interactive px-2.5 py-1 text-[10px] font-medium tracking-wide border ${tempo === value ? 'border-transparent' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)]'}`}
                  style={tempo === value ? { borderRadius: '8px 2px 8px 2px', background: AMBER_PRIMARY, borderColor: AMBER_PRIMARY, color: '#000' } : { borderRadius: '8px 2px 8px 2px' }}
                >{label}</button>
              ))}
            </div>
          </div>
        </GBPanel>

        <GBPanel>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Guitar className="w-4 h-4" style={{ color: AMBER_PRIMARY }} />
              <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.instruments ?? 'INSTRUMENTS'}</label>
              {selectedInstruments.length > 0 && <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5" style={{ borderRadius: '6px 2px 6px 2px', background: `${AMBER_PRIMARY}22`, color: AMBER_PRIMARY }}>{selectedInstruments.length}</span>}
            </div>
            <div className="space-y-1.5">
              {INSTRUMENT_FAMILIES.map(family => {
                const isExpanded = expandedFamily === family.label;
                const familySelected = family.instruments.filter(i => selectedInstruments.includes(i));
                return (
                  <div key={family.label}>
                    <button onClick={() => setExpandedFamily(isExpanded ? null : family.label)}
                      className="ux-interactive w-full flex items-center gap-2 px-2.5 py-1.5 text-[10px] font-medium tracking-wide border text-left"
                      style={familySelected.length > 0 ? { borderRadius: '10px 3px 10px 3px', background: `${AMBER_PRIMARY}1a`, borderColor: `${AMBER_PRIMARY}55`, color: AMBER_PRIMARY } : { borderRadius: '10px 3px 10px 3px', background: 'transparent', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                    >
                      <span>{family.emoji}</span><span>{family.label}</span>
                      {familySelected.length > 0 && <span className="ml-1 text-[9px] font-bold px-1" style={{ borderRadius: '4px', background: AMBER_PRIMARY, color: '#000' }}>{familySelected.length}</span>}
                      <span className="ml-auto opacity-50">{isExpanded ? '▾' : '▸'}</span>
                    </button>
                    {isExpanded && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5 pl-2">
                        {family.instruments.map(instrument => {
                          const sel = selectedInstruments.includes(instrument);
                          return (
                            <button key={instrument} onClick={() => toggleInstrument(instrument)}
                              className={`ux-interactive px-2.5 py-1 text-[10px] font-medium tracking-wide border ${sel ? 'border-transparent' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)]'}`}
                              style={sel ? { borderRadius: '8px 2px 8px 2px', background: `${AMBER_PRIMARY}33`, borderColor: AMBER_PRIMARY, color: AMBER_PRIMARY } : { borderRadius: '8px 2px 8px 2px' }}
                            >{instrument}</button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <textarea value={instrumentation} onChange={e => setInstrumentation(e.target.value)} placeholder={m.instrumentationPlaceholder} rows={2}
              className="w-full bg-transparent border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] lcars-glow-focus transition-colors resize-none"
              style={{ borderRadius: '10px 3px 10px 3px' }}
            />
          </div>
        </GBPanel>
      </div>

      {/* Rhythm + Narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GBPanel>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Drum className="w-4 h-4" style={{ color: AMBER_PRIMARY }} />
              <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.rhythm}</label>
            </div>
            <textarea value={rhythm} onChange={e => setRhythm(e.target.value)} placeholder={m.rhythmPlaceholder} rows={3}
              className="w-full bg-transparent border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] lcars-glow-focus transition-colors resize-none"
              style={{ borderRadius: '10px 3px 10px 3px' }}
            />
          </div>
        </GBPanel>
        <GBPanel>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ListMusic className="w-4 h-4" style={{ color: AMBER_PRIMARY }} />
              <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.narrative}</label>
            </div>
            <textarea value={narrative} onChange={e => setNarrative(e.target.value)} placeholder={m.narrativePlaceholder} rows={3}
              className="w-full bg-transparent border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] lcars-glow-focus transition-colors resize-none"
              style={{ borderRadius: '10px 3px 10px 3px' }}
            />
          </div>
        </GBPanel>
      </div>
    </div>
  );
}
