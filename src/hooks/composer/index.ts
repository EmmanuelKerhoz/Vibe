/**
 * Feature: Composer
 * Barrel export — imports from this path are equivalent to direct imports.
 * Note: src/hooks/composer/ sub-dir already exists — hooks inside it
 * are re-exported here for unified access alongside root-level hooks.
 */
export { useSongComposer } from '../useSongComposer';
export { useTitleGenerator } from '../useTitleGenerator';
export { useTopicMoodSuggester } from '../useTopicMoodSuggester';
// Sub-folder hooks
export { useAiGeneration } from './useAiGeneration';
export { useLineEditor } from './useLineEditor';
export { useMusicalPrompt } from './useMusicalPrompt';
export { useSpellCheck } from './useSpellCheck';
export { useSuggestions } from './useSuggestions';
