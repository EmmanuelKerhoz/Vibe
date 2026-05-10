import React from 'react';
import { Tooltip as FluentTooltip, TooltipProps } from '@fluentui/react-components';

interface Props extends Omit<TooltipProps, 'content' | 'relationship'> {
  title: React.ReactElement | string;
  children: React.ReactElement;
  relationship?: TooltipProps['relationship'];
}

export function Tooltip({ title, children, relationship = 'label', ...props }: Props) {
  return (
    <FluentTooltip
      content={typeof title === 'string'
        ? <span style={{ display: 'block', maxWidth: '18rem', whiteSpace: 'pre-line' }}>{title}</span>
        : title}
      relationship={relationship}
      positioning={props.positioning ?? { position: 'above', align: 'center' }}
      {...props}
    >
      {children}
    </FluentTooltip>
  );
}
