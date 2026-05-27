/**
 * GDriveStrategy.ts — Google Drive pick strategy.
 *
 * Mode lyrics      : list 30 recent lyrics files → native dialog → single pick → download text
 * Mode player-files: list 50 recent audio files  → native multi-select dialog  → AudioFileEntry[]
 *                    Each entry's downloadUrl is a Blob Object URL (blob:) resolved at pick time.
 *                    Caller MUST revoke via URL.revokeObjectURL() when done.
 * Mode player      : unsupported.
 */

import {
  signIn as gdriveSignIn,
  listRecentLyricsFiles,
  listRecentAudioFiles,
  downloadFile as gdriveDownload,
  isGDriveConfigured,
  createAudioBlobUrl,
  type GDriveFile,
} from '../googleDriveService';
import type { PickStrategy } from './PickStrategy';
import type { CloudFile, PickMode, AudioFileEntry } from '../cloudStorage';

// ─── GDrive native dialogs ────────────────────────────────────────────────────

function showGDriveFilePicker(
  files: Array<{ id: string; name: string; mimeType: string }>,
): Promise<{ id: string; name: string } | null> {
  return new Promise(resolve => {
    const dialog = document.createElement('dialog');
    dialog.style.cssText = [
      'padding:0',
      'border:none',
      'border-radius:8px',
      'box-shadow:0 8px 32px rgba(0,0,0,.24)',
      'min-width:320px',
      'max-width:480px',
      'font-family:inherit',
    ].join(';');

    const header = document.createElement('div');
    header.style.cssText = 'padding:16px 20px 8px;font-weight:600;font-size:15px;border-bottom:1px solid #e0e0e0';
    header.textContent = 'Open from Google Drive';

    const list = document.createElement('ul');
    list.style.cssText = 'list-style:none;margin:0;padding:8px 0;max-height:320px;overflow-y:auto';

    files.forEach(f => {
      const li = document.createElement('li');
      li.style.cssText = 'padding:10px 20px;cursor:pointer;font-size:14px;border-bottom:1px solid #f0f0f0';
      li.textContent = f.name;
      li.addEventListener('mouseenter', () => { li.style.background = '#f5f5f5'; });
      li.addEventListener('mouseleave', () => { li.style.background = ''; });
      li.addEventListener('click', () => {
        dialog.close();
        dialog.remove();
        resolve({ id: f.id, name: f.name });
      });
      list.appendChild(li);
    });

    const footer = document.createElement('div');
    footer.style.cssText = 'padding:10px 20px;display:flex;justify-content:flex-end;border-top:1px solid #e0e0e0';
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'padding:6px 16px;cursor:pointer;font-size:13px';
    cancelBtn.addEventListener('click', () => {
      dialog.close();
      dialog.remove();
      resolve(null);
    });
    footer.appendChild(cancelBtn);

    dialog.appendChild(header);
    dialog.appendChild(list);
    dialog.appendChild(footer);
    document.body.appendChild(dialog);
    dialog.showModal();

    dialog.addEventListener('close', () => { dialog.remove(); resolve(null); });
  });
}

