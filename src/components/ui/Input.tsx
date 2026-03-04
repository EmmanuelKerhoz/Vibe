import React from 'react';
import { Input as FluentInput } from '@fluentui/react-components';

export const Input = ({ color, ...props }: any) => {
  return <FluentInput {...props} style={{ width: '100%' }} className="lcars-hud-chip" />;
};
