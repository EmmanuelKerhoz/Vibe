/**
 * Smoke-test: verifies that every hook file under src/hooks/ (and the util
 * modules they depend on) can be imported without errors.
 *
 * Background — commits 515f472 and f40475b redirected imports from songUtils
 * to rhymeSchemeUtils across 18+ files.  This test guards against broken
 * import paths and missing re-exports so regressions are caught early.
 */
import { describe, it, expect } from 'vitest';

/* ------------------------------------------------------------------ */
/*  Hooks — top-level                                                 */
/* ------------------------------------------------------------------ */
import { useSongHistoryState } from '../useSongHistoryState';
import { useSongEditor } from '../useSongEditor';
import { useMarkupEditor } from '../useMarkupEditor';
import { useTitleGenerator } from '../useTitleGenerator';
import { useSongAnalysis } from '../useSongAnalysis';
import { useSongComposer } from '../useSongComposer';
import { useAppState } from '../useAppState';
import { useVersionManager } from '../useVersionManager';
import { useSessionPersistence } from '../useSessionPersistence';
import { useStorageEstimate } from '../useStorageEstimate';
import { useSimilarityEngine } from '../useSimilarityEngine';
import { useTopicMoodSuggester } from '../useTopicMoodSuggester';
import { useAppKpis } from '../useAppKpis';
import { useMetronome } from '../useMetronome';
import { useAudioFeedback } from '../useAudioFeedback';
import { useMobileLayout } from '../useMobileLayout';
import { useMobileInitPanels } from '../useMobileInitPanels';
import { useUIState } from '../useUIState';
import { useSongMeta } from '../useSongMeta';
import { useSessionState } from '../useSessionState';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';
import { useSessionActions } from '../useSessionActions';
import { useImportHandlers } from '../useImportHandlers';
import { useLibraryActions } from '../useLibraryActions';
import { useSectionManager } from '../useSectionManager';
import { useDragHandlers } from '../useDragHandlers';
import { makeSongUpdater } from '../hookUtils';

/* ------------------------------------------------------------------ */
/*  Hooks — analysis sub-directory                                    */
/* ------------------------------------------------------------------ */
import { usePasteImport } from '../analysis/usePasteImport';
import { useSongAnalysisEngine } from '../analysis/useSongAnalysisEngine';
import { useBackgroundThemeAnalysis } from '../analysis/useBackgroundThemeAnalysis';
import { useLanguageAdapter } from '../analysis/useLanguageAdapter';
import { reverseTranslate, reviewFidelity } from '../analysis/languageAdapterPipeline';
import {
  PIPELINE_STEPS,
  IDLE_PROGRESS,
} from '../analysis/languageAdapterTypes';

/* ------------------------------------------------------------------ */
/*  Hooks — composer sub-directory                                    */
/* ------------------------------------------------------------------ */
import { useLineEditor } from '../composer/useLineEditor';
import { useAiGeneration } from '../composer/useAiGeneration';
import { useSuggestions } from '../composer/useSuggestions';
import { useMusicalPrompt } from '../composer/useMusicalPrompt';

/* ------------------------------------------------------------------ */
/*  Utility modules consumed by the hooks above                       */
/* ------------------------------------------------------------------ */
import {
  cleanSectionName,
  getSectionText,
  getSongText,
  normalizeLoadedSection,
  getSchemeLetterForLine,
  getRhymeColor,
  getRhymeTextColor,
} from '../../utils/songUtils';

import {
  detectRhymeSchemeLocally,
  finalizeDetectedRhymeScheme,
  RHYME_SCHEME_LETTERS,
} from '../../utils/rhymeSchemeUtils';

