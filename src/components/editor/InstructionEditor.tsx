import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { MUSICAL_INSTRUCTIONS } from '../../utils/songUtils';

export const InstructionEditor = ({
  instructions,
  sectionId,
  type,
  onChange,
  onAdd,
  onRemove,
}: {
  instructions?: string[];
  sectionId: string;
  type: 'pre' | 'post';
  onChange: (sectionId: string, type: 'pre' | 'post', index: number, value: string) => void;
  onAdd: (sectionId: string, type: 'pre' | 'post') => void;
  onRemove: (sectionId: string, type: 'pre' | 'post', index: number) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasInstructions = instructions && instructions.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors uppercase"
        >
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
          Musical / Modulation {hasInstructions && `(${instructions.length})`}
        </button>
        {!isExpanded && hasInstructions && (
          <div className="flex gap-1 overflow-hidden max-w-[150px]">
            {instructions.slice(0, 2).map((inst, i) => (
              <span key={i} className="text-[9px] px-1.5 py-0.5 bg-zinc-100 dark:bg-white/5 text-zinc-500 rounded border border-zinc-200 dark:border-white/10 truncate max-w-[60px]">
                {inst}
              </span>
            ))}
            {instructions.length > 2 && <span className="text-[9px] text-zinc-400">+{instructions.length - 2}</span>}
          </div>
        )}
      </div>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="space-y-2 overflow-hidden"
        >
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
                className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => onAdd(sectionId, type)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 rounded-md transition-colors border border-dashed border-[var(--accent-color)]/30 w-full justify-center"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Instruction
          </button>
        </motion.div>
      )}
    </div>
  );
};
