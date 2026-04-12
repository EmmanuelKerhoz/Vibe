import React, { useId, useMemo, useRef } from 'react';
import { X, BarChart2, GripVertical, Link2, AlignLeft } from '../ui/icons';
import { Tooltip } from '../ui/Tooltip';
import { AnimatePresence, motion } from 'motion/react';
import { LcarsSelect } from '../ui/LcarsSelect';
import { Button } from '../ui/Button';
import { useTranslation } from '../../i18n';
import { getSectionColor, getSectionDotColor, getSectionTextColor } from '../../utils/songUtils';
import {
  getSectionTooltipText,
  isAnchoredEndSection,
  isAnchoredStartSection,
  isLinkedPreChorusPair,
  SECTION_TYPE_OPTIONS,
} from '../../constants/sections';
import { useSongContext } from '../../contexts/SongContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import {
  useStructureDragHandlers,
  type StructureDragHandlers,
} from '../../hooks/useStructureDragHandlers';
import { CompositionSection } from './CompositionSection';

interface Props {
  isStructureOpen: boolean;
  setIsStructureOpen: (v: boolean) => void;
  isSectionDropdownOpen: boolean;
  setIsSectionDropdownOpen: (v: boolean) => void;
  addStructureItem: (name?: string) => void;
  removeStructureItem: (idx: number) => void;
  normalizeStructure: () => void;
  onScrollToSection: (sectionId: string) => void;
  isMobileOverlay?: boolean;
  className?: string;
}

const sectionButtonShapeClass = 'rounded-[12px_4px_12px_4px]';

function getSectionOptions(structure: string[]) {
  return SECTION_TYPE_OPTIONS.filter(name => {
    if (isAnchoredStartSection(name)) return !structure.some(isAnchoredStartSection);
    if (isAnchoredEndSection(name))   return !structure.some(isAnchoredEndSection);
    return true;
  });
}

function getGroupedChorusIndices(structure: string[]) {
  const groupedIndices = new Set<number>();
  structure.forEach((item, idx) => {
    if (isLinkedPreChorusPair(item, structure[idx + 1])) {
      groupedIndices.add(idx + 1);
    }
  });
  return groupedIndices;
}

// ── SectionRow ─────────────────────────────────────────────────────────────────────────

interface SectionRowProps {
  sectionItem: string;
  sectionIdx: number;
  sectionId: string | null;
  draggable: boolean;
  showDragHandle?: boolean;
  draggedItemIndex: number | null;
  dragOverIndex: number | null;
  dragHandlers: StructureDragHandlers;
  onScrollToSection: (sectionId: string) => void;
  removeStructureItem: (idx: number) => void;
  removeSectionLabel: string;
}

const SectionRow = React.memo(function SectionRow({
  sectionItem,
  sectionIdx,
  sectionId,
  draggable,
  showDragHandle = draggable,
  draggedItemIndex,
  dragOverIndex,
  dragHandlers,
  onScrollToSection,
  removeStructureItem,
  removeSectionLabel,
}: SectionRowProps) {
  return (
    <div
      draggable={draggable}
      {...dragHandlers}
      className={`group flex items-center gap-3 ${sectionButtonShapeClass} border bg-[var(--bg-card)]/85 shadow-sm pl-3 pr-2 py-2.5 text-xs transition-all duration-200 ${getSectionColor(sectionItem)} ${draggable ? 'cursor-grab active:cursor-grabbing hover:border-[var(--accent-color)]/40 hover:bg-[var(--bg-card)]' : 'cursor-default'} ${draggedItemIndex === sectionIdx ? 'opacity-30' : ''} ${dragOverIndex === sectionIdx ? 'ring-2 ring-[var(--accent-color)] ring-offset-1 dark:ring-offset-zinc-900' : ''}`}
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
          onClick={() => sectionId && onScrollToSection(sectionId)}
        >
          {sectionItem}
        </button>
      </Tooltip>
      <Tooltip title={removeSectionLabel}>
        <button
          onClick={() => removeStructureItem(sectionIdx)}
          className="p-1 hover:bg-black/20 rounded transition-colors opacity-0 group-hover:opacity-100"
        >
          <X className="w-3 h-3" />
        </button>
      </Tooltip>
    </div>
  );
});

// ── StructureSidebar ───────────────────────────────────────────────────────────────────

