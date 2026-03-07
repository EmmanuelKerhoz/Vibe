import type { CSSProperties, OptionHTMLAttributes, ReactNode } from 'react';

type MenuItemProps = OptionHTMLAttributes<HTMLOptionElement> & {
  children?: ReactNode;
  sx?: Record<string, unknown>;
};

export const MenuItem = ({ children, value, sx, style, ...props }: MenuItemProps) => {
  const resolvedStyle: CSSProperties | undefined =
    sx?.fontSize !== undefined
      ? { fontSize: String(sx.fontSize), ...style }
      : style;

  return (
    <option value={value} style={resolvedStyle} {...props}>
      {children}
    </option>
  );
};

