import React from 'react';
import { Tooltip as FluentTooltip } from '@fluentui/react-components';

export const Tooltip = ({ title, placement, children }: { title: string, placement?: "top" | "bottom" | "left" | "right" | "top-start" | "top-end" | "bottom-start" | "bottom-end" | "left-start" | "left-end" | "right-start" | "right-end", children: React.ReactElement }) => {
  return (
    <FluentTooltip content={title} positioning={placement} relationship="label">
      {children}
    </FluentTooltip>
  );
};