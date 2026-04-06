import React from 'react';
import { X, Plus } from '../ui/icons';
import { MUSICAL_INSTRUCTIONS } from '../../constants/editor';

export const InstructionEditor = ({ 
  instructions, 
  sectionId, 
  type, 
  onChange, 
  onAdd, 
  onRemove,
  showAddButton = true,
}: { 
  instructions?: string[], 
  sectionId: string, 
  type: 'pre' | 'post',
  onChange: (sectionId: string, type: 'pre' | 'post', index: number, value: string) => void,
  onAdd: (sectionId: string, type: 'pre' | 'post') => void,
  onRemove: (sectionId: string, type: 'pre' | 'post', index: number) => void,
  showAddButton?: boolean,
}) => {
  const hasInstructions = instructions && instructions.length > 0;

  if (!hasInstructions && !showAddButton) return null;

  return (
    <div className="space-y-2">
      {instructions?.map((inst, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              value={inst}
              onChange={(e) => onChange(sectionId, type, idx, e.target.value)}
              placeholder="e.g. [Guitar Solo]"
              className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-md px-3 py-1.5 text-xs text-[var(--accent-color)] font-mono focus:outline-none focus:border-[var(--accent-color)]/50 transition-colors"
              list={`instructions-list-${sectionId}-${type}-${idx}`}
            />
            <datalist id={`instructions-list-${sectionId}-${type}-${idx}`}>
              {MUSICAL_INSTRUCTIONS.map(option => (
                <option key={option} value={`[${option}]`} />
              ))}
            </datalist>
          </div>
          <button
            onClick={() => onRemove(sectionId, type, idx)}
            className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      {showAddButton && (
        <button
          onClick={() => onAdd(sectionId, type)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 rounded-md transition-colors border border-dashed border-[var(--accent-color)]/30 w-full justify-center"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Musical / Modulation / Effect
        </button>
      )}
    </div>
  );
};
