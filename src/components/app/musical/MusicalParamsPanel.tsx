import React, { useState, useCallback } from 'react';
import { Activity, Guitar, Drum, ListMusic, Play, Pause, Music, ChevronDown } from 'lucide-react';
import { Tooltip as FluentTooltip } from '@fluentui/react-components';
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
  { emoji: '\uD83C\uDFBA', label: 'Brass',       instruments: ['Trumpet', 'Trombone', 'French Horn', 'Tuba', 'Cornet'] },
  { emoji: '\uD83C\uDFBB', label: 'Strings',     instruments: ['Violin', 'Alto Violin', 'Viola', 'Cello', 'Double Bass', 'Harp', 'Mandolin'] },
  { emoji: '\uD83C\uDFB8', label: 'Guitar',      instruments: ['Acoustic Guitar', 'Electric Guitar', 'Bass Guitar', 'Twelve-String Guitar'] },
  { emoji: '\uD83C\uDFB9', label: 'Keys',        instruments: ['Grand Piano', 'Piano', 'Rhodes', 'Organ', 'Synth', 'Celesta'] },
  { emoji: '\uD83C\uDFB7', label: 'Woodwinds',   instruments: ['Saxophone', 'Flute', 'Clarinet', 'Oboe', 'Piccolo', 'Tin Whistle'] },
  { emoji: '\uD83E\uDD41', label: 'Percussion',  instruments: ['Standard Drum Kit', 'Afrobeat Kit', 'Electronic Kit', 'Orchestral Percussion', 'Latin Percussion', 'Tribal Percussion', 'Tambourine', 'Guiro', 'Triangle', 'Shaker', 'Cowbell'] },
  { emoji: '\uD83C\uDFA4', label: 'Vocals',      instruments: ['Lead Vocals', 'Backing Vocals', 'Choir'] },
  { emoji: '\uD83C\uDF9B\uFE0F', label: 'Electronic', instruments: ['Synthesizer', 'Sampler', '808', 'TR-909', 'Moog Bass', 'Arp Synth'] },
  { emoji: '\uD83E\uDE97', label: 'Folk / Ethnic', instruments: ['Alto Harmonica', 'Kazoo', 'Jaw Harp', 'Pan Flute', 'Tribal Percussion', 'Bouzouki', 'Sitar', 'Duduk', 'Bodhrán', 'Whistle'] },
];

interface VibeTile { name: string; emoji: string; bpm: number; rhythm: string; instruments: string[] }
interface VibeCategory {
  id: string; label: string; color: string; summary: string;
  artists: string[]; moods: string[]; era: string; tiles: VibeTile[];
}

export function buildGenreTooltip(summary: string, tile: { name: string; bpm: number; rhythm: string; instruments: string[] }) {
  return `${tile.name}\n${summary}\n${tile.bpm} BPM · ${tile.rhythm}\n${tile.instruments.join(', ')}`;
}

interface SubStyleEntry {
  name: string;
  description: string;
  bpmOffset: number;
  mood: string;
  signature: string;
  addInstruments: string[];
}

