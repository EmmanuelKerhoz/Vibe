import React from 'react';
import { Label as FluentLabel } from '@fluentui/react-components';

export const Label = ({ children }: { children: React.ReactNode }) => {
  return (
    <FluentLabel style={{ display: 'block', textTransform: 'uppercase', marginBottom: '8px', marginLeft: '4px', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--colorNeutralForeground2)' }}>
      {children}
    </FluentLabel>
  );
};
