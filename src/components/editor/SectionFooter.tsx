import React from 'react';
import { Loader2, Wand2, Plus } from '../ui/icons';
import { Tooltip } from '../ui/Tooltip';
import { InstructionEditor } from './InstructionEditor';
import { useTranslation } from '../../i18n';
import { useComposerContext } from '../../contexts/ComposerContext';
import { useSongMutation } from '../../contexts/SongMutationContext';

interface SectionFooterProps {
  sectionId: string;
  preInstructions: string[];
  postInstructions: string[];
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
}

export const SectionFooter = React.memo(function SectionFooter({
  sectionId,
  preInstructions, postInstructions,
  playAudioFeedback,
}: SectionFooterProps) {
  const { t } = useTranslation();
  const { isGenerating, isRegeneratingSection, handleInstructionChange, addInstruction, removeInstruction, regenerateSection } = useComposerContext();
  const { addLineToSection } = useSongMutation();

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
      {!isGenerating && (
        <Tooltip title={t.tooltips?.regenerateSection ?? 'Regenerate this section'}>
          <button
            type="button"
            onClick={() => { regenerateSection(sectionId); playAudioFeedback('click'); }}
            disabled={isRegeneratingSection(sectionId)}
            className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
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
