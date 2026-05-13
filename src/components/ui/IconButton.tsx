import type { CSSProperties, ReactNode } from 'react';
import { Button } from './Button';

const SIZE_PADDING: Record<string, string> = {
  small: '2px',
  medium: '4px',
  large: '6px',
};

type IconButtonProps = {
  children?: ReactNode;
  style?: CSSProperties;
  color?: string;
  /** Forwarded to Button — controls padding. Defaults to 'medium'. */
  size?: 'small' | 'medium' | 'large';
} & Record<string, unknown>;

export const IconButton = ({ children, style, color, size = 'medium', ...props }: IconButtonProps) => (
  <Button
    {...props}
    size={size}
    variant="text"
    {...(color !== undefined ? { color } : {})}
    style={{ minWidth: 'auto', padding: SIZE_PADDING[size] ?? '4px', ...style }}
  >
    {children}
  </Button>
);
