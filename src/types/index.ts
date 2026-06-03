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
  /** User-intended rhyme pattern (e.g. "AABB"). Tracked in UNDO/REDO history. */
  targetSchema?: string;
  /** Incremented each time this section is modified (manual or AI). Used to detect stale sections on reload. */
  version?: number;
}

export type LineDragInfo = { sectionId: string; lineId: string } | null;

/** The edit modes available in the editor ribbon. */
export type EditMode = 'text' | 'markdown' | 'section' | 'phonetic';

export interface SongVersion {
  id: string;
  timestamp: number;
  song: Section[];
  structure: string[];
  title: string;
  titleOrigin: 'user' | 'ai';
  topic: string;
  mood: string;
  musicalPrompt?: string;
  name: string;
}

/** Per-section version snapshot for managing individual section changes */
export interface SectionVersion {
  id: string;
  timestamp: number;
  sectionId: string;
  sectionName: string;
  section: Section;
  name: string;
  /** If true, this is an auto-generated snapshot before a change */
  isAutoSave?: boolean;
}

/** A point-in-time snapshot of a musical prompt, stored in LibraryAsset.metadata.promptSnapshots. */
export interface PromptSnapshot {
  timestamp: number;
  prompt: string;
  /** Optional user-facing label, e.g. "v3 – afrobeat variant" */
  label?: string;
}
