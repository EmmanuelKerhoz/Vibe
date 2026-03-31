import React from 'react';
import { Loader2, Wand2, Plus } from '../ui/icons';
import { Tooltip } from '../ui/Tooltip';
import { InstructionEditor } from './InstructionEditor';
import { useTranslation } from '../../i18n';

interface SectionFooterProps {
  sectionId: string;
  preInstructions: string[];
  postInstructions: string[];
  isGenerating: boolean;
  isRegeneratingSection: (sectionId: string) => boolean;
  addLineToSection: (sectionId: string, afterLineId?: string) => void;
  handleInstructionChange: (sectionId: string, type: 'pre' | 'post', index: number, value: string) => void;
  addInstruction: (sectionId: string, type: 'pre' | 'post') => void;
  removeInstruction: (sectionId: string, type: 'pre' | 'post', index: number) => void;
  regenerateSection: (sectionId: string) => void;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
}

export const SectionFooter = React.memo(function SectionFooter({
  sectionId,
  preInstructions, postInstructions,
  isGenerating, isRegeneratingSection,
  addLineToSection,
  handleInstructionChange, addInstruction, removeInstruction,
  regenerateSection, playAudioFeedback,
}: SectionFooterProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => { addLineToSection(sectionId); playAudioFeedback('click'); }}
        className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-200 transition"
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
            className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
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
