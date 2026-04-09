import type { Section } from '../types';
import type { SimilarityMatch } from './similarityUtils';
import { calculateSimilarityWithMetadata } from './rhymeDetection';
import { DEFAULT_MOOD, DEFAULT_TOPIC } from './songDefaults';
import { safeGetItem, safeSetItem } from './safeStorage';
import { normalizeLoadedSection } from './songUtils';
import { SectionSchema } from '../schemas/sessionSchema';
import { LibraryAssetSchema, LibraryStoreSchema } from '../schemas/librarySchema';

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

export type LibraryAsset_Metadata = NonNullable<LibraryAsset['metadata']>;

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
    const json = JSON.parse(raw) as unknown;
    // P4: validate through Zod — catches corrupt / migrated payloads at the
    // storage boundary so the rest of the app always receives typed data.
    const result = LibraryStoreSchema.safeParse(json);
    if (!result.success) {
      console.warn(
        '[libraryUtils] readStore: invalid library payload, resetting to empty store.\n',
        result.error.format(),
      );
      return { version: 0, assets: [] };
    }
    // Zod passthrough on SectionSchema produces objectOutputType which diverges
    // from Section (missing rhymingSyllables, concept). Cast via unknown at this
    // storage boundary — normalizeLoadedSection re-validates fields downstream.
    return result.data as unknown as LibraryStore;
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
  tempo: number;
  instrumentation: string;
  rhythm: string;
  narrative: string;
  musicalPrompt: string;
};

/**
 * Safely coerce an unknown value to Record<string, unknown>.
 * If the value is already a plain object, return it directly.
 * Otherwise return an empty record — normalizeLoadedSection handles
 * all missing fields with safe defaults.
 */
const toRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const loadAssetIntoEditor = (asset: LibraryAsset): LoadedLibraryAssetState => {
  // P2a fix: validate each section through SectionSchema.
  // On parse failure, toRecord() provides a safe empty-record fallback
  // — no cast, normalizeLoadedSection fills all missing fields with defaults.
  const song = asset.sections.map(section => {
    const parsed = SectionSchema.safeParse(section);
    return normalizeLoadedSection(parsed.success ? parsed.data : toRecord(section));
  });
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
    tempo: (typeof metadata?.tempo === 'number' || typeof metadata?.tempo === 'string')
      ? parseInt(String(metadata.tempo), 10) || 120
      : 120,
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
    .map((asset): LibrarySearchResult => {
      const similarityData = calculateSimilarityWithMetadata(currentSong, asset.sections);
      return {
        ...similarityData,
        versionId: asset.id,
        versionName: asset.title,
        title: asset.title,
        timestamp: asset.timestamp,
        assetType: asset.type,
        // Conditional spread: omit optional props when undefined (exactOptionalPropertyTypes).
        ...(asset.artist !== undefined && { artist: asset.artist }),
        ...(asset.metadata !== undefined && { metadata: asset.metadata }),
      };
    })
    .sort((a, b) => b.score - a.score || b.timestamp - a.timestamp)
    .slice(0, limit);
};

/**
 * Extract plain text from a .docx file (Office Open XML).
 */
export const extractTextFromDocx = async (file: Blob): Promise<string> => {
  const payload = await extractImportPayloadFromDocx(file);
  return payload.text;
};

export type ImportedSongFilePayload = {
  text: string;
  songLanguage: string;
};

const readBlobBytes = async (blob: Blob): Promise<Uint8Array> => {
  if (typeof blob.arrayBuffer === 'function') {
    return new Uint8Array(await blob.arrayBuffer());
  }
  return new Uint8Array(await new Response(blob).arrayBuffer());
};

const getZipEntry = (
  files: Record<string, Uint8Array>,
  expectedPath: string,
): Uint8Array | undefined => files[expectedPath]
  ?? Object.entries(files).find(([path]) => path === expectedPath || path.endsWith(`/${expectedPath}`))?.[1];

