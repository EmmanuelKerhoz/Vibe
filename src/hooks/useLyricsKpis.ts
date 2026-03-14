/**
 * @deprecated Use useAppKpis instead — useLyricsKpis has been merged into it.
 * This stub re-exports for backward compatibility if any dynamic import survives.
 */
export type { LyricsKpis } from './useAppKpis';

import { useAppKpis } from './useAppKpis';
import type { Section } from '../types';

export function useLyricsKpis(song: Section[]) {
  return useAppKpis(song).lyricsKpis;
}
