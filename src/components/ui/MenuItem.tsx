import type { OptionHTMLAttributes, ReactNode } from 'react';

type MenuItemProps = OptionHTMLAttributes<HTMLOptionElement> & {
  children?: ReactNode;
  sx?: Record<string, unknown>;
};

export const MenuItem = ({ children, value, sx: _sx, ...props }: MenuItemProps) => (
  <option value={value} {...props}>
    {children}
  </option>
);
