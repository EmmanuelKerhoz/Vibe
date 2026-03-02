import React from 'react';
import { Button } from './Button';

export const IconButton = ({ children, sx, style, color, ...props }: any) => {
  // Translate sx.color into standard colors for the button wrapper
  let resolvedColor = color;
  if (sx && sx.color) {
    if (sx.color === 'error.main') resolvedColor = 'error';
    if (sx.color === 'text.secondary') resolvedColor = 'default';
  }

  return (
    <Button 
      {...props} 
      variant="text" 
      color={resolvedColor}
      sx={sx}
      style={{ minWidth: 'auto', padding: '4px', ...style }}
    >
      {children}
    </Button>
  );
};