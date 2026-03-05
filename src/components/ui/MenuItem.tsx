import React from 'react';

export const MenuItem = ({ children, value, ...props }: any) => (
  <option value={value} {...props}>
    {children}
  </option>
);
