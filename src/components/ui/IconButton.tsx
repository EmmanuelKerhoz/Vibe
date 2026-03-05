import type { CSSProperties, ReactNode } from 'react';
import { Button } from './Button';

type IconButtonProps = {
  children?: ReactNode;
  style?: CSSProperties;
  sx?: Record<string, unknown>;
} & Record<string, unknown>;

export const IconButton = ({ children, style, ...props }: IconButtonProps) => (
  <Button {...props} variant="text" style={{ minWidth: 'auto', padding: '4px', ...style }}>
    {children}
  </Button>
);