const SUB_STYLE_DATA: Record<string, SubStyleEntry[]> = {
  'Rock': [
    { name: 'Classic', description: 'Big riffs, driving rhythm, arena-ready dynamics.', bpmOffset: 0, mood: 'Anthemic', signature: 'Power chords, verse-chorus-solo arc', addInstruments: ['Lead Vocals'] },
    { name: 'Indie', description: 'Lo-fi warmth, jangly guitars, understated vocals.', bpmOffset: -10, mood: 'Introspective', signature: 'Clean tones, reverb-drenched hooks', addInstruments: ['Acoustic Guitar'] },
    { name: 'Psychedelic', description: 'Swirling textures, phased effects, consciousness-expanding sound.', bpmOffset: -20, mood: 'Dreamy', signature: 'Tape delay, backward guitars, sitar accents', addInstruments: ['Synthesizer', 'Sitar'] },
    { name: 'Prog', description: 'Complex time signatures, extended compositions, technical mastery.', bpmOffset: +10, mood: 'Epic', signature: 'Odd meters, synth layers, dynamic shifts', addInstruments: ['Synthesizer', 'Grand Piano'] },
    { name: 'Alternative', description: 'Genre-fluid experimentation, angular melodies, raw emotion.', bpmOffset: -5, mood: 'Restless', signature: 'Dissonant textures, dynamic contrast', addInstruments: [] },
  ],
  'Jazz': [
    { name: 'Swing', description: 'Bouncy shuffle feel, big-band punch, infectious groove.', bpmOffset: +15, mood: 'Joyful', signature: 'Walking bass, brass stabs, swing feel', addInstruments: ['Trumpet', 'Trombone'] },
    { name: 'Bebop', description: 'Virtuosic improv, rapid harmonic movement, intimate combo.', bpmOffset: +40, mood: 'Intense', signature: 'Fast unison heads, complex changes', addInstruments: ['Trumpet'] },
    { name: 'Fusion', description: 'Electric jazz meets rock energy, groove-forward sophistication.', bpmOffset: -15, mood: 'Driving', signature: 'Distorted keys, slap bass, polyrhythm', addInstruments: ['Electric Guitar', 'Synthesizer'] },
    { name: 'Smooth', description: 'Polished production, accessible melody, velvet atmosphere.', bpmOffset: -30, mood: 'Relaxed', signature: 'Soprano sax lead, lush pads', addInstruments: ['Synthesizer'] },
    { name: 'Latin', description: 'Afro-Cuban clave patterns, percussive heat, harmonic color.', bpmOffset: -5, mood: 'Fiery', signature: 'Montuno piano, conga patterns, horn riffs', addInstruments: ['Latin Percussion', 'Trumpet'] },
  ],
  'Hip-Hop': [
    { name: 'Trap', description: 'Sub-heavy 808s, hi-hat rolls, dark atmospheric pads.', bpmOffset: -20, mood: 'Menacing', signature: 'Triplet hi-hats, pitched 808, sparse vocals', addInstruments: ['Synthesizer'] },
    { name: 'Boom Bap', description: 'Punchy drums, sample-based loops, lyric-forward production.', bpmOffset: 0, mood: 'Gritty', signature: 'Chopped samples, snappy snare, vinyl crackle', addInstruments: [] },
    { name: 'Lo-Fi', description: 'Dusty textures, detuned samples, beatmaking as meditation.', bpmOffset: -15, mood: 'Chill', signature: 'Vinyl hiss, jazz piano chops, soft kicks', addInstruments: ['Rhodes'] },
    { name: 'Cloud Rap', description: 'Ethereal pads, reverb-washed vocals, dreamy slow-motion feel.', bpmOffset: -25, mood: 'Ethereal', signature: 'Spacious reverb, airy synths, Auto-Tune', addInstruments: ['Synthesizer'] },
    { name: 'Drill', description: 'Sliding 808s, ominous melodies, relentless rhythmic energy.', bpmOffset: +50, mood: 'Aggressive', signature: 'Sliding bass, dark piano loops, rapid hi-hats', addInstruments: ['Grand Piano'] },
  ],
  'Pop': [
    { name: 'Indie Pop', description: 'Hand-crafted charm, quirky arrangements, authentic texture.', bpmOffset: -10, mood: 'Whimsical', signature: 'Ukulele/glockenspiel accents, lo-fi sheen', addInstruments: ['Acoustic Guitar'] },
    { name: 'K-Pop', description: 'Maximalist production, genre-blending sections, precision choreography sound.', bpmOffset: +8, mood: 'Explosive', signature: 'Beat drops, rap verses, key changes', addInstruments: ['Sampler'] },
    { name: 'Synth-Pop', description: 'Analog synth warmth, retro pulse, neon-lit atmosphere.', bpmOffset: 0, mood: 'Nostalgic', signature: 'Arpeggiator lines, gated reverb drums', addInstruments: ['Arp Synth'] },
    { name: 'Dance Pop', description: 'Four-on-the-floor energy, euphoric drops, club-radio crossover.', bpmOffset: +8, mood: 'Euphoric', signature: 'Build-drop-chorus, side-chain compression', addInstruments: ['Sampler', 'TR-909'] },
  ],
  'R&B': [
    { name: 'Neo Soul', description: 'Organic warmth, jazzy chords, conscious lyricism.', bpmOffset: -10, mood: 'Warm', signature: 'Rhodes chords, live bass, airy vocals', addInstruments: ['Rhodes'] },
    { name: 'Contemporary', description: 'Polished production, vocal runs, crossover-ready sound.', bpmOffset: 0, mood: 'Smooth', signature: 'Layered harmonies, punchy kicks, synth bass', addInstruments: ['Synthesizer'] },
    { name: 'Future R&B', description: 'Glitchy textures, pitch-shifted vocals, experimental atmospheres.', bpmOffset: -5, mood: 'Otherworldly', signature: 'Granular synthesis, chopped vocals, sub bass', addInstruments: ['Synthesizer', 'Sampler'] },
  ],
  'Metal': [
    { name: 'Heavy', description: 'Chugging riffs, pounding double kicks, wall-of-sound power.', bpmOffset: -10, mood: 'Crushing', signature: 'Palm mutes, power chords, mid-tempo groove', addInstruments: ['Lead Vocals'] },
    { name: 'Death', description: 'Blast beats, guttural vocals, extreme technical precision.', bpmOffset: +30, mood: 'Brutal', signature: 'Tremolo picking, blast beats, growl vocals', addInstruments: [] },
    { name: 'Thrash', description: 'Blazing speed, tight riffing, relentless aggression.', bpmOffset: +20, mood: 'Furious', signature: 'Speed picking, gallop rhythms, rapid fills', addInstruments: [] },
    { name: 'Progressive', description: 'Odd time signatures, long-form structure, melodic sophistication.', bpmOffset: -5, mood: 'Epic', signature: 'Complex arrangements, clean/heavy contrast', addInstruments: ['Synthesizer', 'Grand Piano'] },
  ],
  'Funk': [
    { name: 'Classic', description: 'Tight pocket grooves, horn stabs, call-and-response energy.', bpmOffset: 0, mood: 'Groovy', signature: 'Chicken scratch guitar, slap bass, brass hits', addInstruments: ['Trumpet', 'Trombone'] },
    { name: 'P-Funk', description: 'Cosmic synth layers, deep grooves, psychedelic theatrics.', bpmOffset: -5, mood: 'Cosmic', signature: 'Moog bass, vocal chants, extended jams', addInstruments: ['Moog Bass', 'Synthesizer'] },
    { name: 'Neo-Funk', description: 'Modern production on classic foundations, crossover polish.', bpmOffset: +5, mood: 'Slick', signature: 'Compressed drums, filtered guitars, synth bass', addInstruments: ['Synthesizer'] },
    { name: 'Electro-Funk', description: 'Drum machines meet live bass, robotic vocals, dance floor heat.', bpmOffset: +10, mood: 'Electric', signature: 'TR-808/909, vocoder, side-chain groove', addInstruments: ['TR-909', 'Synthesizer'] },
  ],
  'Reggae': [
    { name: 'Roots', description: 'One-drop rhythm, conscious lyrics, earthy warmth.', bpmOffset: 0, mood: 'Spiritual', signature: 'One-drop drums, organ bubble, horn melodies', addInstruments: ['Organ'] },
    { name: 'Dancehall', description: 'Digital riddims, toasting vocals, high-energy bounce.', bpmOffset: +15, mood: 'Hype', signature: 'Digital drums, singjay flow, bass-heavy mix', addInstruments: ['Electronic Kit', 'Sampler'] },
    { name: 'Dub', description: 'Echo-drenched soundscapes, bass as lead, minimalist deconstruction.', bpmOffset: -10, mood: 'Hypnotic', signature: 'Spring reverb, tape delay, bass drops', addInstruments: ['Synthesizer'] },
  ],
  'Blues': [
    { name: 'Delta', description: 'Raw acoustic slide guitar, field-holler roots, primal emotion.', bpmOffset: -10, mood: 'Raw', signature: 'Slide guitar, fingerpicking, sparse arrangement', addInstruments: ['Acoustic Guitar'] },
    { name: 'Chicago', description: 'Amplified grit, shuffling drums, harmonica wails.', bpmOffset: 0, mood: 'Gritty', signature: 'Amplified harp, shuffle beat, call-response', addInstruments: ['Alto Harmonica'] },
    { name: 'Electric', description: 'Overdriven lead tones, band-driven power, stadium blues.', bpmOffset: +10, mood: 'Fiery', signature: 'Overdriven guitar, strong backbeat, solos', addInstruments: ['Electric Guitar'] },
    { name: 'Texas', description: 'Swinging shuffle, horn-section punch, big-hearted sound.', bpmOffset: +5, mood: 'Soulful', signature: 'Shuffle feel, brass section, call-response', addInstruments: ['Trumpet', 'Saxophone'] },
  ],
  'Electronic': [
    { name: 'House', description: 'Four-on-the-floor kick, warm basslines, diva vocal chops.', bpmOffset: 0, mood: 'Euphoric', signature: 'Steady kick, offbeat hi-hat, filtered loops', addInstruments: ['Sampler'] },
    { name: 'Techno', description: 'Industrial precision, hypnotic loops, warehouse intensity.', bpmOffset: +12, mood: 'Industrial', signature: 'Relentless kick, acid lines, dark pads', addInstruments: [] },
    { name: 'Ambient', description: 'Textural landscapes, slow evolution, immersive space.', bpmOffset: -60, mood: 'Meditative', signature: 'Granular textures, field recordings, drones', addInstruments: [] },
    { name: 'IDM', description: 'Glitchy rhythms, cerebral sound design, avant-garde electronic.', bpmOffset: -10, mood: 'Cerebral', signature: 'Broken beats, complex modulation, micro-edits', addInstruments: ['Sampler'] },
  ],
  'Synthwave': [
    { name: 'Retrowave', description: 'Neon nostalgia, pulsing arpeggios, 80s sunset chase.', bpmOffset: 0, mood: 'Nostalgic', signature: 'Arp sequences, gated snare, analog warmth', addInstruments: ['Arp Synth'] },
    { name: 'Darksynth', description: 'Horror-tinged aggression, distorted synths, cyberpunk menace.', bpmOffset: +10, mood: 'Menacing', signature: 'Distorted leads, industrial drums, evil bass', addInstruments: ['Moog Bass'] },
    { name: 'Chillwave', description: 'Hazy lo-fi wash, detuned tapes, blissed-out warmth.', bpmOffset: -20, mood: 'Blissful', signature: 'Tape warble, soft pads, reverb-heavy mix', addInstruments: [] },
  ],
  'Soul': [
    { name: 'Classic', description: 'Motown-era elegance, orchestral sweetness, timeless vocal power.', bpmOffset: 0, mood: 'Elegant', signature: 'String arrangements, tight rhythm section', addInstruments: ['Violin', 'Backing Vocals'] },
    { name: 'Neo Soul', description: 'Jazz-inflected grooves, live instrumentation, conscious artistry.', bpmOffset: -5, mood: 'Warm', signature: 'Rhodes keys, live drums, breathy vocals', addInstruments: ['Rhodes'] },
    { name: 'Northern Soul', description: 'Uptempo Motown energy, dance-floor urgency, rare-groove fire.', bpmOffset: +15, mood: 'Energetic', signature: 'Driving backbeat, brass stabs, stomping floor', addInstruments: ['Trumpet', 'Tambourine'] },
  ],
  'Afrobeat': [
    { name: 'Afrobeats', description: 'Modern crossover pop, infectious log-drum patterns, global appeal.', bpmOffset: +8, mood: 'Festive', signature: 'Log drums, guitar licks, sing-along hooks', addInstruments: ['Sampler'] },
    { name: 'Highlife', description: 'Jazzy guitar lines, swinging horns, West African elegance.', bpmOffset: +5, mood: 'Joyful', signature: 'Clean guitar arpeggios, brass, palm-wine feel', addInstruments: ['Trumpet', 'Acoustic Guitar'] },
    { name: 'Jùjú', description: 'Talking drum conversations, layered percussion, Yoruba praise-song tradition.', bpmOffset: 0, mood: 'Celebratory', signature: 'Talking drum, layered percussion, call-response', addInstruments: ['Tribal Percussion'] },
  ],
};

