import React, { useMemo, useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from '../ui/icons';
import { Tooltip } from '../ui/Tooltip';
import { LcarsSelect } from '../ui/LcarsSelect';
import { useTranslation } from '../../i18n';
import { getSectionColorHex } from '../../utils/songUtils';
import { getSectionTooltipText, isAnchoredEndSection, isAnchoredStartSection, SECTION_TYPE_OPTIONS } from '../../constants/sections';
import type { Section } from '../../types';
import { useSongContext } from '../../contexts/SongContext';
import { useSongMutation } from '../../contexts/SongMutationContext';

interface SectionHeaderProps {
  section: Section;
  sectionIndex: number;
  songLength: number;
  // Pending state lifted from SectionEditor for unified APPLY
  pendingName: string;
  pendingRhyme: string;
  onPendingNameChange: (v: string) => void;
  onPendingRhymeChange: (v: string) => void;
}

export const SectionHeader = React.memo(function SectionHeader({
  section, sectionIndex, songLength,
  pendingName, pendingRhyme,
  onPendingNameChange, onPendingRhymeChange,
}: SectionHeaderProps) {
  const { t } = useTranslation();
  const { rhymeScheme } = useSongContext();
  const { moveSectionUp, moveSectionDown } = useSongMutation();
  const sectionName: string = section.name ?? '';
  const sectionColor = getSectionColorHex(pendingName || sectionName);

  const rhymeSchemes = useMemo(() => t.rhymeSchemes ?? {}, [t.rhymeSchemes]);

  const RHYME_KEYS = useMemo(
    () => ['FREE', ...Object.keys(rhymeSchemes).filter((key) => key !== 'FREE')],
    [rhymeSchemes]
  );

  const safeSectionTypeOptions = SECTION_TYPE_OPTIONS.filter((opt): opt is string => typeof opt === 'string');
  const sectionTypeSelectOptions = useMemo(() => [
    ...safeSectionTypeOptions.map(opt => ({ value: opt, label: opt.toUpperCase() })),
    ...(sectionName && !safeSectionTypeOptions.includes(sectionName)
      ? [{ value: sectionName, label: sectionName.toUpperCase() }]
      : []),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [sectionName, SECTION_TYPE_OPTIONS]);

  return (
    <div className="flex items-center gap-3 lcars-section-header" style={{ color: sectionColor }}>
      {/* Move up/down chevrons */}
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <Tooltip title={t.editor.moveSectionUp ?? 'Move section up'}>
          <button type="button" onClick={() => moveSectionUp(section.id)}
            disabled={sectionIndex === 0 || isAnchoredStartSection(sectionName)}
            className="flex h-5 w-5 items-center justify-center text-zinc-500 dark:text-zinc-600 transition hover:text-zinc-900 dark:hover:text-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed">
            <ChevronUp className="h-3 w-3" />
          </button>
        </Tooltip>
        <Tooltip title={t.editor.moveSectionDown ?? 'Move section down'}>
          <button type="button" onClick={() => moveSectionDown(section.id)}
            disabled={sectionIndex === songLength - 1 || isAnchoredEndSection(sectionName)}
            className="flex h-5 w-5 items-center justify-center text-zinc-500 dark:text-zinc-600 transition hover:text-zinc-900 dark:hover:text-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed">
            <ChevronDown className="h-3 w-3" />
          </button>
        </Tooltip>
      </div>

      {/* Section name — writes to pending only */}
      <LcarsSelect
        value={pendingName}
        onChange={onPendingNameChange}
        options={sectionTypeSelectOptions.map(option => ({
          ...option,
          title: getSectionTooltipText(option.value),
        }))}
        accentColor={sectionColor}
        style={{ color: sectionColor }}
        buttonTitle={getSectionTooltipText(pendingName)}
      />

      {/* Lines count */}
      <p className="flex-shrink-0 text-[11px] uppercase tracking-[0.18em] text-zinc-600 dark:text-zinc-300">
        {section.lines.filter(l => !l.isMeta).length} {t.editor.lines ?? 'lines'}
      </p>

      {/* Rhyme scheme — writes to pending only */}
      <div className="min-w-[15rem] max-w-xs flex-shrink-0">
        <LcarsSelect
          value={pendingRhyme}
          onChange={onPendingRhymeChange}
          options={RHYME_KEYS.filter((k): k is string => typeof k === 'string').map(key => ({
            value: key,
            label: rhymeSchemes[key as keyof typeof rhymeSchemes] ?? key,
          }))}
          accentColor="var(--lcars-cyan)"
        />
      </div>
    </div>
  );
});
