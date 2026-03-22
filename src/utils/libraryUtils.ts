import type { Section } from '../types';
import type { SimilarityMatch } from './similarityUtils';
import { calculateSimilarityWithMetadata } from './rhymeDetection';
import { DEFAULT_MOOD, DEFAULT_TOPIC } from './songDefaults';
import { safeGetItem, safeSetItem } from './safeStorage';
import { normalizeLoadedSection } from './songUtils';

export type LibraryAsset = {
  id: string;
  title: string;
  artist?: string;
  timestamp: number;
  type: 'song' | 'poem' | 'lyrics';
  sections: Section[];
  metadata?: {
    album?: string;
    year?: number;
    genre?: string;
    language?: string;
    topic?: string;
    mood?: string;
    tempo?: number;
    instrumentation?: string;
    rhythm?: string;
    narrative?: string;
    musicalPrompt?: string;
    [key: string]: unknown;
  };
};

export type LibrarySearchResult = SimilarityMatch & {
  assetType: 'song' | 'poem' | 'lyrics';
  artist?: string;
  metadata?: LibraryAsset['metadata'];
};

// ---------------------------------------------------------------------------
// M2 fix: version-stamp + merge strategy for atomic-safe writes.
//
// localStorage is synchronous but JS is single-threaded *per tab*.
// The race condition arises across tabs: Tab A and Tab B both read v=5,
// both push an asset, both write v=6 — one write is lost.
//
// Solution: each write reads the *current* store immediately before
// committing, merges any assets added by other tabs (by id), increments
// the version stamp, then writes. No external lock needed.
// ---------------------------------------------------------------------------

type LibraryStore = {
  version: number;
  assets: LibraryAsset[];
};

const LIBRARY_KEY = 'lyricist_library';

const readStore = (): LibraryStore => {
  try {
    const raw = safeGetItem(LIBRARY_KEY);
    if (!raw) return { version: 0, assets: [] };
    const parsed = JSON.parse(raw) as unknown;
    // Legacy format: plain array (before M2). Migrate transparently.
    if (Array.isArray(parsed)) return { version: 0, assets: parsed as LibraryAsset[] };
    const store = parsed as LibraryStore;
    return { version: store.version ?? 0, assets: store.assets ?? [] };
  } catch {
    return { version: 0, assets: [] };
  }
};

const writeStore = (store: LibraryStore): boolean =>
  safeSetItem(LIBRARY_KEY, JSON.stringify(store));

/**
 * Merge `incoming` assets into `base`, keeping all unique ids.
 * `incoming` wins on conflict (same id → keep incoming version).
 */
export const mergeAssets = (base: LibraryAsset[], incoming: LibraryAsset[]): LibraryAsset[] => {
  const map = new Map<string, LibraryAsset>();
  for (const a of base) map.set(a.id, a);
  for (const a of incoming) map.set(a.id, a); // incoming overwrites
  return [...map.values()].sort((a, b) => b.timestamp - a.timestamp);
};

export const loadLibraryAssets = async (): Promise<LibraryAsset[]> => {
  return readStore().assets;
};

export type LoadedLibraryAssetState = {
  song: Section[];
  structure: string[];
  title: string;
  topic: string;
  mood: string;
  rhymeScheme: string;
  targetSyllables: number;
  genre: string;
  tempo: string;
  instrumentation: string;
  rhythm: string;
  narrative: string;
  musicalPrompt: string;
};

