import type { CSSProperties, ReactNode } from 'react';
import { Button } from './Button';

type IconButtonProps = {
  children?: ReactNode;
  style?: CSSProperties;
  sx?: Record<string, unknown>;
  color?: string;
} & Record<string, unknown>;

/** Maps MUI sx.color token strings to the `color` prop expected by Button. */
const resolveColor = (sx: Record<string, unknown> | undefined, color: string | undefined): string | undefined => {
  if (sx?.color === 'error.main') return 'error';
  if (sx?.color === 'text.secondary') return undefined;
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

