import React from 'react';
import { Tooltip as FluentTooltip, TooltipProps } from '@fluentui/react-components';

interface Props extends Omit<TooltipProps, 'content' | 'positioning' | 'relationship'> {
  title: React.ReactNode;
  children: React.ReactElement;
}

export function Tooltip({ title, children, ...props }: Props) {
  return (
    <FluentTooltip
      content={title}
      relationship="label"
      positioning={{ position: 'above', align: 'center' }}
      {...props}
    >
      {children}
    </FluentTooltip>
  );
}
