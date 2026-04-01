/**
 * PhonologyGrid — Fluent 2 grid showing per-section target vs detected schema.
 *
 * Renders targetSchema (user intent) alongside detectedSchema (derived)
 * with visual rhyme badges per line.
 */

import React from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Badge,
} from '@fluentui/react-components';
import type { SectionPhonologyResult } from '../../hooks/useDerivedPhonology';
import type { Section } from '../../types';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr auto auto',
    gap: tokens.spacingVerticalXS,
    alignItems: 'center',
    padding: tokens.spacingVerticalS,
  },
  header: {
    fontWeight: tokens.fontWeightBold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  sectionName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
    gridColumn: 'span 3',
    paddingTop: tokens.spacingVerticalXS,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  schemaCell: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    letterSpacing: '2px',
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
  },
  match: {
    color: tokens.colorPaletteGreenForeground1,
  },
  mismatch: {
    color: tokens.colorPaletteRedForeground1,
  },
});

interface PhonologyGridProps {
  song: Section[];
  phonologyResults: SectionPhonologyResult[];
}

export const PhonologyGrid = React.memo(function PhonologyGrid({
  song,
  phonologyResults,
}: PhonologyGridProps) {
  const styles = useStyles();
  const resultMap = new Map(phonologyResults.map(r => [r.sectionId, r]));

  return (
    <div className={styles.grid}>
      {/* Header row */}
      <Text className={styles.header}>Section</Text>
      <Text className={styles.header}>Target</Text>
      <Text className={styles.header}>Detected</Text>

      {song.map(section => {
        const result = resultMap.get(section.id);
        const target = section.targetSchema ?? section.rhymeScheme ?? '';
        const detected = result?.detectedSchema ?? '';
        const matches = target && detected && target === detected;

        return (
          <React.Fragment key={section.id}>
            <Text className={styles.sectionName}>{section.name}</Text>
            <Text className={styles.schemaCell}>{target || '—'}</Text>
            <span>
              {detected ? (
                <Badge
                  appearance="outline"
                  color={matches ? 'success' : 'warning'}
                  className={styles.schemaCell}
                >
                  {detected}
                </Badge>
              ) : (
                <Text className={styles.schemaCell}>—</Text>
              )}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
});
