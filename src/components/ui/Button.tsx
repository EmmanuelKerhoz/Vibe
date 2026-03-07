import React from 'react';
import { Button as FluentButton } from '@fluentui/react-components';
import type { CSSProperties } from 'react';

/** Maps semantic color names to Tailwind utility strings for the Fluent button wrapper. */
const colorToClass = (color: string | undefined): string => {
  if (color === 'error') return 'text-red-500 hover:text-red-600 hover:bg-red-500/10';
  if (color === 'success') return 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10';
  if (color === 'info') return 'text-blue-500 hover:text-blue-600 hover:bg-blue-500/10';
  if (color === 'warning') return 'text-amber-500 hover:text-amber-600 hover:bg-amber-500/10';
  return '';
};

type ButtonProps = {
  children?: React.ReactNode;
  variant?: 'contained' | 'outlined' | 'text';
  color?: string;
  size?: 'small' | 'medium' | 'large';
  startIcon?: React.ReactElement;
  component?: string;
  fullWidth?: boolean;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
} & Record<string, unknown>;

export const Button = ({
  children,
  variant,
  color,
  size,
  startIcon,
  component,
  fullWidth,
  className,
  style,
  ...props
}: ButtonProps) => {
  let appearance: 'primary' | 'secondary' | 'outline' | 'transparent' = 'secondary';
  if (variant === 'contained') appearance = 'primary';
  if (variant === 'outlined') appearance = 'outline';
  if (variant === 'text') appearance = 'transparent';

  const fluentStyle: CSSProperties = { ...style, width: fullWidth ? '100%' : undefined };
  const fluentClass = [
    'fluent-button',
    appearance === 'outline' || appearance === 'transparent' ? 'lcars-holo' : '',
    colorToClass(color),
    className || '',
  ].filter(Boolean).join(' ');

  const normalizedSize = size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium';

  if (component === 'label') {
    return (
      <label style={{ display: 'inline-flex', cursor: 'pointer', ...fluentStyle }} className={className}>
        <FluentButton appearance={appearance} size={normalizedSize} icon={startIcon} className={fluentClass} {...props}>
          {children}
        </FluentButton>
      </label>
    );
  }

  return (
    <FluentButton appearance={appearance} size={normalizedSize} icon={startIcon} style={fluentStyle} className={fluentClass} {...props}>
      {children}
    </FluentButton>
  );
};

