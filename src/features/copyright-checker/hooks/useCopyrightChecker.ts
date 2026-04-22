import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SourceType } from '../domain/enums';
import type {
  CheckerConfig,
  LanguageCode,
  RiskAssessment,
  SubmittedLyricDocument,
} from '../domain/types';
import { DEFAULT_CHECKER_CONFIG } from '../domain/config';
import { buildNormalizedDocumentFields } from '../utils/normalizeLyrics';
import { SimilarityEngine } from '../services/similarity/SimilarityEngine';
import type { ReferenceCorpusRepository } from '../services/repository/ReferenceCorpusRepository';
import type { EmbeddingProvider } from '../services/similarity/SemanticMatcher';

export type CheckerStatus = 'idle' | 'running' | 'done' | 'error';

/** Default upper bound on submitted lyric size (characters). Acts as a
 *  defence-in-depth against pathological inputs that could DoS the
 *  in-browser matchers (n-gram explosion, embedding workloads, etc.). */
export const DEFAULT_MAX_LYRICS_LENGTH = 50_000;

/**
 * Accepted shape for a {@link LanguageCode}: a 2–3 letter base tag,
 * optionally followed by a 2-letter region subtag (e.g. "en", "fr",
 * "pt-BR"). Matched case-insensitively; the value is normalized to
 * lowercase base + uppercase region before being forwarded to the
 * matchers, mirroring BCP 47 conventions for the small subset we use.
 */
const LANGUAGE_CODE_PATTERN = /^[A-Za-z]{2,3}(?:-[A-Za-z]{2})?$/;

/**
 * Validate and normalize a user-provided language tag.
 * Returns the normalized lowercase base (with optional uppercase region)
 * when valid, or `null` when the value cannot be interpreted as a language
 * code. Empty / whitespace-only values are treated as "unspecified".
 */
export const normalizeLanguageCode = (
  raw: string | undefined,
): LanguageCode | null | undefined => {
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return undefined;
  if (!LANGUAGE_CODE_PATTERN.test(trimmed)) return null;
  const dash = trimmed.indexOf('-');
  if (dash === -1) return trimmed.toLowerCase();
  return `${trimmed.slice(0, dash).toLowerCase()}-${trimmed.slice(dash + 1).toUpperCase()}`;
};

export interface CheckerInput {
  readonly text: string;
  readonly title?: string;
  readonly artist?: string;
  readonly language?: LanguageCode;
}

export interface UseCopyrightCheckerOptions {
  readonly repository: ReferenceCorpusRepository;
  readonly config?: CheckerConfig;
  readonly embeddings?: EmbeddingProvider;
  /** Debounce window for `runCheck`. Defaults to 350 ms. */
  readonly debounceMs?: number;
  /** Hard cap on submitted lyrics length (characters). Defaults to
   *  {@link DEFAULT_MAX_LYRICS_LENGTH}. Submissions above the cap are
   *  rejected with an `error` status instead of being processed. */
  readonly maxLyricsLength?: number;
}

export interface UseCopyrightCheckerResult {
  readonly status: CheckerStatus;
  readonly assessment: RiskAssessment | null;
  readonly error: string | null;
  readonly runCheck: (input: CheckerInput) => void;
  readonly reset: () => void;
}

const buildSubmission = (
  input: CheckerInput,
  config: CheckerConfig,
): SubmittedLyricDocument => {
  const fields = buildNormalizedDocumentFields(input.text, {
    config,
    ...(input.language ? { language: input.language } : {}),
  });
  return {
    id: `submission-${Date.now()}`,
    sourceType: SourceType.USER_SUBMITTED,
    ...(input.title ? { title: input.title } : {}),
    ...(input.artist ? { artist: input.artist } : {}),
    ...(input.language ? { language: input.language } : {}),
    ...fields,
  };
};

/**
 * React hook orchestrating the similarity checker. Debounces calls and
 * keeps the last assessment in memory only — never persists raw text.
 */
export const useCopyrightChecker = (
  options: UseCopyrightCheckerOptions,
): UseCopyrightCheckerResult => {
  const config = options.config ?? DEFAULT_CHECKER_CONFIG;
  const debounceMs = options.debounceMs ?? 350;
  const maxLyricsLength = options.maxLyricsLength ?? DEFAULT_MAX_LYRICS_LENGTH;

  const engine = useMemo(
    () => new SimilarityEngine({
      repository: options.repository,
      config,
      ...(options.embeddings ? { embeddings: options.embeddings } : {}),
    }),
    [options.repository, options.embeddings, config],
  );

  const [status, setStatus] = useState<CheckerStatus>('idle');
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runId = useRef(0);
  const inflight = useRef<AbortController | null>(null);
  const mounted = useRef(true);

  const cancelInflight = useCallback((): void => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (inflight.current) {
      inflight.current.abort();
      inflight.current = null;
    }
    runId.current += 1;
  }, []);

  const reset = useCallback(() => {
    cancelInflight();
    setStatus('idle');
    setAssessment(null);
    setError(null);
  }, [cancelInflight]);

  const runCheck = useCallback((input: CheckerInput) => {
    if (timer.current) clearTimeout(timer.current);
    if (!input.text.trim()) {
      reset();
      return;
    }
    if (input.text.length > maxLyricsLength) {
      // Supersede any pending run before reporting the validation error.
      cancelInflight();
      if (!mounted.current) return;
      setAssessment(null);
      setError(`Lyrics exceed maximum length of ${maxLyricsLength} characters`);
      setStatus('error');
      return;
    }
    const normalizedLanguage = normalizeLanguageCode(input.language);
    if (normalizedLanguage === null) {
      cancelInflight();
      if (!mounted.current) return;
      setAssessment(null);
      setError(
        `Invalid language code "${input.language}" — expected a BCP 47 tag like "en" or "pt-BR"`,
      );
      setStatus('error');
      return;
    }
    let validatedInput: CheckerInput;
    if (normalizedLanguage) {
      validatedInput = { ...input, language: normalizedLanguage };
    } else {
      // Omit the optional `language` field entirely when unspecified
      // (exactOptionalPropertyTypes is enabled, so `undefined` ≠ absent).
      const { language: _omit, ...rest } = input;
      void _omit;
      validatedInput = rest;
    }
    timer.current = setTimeout(() => {
      timer.current = null;
      const myRun = ++runId.current;
      // Cancel any previous in-flight assessment before starting a new one.
      if (inflight.current) inflight.current.abort();
      const controller = new AbortController();
      inflight.current = controller;
      setStatus('running');
      setError(null);
      const submission = buildSubmission(validatedInput, config);
      engine
        .assess(submission, { signal: controller.signal })
        .then((res) => {
          if (myRun !== runId.current || !mounted.current) return; // superseded / unmounted
          setAssessment(res);
          setStatus('done');
        })
        .catch((err: unknown) => {
          if (myRun !== runId.current || !mounted.current) return;
          // Swallow expected aborts: those are not user-visible errors.
          if (controller.signal.aborted) return;
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setError(err instanceof Error ? err.message : 'Unknown error');
          setStatus('error');
        })
        .finally(() => {
          if (inflight.current === controller) inflight.current = null;
        });
    }, debounceMs);
  }, [engine, config, debounceMs, maxLyricsLength, reset, cancelInflight]);

  // Cleanup on unmount: clear pending debounce timer and abort any in-flight
  // assessment so we never call setState on an unmounted component and never
  // leak a setTimeout handle.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      if (inflight.current) {
        inflight.current.abort();
        inflight.current = null;
      }
    };
  }, []);

  return { status, assessment, error, runCheck, reset };
};
