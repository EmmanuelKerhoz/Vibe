import React from 'react';
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from '../ui/icons';
import { useTranslation } from '../../i18n';
import type { AdaptationProgress, AdaptationResult } from '../../hooks/analysis/useLanguageAdapter';

export const ORDERED_STEP_IDS = ['adapting', 'reversing', 'reviewing', 'done'] as const;

type OrderedStepId = typeof ORDERED_STEP_IDS[number];

export function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

export function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-400/10 border-emerald-400/30';
  if (score >= 60) return 'bg-amber-400/10 border-amber-400/30';
  return 'bg-red-400/10 border-red-400/30';
}

function StepIndicatorRow({
  active,
  isDone,
  isFailed,
}: {
  active: AdaptationProgress['active'];
  isDone: boolean;
  isFailed: boolean;
}) {
  const { t } = useTranslation();
  const stepLabels: Record<OrderedStepId, string> = {
    adapting: t.adaptationProgress?.adapting ?? 'Adapting',
    reversing: t.adaptationProgress?.reversing ?? 'Reversing',
    reviewing: t.adaptationProgress?.reviewing ?? 'Reviewing',
    done: t.adaptationProgress?.done ?? 'Done',
  };
  const effectiveActiveStepId: OrderedStepId = isFailed
    ? 'reviewing'
    : active === 'done'
    ? 'done'
    : active as OrderedStepId;
  const activeIdx = ORDERED_STEP_IDS.indexOf(effectiveActiveStepId);

  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {ORDERED_STEP_IDS.map((stepId, idx) => {
        const stepDone = isDone || idx < activeIdx;
        const stepActive = !isDone && !isFailed && idx === activeIdx;
        const stepLabel = stepLabels[stepId];

        return (
          <React.Fragment key={stepId}>
            <div className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  stepDone
                    ? 'bg-emerald-400'
                    : stepActive
                    ? 'bg-[var(--accent-color)] animate-pulse'
                    : 'bg-white/15'
                }`}
              />
              <span
                className={`whitespace-nowrap ${
                  stepDone
                    ? 'text-emerald-400'
                    : stepActive
                    ? 'text-[var(--accent-color)] font-semibold'
                    : 'text-zinc-600'
                }`}
              >
                {stepLabel}
              </span>
            </div>
            {idx < ORDERED_STEP_IDS.length - 1 && (
              <span className="text-zinc-700 mx-0.5">›</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function AdaptationProgressBanner({
  progress,
  result,
  onDismiss,
  isOverlay,
}: {
  progress: AdaptationProgress;
  result: AdaptationResult | null;
  onDismiss: () => void;
  isOverlay?: boolean;
}) {
  const { t } = useTranslation();
  if (progress.active === 'idle') return null;

  const isFailed = progress.active === 'failed';
  const isDone = progress.active === 'done';

  const banner = (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`w-full rounded border px-3 py-2 ${isOverlay ? 'mt-0' : 'mt-1'} flex flex-col gap-1.5 text-[10px] ${
        isFailed
          ? 'bg-red-400/5 border-red-400/20'
          : isDone && result
          ? scoreBg(result.score)
          : 'bg-white/3 border-white/10'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold tracking-wider uppercase text-zinc-300">
          {isFailed
            ? <XCircle className="w-3 h-3 text-red-400" aria-hidden="true" />
            : isDone && result
            ? result.accepted
              ? <CheckCircle2 className="w-3 h-3 text-emerald-400" aria-hidden="true" />
              : <AlertTriangle className="w-3 h-3 text-amber-400" aria-hidden="true" />
            : <Loader2 className="w-3 h-3 animate-spin text-[var(--accent-color)]" aria-hidden="true" />}
          <span className="text-zinc-400">{progress.label}</span>
        </div>
        {(isDone || isFailed) && (
          <button
            onClick={onDismiss}
            className="text-zinc-500 hover:text-zinc-300 transition-colors leading-none px-1"
            aria-label={t.adaptationProgress?.dismissResult ?? 'Dismiss adaptation result'}
          >
            ✕
          </button>
        )}
      </div>

      <StepIndicatorRow active={progress.active} isDone={isDone} isFailed={isFailed} />

      {isDone && result && (
        <div className="flex flex-col gap-1 mt-0.5">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">{t.adaptationProgress?.fidelityScore ?? 'Fidelity score'}</span>
            <span className={`font-bold tabular-nums ${scoreColor(result.score)}`}>
              {result.score}/100
            </span>
            {!result.accepted && (
              <span className="text-amber-400 italic">— {t.adaptationProgress?.reviewRecommended ?? 'review recommended'}</span>
            )}
          </div>
          {result.warnings.length > 0 && (
            <ul className="flex flex-col gap-0.5 list-none pl-0 mt-0.5">
              {result.warnings.map((warning, index) => (
                <li key={index} className="flex items-start gap-1 text-amber-300/80">
                  <span className="mt-0.5 shrink-0">·</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isFailed && (
        <span className="text-red-400">{t.adaptationProgress?.pipelineFailed ?? 'Adaptation pipeline failed. Check console for details.'}</span>
      )}
    </div>
  );

  if (isOverlay && !isDone && !isFailed) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden adaptation-particles" aria-hidden="true" />
        <div className="relative z-10 w-full max-w-md glass-panel border border-[var(--accent-color)]/20 rounded-2xl p-6 shadow-2xl adaptation-modal-glow">
          {banner}
        </div>
      </div>
    );
  }

  return banner;
}
