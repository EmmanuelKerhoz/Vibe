import { Input as FluentInput } from '@fluentui/react-components';
import type { InputProps } from '@fluentui/react-components';

/** Maps semantic color names to Tailwind utility strings for LCARS theming. */
const colorToClass = (color: string | undefined): string => {
  if (color === 'error')   return 'border-red-500/60 focus-within:border-red-500';
  if (color === 'success') return 'border-emerald-500/60 focus-within:border-emerald-500';
  if (color === 'warning') return 'border-amber-500/60 focus-within:border-amber-500';
  if (color === 'info')    return 'border-blue-500/60 focus-within:border-blue-500';
  return '';
};

type AdaptedInputProps = InputProps & {
  /**
   * Semantic color state: 'error' | 'success' | 'warning' | 'info'.
   * Rendered as a LCARS border tint via Tailwind utilities.
   */
  color?: string;
  /** MUI sx prop — intentionally ignored (not supported in this Fluent wrapper). */
  sx?: Record<string, unknown>;
};

export const Input = ({ color, sx: _sx, ...props }: AdaptedInputProps) => {
  const colorClass = colorToClass(color);
  const className = [`lcars-hud-chip`, colorClass, props.className ?? ''].filter(Boolean).join(' ');
  return (
    <FluentInput
      {...props}
      style={{ width: '100%', ...(props.style ?? {}) }}
      className={className}
    />
  );
};
