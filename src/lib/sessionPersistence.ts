/**
 * sessionPersistence
 *
 * Stores / retrieves the current Vibe session via the Origin Private File
 * System (OPFS).  OPFS is attached to the device + origin — it is NOT
 * browser-profile-dependent and persists across browser restarts.
 *
 * File: vibe-session.json  (in the OPFS root directory)
 * Schema version: 1
 *
 * P7: loadSession() now validates the raw JSON against a structural guard
 *     before returning it as SessionSnapshot, instead of casting blindly.
 *     Invalid or partial payloads (corrupted OPFS data, migration mismatch)
 *     return null so the app starts clean rather than propagating corrupt state.
 */
import type { Section, SectionVersion } from '../types';
import type { SongVersion } from '../types';
import type { AppTab } from '../hooks/useUIState';

export const SESSION_SCHEMA_VERSION = 1;
const FILE_NAME = 'vibe-session.json';

export interface SessionSnapshot {
  schemaVersion: number;
  savedAt: number;          // Date.now()
  // Song data
  song: Section[];
  structure: string[];
  // Meta
  title: string;
  titleOrigin: 'user' | 'ai';
  topic: string;
  mood: string;
  rhymeScheme: string;
  targetSyllables: number;
  songLanguage: string;
  genre: string;
  tempo: number;
  songDurationSeconds?: number;
  timeSignature?: [number, number];
  instrumentation: string;
  rhythm: string;
  narrative: string;
  musicalPrompt: string;
  versions?: SongVersion[];
  sectionVersions?: Record<string, SectionVersion[]>;
  // UI navigation
  activeTab: AppTab;
  isStructureOpen: boolean;
  isLeftPanelOpen: boolean;
}

// ─── Structural guard (no Zod dependency in this module) ─────────────────────
// Validates the minimum required fields before we trust the payload.
// Full deep validation of `song` sections / `versions` is delegated to the
// SessionSchema / SongVersionSchema Zod schemas used at import time.

function isValidSnapshot(raw: unknown): raw is SessionSnapshot {
  if (typeof raw !== 'object' || raw === null) return false;
  const r = raw as Record<string, unknown>;
  return (
    r['schemaVersion'] === SESSION_SCHEMA_VERSION &&
    typeof r['savedAt'] === 'number' &&
    Array.isArray(r['song']) &&
    Array.isArray(r['structure']) &&
    typeof r['title'] === 'string' &&
    (r['titleOrigin'] === 'user' || r['titleOrigin'] === 'ai') &&
    typeof r['topic'] === 'string' &&
    typeof r['mood'] === 'string' &&
    typeof r['rhymeScheme'] === 'string' &&
    typeof r['targetSyllables'] === 'number' &&
    typeof r['songLanguage'] === 'string' &&
    typeof r['genre'] === 'string' &&
    typeof r['tempo'] === 'number' &&
    typeof r['instrumentation'] === 'string' &&
    typeof r['rhythm'] === 'string' &&
    typeof r['narrative'] === 'string' &&
    typeof r['musicalPrompt'] === 'string' &&
    typeof r['activeTab'] === 'string' &&
    typeof r['isStructureOpen'] === 'boolean' &&
    typeof r['isLeftPanelOpen'] === 'boolean'
  );
}

// ─── OPFS helpers ──────────────────────────────────────────────────────────────

function isOpfsAvailable(): boolean {
  return typeof navigator !== 'undefined' &&
    typeof navigator.storage?.getDirectory === 'function';
}

async function getRoot(): Promise<FileSystemDirectoryHandle> {
  return navigator.storage.getDirectory();
}

// ─── Public API ────────────────────────────────────────────────────────────────

export async function saveSession(payload: SessionSnapshot): Promise<void> {
  if (!isOpfsAvailable()) return;
  try {
    const root = await getRoot();
    const fh = await root.getFileHandle(FILE_NAME, { create: true });
    const writable = await fh.createWritable();
    await writable.write(JSON.stringify({ ...payload, schemaVersion: SESSION_SCHEMA_VERSION }));
    await writable.close();
  } catch {
    // Non-blocking — never crash the app on persistence failure
  }
}

export async function loadSession(): Promise<SessionSnapshot | null> {
  if (!isOpfsAvailable()) return null;
  try {
    const root = await getRoot();
    const fh = await root.getFileHandle(FILE_NAME);
    const file = await fh.getFile();
    const raw: unknown = JSON.parse(await file.text());
    // P7: structural validation instead of blind cast
    if (!isValidSnapshot(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  if (!isOpfsAvailable()) return;
  try {
    const root = await getRoot();
    await root.removeEntry(FILE_NAME);
  } catch {
    // File might not exist — ignore
  }
}
