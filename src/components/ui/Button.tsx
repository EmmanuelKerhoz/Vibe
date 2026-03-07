import React from 'react';
import { Button as FluentButton } from '@fluentui/react-components';
import type { CSSProperties } from 'react';

/** Maps a MUI-style `sx` object to a partial CSSProperties. Only handles the
 *  spacing/sizing tokens actually used in App.tsx so we avoid a full MUI dep. */
const sxToStyle = (sx: Record<string, unknown>): CSSProperties => ({
  ...(sx.mt !== undefined ? { marginTop: typeof sx.mt === 'number' ? `${(sx.mt as number) * 0.25}rem` : String(sx.mt) } : {}),
  ...(sx.mb !== undefined ? { marginBottom: typeof sx.mb === 'number' ? `${(sx.mb as number) * 0.25}rem` : String(sx.mb) } : {}),
  ...(sx.py !== undefined ? { paddingTop: typeof sx.py === 'number' ? `${(sx.py as number) * 0.25}rem` : String(sx.py), paddingBottom: typeof sx.py === 'number' ? `${(sx.py as number) * 0.25}rem` : String(sx.py) } : {}),
  ...(sx.px !== undefined ? { paddingLeft: typeof sx.px === 'number' ? `${(sx.px as number) * 0.25}rem` : String(sx.px), paddingRight: typeof sx.px === 'number' ? `${(sx.px as number) * 0.25}rem` : String(sx.px) } : {}),
  ...(sx.fontSize !== undefined ? { fontSize: String(sx.fontSize) } : {}),
});

/** Maps MUI color names to Tailwind utility strings for the Fluent button wrapper. */
const colorToClass = (color: string | undefined): string => {
  if (color === 'error') return 'text-red-500 hover:text-red-600 hover:bg-red-500/10';
  if (color === 'success') return 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10';
  if (color === 'info') return 'text-blue-500 hover:text-blue-600 hover:bg-blue-500/10';
  if (color === 'warning') return 'text-amber-500 hover:text-amber-600 hover:bg-amber-500/10';
  return '';
};

export const Button = ({
  children,
  variant,
  color,
  size,
  startIcon,
  sx,
  component,
  fullWidth,
  className,
  style,
  ...props
}: any) => {
  let appearance: any = 'secondary';
  if (variant === 'contained') appearance = 'primary';
  if (variant === 'outlined') appearance = 'outline';
  if (variant === 'text') appearance = 'transparent';

  const sxStyle = sx ? sxToStyle(sx as Record<string, unknown>) : {};
  const fluentStyle: CSSProperties = { ...sxStyle, ...style, width: fullWidth ? '100%' : undefined };
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
        <FluentButton as="span" appearance={appearance} size={normalizedSize} icon={startIcon} className={fluentClass} {...props}>
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