const extractDocumentLanguage = (
  files: Record<string, Uint8Array>,
  strFromU8: (data: Uint8Array) => string,
): string => {
  const preferredEntries = ['docProps/core.xml', 'meta.xml']
    .map(path => getZipEntry(files, path))
    .filter((entry): entry is Uint8Array => Boolean(entry));
  const candidateEntries = preferredEntries.length > 0 ? preferredEntries : Object.values(files);

  for (const entry of candidateEntries) {
    const match = strFromU8(entry).match(/<dc:language>([^<]+)<\/dc:language>/);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return '';
};

export const extractImportPayloadFromText = (text: string): ImportedSongFilePayload => {
  const normalizedText = text.replace(/^\uFEFF/, '');
  const match = normalizedText.match(/^#\s*lang:\s*(.+?)\s*(?:\r?\n){1,2}/i);
  if (!match) return { text: normalizedText, songLanguage: '' };
  return {
    text: normalizedText.slice(match[0].length),
    songLanguage: match[1]?.trim() ?? '',
  };
};

export const extractImportPayloadFromDocx = async (file: Blob): Promise<ImportedSongFilePayload> => {
  try {
    const { unzipSync, strFromU8 } = await import('fflate');
    const unzipped = unzipSync(await readBlobBytes(file));
    const docXml = getZipEntry(unzipped, 'word/document.xml');
    if (!docXml) return { text: '', songLanguage: '' };
    const xml = strFromU8(docXml);
    const paragraphs = xml.split(/<\/w:p>/);
    const text = paragraphs
      .map(p => {
        const texts = [...p.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map(m => m[1] ?? '');
        return texts.join('');
      })
      .filter(t => t.trim().length > 0)
      .join('\n');
    const songLanguage = extractDocumentLanguage(unzipped, strFromU8);
    return { text, songLanguage };
  } catch {
    return { text: '', songLanguage: '' };
  }
};

/**
 * Extract plain text from a .odt file (ODF).
 */
export const extractTextFromOdt = async (file: Blob): Promise<string> => {
  const payload = await extractImportPayloadFromOdt(file);
  return payload.text;
};

export const extractImportPayloadFromOdt = async (file: Blob): Promise<ImportedSongFilePayload> => {
  try {
    const { unzipSync, strFromU8 } = await import('fflate');
    const unzipped = unzipSync(await readBlobBytes(file));
    const contentXml = getZipEntry(unzipped, 'content.xml');
    if (!contentXml) return { text: '', songLanguage: '' };
    const xml = strFromU8(contentXml);
    const paragraphs = xml.split(/<\/text:p>/);
    const text = paragraphs
      .map(p => p.replace(/<[^>]+>/g, '').trim())
      .filter(t => t.length > 0)
      .join('\n');
    const songLanguage = extractDocumentLanguage(unzipped, strFromU8);
    return { text, songLanguage };
  } catch {
    return { text: '', songLanguage: '' };
  }
};

export const importAssetsFromFile = async (file: File): Promise<LibraryAsset[]> => {
  const assets: LibraryAsset[] = [];
  try {
    if (file.name.endsWith('.json')) {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed)) {
        // P4: validate each item through LibraryAssetSchema instead of casting.
        // Invalid entries are skipped with a warning — no crash, no garbage data.
        for (let idx = 0; idx < parsed.length; idx++) {
          const result = LibraryAssetSchema.safeParse(parsed[idx]);
          if (result.success) {
            // Zod passthrough on SectionSchema produces objectOutputType which
            // diverges from LibraryAsset.sections (Section[]). Cast via unknown
            // at the import boundary — normalizeLoadedSection re-validates downstream.
            assets.push(result.data as unknown as LibraryAsset);
          } else {
            console.warn(
              `[libraryUtils] importAssetsFromFile: item ${idx} failed validation, skipping.`,
              result.error.format(),
            );
          }
        }
        return assets;
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

/** Parse plain text into Section objects without AI. Used as a local fallback
 *  when no API key is available and for library imports. */
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
