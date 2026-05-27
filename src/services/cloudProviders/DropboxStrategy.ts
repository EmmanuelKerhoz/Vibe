/**
 * DropboxStrategy.ts — Dropbox Chooser pick strategy.
 */

import type { PickStrategy } from './PickStrategy';
import type { CloudFile, PickMode, AudioFileEntry } from '../cloudStorage';

const DROPBOX_APP_KEY =
  (import.meta.env.VITE_DROPBOX_APP_KEY as string | undefined) ?? '';

const AUDIO_EXTENSIONS = ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac', '.opus', '.weba', '.webm'];
const LYRICS_EXTENSIONS = ['.txt', '.md', '.json', '.docx', '.odt'];

function isLyricsFile(name: string): boolean {
  return LYRICS_EXTENSIONS.some(ext => name.toLowerCase().endsWith(ext));
}

function isAudioFile(name: string): boolean {
  return AUDIO_EXTENSIONS.some(ext => name.toLowerCase().endsWith(ext));
}

async function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

async function pickDropbox(mode: PickMode, signal?: AbortSignal): Promise<CloudFile | null> {
  if (!DROPBOX_APP_KEY) return null;
  if (mode === 'player') throw new Error('Dropbox folder crawl not yet supported');

  return new Promise((resolve, reject) => {
    const isMulti = mode === 'player-files';
    const extensions = isMulti ? AUDIO_EXTENSIONS : LYRICS_EXTENSIONS;

    const options = {
      success: async (files: Array<{ name: string; link: string }>) => {
        if (signal?.aborted) { resolve(null); return; }
        try {
          if (!files.length) { resolve(null); return; }

          if (isMulti) {
            const entries: AudioFileEntry[] = files
              .filter(f => isAudioFile(f.name))
              .map((f, idx) => ({
                id:          `dropbox-${idx}-${f.name}`,
                name:        f.name,
                downloadUrl: f.link,
                size:        0,
                mimeType:    'audio/mpeg',
              }));
            if (!entries.length) { resolve(null); return; }
            resolve({
              name:     `selection (${entries.length} fichiers)`,
              content:  JSON.stringify(entries),
              fileList: entries,
            });
            return;
          }

          const file = files[0];
          if (!file) { resolve(null); return; }
          if (!isLyricsFile(file.name)) { resolve(null); return; }
          const resp = await fetch(file.link);
          const blob = await resp.blob();
          const content = await readBlobAsText(blob);
          resolve({ name: file.name, content });
        } catch (err) { reject(err); }
      },
      cancel: () => resolve(null),
      linkType: 'direct' as const,
      multiselect: isMulti,
      extensions,
    };

    const dbx = (window as unknown as { Dropbox?: { choose: (o: typeof options) => void } }).Dropbox;
    if (!dbx) { resolve(null); return; }
    if (signal?.aborted) { resolve(null); return; }
    dbx.choose(options);
  });
}

export class DropboxStrategy implements PickStrategy {
  pick(mode: PickMode, signal?: AbortSignal): Promise<CloudFile | null> {
    return pickDropbox(mode, signal);
  }
}
