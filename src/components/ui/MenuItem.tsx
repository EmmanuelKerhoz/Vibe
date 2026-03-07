import type { CSSProperties, OptionHTMLAttributes, ReactNode } from 'react';

type MenuItemProps = OptionHTMLAttributes<HTMLOptionElement> & {
  children?: ReactNode;
};

export const MenuItem = ({ children, value, style, ...props }: MenuItemProps) => {
  return (
    <option value={value} style={style} {...props}>
      {children}
    </option>
  );
};

