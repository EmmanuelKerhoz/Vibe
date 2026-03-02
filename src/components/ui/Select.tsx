import React from 'react';
import { Select as FluentSelect } from '@fluentui/react-components';

export const Select = ({ color, className, ...props }: any) => {
  return (
    <FluentSelect 
      {...props} 
      style={{ width: '100%', ...props.style }}
      className={`lcars-hud-chip ${className || ''}`}
      onChange={(e, data) => {
        if (props.onChange) {
          props.onChange({ target: { value: data.value } });
        }
      }}
    >
      {/* Return children exactly as they are without stripping their props */}
      {props.children}
    </FluentSelect>
  );
};