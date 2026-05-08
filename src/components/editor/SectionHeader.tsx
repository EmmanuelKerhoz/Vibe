import React, { useMemo } from 'react';
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
}

export const SectionHeader = React.memo(function SectionHeader({
  section, sectionIndex, songLength,
}: SectionHeaderProps) {
  const { t } = useTranslation();
  const { rhymeScheme } = useSongContext();
  const { moveSectionUp, moveSectionDown, setSectionName, setSectionRhymeScheme } = useSongMutation();
  const sectionName: string = section.name ?? '';
  const sectionColor = getSectionColorHex(sectionName);

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
    <div className="mb-3 flex items-center justify-between gap-4 flex-wrap lcars-section-header" style={{ color: sectionColor }}>
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-0.5">
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
        <div>
          <LcarsSelect
            value={sectionName}
            onChange={(v) => setSectionName(section.id, v)}
            options={sectionTypeSelectOptions.map(option => ({
              ...option,
              title: getSectionTooltipText(option.value),
            }))}
            accentColor={sectionColor}
            style={{ color: sectionColor }}
            buttonTitle={getSectionTooltipText(sectionName)}
          />
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              {section.lines.filter(l => !l.isMeta).length} {t.editor.lines ?? 'lines'}
            </p>
            <div className="min-w-[15rem] max-w-full flex-1">
              <LcarsSelect
                value={section.rhymeScheme || rhymeScheme}
                onChange={(v) => setSectionRhymeScheme(section.id, v)}
                options={RHYME_KEYS.filter((k): k is string => typeof k === 'string').map(key => ({
                  value: key,
                  label: rhymeSchemes[key as keyof typeof rhymeSchemes] ?? key,
                }))}
                accentColor="var(--lcars-cyan)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
