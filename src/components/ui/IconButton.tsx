import React from 'react';
import { Button } from './Button';

export const IconButton = ({ children, ...props }: any) => (
  <Button {...props} variant="text" style={{ minWidth: 'auto', padding: '4px', ...props.style }}>
    {children}
  </Button>
);
