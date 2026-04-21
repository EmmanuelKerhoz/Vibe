import { useCallback, useMemo, useRef, useState } from 'react';
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

  const reset = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    runId.current += 1;
    setStatus('idle');
    setAssessment(null);
    setError(null);
  }, []);

  const runCheck = useCallback((input: CheckerInput) => {
    if (timer.current) clearTimeout(timer.current);
    if (!input.text.trim()) {
      reset();
      return;
    }
    timer.current = setTimeout(() => {
      const myRun = ++runId.current;
      setStatus('running');
      setError(null);
      const submission = buildSubmission(input, config);
      engine
        .assess(submission)
        .then((res) => {
          if (myRun !== runId.current) return; // superseded
          setAssessment(res);
          setStatus('done');
        })
        .catch((err: unknown) => {
          if (myRun !== runId.current) return;
          setError(err instanceof Error ? err.message : 'Unknown error');
          setStatus('error');
        });
    }, debounceMs);
  }, [engine, config, debounceMs, reset]);

  return { status, assessment, error, runCheck, reset };
};
