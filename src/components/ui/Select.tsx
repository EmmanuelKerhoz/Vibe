import React from 'react';
import { Select as FluentSelect } from '@fluentui/react-components';

export const Select = ({ color, ...props }: any) => {
  return (
    <FluentSelect 
      {...props} 
      style={{ width: '100%' }}
      className="lcars-hud-chip"
      onChange={(e, data) => {
        if (props.onChange) {
          props.onChange({ target: { value: data.value } });
        }
      }}
    >
      {React.Children.map(props.children, child => {
        if (React.isValidElement(child)) {
          return <option value={(child.props as any).value}>{(child.props as any).children}</option>;
        }
        return child;
      })}
    </FluentSelect>
  );
};