function showGDriveMultiFilePicker(files: GDriveFile[]): Promise<GDriveFile[] | null> {
  return new Promise(resolve => {
    const dialog = document.createElement('dialog');
    dialog.style.cssText = [
      'padding:0',
      'border:none',
      'border-radius:8px',
      'box-shadow:0 8px 32px rgba(0,0,0,.24)',
      'min-width:360px',
      'max-width:520px',
      'font-family:inherit',
    ].join(';');

    const header = document.createElement('div');
    header.style.cssText = 'padding:16px 20px 8px;font-weight:600;font-size:15px;border-bottom:1px solid #e0e0e0';
    header.textContent = 'Select audio files from Google Drive';

    const list = document.createElement('ul');
    list.style.cssText = 'list-style:none;margin:0;padding:8px 0;max-height:360px;overflow-y:auto';

    const checkboxes: Map<string, HTMLInputElement> = new Map();

    files.forEach(f => {
      const li = document.createElement('li');
      li.style.cssText = 'padding:8px 20px;display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;border-bottom:1px solid #f0f0f0';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = `gdrive-audio-${f.id}`;
      cb.style.cssText = 'width:16px;height:16px;cursor:pointer;flex-shrink:0';
      checkboxes.set(f.id, cb);

      const label = document.createElement('label');
      label.htmlFor = cb.id;
      label.textContent = f.name;
      label.style.cssText = 'cursor:pointer;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';

      li.addEventListener('click', e => {
        if ((e.target as HTMLElement).tagName !== 'INPUT') cb.checked = !cb.checked;
      });
      li.addEventListener('mouseenter', () => { li.style.background = '#f5f5f5'; });
      li.addEventListener('mouseleave', () => { li.style.background = ''; });

      li.appendChild(cb);
      li.appendChild(label);
      list.appendChild(li);
    });

    const footer = document.createElement('div');
    footer.style.cssText = 'padding:10px 20px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e0e0e0;gap:8px';

    const countLabel = document.createElement('span');
    countLabel.style.cssText = 'font-size:12px;color:#666';
    countLabel.textContent = '0 selected';

    list.addEventListener('change', () => {
      const n = [...checkboxes.values()].filter(c => c.checked).length;
      countLabel.textContent = `${n} selected`;
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'padding:6px 16px;cursor:pointer;font-size:13px';
    cancelBtn.addEventListener('click', () => { dialog.close(); dialog.remove(); resolve(null); });

    const selectBtn = document.createElement('button');
    selectBtn.textContent = 'Add to player';
    selectBtn.style.cssText = 'padding:6px 16px;cursor:pointer;font-size:13px;background:#1a73e8;color:#fff;border:none;border-radius:4px';
    selectBtn.addEventListener('click', () => {
      const selected = files.filter(f => checkboxes.get(f.id)?.checked);
      dialog.close();
      dialog.remove();
      resolve(selected.length ? selected : null);
    });

    footer.appendChild(countLabel);
    footer.appendChild(cancelBtn);
    footer.appendChild(selectBtn);

    dialog.appendChild(header);
    dialog.appendChild(list);
    dialog.appendChild(footer);
    document.body.appendChild(dialog);
    dialog.showModal();

    dialog.addEventListener('close', () => { dialog.remove(); resolve(null); });
  });
}

// ─── pickGDrive ───────────────────────────────────────────────────────────────

async function pickGDrive(mode: PickMode, signal?: AbortSignal): Promise<CloudFile | null> {
  if (!isGDriveConfigured()) return null;
  if (mode === 'player') throw new Error('Google Drive folder crawl not yet supported');
  if (signal?.aborted) return null;

  let token: string;
  try {
    token = await gdriveSignIn(false);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'GDRIVE_AUTH_CANCELLED' || msg === 'GDRIVE_POPUP_BLOCKED') return null;
    throw err;
  }

  if (signal?.aborted) return null;

  if (mode === 'player-files') {
    const audioFiles = await listRecentAudioFiles(token);
    if (!audioFiles.length) return null;
    if (signal?.aborted) return null;

    const chosen = await showGDriveMultiFilePicker(audioFiles);
    if (!chosen?.length || signal?.aborted) return null;

    const entries: AudioFileEntry[] = await Promise.all(
      chosen.map(async f => ({
        id:          f.id,
        name:        f.name,
        downloadUrl: await createAudioBlobUrl(f.id, token),
        size:        f.size ? parseInt(f.size, 10) : 0,
        mimeType:    f.mimeType,
      }))
    );

    return {
      name:     `selection (${entries.length} fichiers)`,
      content:  JSON.stringify(entries),
      fileList: entries,
    };
  }

  const files = await listRecentLyricsFiles(token);
  if (!files.length) return null;
  if (signal?.aborted) return null;

  const chosen = await showGDriveFilePicker(files);
  if (!chosen || signal?.aborted) return null;

  const content = await gdriveDownload(chosen.id, token);
  return { name: chosen.name, content, gdriveFileId: chosen.id };
}

// ─── Strategy export ──────────────────────────────────────────────────────────

export class GDriveStrategy implements PickStrategy {
  pick(mode: PickMode, signal?: AbortSignal): Promise<CloudFile | null> {
    return pickGDrive(mode, signal);
  }
}
