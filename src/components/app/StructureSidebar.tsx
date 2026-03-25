import React from 'react';
import { AlignLeft, X, BarChart2, GripVertical, Link2 } from '../ui/icons';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { AnimatePresence, motion } from 'motion/react';
import { LcarsSelect } from '../ui/LcarsSelect';
import { useTranslation } from '../../i18n';
import { useDrag } from '../../contexts/DragContext';
import { getSectionColor, getSectionDotColor, getSectionTextColor } from '../../utils/songUtils';
import type { Section } from '../../types';
import {
  getSectionTooltipText,
  isAnchoredEndSection,
  isAnchoredStartSection,
  isLinkedPreChorusPair,
  SECTION_TYPE_OPTIONS,
} from '../../constants/sections';
import { useSongContext } from '../../contexts/SongContext';
import { useComposerContext } from '../../contexts/ComposerContext';

interface Props {
  isStructureOpen: boolean;
  setIsStructureOpen: (v: boolean) => void;
  newSectionName: string;
  setNewSectionName: (v: string) => void;
  isSectionDropdownOpen: boolean;
  setIsSectionDropdownOpen: (v: boolean) => void;
  addStructureItem: (name?: string) => void;
  removeStructureItem: (idx: number) => void;
  normalizeStructure: () => void;
  handleDrop: (idx: number) => void;
  onScrollToSection: (sectionId: string) => void;
  onRegenerateSong?: () => void;
  onGenerateSong?: () => void;
  isMobileOverlay?: boolean;
  className?: string;
}

