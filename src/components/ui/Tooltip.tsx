import { Tooltip as FluentTooltip } from '@fluentui/react-components';
import type { ReactElement, ReactNode } from 'react';

type TooltipProps = {
  title: ReactNode;
  children: ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
};

export const Tooltip = ({ title, children, placement: _placement }: TooltipProps) => {
  return (
    <FluentTooltip content={title as any} relationship="label">
      {children}
    </FluentTooltip>
  );
};
