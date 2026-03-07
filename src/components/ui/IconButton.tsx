import type { CSSProperties, ReactNode } from 'react';
import { Button } from './Button';

type IconButtonProps = {
  children?: ReactNode;
  style?: CSSProperties;
  sx?: Record<string, unknown>;
  color?: string;
} & Record<string, unknown>;

/**
 * Maps MUI sx.color token strings to the `color` prop expected by Button.
 * Supported tokens: 'error.main', 'success.main', 'warning.main', 'info.main',
 * 'primary.main', 'text.secondary' (treated as no color), others passed through.
 */
const resolveColor = (sx: Record<string, unknown> | undefined, color: string | undefined): string | undefined => {
  if (!sx?.color) return color;
  const token = String(sx.color);
  if (token === 'error.main') return 'error';
  if (token === 'success.main') return 'success';
  if (token === 'warning.main') return 'warning';
  if (token === 'info.main') return 'info';
  if (token === 'primary.main') return 'primary';
  if (token === 'text.secondary') return color; // muted — keep caller's color or undefined
  return color;
};

export const IconButton = ({ children, style, sx, color, ...props }: IconButtonProps) => (
  <Button
    {...props}
    variant="text"
    color={resolveColor(sx, color)}
    style={{ minWidth: 'auto', padding: '4px', ...style }}
  >
    {children}
  </Button>
);

