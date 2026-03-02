import React from 'react';
import { Button as FluentButton } from '@fluentui/react-components';

export const Button = ({ children, variant, color, size, startIcon, component, fullWidth, className, style, sx, ...props }: any) => {
  let appearance: any = 'secondary';
  
  // Mapping Material variants to Fluent appearances
  if (variant === 'contained') appearance = 'primary';
  if (variant === 'outlined') appearance = 'outline';
  if (variant === 'text') appearance = 'transparent';
  
  // Handling color prop to match intent via Tailwind classes since Fluent uses tokens
  let colorClass = '';
  if (color === 'error') colorClass = 'text-red-500 hover:text-red-600 hover:bg-red-500/10';
  if (color === 'success') colorClass = 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10';
  if (color === 'info') colorClass = 'text-blue-500 hover:text-blue-600 hover:bg-blue-500/10';
  if (color === 'warning') colorClass = 'text-amber-500 hover:text-amber-600 hover:bg-amber-500/10';
  if (color === 'secondary') colorClass = 'text-purple-500 hover:text-purple-600 hover:bg-purple-500/10';
  
  // Handle sx props mapping to style to prevent loss of styling
  const mappedSxStyle = sx ? {
    ...(sx.mt ? { marginTop: typeof sx.mt === 'number' ? `${sx.mt * 0.25}rem` : sx.mt } : {}),
    ...(sx.mb ? { marginBottom: typeof sx.mb === 'number' ? `${sx.mb * 0.25}rem` : sx.mb } : {}),
    ...(sx.py ? { paddingBottom: typeof sx.py === 'number' ? `${sx.py * 0.25}rem` : sx.py, paddingTop: typeof sx.py === 'number' ? `${sx.py * 0.25}rem` : sx.py } : {}),
    ...(sx.px ? { paddingLeft: typeof sx.px === 'number' ? `${sx.px * 0.25}rem` : sx.px, paddingRight: typeof sx.px === 'number' ? `${sx.px * 0.25}rem` : sx.px } : {}),
    ...(sx.fontSize ? { fontSize: sx.fontSize } : {}),
    ...(sx.minHeight ? { minHeight: sx.minHeight } : {}),
    ...(sx.height ? { height: sx.height } : {}),
    ...(sx.flexShrink !== undefined ? { flexShrink: sx.flexShrink } : {}),
    ...(sx.flex !== undefined ? { flex: sx.flex } : {}),
    ...(sx.color ? { color: sx.color } : {})
  } : {};

  const finalStyle = { ...mappedSxStyle, ...style, width: fullWidth ? '100%' : undefined };
  const fluentClass = `fluent-button ${appearance === 'outline' || appearance === 'transparent' ? 'lcars-holo' : ''} ${colorClass} ${className || ''}`;
  
  if (component === 'label') {
    return (
      <label style={{ display: 'inline-flex', cursor: 'pointer', ...finalStyle }} className={className}>
        <FluentButton as="span" appearance={appearance} size={size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium'} icon={startIcon} className={fluentClass} {...props}>
          {children}
        </FluentButton>
      </label>
    );
  }
  
  return (
    <FluentButton appearance={appearance} size={size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium'} icon={startIcon} style={finalStyle} className={fluentClass} {...props}>
      {children}
    </FluentButton>
  );
};