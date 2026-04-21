import React from 'react';
import {
  Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow,
} from '@fluentui/react-components';
import type { SimilarityMatch } from '../domain/types';
import { redactExcerpt } from '../utils/textHashes';

interface FlaggedMatchesTableProps {
  readonly matches: readonly SimilarityMatch[];
  readonly maxExcerptChars?: number;
}

const formatLineRange = (start: number, end: number): string =>
  start === end ? `L${start + 1}` : `L${start + 1}–${end + 1}`;

const formatType = (type: string): string =>
  type.toLowerCase().split('_').map((p) => p[0]?.toUpperCase() + p.slice(1)).join(' ');

export const FlaggedMatchesTable: React.FC<FlaggedMatchesTableProps> = ({
  matches,
  maxExcerptChars = 80,
}) => {
  if (matches.length === 0) {
    return (
      <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>
        No flagged overlaps to display.
      </p>
    );
  }
  return (
    <Table size="small" aria-label="Flagged overlaps">
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Submitted snippet</TableHeaderCell>
          <TableHeaderCell>Reference</TableHeaderCell>
          <TableHeaderCell>Lines</TableHeaderCell>
          <TableHeaderCell>Strength</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matches.map((m) => (
          <TableRow key={m.id}>
            <TableCell>{formatType(m.type)}</TableCell>
            <TableCell title={m.submittedExcerpt}>
              {redactExcerpt(m.submittedExcerpt, maxExcerptChars)}
            </TableCell>
            <TableCell title={m.referenceLabel}>
              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                {redactExcerpt(m.referenceLabel, 40)}
              </span>
            </TableCell>
            <TableCell>{formatLineRange(m.submittedSpan.lineStart, m.submittedSpan.lineEnd)}</TableCell>
            <TableCell>{Math.round(m.strength * 100)}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
