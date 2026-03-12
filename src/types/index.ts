export interface Line {
  id: string;
  text: string;
  rhymingSyllables: string;
  rhyme: string;
  syllables: number;
  concept: string;
  isManual?: boolean;
  /** True when this line is a pure production/performance meta-instruction, e.g. [Guitar solo] */
  isMeta?: boolean;
}

export interface Section {
  id: string;
  name: string;
  lines: Line[];
  rhymeScheme?: string;
  targetSyllables?: number;
  mood?: string;
  preInstructions?: string[];
  postInstructions?: string[];
  language?: string;
}

export interface SongVersion {
  id: string;
  timestamp: number;
  song: Section[];
  structure: string[];
  title: string;
  titleOrigin: 'user' | 'ai';
  topic: string;
  mood: string;
  name: string;
}
