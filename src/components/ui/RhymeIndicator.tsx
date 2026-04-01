/**
 * RhymeIndicator — Fluent UI v9 badge showing detected rhyme type.
 *
 * Displays a compact visual tag (rich / sufficient / assonance / weak / none)
 * with colour-coding per docs_fusion_optimal.md §6 typography.
 */

import React from 'react';
import {
  Badge,
  Tooltip,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import type { RhymeType } from '../../lib/linguistics/core/types';

const RHYME_COLORS: Record<RhymeType, string> = {
  rich: tokens.colorPaletteGreenForeground1,
  sufficient: tokens.colorPaletteBlueForeground2,
  assonance: tokens.colorPaletteYellowForeground2,
  weak: tokens.colorNeutralForeground3,
  none: tokens.colorNeutralForeground4,
};

const RHYME_LABELS: Record<RhymeType, string> = {
  rich: 'Rich rhyme',
  sufficient: 'Sufficient rhyme',
  assonance: 'Assonance',
  weak: 'Weak rhyme',
  none: 'No rhyme',
};

const useStyles = makeStyles({
  badge: {
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
});

interface RhymeIndicatorProps {
  rhymeType: RhymeType;
  /** Optional rhyme label letter (A, B, C…). */
  label?: string;
  /** Score value 0–1. */
  score?: number;
}

export const RhymeIndicator = React.memo(function RhymeIndicator({
  rhymeType,
  label,
  score,
}: RhymeIndicatorProps) {
  const styles = useStyles();
  const color = RHYME_COLORS[rhymeType];
  const tooltipText = score !== undefined
    ? `${RHYME_LABELS[rhymeType]} (${(score * 100).toFixed(0)}%)`
    : RHYME_LABELS[rhymeType];

  return (
    <Tooltip content={tooltipText} relationship="description">
      <Badge
        className={styles.badge}
        appearance="outline"
        color="informative"
        style={{ borderColor: color, color }}
      >
        {label ? `${label} · ${rhymeType}` : rhymeType}
      </Badge>
    </Tooltip>
  );
});