import { doLinesRhymeGraphemic } from '../../utils/rhymeDetection';

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe('Hook import smoke-tests', () => {
  describe('top-level hooks export callable functions', () => {
    it.each([
      ['useSongHistoryState', useSongHistoryState],
      ['useSongEditor', useSongEditor],
      ['useMarkupEditor', useMarkupEditor],
      ['useTitleGenerator', useTitleGenerator],
      ['useSongAnalysis', useSongAnalysis],
      ['useSongComposer', useSongComposer],
      ['useAppState', useAppState],
      ['useVersionManager', useVersionManager],
      ['useSessionPersistence', useSessionPersistence],
      ['useStorageEstimate', useStorageEstimate],
      ['useSimilarityEngine', useSimilarityEngine],
      ['useTopicMoodSuggester', useTopicMoodSuggester],
      ['useAppKpis', useAppKpis],
      ['useMetronome', useMetronome],
      ['useAudioFeedback', useAudioFeedback],
      ['useMobileLayout', useMobileLayout],
      ['useMobileInitPanels', useMobileInitPanels],
      ['useUIState', useUIState],
      ['useSongMeta', useSongMeta],
      ['useSessionState', useSessionState],
      ['useKeyboardShortcuts', useKeyboardShortcuts],
      ['useSessionActions', useSessionActions],
      ['useImportHandlers', useImportHandlers],
      ['useLibraryActions', useLibraryActions],
      ['useSectionManager', useSectionManager],
      ['useDragHandlers', useDragHandlers],
      ['makeSongUpdater', makeSongUpdater],
    ])('%s is a function', (_name, hook) => {
      expect(typeof hook).toBe('function');
    });
  });

  describe('analysis hooks export callable functions', () => {
    it.each([
      ['usePasteImport', usePasteImport],
      ['useSongAnalysisEngine', useSongAnalysisEngine],
      ['useBackgroundThemeAnalysis', useBackgroundThemeAnalysis],
      ['useLanguageAdapter', useLanguageAdapter],
      ['reverseTranslate', reverseTranslate],
      ['reviewFidelity', reviewFidelity],
    ])('%s is a function', (_name, hook) => {
      expect(typeof hook).toBe('function');
    });

    it('languageAdapterTypes exports constants', () => {
      expect(Array.isArray(PIPELINE_STEPS)).toBe(true);
      expect(PIPELINE_STEPS.length).toBeGreaterThan(0);
      expect(IDLE_PROGRESS).toBeDefined();
    });
  });

  describe('composer hooks export callable functions', () => {
    it.each([
      ['useLineEditor', useLineEditor],
      ['useAiGeneration', useAiGeneration],
      ['useSuggestions', useSuggestions],
      ['useMusicalPrompt', useMusicalPrompt],
    ])('%s is a function', (_name, hook) => {
      expect(typeof hook).toBe('function');
    });
  });
});

describe('Utility import smoke-tests (consumed by hooks)', () => {
  describe('songUtils exports', () => {
    it.each([
      ['cleanSectionName', cleanSectionName],
      ['getSectionText', getSectionText],
      ['getSongText', getSongText],
      ['normalizeLoadedSection', normalizeLoadedSection],
      ['getSchemeLetterForLine', getSchemeLetterForLine],
      ['getRhymeColor', getRhymeColor],
      ['getRhymeTextColor', getRhymeTextColor],
    ])('%s is a function', (_name, fn) => {
      expect(typeof fn).toBe('function');
    });
  });

  describe('rhymeSchemeUtils exports (redirected imports)', () => {
    it.each([
      ['detectRhymeSchemeLocally', detectRhymeSchemeLocally],
      ['finalizeDetectedRhymeScheme', finalizeDetectedRhymeScheme],
    ])('%s is a function', (_name, fn) => {
      expect(typeof fn).toBe('function');
    });

    it('RHYME_SCHEME_LETTERS is a non-empty string', () => {
      expect(typeof RHYME_SCHEME_LETTERS).toBe('string');
      expect(RHYME_SCHEME_LETTERS.length).toBeGreaterThan(0);
    });
  });

  describe('rhymeDetection exports', () => {
    it('doLinesRhymeGraphemic is a function', () => {
      expect(typeof doLinesRhymeGraphemic).toBe('function');
    });
  });
});
