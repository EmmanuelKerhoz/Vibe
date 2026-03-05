import React from 'react';
import { Tooltip as FluentTooltip } from '@fluentui/react-components';

export const Tooltip = ({ title, children }: { title: string, children: React.ReactElement }) => {
  return (
    <FluentTooltip content={title} relationship="label">
      {children}
    </FluentTooltip>
  );
};
