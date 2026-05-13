/**
 * @deprecated Prefer `LcarsSelect` for all new UI.
 * This adapter exists solely to bridge the legacy MUI `onChange` signature
 * (`{ target: { value } }`) to the Fluent `(_, data) => void` API.
 * Migrate call-sites to `LcarsSelect` when possible.
 */
import { Select as FluentSelect } from '@fluentui/react-components';
import type { SelectProps } from '@fluentui/react-components';

type LegacyOnChange = (event: { target: { value?: string } }) => void;

type AdaptedSelectProps = Omit<SelectProps, 'onChange'> & {
  onChange?: LegacyOnChange;
};

export const Select = ({ onChange, children, ...props }: AdaptedSelectProps) => {
  return (
    <FluentSelect
      {...props}
      style={{ width: '100%', ...(props.style ?? {}) }}
      className={`lcars-hud-chip ${props.className ?? ''}`.trim()}
      onChange={(_, data) => {
        onChange?.({ target: { value: data.value } });
      }}
    >
      {children}
    </FluentSelect>
  );
};
