import React, { useRef } from 'react';
import { Plus, ChevronDown, AlignLeft, X, BarChart2, GripVertical, Link2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { AnimatePresence, motion } from 'motion/react';
import { IconButton } from '../ui/IconButton';
import { Input } from '../ui/Input';
import { useTranslation } from '../../i18n';
import { getSectionColor, getSectionDotColor, getSectionTextColor } from '../../utils/songUtils';
import type { Section } from '../../types';
import { getSectionTooltipText, isAnchoredEndSection, isAnchoredStartSection, SECTION_TYPE_OPTIONS } from '../../constants/sections';

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
  isMobileOverlay?: boolean;
  className?: string;
}

/** Detect a Pre-Chorus/Chorus pair: returns true if item at idx is a Pre-Chorus
 *  and the next item is a Chorus (any casing / numbering). */
function isPreChorusOf(current: string, next: string | undefined): boolean {
  if (!next) return false;
  return /pre.?chorus/i.test(current) && /^chorus/i.test(next);
}

export function StructureSidebar({
  isStructureOpen, setIsStructureOpen,
  structure, song, newSectionName, setNewSectionName,
  isSectionDropdownOpen, setIsSectionDropdownOpen,
  draggedItemIndex, setDraggedItemIndex,
  dragOverIndex, setDragOverIndex,
  isGenerating, addStructureItem, removeStructureItem,
  normalizeStructure, handleDrop, onScrollToSection,
  isMobileOverlay = false,
  className,
}: Props) {
  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsStructureOpen(false);
  };

  /** Drop handler for grouped Pre-Chorus+Chorus: moves both items together. */
  const handleGroupDrop = (targetIdx: number) => {
    if (draggedItemIndex === null) return;
    handleDrop(targetIdx);
    // The second item of the group follows immediately after
    // handleDrop will have shifted indices; we trigger a second drop for the pair.
    // Since handleDrop operates on the current draggedItemIndex state, we
    // simply call it twice: parent's handleDrop must be idempotent per call.
    // This relies on parent re-rendering between calls, so we use setTimeout.
    const pairIdx = draggedItemIndex + 1;
    const adjustedTarget = targetIdx < draggedItemIndex ? targetIdx + 1 : targetIdx + 1;
    window.setTimeout(() => {
      // Re-trigger with the chorus index
      setDraggedItemIndex(pairIdx);
      window.setTimeout(() => handleDrop(adjustedTarget), 0);
    }, 0);
  };

  const sectionOptions = SECTION_TYPE_OPTIONS;

  // Build a set of indices to skip (Chorus items already rendered as part of a group)
  const groupedChorusIndices = new Set<number>();
  structure.forEach((item, idx) => {
    if (isPreChorusOf(item, structure[idx + 1])) {
      groupedChorusIndices.add(idx + 1);
    }
  });

  return (
    <AnimatePresence>
      {isStructureOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`border-l border-fluent-border bg-fluent-sidebar flex flex-col z-50 shadow-2xl lcars-panel fluent-animate-panel !rounded-none${className ? ` ${className}` : ''}`}
          style={{ overflow: 'visible' }}
        >
          {/* LCARS gradient separator — left edge */}
          <div style={{
            position: 'absolute',
            top: 0, left: -1, bottom: 0,
            width: '2px',
            background: 'linear-gradient(180deg, var(--lcars-amber) 0%, var(--lcars-cyan) 50%, var(--lcars-violet) 100%)',
            opacity: 0.85,
            pointerEvents: 'none',
            zIndex: 10,
          }} />
          <div className="w-[280px] flex flex-col h-full overflow-hidden">

            <div className="h-16 px-5 flex items-center justify-between" style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: 'var(--accent-rail-thickness, 2px)',
                background: 'var(--accent-rail-gradient-h)',
                opacity: 0.85, pointerEvents: 'none', zIndex: 1,
              }} />
              <h3 className="micro-label text-zinc-400 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[var(--accent-color)]" />
                <span className="text-[10px] uppercase tracking-widest font-semibold">{t.structure.title}</span>
              </h3>
              {isMobileOverlay && (
                <button
                  onClick={handleClose}
                  className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded"
                  aria-label="Close structure panel"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
              <div>
                <div className="space-y-2">
                  <div className="flex flex-col gap-1.5">
                    {structure.map((item, idx) => {
                      // Skip chorus items already rendered inside a Pre-Chorus group
                      if (groupedChorusIndices.has(idx)) return null;

                      const isGroupLeader = isPreChorusOf(item, structure[idx + 1]);
                      const chorusItem = isGroupLeader ? structure[idx + 1] : undefined;
                      const chorusIdx = isGroupLeader ? idx + 1 : undefined;

                      const isIntro = isAnchoredStartSection(item);
                      const isOutro = isAnchoredEndSection(item);
                      const isDraggable = !isIntro && !isOutro;
                      const sectionId = song[idx]?.id ?? null;
                      const chorusSectionId = chorusIdx !== undefined ? (song[chorusIdx]?.id ?? null) : null;

                      const SectionRow = ({ sectionItem, sectionIdx, sectionId: sid, draggable: drag }: {
                        sectionItem: string;
                        sectionIdx: number;
                        sectionId: string | null;
                        draggable: boolean;
                      }) => (
                        <div
                          draggable={drag}
                          onDragStart={() => drag && setDraggedItemIndex(sectionIdx)}
                          onDragOver={(e) => {
                            e.preventDefault(); e.stopPropagation();
                            if (draggedItemIndex === null || draggedItemIndex === sectionIdx) return;
                            if (sectionIdx === 0 && isAnchoredStartSection(structure[0] ?? '')) return;
                            if (sectionIdx === structure.length - 1 && isAnchoredEndSection(structure[structure.length - 1] ?? '')) return;
                            setDragOverIndex(sectionIdx);
                          }}
                          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverIndex(null); }}
                          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDrop(sectionIdx); }}
                          className={`group flex items-center gap-3 rounded-[16px_6px_16px_6px] border bg-[var(--bg-card)]/85 shadow-sm pl-3 pr-2 py-2.5 text-xs transition-all duration-200 ${getSectionColor(sectionItem)} ${drag ? 'cursor-grab active:cursor-grabbing hover:border-[var(--accent-color)]/40 hover:bg-[var(--bg-card)]' : 'cursor-default'} ${draggedItemIndex === sectionIdx ? 'opacity-30' : ''} ${dragOverIndex === sectionIdx ? 'ring-2 ring-[var(--accent-color)] ring-offset-1 dark:ring-offset-zinc-900' : ''}`}
                        >
                          <span className={`h-7 w-1.5 rounded-full ${getSectionDotColor(sectionItem)}`} aria-hidden="true" />
                          {drag ? (
                            <GripVertical className="w-3.5 h-3.5 opacity-30 group-hover:opacity-60 transition-opacity" />
                          ) : (
                            <div className="w-3.5" />
                          )}
                          <Tooltip title={getSectionTooltipText(sectionItem)}>
                            <button
                              type="button"
                              className={`flex-1 text-left truncate transition-colors ${getSectionTextColor(sectionItem)} hover:text-[var(--accent-color)]`}
                              onClick={() => sid && onScrollToSection(sid)}
                            >
                              {sectionItem}
                            </button>
                          </Tooltip>
                          <Tooltip title={t.tooltips.removeSection}>
                            <button onClick={() => removeStructureItem(sectionIdx)} className="p-1 hover:bg-black/20 rounded transition-colors opacity-0 group-hover:opacity-100">
                              <X className="w-3 h-3" />
                            </button>
                          </Tooltip>
                        </div>
                      );

                      if (isGroupLeader && chorusItem !== undefined && chorusIdx !== undefined) {
                        // Render Pre-Chorus + Chorus as a coupled group
                        return (
                          <div
                            key={idx}
                            draggable={isDraggable}
                            onDragStart={() => isDraggable && setDraggedItemIndex(idx)}
                            onDragOver={(e) => {
                              e.preventDefault(); e.stopPropagation();
                              if (draggedItemIndex === null || draggedItemIndex === idx) return;
                              if (idx === 0 && isAnchoredStartSection(structure[0] ?? '')) return;
                              if (idx === structure.length - 1 && isAnchoredEndSection(structure[structure.length - 1] ?? '')) return;
                              setDragOverIndex(idx);
                            }}
                            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverIndex(null); }}
                            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleGroupDrop(idx); }}
                            className={`relative flex flex-col gap-0 ${dragOverIndex === idx ? 'ring-2 ring-[var(--accent-color)] ring-offset-1 dark:ring-offset-zinc-900 rounded-[16px_6px_16px_6px]' : ''}`}
                          >
                            {/* Link indicator */}
                            <div className="absolute left-[18px] top-[calc(50%-8px)] bottom-[calc(50%-8px)] w-px bg-[var(--accent-color)] opacity-30 pointer-events-none" style={{ top: '38px', bottom: '38px' }} />
                            <div className="absolute left-[12px] top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                              <Link2 className="w-3 h-3 text-[var(--accent-color)] opacity-50" />
                            </div>
                            <SectionRow sectionItem={item} sectionIdx={idx} sectionId={sectionId} draggable={isDraggable} />
                            <div className="ml-6 border-l-2 border-[var(--accent-color)] border-opacity-20 pl-1">
                              <SectionRow sectionItem={chorusItem} sectionIdx={chorusIdx} sectionId={chorusSectionId} draggable={false} />
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={idx}
                          draggable={isDraggable}
                          onDragStart={() => isDraggable && setDraggedItemIndex(idx)}
                          onDragOver={(e) => {
                           e.preventDefault(); e.stopPropagation();
                            if (draggedItemIndex === null || draggedItemIndex === idx) return;
                            if (idx === 0 && isAnchoredStartSection(structure[0] ?? '')) return;
                            if (idx === structure.length - 1 && isAnchoredEndSection(structure[structure.length - 1] ?? '')) return;
                            setDragOverIndex(idx);
                          }}
                          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverIndex(null); }}
                          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDrop(idx); }}
                          className={`group flex items-center gap-3 rounded-[16px_6px_16px_6px] border bg-[var(--bg-card)]/85 shadow-sm pl-3 pr-2 py-2.5 text-xs transition-all duration-200 ${getSectionColor(item)} ${isDraggable ? 'cursor-grab active:cursor-grabbing hover:border-[var(--accent-color)]/40 hover:bg-[var(--bg-card)]' : 'cursor-default'} ${draggedItemIndex === idx ? 'opacity-30' : ''} ${dragOverIndex === idx ? 'ring-2 ring-[var(--accent-color)] ring-offset-1 dark:ring-offset-zinc-900' : ''}`}
                        >
                          <span className={`h-7 w-1.5 rounded-full ${getSectionDotColor(item)}`} aria-hidden="true" />
                          {isDraggable ? (
                            <GripVertical className="w-3.5 h-3.5 opacity-30 group-hover:opacity-60 transition-opacity" />
                          ) : (
                            <div className="w-3.5" />
                          )}
                          <Tooltip title={getSectionTooltipText(item)}>
                            <button
                              type="button"
                              className={`flex-1 text-left truncate transition-colors ${getSectionTextColor(item)} hover:text-[var(--accent-color)]`}
                              onClick={() => sectionId && onScrollToSection(sectionId)}
                            >
                              {item}
                            </button>
                          </Tooltip>
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
                            if (isAnchoredStartSection(name)) {
                              return !structure.some(isAnchoredStartSection);
                            }
                            if (isAnchoredEndSection(name)) {
                              return !structure.some(isAnchoredEndSection);
                            }
                            return true;
                          })
                          .map(name => (
                            <Tooltip key={name} title={getSectionTooltipText(name)}>
                              <button
                                onClick={() => { addStructureItem(name); setIsSectionDropdownOpen(false); }}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 transition-colors flex items-center gap-2"
                              >
                                <Plus className="w-3 h-3 text-[var(--accent-color)]" />
                                {name}
                              </button>
                            </Tooltip>
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
