/**
 * CompositionSection
 *
 * Standalone composition controls: rhyme scheme selector, syllable target
 * slider and Quantize button. Sourced entirely from ComposerParamsContext —
 * zero prop drilling.
 *
 * Intended for the right panel (StructureSidebar) so that composition params
 * are accessible without opening the left generation panel.
 */
import React from 'react';
import { Ruler } from '../ui/icons';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { Label } from '../ui/Label';
import { LcarsSelect } from '../ui/LcarsSelect';
import { useTranslation } from '../../i18n';
import { useComposerParamsContext } from '../../contexts/ComposerParamsContext';

const RHYME_SCHEME_ORDER = ['FREE', 'AABB', 'ABAB', 'AAAA', 'ABCB', 'AAABBB', 'AABBCC', 'ABABAB', 'ABCABC'] as const;

export function CompositionSection() {
  const { t } = useTranslation();
  const {
    rhymeScheme, setRhymeScheme,
    targetSyllables, setTargetSyllables,
    song, isGenerating, quantizeSyllables,
  } = useComposerParamsContext();

  const rhymeSchemeButtonTitle = t.tooltips.rhymeScheme
    ? { buttonTitle: t.tooltips.rhymeScheme }
    : {};

  return (
    <div className="px-5 pt-4 pb-2 space-y-4">
      {/* Section label */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-4 rounded-full bg-[var(--lcars-cyan,#06b6d4)] opacity-80" />
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold">Composition</span>
      </div>

      <div className="space-y-4">
        <div>
          <Label>{t.leftPanel.rhymeScheme}</Label>
          <LcarsSelect
            value={rhymeScheme}
            onChange={setRhymeScheme}
            accentColor="var(--lcars-cyan)"
            options={RHYME_SCHEME_ORDER.map(value => ({
              value,
              label: (t.rhymeSchemes ?? {})[value] ?? value,
            }))}
            {...rhymeSchemeButtonTitle}
          />
        </div>

        <div>
          <Label>{t.leftPanel.targetSyllables}</Label>
          <Tooltip title={t.tooltips.targetSyllables ?? ''}>
            <div className="flex items-center gap-3">
              <input
                type="range" min="4" max="20" value={targetSyllables}
                onChange={e => setTargetSyllables(parseInt(e.target.value))}
                className="flex-1 accent-[var(--accent-color)] h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs telemetry-text text-[var(--accent-color)] w-5 text-center">
                {targetSyllables}
              </span>
            </div>
          </Tooltip>
        </div>

        <Tooltip title={t.tooltips.quantize}>
          <Button
            onClick={() => { void quantizeSyllables(); }}
            disabled={song.length === 0 || isGenerating}
            variant="outlined" color="primary" fullWidth
            startIcon={<Ruler className="w-3.5 h-3.5" />}
            style={{ fontSize: '11px', padding: '4px 0' }}
          >
            {t.leftPanel.quantize}
          </Button>
        </Tooltip>
      </div>

      <div className="h-px bg-black/5 dark:bg-white/5 mx-1 mt-2" />
    </div>
  );
}