const SUB_STYLES: Record<string, string[]> = Object.fromEntries(
  Object.entries(SUB_STYLE_DATA).map(([genre, entries]) => [genre, entries.map(e => e.name)])
);

const TILE_SUBSTYLE_FALLBACK: Record<string, string> = {
  'House': 'Electronic',
  'Techno': 'Electronic',
  'Drum & Bass': 'Electronic',
  'Trap': 'Hip-Hop',
  'Hard Rock': 'Rock',
  'Punk': 'Rock',
  'Grunge': 'Rock',
  'Gospel': 'Soul',
  'Indie Pop': 'Pop',
  'K-Pop': 'Pop',
  'Synth-Pop': 'Pop',
  'Bossa Nova': 'Jazz',
  'Tango': 'Jazz',
  'Reggaeton': 'Afrobeat',
};

function getSubStyleEntries(tileName: string): SubStyleEntry[] {
  return SUB_STYLE_DATA[tileName] ?? SUB_STYLE_DATA[TILE_SUBSTYLE_FALLBACK[tileName] ?? ''] ?? [];
}

function getSubStyleNames(tileName: string): string[] {
  return getSubStyleEntries(tileName).map(e => e.name);
}

const RHYTHM_SUGGESTIONS = [
  'Steady 4/4 pulse', 'Syncopated groove', 'Half-time feel', 'Shuffle',
  'Swing', 'Double-time', 'Triplet feel', 'Polyrhythmic',
  'Laid-back groove', 'Driving pulse', 'Breakbeat', 'Waltz 3/4',
];

