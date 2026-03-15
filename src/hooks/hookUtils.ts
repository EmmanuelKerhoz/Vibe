import type { Section } from '../types';

/**
 * Factory that creates the standard `updateSong` helper used across AI hooks.
 * Wraps `updateState` to mutate only `song`, leaving `structure` untouched.
 */
export const makeSongUpdater = (
  updateState: (
    recipe: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] },
  ) => void,
) => (
  transform: (currentSong: Section[]) => Section[],
): void => {
  updateState(current => ({
    song: transform(current.song),
    structure: current.structure,
  }));
};
