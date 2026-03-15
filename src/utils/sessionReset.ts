// ---------------------------------------------------------------------------
// sessionReset.ts — canonical reset payload builder
// ---------------------------------------------------------------------------
// Single source of truth for every field that must be zeroed on
// "New empty song" or "Reset song". Adding a new piece of state only
// requires touching this file.
// ---------------------------------------------------------------------------

import { safeRemoveItem } from './safeStorage';
import { createEmptySong, DEFAULT_TOPIC, DEFAULT_MOOD } from './songDefaults';
import { DEFAULT_STRUCTURE } from '../constants/editor';
import type { Section } from '../types';

export interface ResetPayload {
  // Song content
  song: Section[];
  structure: string[];
  // Editorial metadata
  title: string;
  titleOrigin: 'user' | 'ai';
  topic: string;
  mood: string;
  rhymeScheme: string;
  targetSyllables: number;
  // Musical metadata
  genre: string;
  tempo: string;
  instrumentation: string;
  rhythm: string;
  narrative: string;
  musicalPrompt: string;
  // UI / session
  markupText: string;
  activeTab: 'lyrics' | 'musical';
  isLeftPanelOpen: boolean;
  similarityMatches: never[];
  hasSavedSession: boolean;
}

/**
 * Full reset — clears everything including musical params and UI state.
 * Used by handleCreateEmptySong ("New empty song").
 */
export const buildResetPayload = (rhymeScheme = 'AABB'): ResetPayload => ({
  song:             createEmptySong(DEFAULT_STRUCTURE, rhymeScheme),
  structure:        DEFAULT_STRUCTURE,
  title:            '',
  titleOrigin:      'user',
  topic:            DEFAULT_TOPIC,
  mood:             DEFAULT_MOOD,
  rhymeScheme,
  targetSyllables:  10,
  genre:            '',
  tempo:            '120',
  instrumentation:  '',
  rhythm:           '',
  narrative:        '',
  musicalPrompt:    '',
  markupText:       '',
  activeTab:        'lyrics',
  isLeftPanelOpen:  false,
  similarityMatches: [],
  hasSavedSession:  false,
});

/**
 * Partial reset — preserves musical params and UI prefs.
 * Used by resetSong ("Reset lyrics" from reset modal).
 */
export const buildPartialResetPayload = (currentRhymeScheme: string): Pick<
  ResetPayload,
  'song' | 'structure' | 'markupText' | 'similarityMatches' | 'hasSavedSession'
> => ({
  song:             createEmptySong(DEFAULT_STRUCTURE, currentRhymeScheme),
  structure:        DEFAULT_STRUCTURE,
  markupText:       '',
  similarityMatches: [],
  hasSavedSession:  false,
});

/**
 * Side-effect: wipes persisted session from localStorage.
 * Call alongside any reset to prevent stale hydration on next load.
 */
export const clearPersistedSession = (): void => {
  safeRemoveItem('lyricist_session');
};
