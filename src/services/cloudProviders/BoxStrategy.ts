/**
 * BoxStrategy.ts — Box OAuth2 implicit pick strategy.
 * Note: multi-file pick (player / player-files) not yet supported.
 */

import type { PickStrategy } from './PickStrategy';
import type { CloudFile, PickMode } from '../cloudStorage';

const BOX_CLIENT_ID =
  (import.meta.env.VITE_BOX_CLIENT_ID as string | undefined) ?? '';

const BOX_ORIGINS: ReadonlySet<string> = new Set([
  'https://app.box.com',
  'https://account.box.com',
]);

async function pickBox(mode: PickMode, signal?: AbortSignal): Promise<CloudFile | null> {
  if (!BOX_CLIENT_ID) return null;
  if (mode === 'player' || mode === 'player-files') {
    throw new Error('Box multi-file pick not yet supported');
  }

  return new Promise(resolve => {
    const popup = window.open(
      `https://app.box.com/api/oauth2/authorize?client_id=${BOX_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(window.location.origin)}`,
      'BoxAuth', 'width=600,height=700',
    );
    if (!popup) { resolve(null); return; }

    const handler = (e: MessageEvent) => {
      if (!BOX_ORIGINS.has(e.origin)) return;
      window.removeEventListener('message', handler);
      if (!popup.closed) popup.close();
      const token = (e.data as { access_token?: string }).access_token;
      if (!token) { resolve(null); return; }
      resolve(null);
    };

    signal?.addEventListener('abort', () => { if (!popup.closed) popup.close(); resolve(null); });
    window.addEventListener('message', handler);
  });
}

export class BoxStrategy implements PickStrategy {
  pick(mode: PickMode, signal?: AbortSignal): Promise<CloudFile | null> {
    return pickBox(mode, signal);
  }
}
