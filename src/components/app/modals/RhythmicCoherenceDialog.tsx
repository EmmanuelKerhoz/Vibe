/**
 * RhythmicCoherenceDialog — Fluent-UI-styled modal shown when the rhythmic
 * coherence score is below 70 after generating a musical prompt.
 *
 * Option A – Prioritise Lyrics: adjusts BPM suggestion.
 * Option B – Adjust Lyrics: shows which lines are too dense.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../ui/Button';
import { useTranslation } from '../../../i18n';
import { Activity } from '../../ui/icons';
import type { CoherenceResult, LineDiff } from '../../../lib/rhythmicCoherence';

interface Props {
  result: CoherenceResult;
  onApply: (option: 'a' | 'b', result: CoherenceResult) => void;
  onSkip: () => void;
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? '#22c55e'  // green
    : score >= 60 ? '#f59e0b' // orange/amber
    : '#ef4444';              // red

  return (
    <div className="w-full mt-2">
      <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--text-secondary)' }}>
        <span>0</span>
        <span style={{ color }}>
          {score}%
        </span>
        <span>100</span>
      </div>
      <div className="w-full h-2 rounded-full bg-[var(--border-color)]">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function RhythmicCoherenceDialog({ result, onApply, onSkip }: Props) {
  const { t } = useTranslation();
  const rc = t.rhythmicCoherence;
  const [selected, setSelected] = useState<'a' | 'b'>('a');

  const title = rc?.title ?? 'Rhythmic Coherence Check';
  const scoreLabel = rc?.scoreLabel ?? 'Match Score';
  const optionALabel = rc?.optionA ?? 'Prioritise Lyrics';
  const optionADesc = rc?.optionADescription ?? 'Adjust the musical prompt tempo/style to match the lyrics density.';
  const optionBLabel = rc?.optionB ?? 'Adjust Lyrics';
  const optionBDesc = rc?.optionBDescription ?? 'View lines that are too long and trim them.';
  const applyLabel = rc?.apply ?? 'Apply';
  const skipLabel = rc?.skip ?? 'Skip';
  const suggestedBpmTemplate = rc?.suggestedBpm ?? 'Suggested BPM range: {min}–{max}';
  const tooLongLinesLabel = rc?.tooLongLines ?? 'Lines that may be too dense:';
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const handleDialogKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onSkip();
      return;
    }
    if (e.key !== 'Tab') return;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const items = Array.from(focusable ?? []).filter(item => !item.hasAttribute('disabled'));
    if (items.length === 0) return;

    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const suggestedBpmText = suggestedBpmTemplate
    .replace('{min}', String(result.suggestedBpmRange[0]))
    .replace('{max}', String(result.suggestedBpmRange[1]));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onSkip}
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="coherence-dialog-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="relative w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)' }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b flex items-center gap-3"
          style={{ borderColor: 'var(--border-color)', background: 'var(--bg-elevated, var(--bg-sidebar))' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--accent-color) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-color) 25%, transparent)' }}
          >
            <Activity className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
          </div>
          <h2 id="coherence-dialog-title" className="text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Score */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              {scoreLabel}
            </p>
            <ScoreBar score={result.score} />
          </div>

          {/* Radio options */}
          <div className="space-y-2">
            {/* Option A */}
            <label className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${selected === 'a' ? 'ring-1 ring-[var(--accent-color)]' : ''}`}
              style={{ background: selected === 'a' ? 'color-mix(in srgb, var(--accent-color) 6%, transparent)' : 'var(--bg-input, var(--bg-sidebar))' }}>
              <input
                type="radio"
                name="coherence-option"
                value="a"
                checked={selected === 'a'}
                onChange={() => setSelected('a')}
                className="mt-0.5 accent-[var(--accent-color)]"
              />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{optionALabel}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{optionADesc}</p>
                {selected === 'a' && (
                  <p className="text-[11px] mt-1 font-mono" style={{ color: 'var(--accent-color)' }}>
                    {suggestedBpmText}
                  </p>
                )}
              </div>
            </label>

            {/* Option B */}
            <label className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${selected === 'b' ? 'ring-1 ring-[var(--accent-color)]' : ''}`}
              style={{ background: selected === 'b' ? 'color-mix(in srgb, var(--accent-color) 6%, transparent)' : 'var(--bg-input, var(--bg-sidebar))' }}>
              <input
                type="radio"
                name="coherence-option"
                value="b"
                checked={selected === 'b'}
                onChange={() => setSelected('b')}
                className="mt-0.5 accent-[var(--accent-color)]"
              />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{optionBLabel}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{optionBDesc}</p>
                {selected === 'b' && result.lineDiffs.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {tooLongLinesLabel}
                    </p>
                    {result.lineDiffs.slice(0, 5).map((d: LineDiff) => (
                      <p key={d.lineIndex} className="text-[11px] font-mono truncate" style={{ color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>L{d.lineIndex + 1}: </span>
                        {d.text}
                        <span className="ml-1" style={{ color: '#ef4444' }}>({d.syllables} syl)</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 border-t flex items-center justify-end gap-2"
          style={{ borderColor: 'var(--border-color)', background: 'var(--bg-elevated, var(--bg-sidebar))' }}
        >
          <Button variant="text" onClick={onSkip} size="small">
            {skipLabel}
          </Button>
          <Button variant="contained" color="primary" onClick={() => onApply(selected, result)} size="small">
            {applyLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
