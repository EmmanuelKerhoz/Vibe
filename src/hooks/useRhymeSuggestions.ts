/**
 * useRhymeSuggestions
 *
 * Debounced hook that calls suggestRhymes() on the last word of a lyric
 * line and returns grouped results (perfect / near / assonance).
 *
 * Cancels the previous run on each new input via a ref-held timer.
 * Synchronous (no async) — suggestRhymes() is CPU-only, < 1 ms.
 */

import { useState, useEffect, useRef } from 'react';
import { suggestRhymes } from '../lib/linguistics';
import type { RhymeSuggestion } from '../lib/linguistics';

export type RhymeGroup = 'perfect' | 'near' | 'assonance';

export interface GroupedSuggestion {
  word: string;
  /** IPA nucleus string from RhymeSuggestion.rhymeNucleus. */
  nucleus: string;
  score: number;
  group: RhymeGroup;
}

export interface UseRhymeSuggestionsResult {
  suggestions: GroupedSuggestion[];
  query: string;        // last word extracted from the line
  isLoading: boolean;
}

const DEBOUNCE_MS = 300;
const MAX_RESULTS  = 8;

/** Extract the last alphabetic word from a lyric line (strips punctuation). */
function extractLastWord(text: string): string {
  const trimmed = text.trimEnd();
  const match   = trimmed.match(/[\p{L}'-]+$/u);
  return match ? match[0].toLowerCase() : '';
}

function classifyScore(score: number): RhymeGroup {
  if (score >= 0.85) return 'perfect';
  if (score >= 0.60) return 'near';
  return 'assonance';
}

function mapSuggestions(raw: RhymeSuggestion[]): GroupedSuggestion[] {
  return raw
    .slice(0, MAX_RESULTS)
    .map(s => ({
      word:    s.word,
      nucleus: s.rhymeNucleus,
      score:   s.score,
      group:   classifyScore(s.score),
    }));
}

export function useRhymeSuggestions(
  lineText: string,
  lang: string,
  enabled: boolean,
): UseRhymeSuggestionsResult {
  const [suggestions, setSuggestions] = useState<GroupedSuggestion[]>([]);
  const [query,       setQuery]       = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setSuggestions([]);
      setQuery('');
      setIsLoading(false);
      return;
    }

    const word = extractLastWord(lineText);

    if (word.length < 2) {
      setSuggestions([]);
      setQuery(word);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (timerRef.current !== null) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      try {
        const result = suggestRhymes(word, lang === 'auto' ? undefined : lang);
        setSuggestions(mapSuggestions(result.suggestions));
        setQuery(word);
      } catch {
        setSuggestions([]);
        setQuery(word);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [lineText, lang, enabled]);

  return { suggestions, query, isLoading };
}
