import React from 'react';
import { Loader2, Wand2, Plus } from '../ui/icons';
import { Tooltip } from '../ui/Tooltip';
import { InstructionEditor } from './InstructionEditor';
import { useTranslation } from '../../i18n';
import { useComposerContext } from '../../contexts/ComposerContext';
import { useSongMutation } from '../../contexts/SongMutationContext';
import { useRhymeScheme } from '../../hooks/useRhymeScheme';

// ─── Scheme badge ─────────────────────────────────────────────────────────────

/** Maps confidence [0..1] to a Tailwind colour class triplet. */
function confidenceClass(confidence: number): string {
  if (confidence >= 0.70) return 'text-[var(--accent-color)] border-[var(--accent-color)]/40 bg-[var(--accent-color)]/8';
  if (confidence >= 0.45) return 'text-zinc-500 dark:text-zinc-400 border-zinc-400/30 bg-zinc-400/8';
  return 'text-zinc-400 dark:text-zinc-600 border-zinc-300/30 bg-transparent';
}

interface SchemeBadgeProps {
  label: string;
  confidence: number;
}

function SchemeBadge({ label, confidence }: SchemeBadgeProps) {
  const colourCls = confidenceClass(confidence);
  const pct = Math.round(confidence * 100);
  return (
    <Tooltip title={`Rhyme scheme \u2014 confidence ${pct}%`}>
      <span
        aria-label={`Rhyme scheme: ${label}, confidence ${pct}%`}
        className={`
          inline-flex items-center gap-0.5 select-none
          rounded border px-1.5 py-0.5
          font-mono text-[9px] uppercase tracking-[0.18em]
          transition-colors duration-200
          ${colourCls}
        `}
      >
        {label}
      </span>
    </Tooltip>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SectionFooterProps {
  sectionId: string;
  preInstructions: string[];
  postInstructions: string[];
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
  /** Lyric line texts for scheme detection (filtered from section.lines). */
  lineTexts: string[];
  /** Active language for this section (ISO code or 'auto'). */
  lang: string;
}

export const SectionFooter = React.memo(function SectionFooter({
  sectionId,
  preInstructions, postInstructions,
  playAudioFeedback,
  lineTexts,
  lang,
}: SectionFooterProps) {
  const { t } = useTranslation();
  const { isGenerating, isRegeneratingSection, handleInstructionChange, addInstruction, removeInstruction, regenerateSection } = useComposerContext();
  const { addLineToSection } = useSongMutation();

  const scheme = useRhymeScheme(lineTexts, lang);

  // Only show the badge when a scheme was detected and is not pure free verse
  // with very low confidence (would just add noise).
  const showBadge = scheme !== null && !(scheme.label === 'FREE_VERSE' && scheme.confidence < 0.25);

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

      {/* Rhyme scheme badge — pushed right, before regenerate */}
      {showBadge && scheme && (
        <span className="ml-auto">
          <SchemeBadge label={scheme.label} confidence={scheme.confidence} />
        </span>
      )}

      {!isGenerating && (
        <Tooltip title={t.tooltips?.regenerateSection ?? 'Regenerate this section'}>
          <button
            type="button"
            onClick={() => { regenerateSection(sectionId); playAudioFeedback('click'); }}
            disabled={isRegeneratingSection(sectionId)}
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
