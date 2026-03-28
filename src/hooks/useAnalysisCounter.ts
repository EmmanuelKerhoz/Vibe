import { useState, useCallback, useRef } from 'react';

/**
 * Pure counter hook: tracks the number of concurrent analysis operations
 * and exposes a stable `isAnalyzing` boolean.
 *
 * Rules:
 * - isAnalyzing becomes true on the first beginAnalyzing() call.
 * - isAnalyzing stays true while any op is still running (counter > 0).
 * - isAnalyzing becomes false only when the counter reaches 0.
 * - Excess endAnalyzing() calls are clamped to 0 (never negative).
 *
 * Extracted from useSongAnalysis so the logic can be tested
 * independently without mounting the full analysis sub-hook tree.
 */
export function useAnalysisCounter() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const counterRef = useRef(0);

  const beginAnalyzing = useCallback(() => {
    counterRef.current += 1;
    setIsAnalyzing(true);
  }, []);

  const endAnalyzing = useCallback(() => {
    counterRef.current = Math.max(0, counterRef.current - 1);
    if (counterRef.current === 0) {
      setIsAnalyzing(false);
    }
  }, []);

  /** Adapter for sub-hooks that use a boolean setter interface. */
  const setIsAnalyzingForSubhook = useCallback(
    (value: boolean) => { if (value) { beginAnalyzing(); } else { endAnalyzing(); } },
    [beginAnalyzing, endAnalyzing],
  );

  return { isAnalyzing, beginAnalyzing, endAnalyzing, setIsAnalyzingForSubhook };
}
