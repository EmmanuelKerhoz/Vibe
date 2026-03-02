import React from 'react';

export const MenuItem = ({ children, value, sx, className, style, ...props }: any) => {
  // Convert sx syntax to styles to avoid DOM attribute injection
  const inlineStyles = sx ? { 
    ...(sx.fontSize ? { fontSize: sx.fontSize } : {}),
    ...style
  } : style;

  return (
    <option value={value} style={inlineStyles} className={className} {...props}>
      {children}
    </option>
  );
};