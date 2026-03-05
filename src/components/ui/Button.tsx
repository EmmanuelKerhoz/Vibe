import React from 'react';
import { Button as FluentButton } from '@fluentui/react-components';

type ButtonProps = {
  children?: React.ReactNode;
  variant?: 'contained' | 'outlined' | 'text';
  color?: string;
  size?: 'small' | 'medium' | 'large';
  startIcon?: React.ReactNode;
  sx?: Record<string, unknown>;
  component?: 'label';
  fullWidth?: boolean;
  className?: string;
  style?: React.CSSProperties;
} & Record<string, unknown>;

export const Button = ({ children, variant, startIcon, component, fullWidth, className, style, sx: _sx, ...props }: ButtonProps) => {
  const appearance: 'secondary' | 'primary' | 'outline' | 'transparent' =
    variant === 'contained' ? 'primary' : variant === 'outlined' ? 'outline' : variant === 'text' ? 'transparent' : 'secondary';

  const fluentStyle: React.CSSProperties = { ...style, width: fullWidth ? '100%' : style?.width };
  const fluentClass = `fluent-button ${appearance === 'outline' || appearance === 'transparent' ? 'lcars-holo' : ''} ${className || ''}`.trim();

  if (component === 'label') {
    return (
      <label style={{ display: 'inline-flex', cursor: 'pointer', ...fluentStyle }} className={className}>
        <FluentButton appearance={appearance} size={props.size as any} icon={startIcon as any} className={fluentClass} {...(props as any)}>
          {children as any}
        </FluentButton>
      </label>
    );
  }

  return (
    <FluentButton appearance={appearance} size={props.size as any} icon={startIcon as any} style={fluentStyle} className={fluentClass} {...(props as any)}>
      {children as any}
    </FluentButton>
  );
};