export const StructureSidebar = React.memo(function StructureSidebar({
  isStructureOpen, setIsStructureOpen,
  isSectionDropdownOpen, setIsSectionDropdownOpen,
  addStructureItem, removeStructureItem, normalizeStructure,
  onScrollToSection,
  isMobileOverlay = false,
  className,
}: Props) {
  const { song, structure } = useSongContext();
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  const { makeDragHandlers, draggedItemIndex, dragOverIndex } =
    useStructureDragHandlers({ structure });

  const handleClose = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsStructureOpen(false);
  };

  useFocusTrap(panelRef, !!(isMobileOverlay && isStructureOpen), () => setIsStructureOpen(false));

  const addSectionLabel = t.structure.addSection.replace(/(\.\.\.|\u2026)$/, '').trim();
  const removeSectionLabel = t.tooltips.removeSection;

  const sectionOptions = useMemo(
    () => getSectionOptions(structure).map(name => ({
      value: name,
      label: name,
      title: getSectionTooltipText(name),
    })),
    [structure],
  );

  const groupedChorusIndices = useMemo(
    () => getGroupedChorusIndices(structure),
    [structure],
  );

  return (
    <AnimatePresence>
      {isStructureOpen && (
        <motion.div
          ref={panelRef}
          role={isMobileOverlay ? 'dialog' : undefined}
          aria-modal={isMobileOverlay ? 'true' : undefined}
          aria-labelledby={isMobileOverlay ? headingId : undefined}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`flex flex-col z-50 shadow-2xl lcars-panel fluent-animate-panel${className ? ` ${className}` : ''}`}
          style={{ overflow: 'visible', position: 'relative' }}
        >
          <div className="w-[280px] flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div
              className="h-16 px-5 flex items-center justify-between shrink-0"
              style={{ position: 'relative', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}
            >
              <div data-testid="structure-sidebar-rail" style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: 'var(--accent-rail-thickness, 2px)',
                background: 'var(--accent-rail-gradient-h-rev)',
                opacity: 0.85, pointerEvents: 'none', zIndex: 1,
              }} />
              <h3 id={headingId} className="micro-label text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
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

            {/* Section list — scrollable */}
            <div className="px-5 pt-5 flex-1 overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <div className="flex flex-col gap-1.5">
                  {structure.map((item, idx) => {
                    if (groupedChorusIndices.has(idx)) return null;

                    const isGroupLeader = isLinkedPreChorusPair(item, structure[idx + 1]);
                    const chorusItem  = isGroupLeader ? structure[idx + 1] : undefined;
                    const chorusIdx   = isGroupLeader ? idx + 1 : undefined;

                    const isDraggable    = !isAnchoredStartSection(item) && !isAnchoredEndSection(item);
                    const sectionId      = song[idx]?.id ?? null;
                    const chorusSectionId = chorusIdx !== undefined ? (song[chorusIdx]?.id ?? null) : null;

                    const rowKey = sectionId ?? `${item}-${idx}`;

                    const dragHandlers = makeDragHandlers(idx, isDraggable);

                    if (isGroupLeader && chorusItem !== undefined && chorusIdx !== undefined) {
                      return (
                        <div
                          key={rowKey}
                          draggable={isDraggable}
                          {...dragHandlers}
                          className={`relative flex flex-col gap-1.5 ${
                            dragOverIndex === idx
                              ? `ring-2 ring-[var(--accent-color)] ring-offset-1 dark:ring-offset-zinc-900 ${sectionButtonShapeClass}`
                              : ''
                          }`}
                        >
                          <div className="absolute left-2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[var(--accent-color)]/20 bg-[var(--bg-card)]/95 pointer-events-none">
                            <Link2 className="w-2.5 h-2.5 text-[var(--accent-color)] opacity-60" />
                          </div>
                          <SectionRow
                            sectionItem={item}
                            sectionIdx={idx}
                            sectionId={sectionId}
                            draggable={false}
                            showDragHandle={isDraggable}
                            draggedItemIndex={draggedItemIndex}
                            dragOverIndex={dragOverIndex}
                            dragHandlers={dragHandlers}
                            onScrollToSection={onScrollToSection}
                            removeStructureItem={removeStructureItem}
                            removeSectionLabel={removeSectionLabel}
                          />
                          <SectionRow
                            sectionItem={chorusItem}
                            sectionIdx={chorusIdx}
                            sectionId={chorusSectionId}
                            draggable={false}
                            draggedItemIndex={draggedItemIndex}
                            dragOverIndex={dragOverIndex}
                            dragHandlers={makeDragHandlers(chorusIdx, false)}
                            onScrollToSection={onScrollToSection}
                            removeStructureItem={removeStructureItem}
                            removeSectionLabel={removeSectionLabel}
                          />
                        </div>
                      );
                    }

                    return (
                      <SectionRow
                        key={rowKey}
                        sectionItem={item}
                        sectionIdx={idx}
                        sectionId={sectionId}
                        draggable={isDraggable}
                        draggedItemIndex={draggedItemIndex}
                        dragOverIndex={dragOverIndex}
                        dragHandlers={dragHandlers}
                        onScrollToSection={onScrollToSection}
                        removeStructureItem={removeStructureItem}
                        removeSectionLabel={removeSectionLabel}
                      />
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
                    style={{ fontSize: '11px', textTransform: 'uppercase' }}
                  />
                </div>
              </div>
            </div>

            {/* Footer — Composition controls + Normalize (fixed, out of scroll) */}
            <div
              className="shrink-0"
              style={{ borderTop: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}
            >
              <CompositionSection />
              <div className="px-5 pb-5">
                <Tooltip title={t.tooltips.normalizeStructure}>
                  <div className="lcars-gradient-outline" style={{ borderRadius: sectionButtonShapeClass, width: '100%' }}>
                    <Button
                      onClick={normalizeStructure}
                      disabled={structure.length === 0}
                      variant="outlined" fullWidth
                      startIcon={<AlignLeft className="w-3.5 h-3.5" />}
                      className="ux-interactive"
                      style={{ fontSize: '11px', padding: '4px 0', borderRadius: sectionButtonShapeClass }}
                    >
                      {t.structure.normalize}
                    </Button>
                  </div>
                </Tooltip>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
