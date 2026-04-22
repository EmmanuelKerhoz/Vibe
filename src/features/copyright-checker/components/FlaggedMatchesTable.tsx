import React, { useId } from 'react';
import {
  Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow,
} from '@fluentui/react-components';
import type { SimilarityMatch } from '../domain/types';
import { redactExcerpt } from '../utils/textHashes';

interface FlaggedMatchesTableProps {
  readonly matches: readonly SimilarityMatch[];
  readonly maxExcerptChars?: number;
  /**
   * Visible/announced caption for the table. Defaults to a generic
   * description; override when the table is embedded in a section that
   * provides additional context (e.g. per-document overlap drilldowns).
   */
  readonly caption?: string;
}

const formatLineRange = (start: number, end: number): string =>
  start === end ? `L${start + 1}` : `L${start + 1}–${end + 1}`;

const formatType = (type: string): string =>
  type.toLowerCase().split('_').map((p) => p[0]?.toUpperCase() + p.slice(1)).join(' ');

const visuallyHiddenStyle: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export const FlaggedMatchesTable: React.FC<FlaggedMatchesTableProps> = ({
  matches,
  maxExcerptChars = 80,
  caption = 'Flagged overlaps between the submitted lyrics and reference documents',
}) => {
  const captionId = useId();
  if (matches.length === 0) {
    return (
      <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>
        No flagged overlaps to display.
      </p>
    );
  }
  return (
    <>
      {/* Fluent UI v9 Table renders a div tree (no <caption> support), so we
          provide a visually-hidden heading wired via aria-labelledby. */}
      <span id={captionId} style={visuallyHiddenStyle}>{caption}</span>
      <Table size="small" aria-labelledby={captionId}>
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
    </>
  );
};
