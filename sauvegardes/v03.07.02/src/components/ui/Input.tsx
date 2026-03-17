import { Input as FluentInput } from '@fluentui/react-components';
import type { InputProps } from '@fluentui/react-components';

type AdaptedInputProps = InputProps & {
  color?: string;
  sx?: Record<string, unknown>;
};

export const Input = ({ color: _color, sx: _sx, ...props }: AdaptedInputProps) => {
  return <FluentInput {...props} style={{ width: '100%', ...(props.style || {}) }} className={`lcars-hud-chip ${props.className || ''}`.trim()} />;
};
