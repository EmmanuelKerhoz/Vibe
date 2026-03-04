export const DEFAULT_STRUCTURE = ['Intro', 'Verse 1', 'Chorus', 'Verse 2', 'Chorus', 'Bridge', 'Outro'];

export const MUSICAL_INSTRUCTIONS = [
  "Harmonica riff",
  "Guitar Solo",
  "Choir answer",
  "Riff",
  "Solo",
  "Vocaloid",
  "Bass drop",
  "Drum fill",
  "Acapella",
  "Beat drop",
  "Synth lead",
  "Piano arpeggio",
  "Strings swell",
  "Brass stab",
  "Modulation",
  "Tempo change",
  "Fade out",
  "Crescendo",
  "Whispered",
  "Shouted"
];

export const getSectionColor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('pre-chorus') || n.includes('prechorus')) return 'bg-orange-500/10 border-orange-500/20 text-orange-500';
  if (n.includes('chorus')) return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
  if (n.includes('verse')) return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
  if (n.includes('bridge') || n.includes('breakdown')) return 'bg-purple-500/10 border-purple-500/20 text-purple-500';
  if (n.includes('intro') || n.includes('outro')) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
  return 'bg-zinc-800/50 border-white/10 text-zinc-400';
};

export const getSectionTextColor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('pre-chorus') || n.includes('prechorus')) return 'text-orange-500';
  if (n.includes('chorus')) return 'text-amber-500';
  if (n.includes('verse')) return 'text-blue-500';
  if (n.includes('bridge') || n.includes('breakdown')) return 'text-purple-500';
  if (n.includes('intro') || n.includes('outro')) return 'text-emerald-500';
  return 'text-zinc-600 dark:text-zinc-400';
};

export const getSectionDotColor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('pre-chorus') || n.includes('prechorus')) return 'bg-orange-500';
  if (n.includes('chorus')) return 'bg-amber-500';
  if (n.includes('verse')) return 'bg-blue-500';
  if (n.includes('bridge')) return 'bg-purple-500';
  if (n.includes('intro') || n.includes('outro')) return 'bg-emerald-500';
  return 'bg-zinc-500';
};

export const getRhymeColor = (rhyme: string) => {
  const r = rhyme.toUpperCase();
  if (r === 'A') return 'bg-blue-500/15 text-blue-500 border-blue-500/20';
  if (r === 'B') return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20';
  if (r === 'C') return 'bg-amber-500/15 text-amber-500 border-amber-500/20';
  if (r === 'D') return 'bg-purple-500/15 text-purple-500 border-purple-500/20';
  if (r === 'E') return 'bg-pink-500/15 text-pink-500 border-pink-500/20';
  if (r === 'F') return 'bg-cyan-500/15 text-cyan-500 border-cyan-500/20';
  if (r === 'G') return 'bg-rose-500/15 text-rose-500 border-rose-500/20';
  if (r === 'H') return 'bg-indigo-500/15 text-indigo-500 border-indigo-500/20';
  return 'bg-white/5 text-zinc-500 border-white/10';
};
