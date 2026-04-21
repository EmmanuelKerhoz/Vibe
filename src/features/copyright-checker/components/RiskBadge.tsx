import React from 'react';
import { Badge } from '@fluentui/react-components';
import { RiskLevel } from '../domain/enums';

interface RiskBadgeProps {
  readonly level: RiskLevel;
  readonly score?: number;
}

const LABEL: Record<RiskLevel, string> = {
  [RiskLevel.LOW]: 'Low similarity',
  [RiskLevel.MODERATE]: 'Moderate similarity',
  [RiskLevel.HIGH]: 'High similarity',
  [RiskLevel.ESCALATE]: 'Escalate for review',
};

const APPEARANCE: Record<RiskLevel, 'filled' | 'outline' | 'tint' | 'ghost'> = {
  [RiskLevel.LOW]: 'tint',
  [RiskLevel.MODERATE]: 'tint',
  [RiskLevel.HIGH]: 'filled',
  [RiskLevel.ESCALATE]: 'filled',
};

const COLOR: Record<RiskLevel, 'subtle' | 'brand' | 'warning' | 'danger'> = {
  [RiskLevel.LOW]: 'subtle',
  [RiskLevel.MODERATE]: 'brand',
  [RiskLevel.HIGH]: 'warning',
  [RiskLevel.ESCALATE]: 'danger',
};

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score }) => (
  <Badge
    appearance={APPEARANCE[level]}
    color={COLOR[level]}
    aria-label={`Risk level ${LABEL[level]}${typeof score === 'number' ? `, score ${score}` : ''}`}
  >
    {LABEL[level]}{typeof score === 'number' ? ` · ${score}` : ''}
  </Badge>
);
