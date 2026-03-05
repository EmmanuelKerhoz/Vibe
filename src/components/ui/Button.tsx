import React from 'react';
import { Button as FluentButton } from '@fluentui/react-components';

export const Button = ({ children, variant, color, size, startIcon, sx, component, fullWidth, className, style, ...props }: any) => {
  let appearance: any = 'secondary';
  if (variant === 'contained') appearance = 'primary';
  if (variant === 'outlined') appearance = 'outline';
  if (variant === 'text') appearance = 'transparent';
  
  const fluentStyle = { ...style, width: fullWidth ? '100%' : undefined };
  const fluentClass = `fluent-button ${appearance === 'outline' || appearance === 'transparent' ? 'lcars-holo' : ''} ${className || ''}`;
  
  if (component === 'label') {
    return (
      <label style={{ display: 'inline-flex', cursor: 'pointer', ...fluentStyle }} className={className}>
        <FluentButton as="span" appearance={appearance} size={size} icon={startIcon} className={fluentClass} {...props}>
          {children}
        </FluentButton>
      </label>
    );
  }
  
  return (
    <FluentButton appearance={appearance} size={size} icon={startIcon} style={fluentStyle} className={fluentClass} {...props}>
      {children}
    </FluentButton>
  );
};
