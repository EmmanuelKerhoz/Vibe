import { Tooltip as FluentTooltip } from '@fluentui/react-components';
import type { ReactElement, ReactNode } from 'react';

type TooltipProps = {
  title: ReactNode;
  children: ReactElement;
  placement?: 'top' | 'left' | 'right';
};

const placementMap: Record<NonNullable<TooltipProps['placement']>, 'above' | 'before' | 'after'> = {
  top: 'above',
  left: 'before',
  right: 'after',
};

export const Tooltip = ({ title, children, placement = 'top' }: TooltipProps) => {
  return (
    <FluentTooltip content={title as any} relationship="label" positioning={placementMap[placement]}>
      {children}
    </FluentTooltip>
  );
};
