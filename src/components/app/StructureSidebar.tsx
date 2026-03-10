import React, { useRef } from 'react';
import { Plus, ChevronDown, AlignLeft, PanelRight, X, BarChart2, GripVertical } from 'lucide-react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { AnimatePresence, motion } from 'motion/react';
import { IconButton } from '../ui/IconButton';
import { Input } from '../ui/Input';
import { useTranslation } from '../../i18n';
import { getSectionColor, getSectionDotColor } from '../../utils/songUtils';
import type { Section } from '../../types';

interface Props {
  isStructureOpen: boolean;
  setIsStructureOpen: (v: boolean) => void;
  structure: string[];
  song: Section[];
  newSectionName: string;
  setNewSectionName: (v: string) => void;
  isSectionDropdownOpen: boolean;
  setIsSectionDropdownOpen: (v: boolean) => void;
  draggedItemIndex: number | null;
  setDraggedItemIndex: (v: number | null) => void;
  dragOverIndex: number | null;
  setDragOverIndex: (v: number | null) => void;
  isGenerating: boolean;
  addStructureItem: (name?: string) => void;
  removeStructureItem: (idx: number) => void;
  normalizeStructure: () => void;
  handleDrop: (idx: number) => void;
  onScrollToSection: (sectionId: string) => void;
}

export function StructureSidebar({
  isStructureOpen, setIsStructureOpen,
  structure, song, newSectionName, setNewSectionName,
  isSectionDropdownOpen, setIsSectionDropdownOpen,
  draggedItemIndex, setDraggedItemIndex,
  dragOverIndex, setDragOverIndex,
  isGenerating, addStructureItem, removeStructureItem,
  normalizeStructure, handleDrop, onScrollToSection,
}: Props) {
  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sectionOptions = [
    t.sections.intro, t.sections.verse, t.sections.preChorus,
    t.sections.chorus, t.sections.bridge, t.sections.breakdown, t.sections.outro,
  ];

  return (
    <AnimatePresence>
      {isStructureOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="border-l border-fluent-border bg-fluent-sidebar flex flex-col z-10 shadow-2xl overflow-hidden lcars-panel !rounded-none"
        >
          <div className="w-[280px] flex flex-col h-full">
            <div className="h-16 px-5 border-b border-fluent-border flex items-center justify-between">
              <h3 className="micro-label text-zinc-400 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[var(--accent-color)]" />
                {t.structure.title}
              </h3>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
              <div>
                <div className="space-y-2">
                  <div className="flex flex-col gap-1.5">
                    {structure.map((item, idx) => {
                      const isIntro = item.toLowerCase() === 'intro';
                      const isOutro = item.toLowerCase() === 'outro';
                      const isDraggable = !isIntro && !isOutro;
                      // Find matching section id for scroll target
                      const sectionId = song[idx]?.id ?? null;
                      return (
                        <div
                          key={idx}
                          draggable={isDraggable}
                          onDragStart={() => isDraggable && setDraggedItemIndex(idx)}
                          onDragOver={(e) => {
                            e.preventDefault(); e.stopPropagation();
                            if (draggedItemIndex === null || draggedItemIndex === idx) return;
                            if (idx === 0 && structure[0].toLowerCase() === 'intro') return;
                            if (idx === structure.length - 1 && structure[structure.length - 1].toLowerCase() === 'outro') return;
                            setDragOverIndex(idx);
                          }}
                          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverIndex(null); }}
                          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDrop(idx); }}
                          className={`group flex items-center gap-2 border rounded-md pl-2 pr-1 py-2 text-xs transition-all duration-150 ${getSectionColor(item)} ${isDraggable ? 'cursor-grab active:cursor-grabbing hover:border-[var(--accent-color)]/50' : 'cursor-default'} ${draggedItemIndex === idx ? 'opacity-30' : ''} ${dragOverIndex === idx ? 'ring-2 ring-[var(--accent-color)] ring-offset-1 dark:ring-offset-zinc-900' : ''}`}
                        >
                          {isDraggable ? (
                            <GripVertical className="w-3.5 h-3.5 opacity-30 group-hover:opacity-60 transition-opacity" />
                          ) : (
                            <div className="w-3.5" />
                          )}
                          {/* Clickable label scrolls to section */}
                          <button
                            type="button"
                            className="flex-1 text-left truncate hover:text-[var(--accent-color)] transition-colors"
                            onClick={() => sectionId && onScrollToSection(sectionId)}
                            title={`Scroll to ${item}`}
                          >
                            {item}
                          </button>
                          <Tooltip title={t.tooltips.removeSection}>
                            <button onClick={() => removeStructureItem(idx)} className="p-1 hover:bg-black/20 rounded transition-colors opacity-0 group-hover:opacity-100">
                              <X className="w-3 h-3" />
                            </button>
                          </Tooltip>
                        </div>
                      );
                    })}
                  </div>

                  <div className="relative" ref={dropdownRef}>
                    <div className="flex gap-1.5 mt-3">
                      <div className="relative flex-1">
                        <Input
                          value={newSectionName}
                          onChange={e => { setNewSectionName(e.target.value); setIsSectionDropdownOpen(true); }}
                          onFocus={() => setIsSectionDropdownOpen(true)}
                          placeholder={t.structure.addSection}
                          onKeyDown={e => e.key === 'Enter' && addStructureItem()}
                        />
                        <button
                          onClick={() => setIsSectionDropdownOpen(!isSectionDropdownOpen)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSectionDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      <Tooltip title={t.tooltips.addSection}>
                        <IconButton onClick={() => addStructureItem()} color="primary" style={{ backgroundColor: 'var(--accent-color)', color: 'var(--on-accent-color)', borderRadius: '8px' }}>
                          <Plus className="w-4 h-4" />
                        </IconButton>
                      </Tooltip>
                    </div>
                    {isSectionDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1 py-1 bg-fluent-card border border-fluent-border rounded-md shadow-xl z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 lcars-panel">
                        {sectionOptions
                          .filter(name => {
                            if (name === t.sections.intro || name === t.sections.outro) {
                              return !structure.some(s => s.toLowerCase() === name.toLowerCase());
                            }
                            return true;
                          })
                          .map(name => (
                            <button
                              key={name}
                              onClick={() => { addStructureItem(name); setIsSectionDropdownOpen(false); }}
                              className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 transition-colors flex items-center gap-2"
                            >
                              <Plus className="w-3 h-3 text-[var(--accent-color)]" />
                              {name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  <Tooltip title={t.tooltips.normalizeStructure}>
                    <Button
                      onClick={normalizeStructure}
                      disabled={structure.length === 0 || isGenerating}
                      variant="outlined" fullWidth
                      startIcon={<AlignLeft className="w-3.5 h-3.5" />}
                      style={{ fontSize: '10px', padding: '4px 0' }}
                      className="mt-4"
                    >
                      {t.structure.normalize}
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-fluent-border">
              <Tooltip title={t.tooltips.collapseRight}>
                <button
                  onClick={() => setIsStructureOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-[10px] uppercase tracking-widest text-[var(--accent-color)] hover:text-[var(--accent-color)]/80 transition-colors"
                >
                  <PanelRight className="w-3.5 h-3.5" />
                  {t.structure.collapse}
                </button>
              </Tooltip>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