export const loadAssetIntoEditor = (asset: LibraryAsset): LoadedLibraryAssetState => {
  const song = asset.sections.map(section => normalizeLoadedSection(section as unknown as Record<string, unknown>));
  const firstSection = song[0];
  const metadata = asset.metadata;

  return {
    song,
    structure: song.map(section => section.name),
    title: asset.title,
    topic: typeof metadata?.topic === 'string' ? metadata.topic : DEFAULT_TOPIC,
    mood: typeof metadata?.mood === 'string' ? metadata.mood : DEFAULT_MOOD,
    rhymeScheme: firstSection?.rhymeScheme || 'AABB',
    targetSyllables: firstSection?.targetSyllables || 10,
    genre: typeof metadata?.genre === 'string' ? metadata.genre : '',
    tempo: (typeof metadata?.tempo === 'number' || typeof metadata?.tempo === 'string') ? String(metadata.tempo) : '120',
    instrumentation: typeof metadata?.instrumentation === 'string' ? metadata.instrumentation : '',
    rhythm: typeof metadata?.rhythm === 'string' ? metadata.rhythm : '',
    narrative: typeof metadata?.narrative === 'string' ? metadata.narrative : '',
    musicalPrompt: typeof metadata?.musicalPrompt === 'string' ? metadata.musicalPrompt : '',
  };
};

