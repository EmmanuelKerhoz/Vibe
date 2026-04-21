import React from 'react';
import { Loader2, Wand2, Plus } from '../ui/icons';
import { Tooltip } from '../ui/Tooltip';
import { InstructionEditor } from './InstructionEditor';
import { useTranslation } from '../../i18n';
import { useComposerContext } from '../../contexts/ComposerContext';
import { useSongMutation } from '../../contexts/SongMutationContext';
import type { SchemeResult } from '../../lib/rhyme/types';

// ─── Scheme badge ─────────────────────────────────────────────────────────────

function confidenceClass(confidence: number): string {
  if (confidence >= 0.70) return 'text-[var(--accent-color)] border-[var(--accent-color)]/40 bg-[var(--accent-color)]/8';
  if (confidence >= 0.45) return 'text-zinc-500 dark:text-zinc-400 border-zinc-400/30 bg-zinc-400/8';
  return 'text-zinc-400 dark:text-zinc-600 border-zinc-300/30 bg-transparent';
}

interface SchemeBadgeProps { label: string; confidence: number; isProxied: boolean; }

function SchemeBadge({ label, confidence, isProxied }: SchemeBadgeProps) {
  const colourCls = confidenceClass(confidence);
  const pct = Math.round(confidence * 100);
  const displayLabel = isProxied ? `~${label}` : label;
  const tooltipSuffix = isProxied ? ' (graphemic approximation)' : '';
  return (
    <Tooltip title={`Rhyme scheme \u2014 confidence ${pct}%${tooltipSuffix}`}>
      <span
        aria-label={`Rhyme scheme: ${displayLabel}, confidence ${pct}%${tooltipSuffix}`}
        className={`
          inline-flex items-center gap-0.5 select-none
          rounded border px-1.5 py-0.5
          font-mono text-[9px] uppercase tracking-[0.18em]
          transition-colors duration-200
          ${colourCls}
          ${isProxied ? 'opacity-70 italic' : ''}
        `}
      >
        {displayLabel}
      </span>
    </Tooltip>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SectionFooterProps {
  sectionId: string;
  hasLyrics: boolean;
  preInstructions: string[];
  postInstructions: string[];
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
  /** Pre-computed scheme result from parent SectionEditor (single hook instance). */
  schemeResult: SchemeResult | null;
  /**
   * When true, the scheme badge displays a "~" prefix and italic style to
   * indicate that the analysis relied on a graphemic proxy rather than a
   * native G2P strategy.
   * Typically forwarded from `SchemeResult.isProxied`.
   */
  isProxied?: boolean;
}

export const SectionFooter = React.memo(function SectionFooter({
  sectionId,
  hasLyrics,
  preInstructions, postInstructions,
  playAudioFeedback,
  schemeResult,
  isProxied,
}: SectionFooterProps) {
  const { t } = useTranslation();
  const { isGenerating, isRegeneratingSection, handleInstructionChange, addInstruction, removeInstruction, regenerateSection } = useComposerContext();
  const { addLineToSection } = useSongMutation();

  const showBadge = schemeResult !== null && !(schemeResult.label === 'FREE_VERSE' && schemeResult.confidence < 0.25);
  const proxied: boolean = (isProxied ?? schemeResult?.isProxied) === true;

  const canRegenerate = hasLyrics && !isRegeneratingSection(sectionId);
  const regenTooltip = !hasLyrics
    ? 'No lyrics to regenerate — add content first'
    : (t.tooltips?.regenerateSection ?? 'Regenerate this section');

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => { addLineToSection(sectionId); playAudioFeedback('click'); }}
        className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition"
      >
        <Plus className="h-3 w-3" />
        {t.editor.addLine ?? '+ ADD LINE'}
      </button>

      <InstructionEditor
        sectionId={sectionId}
        instructions={preInstructions}
        type="pre"
        onChange={handleInstructionChange}
        onAdd={addInstruction}
        onRemove={removeInstruction}
      />
      <InstructionEditor
        sectionId={sectionId}
        instructions={postInstructions}
        type="post"
        onChange={handleInstructionChange}
        onAdd={addInstruction}
        onRemove={removeInstruction}
      />

      {showBadge && schemeResult && (
        <span className="ml-auto">
          <SchemeBadge
            label={schemeResult.label}
            confidence={schemeResult.confidence}
            isProxied={proxied}
          />
        </span>
      )}

      {!isGenerating && (
        <Tooltip title={regenTooltip}>
          <button
            type="button"
            onClick={() => {
              if (!canRegenerate) return;
              regenerateSection(sectionId);
              playAudioFeedback('click');
            }}
            disabled={!canRegenerate}
            aria-label={regenTooltip}
            className={`
              flex items-center gap-1 text-[10px] uppercase tracking-[0.2em]
              text-zinc-600 dark:text-zinc-500
              hover:text-zinc-900 dark:hover:text-zinc-200
              transition disabled:opacity-40 disabled:cursor-not-allowed
              ${showBadge ? '' : 'ml-auto'}
            `}
          >
            {isRegeneratingSection(sectionId)
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Wand2 className="h-3 w-3" />}
            {t.editor?.regenerateSection ?? 'REGENERATE SECTION'}
          </button>
        </Tooltip>
      )}
    </div>
  );
});
