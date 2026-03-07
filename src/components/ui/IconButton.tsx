import type { CSSProperties, ReactNode } from 'react';
import { Button } from './Button';

type IconButtonProps = {
  children?: ReactNode;
  style?: CSSProperties;
  color?: string;
} & Record<string, unknown>;

export const IconButton = ({ children, style, color, ...props }: IconButtonProps) => (
  <Button
    {...props}
    variant="text"
    color={color}
    style={{ minWidth: 'auto', padding: '4px', ...style }}
  >
    {children}
  </Button>
);