export const StructureSidebar = React.memo(function StructureSidebar({
  isStructureOpen, setIsStructureOpen,
  newSectionName: _newSectionName, setNewSectionName: _setNewSectionName,
  isSectionDropdownOpen, setIsSectionDropdownOpen,
  addStructureItem, removeStructureItem,
  normalizeStructure, handleDrop, onScrollToSection,
  onRegenerateSong, onGenerateSong,
  isMobileOverlay = false,
  className,
}: Props) {
  const actionButtonRadius = '10px 3px 10px 3px';
  const sectionButtonShapeClass = 'rounded-[12px_4px_12px_4px]';
  const { song, structure } = useSongContext();
  const { isGenerating } = useComposerContext();
  const { t } = useTranslation();
  const {
    draggedItemIndex,
    setDraggedItemIndex,
    dragOverIndex,
    setDragOverIndex,
  } = useDrag();

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsStructureOpen(false);
  };

  const addSectionLabel = t.structure.addSection.replace(/(\.\.\.|…)$/, '').trim();
  const sectionOptions = SECTION_TYPE_OPTIONS
    .filter(name => {
      if (isAnchoredStartSection(name)) {
        return !structure.some(isAnchoredStartSection);
      }
      if (isAnchoredEndSection(name)) {
        return !structure.some(isAnchoredEndSection);
      }
      return true;
    })
    .map(name => ({
      value: name,
      label: name,
      title: getSectionTooltipText(name),
    }));

  // Build a set of indices to skip (Chorus items already rendered as part of a group)
  const groupedChorusIndices = new Set<number>();
  structure.forEach((item, idx) => {
    if (isLinkedPreChorusPair(item, structure[idx + 1])) {
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
          className={`border-l border-fluent-border bg-fluent-sidebar flex flex-col z-50 shadow-2xl lcars-panel fluent-animate-panel !rounded-none !border-t-0 !border-b-0 !border-r-0${className ? ` ${className}` : ''}`}
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

            <div className="h-16 px-5 flex items-center justify-between shrink-0" style={{ position: 'relative', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
              {/* Reversed accent rail — touches both panel borders */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: 'var(--accent-rail-thickness, 2px)',
                background: 'var(--accent-rail-gradient-h-rev)',
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

                      const isGroupLeader = isLinkedPreChorusPair(item, structure[idx + 1]);
                      const chorusItem = isGroupLeader ? structure[idx + 1] : undefined;
                      const chorusIdx = isGroupLeader ? idx + 1 : undefined;

                      const isIntro = isAnchoredStartSection(item);
                      const isOutro = isAnchoredEndSection(item);
                      const isDraggable = !isIntro && !isOutro;
                      const sectionId = song[idx]?.id ?? null;
                      const chorusSectionId = chorusIdx !== undefined ? (song[chorusIdx]?.id ?? null) : null;

                      const SectionRow = ({ sectionItem, sectionIdx, sectionId: sid, draggable: drag, showDragHandle = drag }: {
                        sectionItem: string;
                        sectionIdx: number;
                        sectionId: string | null;
                        draggable: boolean;
                        showDragHandle?: boolean;
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
                          className={`group flex items-center gap-3 ${sectionButtonShapeClass} border bg-[var(--bg-card)]/85 shadow-sm pl-3 pr-2 py-2.5 text-xs transition-all duration-200 ${getSectionColor(sectionItem)} ${drag ? 'cursor-grab active:cursor-grabbing hover:border-[var(--accent-color)]/40 hover:bg-[var(--bg-card)]' : 'cursor-default'} ${draggedItemIndex === sectionIdx ? 'opacity-30' : ''} ${dragOverIndex === sectionIdx ? 'ring-2 ring-[var(--accent-color)] ring-offset-1 dark:ring-offset-zinc-900' : ''}`}
                        >
                          <span className={`h-7 w-1.5 rounded-full ${getSectionDotColor(sectionItem)}`} aria-hidden="true" />
                          {showDragHandle ? (
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
                            className={`relative flex flex-col gap-1.5 ${dragOverIndex === idx ? `ring-2 ring-[var(--accent-color)] ring-offset-1 dark:ring-offset-zinc-900 ${sectionButtonShapeClass}` : ''}`}
                          >
                            <div className="absolute left-2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[var(--accent-color)]/20 bg-[var(--bg-card)]/95 pointer-events-none">
                              <Link2 className="w-2.5 h-2.5 text-[var(--accent-color)] opacity-60" />
                            </div>
                            <SectionRow sectionItem={item} sectionIdx={idx} sectionId={sectionId} draggable={false} showDragHandle={isDraggable} />
                            <SectionRow sectionItem={chorusItem} sectionIdx={chorusIdx} sectionId={chorusSectionId} draggable={false} />
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
                          className={`group flex items-center gap-3 ${sectionButtonShapeClass} border bg-[var(--bg-card)]/85 shadow-sm pl-3 pr-2 py-2.5 text-xs transition-all duration-200 ${getSectionColor(item)} ${isDraggable ? 'cursor-grab active:cursor-grabbing hover:border-[var(--accent-color)]/40 hover:bg-[var(--bg-card)]' : 'cursor-default'} ${draggedItemIndex === idx ? 'opacity-30' : ''} ${dragOverIndex === idx ? 'ring-2 ring-[var(--accent-color)] ring-offset-1 dark:ring-offset-zinc-900' : ''}`}
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

                  <div className="mt-3">
                    <LcarsSelect
                      value=""
                      onChange={addStructureItem}
                      options={sectionOptions}
                      placeholder={addSectionLabel}
                      isOpen={isSectionDropdownOpen}
                      onOpenChange={setIsSectionDropdownOpen}
                      accentColor="var(--lcars-cyan)"
                      buttonTitle={t.tooltips.addSection}
                    />
                  </div>

                  <Tooltip title={t.tooltips.normalizeStructure}>
                    <div className="lcars-gradient-outline mt-4" style={{ borderRadius: actionButtonRadius, width: '100%' }}>
                      <Button
                        onClick={normalizeStructure}
                        disabled={structure.length === 0 || isGenerating}
                        variant="outlined" fullWidth
                        startIcon={<AlignLeft className="w-3.5 h-3.5" />}
                        className="ux-interactive"
                        style={{ fontSize: '10px', padding: '4px 0', borderRadius: actionButtonRadius }}
                      >
                        {t.structure.normalize}
                      </Button>
                    </div>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