export const saveAssetToLibrary = async (asset: Omit<LibraryAsset, 'id' | 'timestamp'>): Promise<LibraryAsset> => {
  const newAsset: LibraryAsset = {
    ...asset,
    id: `asset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: Date.now(),
  };
  try {
    // M2: re-read immediately before writing to capture concurrent tab writes.
    const current = readStore();
    const merged = mergeAssets(current.assets, [newAsset]);
    writeStore({ version: current.version + 1, assets: merged });
    return newAsset;
  } catch (error) {
    console.error('Failed to save asset to library:', error);
    throw error;
  }
};

export const deleteAssetFromLibrary = async (assetId: string): Promise<void> => {
  try {
    // M2: re-read immediately before writing.
    const current = readStore();
    const updated = current.assets.filter(a => a.id !== assetId);
    writeStore({ version: current.version + 1, assets: updated });
  } catch (error) {
    console.error('Failed to delete asset from library:', error);
    throw error;
  }
};

/**
 * Purge all library assets (clear entire library).
 */
export const purgeLibrary = async (): Promise<void> => {
  try {
    writeStore({ version: 0, assets: [] });
  } catch (error) {
    console.error('Failed to purge library:', error);
    throw error;
  }
};

/**
 * Find top 3 similar assets in library.
 * Always returns up to 3 results regardless of score.
 */
export const findSimilarAssetsInLibrary = async (
  currentSong: Section[],
  _threshold = 0,
  limit = 3,
): Promise<LibrarySearchResult[]> => {
  if (currentSong.length === 0) return [];
  const library = await loadLibraryAssets();
  if (library.length === 0) return [];
  return library
    .filter(asset => asset.sections.length > 0)
    .map((asset) => {
      const similarityData = calculateSimilarityWithMetadata(currentSong, asset.sections);
      return {
        ...similarityData,
        versionId: asset.id,
        versionName: asset.title,
        title: asset.title,
        timestamp: asset.timestamp,
        assetType: asset.type,
        artist: asset.artist,
        metadata: asset.metadata,
      };
    })
    .sort((a, b) => b.score - a.score || b.timestamp - a.timestamp)
    .slice(0, limit);
};

/**
 * Extract plain text from a .docx file (Office Open XML).
 */
export const extractTextFromDocx = async (file: File): Promise<string> => {
  try {
    const { unzipSync, strFromU8 } = await import('fflate');
    const buffer = await file.arrayBuffer();
    const unzipped = unzipSync(new Uint8Array(buffer));
    const docXml = unzipped['word/document.xml'];
    if (!docXml) return '';
    const xml = strFromU8(docXml);
    const paragraphs = xml.split(/<\/w:p>/);
    return paragraphs
      .map(p => {
        const texts = [...p.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map(m => m[1] ?? '');
        return texts.join('');
      })
      .filter(t => t.trim().length > 0)
      .join('\n');
  } catch {
    return '';
  }
};

/**
 * Extract plain text from a .odt file (ODF).
 */
export const extractTextFromOdt = async (file: File): Promise<string> => {
  try {
    const { unzipSync, strFromU8 } = await import('fflate');
    const buffer = await file.arrayBuffer();
    const unzipped = unzipSync(new Uint8Array(buffer));
    const contentXml = unzipped['content.xml'];
    if (!contentXml) return '';
    const xml = strFromU8(contentXml);
    const paragraphs = xml.split(/<\/text:p>/);
    return paragraphs
      .map(p => p.replace(/<[^>]+>/g, '').trim())
      .filter(t => t.length > 0)
      .join('\n');
  } catch {
    return '';
  }
};

export const importAssetsFromFile = async (file: File): Promise<LibraryAsset[]> => {
  const assets: LibraryAsset[] = [];
  try {
    if (file.name.endsWith('.json')) {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown[];
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => {
          const it = item as Record<string, unknown>;
          return {
            id: (it['id'] as string) || `import_${Date.now()}_${idx}`,
            title: (it['title'] as string) || `Imported ${idx + 1}`,
            timestamp: (it['timestamp'] as number) || Date.now(),
            type: (it['type'] as LibraryAsset['type']) || 'lyrics',
            sections: (it['sections'] as Section[]) || [],
            artist: it['artist'] as string | undefined,
            metadata: it['metadata'] as LibraryAsset['metadata'],
          };
        });
      }
    } else if (file.name.endsWith('.docx')) {
      const text = await extractTextFromDocx(file);
      if (text) {
        assets.push({
          id: `import_${Date.now()}`,
          title: file.name.replace(/\.docx$/, ''),
          timestamp: Date.now(),
          type: 'lyrics',
          sections: parseTextToSections(text),
        });
      }
    } else if (file.name.endsWith('.odt')) {
      const text = await extractTextFromOdt(file);
      if (text) {
        assets.push({
          id: `import_${Date.now()}`,
          title: file.name.replace(/\.odt$/, ''),
          timestamp: Date.now(),
          type: 'lyrics',
          sections: parseTextToSections(text),
        });
      }
    } else {
      const text = await file.text();
      assets.push({
        id: `import_${Date.now()}`,
        title: file.name.replace(/\.(txt|md)$/, ''),
        timestamp: Date.now(),
        type: 'lyrics',
        sections: parseTextToSections(text),
      });
    }
  } catch (error) {
    console.error('Failed to import assets:', error);
  }
  return assets;
};

/** @internal Exported for focused unit tests. */
export const parseTextToSections = (text: string): Section[] => {
  const blocks = text.split(/\n\s*\n/);
  const sections: Section[] = [];
  let uid = Date.now();

  blocks.forEach((block) => {
    const lines = block.trim().split('\n');
    if (lines.length === 0) return;
    let sectionName = 'Verse';
    let contentLines = lines;
    const firstLine = (lines[0] ?? '').trim();
    if ((firstLine.startsWith('[') && firstLine.endsWith(']')) || (firstLine.startsWith('**[') && firstLine.endsWith(']**'))) {
      const headerMatch = firstLine.match(/^(?:\*\*)?\[(.+?)\](?:\*\*)?$/);
      sectionName = headerMatch?.[1] ?? sectionName;
      contentLines = lines.slice(1);
    }
    const sectionLines = contentLines
      .filter(line => line.trim().length > 0)
      .map((lineText, idx) => ({
        id: `line_${uid++}_${idx}`,
        text: lineText,
        rhymingSyllables: '',
        rhyme: '',
        syllables: 0,
        concept: '',
        isManual: true,
      }));
    if (sectionLines.length > 0) {
      sections.push({
        id: `section_${uid++}_${sections.length}`,
        name: sectionName,
        rhymeScheme: 'AABB',
        targetSyllables: 8,
        mood: '',
        lines: sectionLines,
        preInstructions: [],
        postInstructions: [],
      });
    }
  });
  return sections;
};

export const exportLibraryToJson = async (): Promise<Blob> => {
  const library = await loadLibraryAssets();
  const json = JSON.stringify(library, null, 2);
  return new Blob([json], { type: 'application/json' });
};