const NARRATIVE_SUGGESTIONS = [
  'Cinematic build', 'Melancholic introspection', 'Anthemic release',
  'Dark & moody', 'Euphoric energy', 'Nostalgic warmth', 'Aggressive intensity',
  'Dreamy atmosphere', 'Intimate & raw', 'Epic journey', 'Playful & upbeat',
  'Haunting & ethereal',
];

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
  onWorkflowStepComplete?: (step: number) => void;
}

export function MusicalParamsPanel({ genre, setGenre, tempo, setTempo, instrumentation, setInstrumentation, rhythm, setRhythm, narrative, setNarrative, onWorkflowStepComplete }: Props) {
  const { t } = useTranslation();
  const m = t.musical;
  const AMBER_SECONDARY = '#38bdf8';
  const AMBER_MUTED = '#c4b5fd';

  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);
  const [selectedVibeTile, setSelectedVibeTile] = useState<VibeTile | null>(null);
  const [selectedSubStyle, setSelectedSubStyle] = useState<string>('');
  const [isRhythmDropdownOpen, setIsRhythmDropdownOpen] = useState(false);
  const [isNarrativeDropdownOpen, setIsNarrativeDropdownOpen] = useState(false);

  const selectedCategory = selectedVibeTile ? VIBE_CATEGORIES.find(cat => cat.tiles.some(t => t.name === selectedVibeTile.name)) ?? null : null;
  const selectedAccent = selectedCategory?.color ?? AMBER_PRIMARY;
  const genreBlueprint = selectedVibeTile ? (selectedSubStyle ? `${selectedVibeTile.name} / ${selectedSubStyle}` : selectedVibeTile.name) : genre;
  const suggestedSubStyles = selectedVibeTile ? getSubStyleNames(selectedVibeTile.name) : [];
  const selectedSubStyleEntry = selectedVibeTile && selectedSubStyle
    ? getSubStyleEntries(selectedVibeTile.name).find(e => e.name === selectedSubStyle) ?? null
    : null;

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
    // Step 1 complete: Genre selected
    onWorkflowStepComplete?.(1);
  }, [selectedVibeTile, setGenre, setTempo, setRhythm, setInstrumentation, onWorkflowStepComplete]);

  const handleSubStyleSelect = useCallback((subStyle: string) => {
    const next = selectedSubStyle === subStyle ? '' : subStyle;
    setSelectedSubStyle(next);
    if (selectedVibeTile) setGenre(next ? `${selectedVibeTile.name} / ${next}` : selectedVibeTile.name);
    setRhythm(next || (selectedVibeTile?.rhythm ?? ''));
    if (next && selectedVibeTile) {
      const entry = getSubStyleEntries(selectedVibeTile.name).find(e => e.name === next);
      if (entry) {
        const baseBpm = RHYTHM_BPM[selectedVibeTile.rhythm] ?? selectedVibeTile.bpm;
        setTempo(Math.max(40, Math.min(220, baseBpm + entry.bpmOffset)).toString());
        if (entry.addInstruments.length > 0) {
          const current = selectedVibeTile.instruments;
          const merged = [...current, ...entry.addInstruments.filter(i => !current.includes(i))];
          setInstrumentation(merged.join(', '));
        }
      }
    } else if (!next && selectedVibeTile) {
      setTempo((RHYTHM_BPM[selectedVibeTile.rhythm] ?? selectedVibeTile.bpm).toString());
      setInstrumentation(selectedVibeTile.instruments.join(', '));
    }
    // Step 2 complete: Sub-style selected
    if (next) onWorkflowStepComplete?.(2);
  }, [selectedSubStyle, selectedVibeTile, setGenre, setRhythm, setTempo, setInstrumentation, onWorkflowStepComplete]);

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
                  <div className="mb-1.5 space-y-1 px-0.5">
                    <div className="text-[9px] font-bold tracking-widest uppercase" style={{ color: category.color }}>{category.label}</div>
                    <p className="text-[10px] leading-4 text-[var(--text-secondary)] opacity-75">{category.summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {category.tiles.map(tile => {
                      const isSelected = selectedVibeTile?.name === tile.name;
                      return (
                        <FluentTooltip
                          key={tile.name}
                          content={<span style={{ display: 'block', maxWidth: '18rem', whiteSpace: 'pre-line' }}>{buildGenreTooltip(category.summary, tile)}</span>}
                          relationship="description"
                          positioning={{ position: 'above', align: 'center' }}
                        >
                          <button onClick={() => handleVibeTileSelect(tile)}
                            className="ux-interactive flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium tracking-wide border"
                            style={isSelected
                              ? { borderRadius: '12px 4px 12px 4px', background: `${category.color}22`, borderColor: category.color, color: category.color, boxShadow: `0 0 8px ${category.color}55`, transform: 'scale(1.04)' }
                              : { borderRadius: '12px 4px 12px 4px', background: 'transparent', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                          >
                            <span>{tile.emoji}</span><span>{tile.name}</span>
                          </button>
                        </FluentTooltip>
                      );
                    })}
                  </div>
              </div>
            ))}
          </div>
          {selectedVibeTile && getSubStyleNames(selectedVibeTile.name).length > 0 && (
            <div className="pt-2 border-t border-[var(--border-color)]">
              <div className="text-[9px] font-bold tracking-widest uppercase mb-1.5 text-[var(--text-secondary)]">{m.subStyle ?? 'SUB-STYLE'}</div>
              <div className="flex flex-wrap gap-1.5">
                {getSubStyleEntries(selectedVibeTile.name).map(entry => (
                  <FluentTooltip
                    key={entry.name}
                    content={<span style={{ display: 'block', maxWidth: '18rem', whiteSpace: 'pre-line' }}>{`${entry.name}\n${entry.description}\nMood: ${entry.mood} · BPM ${entry.bpmOffset >= 0 ? '+' : ''}${entry.bpmOffset}`}</span>}
                    relationship="description"
                    positioning={{ position: 'above', align: 'center' }}
                  >
                    <button onClick={() => handleSubStyleSelect(entry.name)}
                      className="ux-interactive px-2.5 py-1 text-[10px] font-medium tracking-wide border"
                      style={selectedSubStyle === entry.name
                        ? { borderRadius: '8px 2px 8px 2px', background: selectedAccent, borderColor: selectedAccent, color: '#000' }
                        : { borderRadius: '8px 2px 8px 2px', background: 'transparent', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                    >{entry.name}</button>
                  </FluentTooltip>
                ))}
              </div>
              {selectedSubStyleEntry && (
                <div className="mt-2 border px-3 py-2.5 space-y-2" style={{ borderRadius: '14px 4px 14px 4px', background: `${selectedAccent}14`, borderColor: `${selectedAccent}40` }}>
                  <div className="flex items-center gap-2">
                    <div className="text-[9px] font-bold tracking-widest uppercase" style={{ color: selectedAccent }}>NICHE PROFILE</div>
                    <span className="ml-auto px-2 py-0.5 text-[9px] font-bold tracking-wide" style={{ borderRadius: '999px', background: `${selectedAccent}22`, color: selectedAccent }}>{selectedSubStyleEntry.mood}</span>
                  </div>
                  <p className="text-[11px] leading-5 text-[var(--text-secondary)]">{selectedSubStyleEntry.description}</p>
                  <div className="space-y-1">
                    <div className="text-[9px] font-bold tracking-widest uppercase text-[var(--text-secondary)] opacity-70">SONIC SIGNATURE</div>
                    <p className="text-[10px] leading-4 italic" style={{ color: selectedAccent }}>{selectedSubStyleEntry.signature}</p>
                  </div>
                  {selectedSubStyleEntry.addInstruments.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {selectedSubStyleEntry.addInstruments.map(inst => (
                        <span key={inst} className="px-1.5 py-0.5 text-[9px] font-medium" style={{ borderRadius: '6px 2px 6px 2px', background: `${selectedAccent}1a`, color: selectedAccent }}>+ {inst}</span>
                      ))}
                    </div>
                  )}
                  {selectedSubStyleEntry.bpmOffset !== 0 && (
                    <div className="text-[10px] font-medium" style={{ color: AMBER_SECONDARY }}>
                      BPM {selectedSubStyleEntry.bpmOffset > 0 ? '↑' : '↓'} {Math.abs(selectedSubStyleEntry.bpmOffset)} from base
                    </div>
                  )}
                </div>
              )}
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
            {/* Rhythm & Groove */}
            <div className="pt-3 border-t border-[var(--border-color)] space-y-2">
              <div className="flex items-center gap-2">
                <Drum className="w-3.5 h-3.5" style={{ color: AMBER_PRIMARY }} />
                <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.rhythm}</label>
                <button
                  onClick={() => setIsRhythmDropdownOpen(!isRhythmDropdownOpen)}
                  className="ml-auto p-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isRhythmDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {isRhythmDropdownOpen && (
                <div className="flex flex-wrap gap-1.5">
                  {RHYTHM_SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => { setRhythm(rhythm ? `${rhythm}, ${s}` : s); setIsRhythmDropdownOpen(false); }}
                      className="ux-interactive px-2 py-0.5 text-[9px] font-medium tracking-wide border bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent-color)]/40 hover:text-[var(--text-primary)] transition-colors"
                      style={{ borderRadius: '8px 2px 8px 2px' }}
                    >{s}</button>
                  ))}
                </div>
              )}
              <textarea value={rhythm} onChange={e => setRhythm(e.target.value)} placeholder={m.rhythmPlaceholder} rows={2}
                className="w-full bg-transparent border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] lcars-glow-focus transition-colors resize-none"
                style={{ borderRadius: '10px 3px 10px 3px' }}
              />
            </div>
            {/* Narrative / Vibe */}
            <div className="pt-3 border-t border-[var(--border-color)] space-y-2">
              <div className="flex items-center gap-2">
                <ListMusic className="w-3.5 h-3.5" style={{ color: AMBER_PRIMARY }} />
                <label className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.narrative}</label>
                <button
                  onClick={() => setIsNarrativeDropdownOpen(!isNarrativeDropdownOpen)}
                  className="ml-auto p-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isNarrativeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {isNarrativeDropdownOpen && (
                <div className="flex flex-wrap gap-1.5">
                  {NARRATIVE_SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => { setNarrative(narrative ? `${narrative}, ${s}` : s); setIsNarrativeDropdownOpen(false); }}
                      className="ux-interactive px-2 py-0.5 text-[9px] font-medium tracking-wide border bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent-color)]/40 hover:text-[var(--text-primary)] transition-colors"
                      style={{ borderRadius: '8px 2px 8px 2px' }}
                    >{s}</button>
                  ))}
                </div>
              )}
              <textarea value={narrative} onChange={e => setNarrative(e.target.value)} placeholder={m.narrativePlaceholder} rows={2}
                className="w-full bg-transparent border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] lcars-glow-focus transition-colors resize-none"
                style={{ borderRadius: '10px 3px 10px 3px' }}
              />
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
    </div>
  );
}
